import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { FROM } from '@/lib/resend'
import { sendSafely } from '@/lib/payments'
import { refundPolicy } from '@/lib/refunds'
import { clientRescheduleBlock } from '@/lib/reschedule-rules'
import { clientEditBlock, editablePhotos } from '@/lib/booking-edits'
import { formatBookingDate } from '@/lib/booking-time'
import { cancellationHtml } from '@/emails/cancellation'
import { sendSmsSafely, bookingCancelledSms, clientCancelledAdminSms, ADMIN_NOTIFY_PHONE } from '@/lib/sms'

// GET — lookup booking by token (for the manage booking page)
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  // '*' so reschedule_count is read once migration 025 has run, and nothing breaks before
  const { data: booking } = await adminDb
    .from('bookings')
    .select('*')
    .eq('cancel_token', token)
    .single()

  if (!booking) return NextResponse.json({ error: 'Invalid booking link' }, { status: 404 })

  // What the client would get back if they cancelled right now
  const { share, refundPesewas } = refundPolicy(booking, 'client')
  const paid = booking.payment_status === 'paid'
  return NextResponse.json({
    id:           booking.id,
    client_name:  booking.client_name,
    service_name: booking.service_name,
    treatment:    booking.treatment,
    stylist_name: booking.stylist_name,
    booking_date: booking.booking_date,
    time_slot:    booking.time_slot,
    status:       booking.status,
    paid,
    paidPesewas: paid ? booking.amount : 0,
    refundShare: share,
    refundPesewas,
    rescheduleBlock: clientRescheduleBlock(booking),
    // For "Update details"
    client_phone: booking.client_phone,
    client_email: booking.client_email ?? '',
    notes:        booking.notes ?? '',
    unit_photos:  booking.unit_photos ?? [],
    inspo_photos: booking.inspo_photos ?? [],
    photos:       editablePhotos(booking),
    editBlock:    clientEditBlock(booking),
  })
}

// POST — execute cancellation
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { reason } = await req.json().catch(() => ({ reason: '' }))

  const { data: booking } = await adminDb
    .from('bookings')
    .select('*')
    .eq('cancel_token', token)
    .single()

  if (!booking) return NextResponse.json({ error: 'Invalid cancellation link' }, { status: 404 })
  if (booking.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
  if (booking.status === 'completed') return NextResponse.json({ error: 'Appointment already completed' }, { status: 400 })

  const { hoursNotice, share, refundPesewas } = refundPolicy(booking, 'client')

  const { data: updated } = await adminDb.from('bookings').update({
    status: 'cancelled',
    cancellation_reason: reason || 'Cancelled by client',
    cancelled_at: new Date().toISOString(),
    refund_amount: refundPesewas,
  }).eq('id', booking.id).in('status', ['pending', 'confirmed']).select('id').maybeSingle()

  if (!updated) return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })

  if (booking.client_email) {
    await sendSafely('client cancellation email', {
      from: FROM,
      to: booking.client_email,
      subject: 'Your Essakobea appointment has been cancelled',
      html: cancellationHtml({
        clientName:  booking.client_name,
        serviceName: booking.service_name,
        treatment:   booking.treatment,
        bookingDate: formatBookingDate(booking.booking_date),
        timeSlot:    booking.time_slot,
        reason,
        cancelledBy: 'client',
        paid:        booking.payment_status === 'paid',
        refundShare: share,
      }),
    })
  }

  await sendSmsSafely('client cancellation SMS', booking.client_phone,
    bookingCancelledSms(booking, booking.payment_status === 'paid', share))
  await sendSmsSafely('admin cancellation SMS', ADMIN_NOTIFY_PHONE, clientCancelledAdminSms(booking, reason))

  return NextResponse.json({ success: true, hoursNotice })
}
