// ─────────────────────────────────────────────────────────────────────────────
// Recording Paystack payments. Called from the success page (verify), the
// Paystack webhook, and the stale-slot cleanup, so it must be safe to run
// any number of times for the same payment: only the first call changes
// anything or sends emails.
// ─────────────────────────────────────────────────────────────────────────────

import { adminDb } from '@/lib/supabase/admin'
import { getResend, FROM, FROM_ADMIN } from '@/lib/resend'
import { formatBookingDate } from '@/lib/booking-time'
import { isPriceRange } from '@/lib/booking-fees'
import { bookingConfirmationHtml } from '@/emails/booking-confirmation'
import { bookingAdminAlertHtml } from '@/emails/booking-admin-alert'
import { customizationLabel } from '@/lib/service-rules'
import { orderConfirmationHtml } from '@/emails/order-confirmation'

export const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_EMAIL ?? 'essakobea@gmail.com'

export const TIMEOUT_CANCEL_REASON = 'Payment timeout, slot released'
const PAID_AFTER_RELEASE_REASON = 'Payment arrived after the slot was given to someone else. Full refund owed.'

// Email delivery must never undo or fail a payment that's already recorded.
export async function sendSafely(label: string, email: Parameters<ReturnType<typeof getResend>['emails']['send']>[0]) {
  try {
    const { error } = await getResend().emails.send(email)
    if (error) console.error(`Failed to send ${label}`, error)
  } catch (err) {
    console.error(`Failed to send ${label}`, err)
  }
}

export type SettleOutcome =
  | 'confirmed'          // first time we've seen this payment, booking is now confirmed
  | 'already_recorded'   // payment was recorded before; nothing changed
  | 'refund_owed'        // paid, but the booking couldn't be honoured; full refund recorded
  | 'amount_mismatch'    // Paystack amount is less than what we charged; not recorded
  | 'not_found'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

export async function settleBookingPayment(
  bookingId: string,
  reference: string,
  paidPesewas: number,
): Promise<{ outcome: SettleOutcome; booking: Row | null }> {
  const { data: booking } = await adminDb.from('bookings').select('*').eq('id', bookingId).single()
  if (!booking) return { outcome: 'not_found', booking: null }

  if (booking.payment_status !== 'unpaid') return { outcome: 'already_recorded', booking }

  if (paidPesewas < booking.amount) {
    console.error(`Paystack amount ${paidPesewas} is below booking ${bookingId} amount ${booking.amount}`)
    return { outcome: 'amount_mismatch', booking }
  }

  // Claim the payment atomically: only one caller can flip unpaid → paid.
  const { data: claimed } = await adminDb
    .from('bookings')
    .update({ payment_status: 'paid', payment_reference: reference })
    .eq('id', bookingId)
    .eq('payment_status', 'unpaid')
    .select('*')
    .maybeSingle()
  if (!claimed) {
    const { data: fresh } = await adminDb.from('bookings').select('*').eq('id', bookingId).single()
    return { outcome: 'already_recorded', booking: fresh }
  }

  // Pending bookings get confirmed. Bookings our own cleanup cancelled for a
  // payment timeout get reinstated if the slot is still free. Bookings someone
  // cancelled on purpose stay cancelled, with a full refund owed.
  const canConfirm =
    claimed.status === 'pending' ||
    (claimed.status === 'cancelled' && claimed.cancellation_reason === TIMEOUT_CANCEL_REASON)

  if (canConfirm) {
    const { data: confirmed, error } = await adminDb
      .from('bookings')
      .update({ status: 'confirmed', cancellation_reason: null, cancelled_at: null })
      .eq('id', bookingId)
      .select('*')
      .single()

    if (!error && confirmed) {
      await sendBookingConfirmedEmails(confirmed)
      return { outcome: 'confirmed', booking: confirmed }
    }
    // 23505 = the stylist's slot was taken while this payment was in flight.
    if (error?.code !== '23505') console.error('Failed to confirm paid booking', bookingId, error)
  }

  const { data: refundRow } = await adminDb
    .from('bookings')
    .update({
      status: 'cancelled',
      cancellation_reason: claimed.status === 'cancelled' && claimed.cancellation_reason !== TIMEOUT_CANCEL_REASON
        ? claimed.cancellation_reason
        : PAID_AFTER_RELEASE_REASON,
      cancelled_at: claimed.cancelled_at ?? new Date().toISOString(),
      refund_amount: claimed.amount,
    })
    .eq('id', bookingId)
    .select('*')
    .single()

  await sendSafely('paid-but-cancelled admin alert', {
    from: FROM_ADMIN,
    to: ADMIN_NOTIFY_EMAIL,
    subject: `Refund needed: ${claimed.client_name} paid for a cancelled booking`,
    html: `<p>${claimed.client_name} (${claimed.client_phone}, ${claimed.client_email}) paid
      ₵${(claimed.amount / 100).toLocaleString()} for ${claimed.service_name} on
      ${formatBookingDate(claimed.booking_date)} at ${claimed.time_slot}, but the booking could not be confirmed
      because it had already been cancelled or the slot was taken.</p>
      <p>Paystack reference: ${reference}</p>
      <p>Please contact the client and refund them, then mark the refund as sent in the admin Bookings page.</p>`,
  })

  return { outcome: 'refund_owed', booking: refundRow ?? claimed }
}

// The client came back from Paystack without paying. Free their slot now
// instead of holding it for the full 30 minutes, so they can retry the same
// time. Uses the timeout reason on purpose: if the payment somehow lands
// later, settleBookingPayment reinstates the booking (or flags a refund).
export async function releaseUnpaidBooking(bookingId: string) {
  await adminDb
    .from('bookings')
    .update({ status: 'cancelled', cancellation_reason: TIMEOUT_CANCEL_REASON, cancelled_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('status', 'pending')
    .eq('payment_status', 'unpaid')
}

async function sendBookingConfirmedEmails(booking: Row) {
  const formattedDate = formatBookingDate(booking.booking_date)

  // A range-priced option ("₵250 – ₵450") means what they paid is a deposit.
  let isDeposit = false
  if (booking.service_id && booking.treatment) {
    const { data: svc } = await adminDb.from('services').select('booking_options').eq('slug', booking.service_id).single()
    const options = svc?.booking_options as { name?: string; price?: string }[] | null
    const opt = options?.find((o) => o.name === booking.treatment)
    if (isPriceRange(opt?.price)) isDeposit = true
  }

  const sharedFields = {
    serviceName:       booking.service_name,
    treatment:         booking.treatment,
    bookingDate:       formattedDate,
    timeSlot:          booking.time_slot,
    depositGHS:        Math.round((booking.amount ?? 0) / 100),
    isDeposit,
    stylistName:       booking.stylist_name ?? null,
    bookingId:         booking.id,
    appUrl:            process.env.NEXT_PUBLIC_APP_URL ?? '',
    customizationType: booking.customization_type ?? null,
    customizationLabel: customizationLabel(booking.service_id, booking.customization_type),
    isEmergency:       booking.is_emergency ?? false,
    customizationFee:  Math.round((booking.customization_fee ?? 0) / 100),
    emergencyFee:      Math.round((booking.emergency_fee ?? 0) / 100),
    serviceCharge:     Math.round((booking.service_charge ?? 0) / 100),
    bundleCount:       booking.bundle_count ?? null,
  }

  if (booking.client_email) {
    await sendSafely('booking confirmation', {
      from: FROM,
      to: booking.client_email,
      subject: `Booking confirmed: ${booking.service_name} on ${formattedDate}`,
      html: bookingConfirmationHtml({
        clientName:  booking.client_name,
        cancelToken: booking.cancel_token,
        ...sharedFields,
      }),
    })
  }

  await sendSafely('admin booking alert', {
    from: FROM_ADMIN,
    to: ADMIN_NOTIFY_EMAIL,
    subject: `New booking: ${booking.client_name} · ${booking.service_name} on ${formattedDate}`,
    html: bookingAdminAlertHtml({
      clientName:  booking.client_name,
      clientPhone: booking.client_phone,
      clientEmail: booking.client_email,
      notes:       booking.notes ?? null,
      ...sharedFields,
    }),
  })
}

export async function settleOrderPayment(
  orderId: string,
  reference: string,
  paidPesewas: number,
): Promise<{ outcome: SettleOutcome; order: Row | null }> {
  const { data: order } = await adminDb.from('orders').select('*').eq('id', orderId).single()
  if (!order) return { outcome: 'not_found', order: null }
  if (order.payment_status !== 'unpaid') return { outcome: 'already_recorded', order }

  if (paidPesewas < order.total) {
    console.error(`Paystack amount ${paidPesewas} is below order ${orderId} total ${order.total}`)
    return { outcome: 'amount_mismatch', order }
  }

  const { data: claimed } = await adminDb
    .from('orders')
    .update({ payment_status: 'paid', payment_reference: reference, status: 'processing' })
    .eq('id', orderId)
    .eq('payment_status', 'unpaid')
    .select('*')
    .maybeSingle()
  if (!claimed) {
    const { data: fresh } = await adminDb.from('orders').select('*').eq('id', orderId).single()
    return { outcome: 'already_recorded', order: fresh }
  }

  if (claimed.client_email) {
    await sendSafely('order confirmation', {
      from: FROM,
      to: claimed.client_email,
      subject: 'Order confirmed | Essakobea',
      html: orderConfirmationHtml({
        clientName:      claimed.client_name,
        orderId:         claimed.id,
        items:           claimed.items,
        subtotal:        claimed.subtotal,
        total:           claimed.total,
        deliveryMethod:  claimed.delivery_method,
        deliveryAddress: claimed.delivery_address,
        appUrl:          process.env.NEXT_PUBLIC_APP_URL ?? '',
      }),
    })
  }

  return { outcome: 'confirmed', order: claimed }
}

// Paystack metadata → the right settle function.
export async function settlePayment(reference: string, paidPesewas: number, metadata: Record<string, unknown>) {
  if (metadata.type === 'booking' && typeof metadata.bookingId === 'string') {
    const r = await settleBookingPayment(metadata.bookingId, reference, paidPesewas)
    return { type: 'booking' as const, id: metadata.bookingId, outcome: r.outcome, record: r.booking }
  }
  if (metadata.type === 'order' && typeof metadata.orderId === 'string') {
    const r = await settleOrderPayment(metadata.orderId, reference, paidPesewas)
    return { type: 'order' as const, id: metadata.orderId, outcome: r.outcome, record: r.order }
  }
  return null
}
