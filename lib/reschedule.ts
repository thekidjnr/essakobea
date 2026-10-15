// ─────────────────────────────────────────────────────────────────────────────
// Rescheduling: a booking moves to a new date and time in place, keeping its
// payment, stylist and manage link. See migration 025.
//
// Clients move their own booking from the manage link in their email:
//   • only a confirmed booking, 24 hours or more before it starts
//   • once per booking (reschedule_count)
//   • not emergency bookings, whose fee paid for that out-of-hours slot
//   • same stylist, on the salon's normal grid
// The 24 hour rule matches the cancellation policy in lib/refunds: without
// it, a client could dodge the 50% late cancellation charge by moving the
// booking out a week and then cancelling it for a full refund.
//
// The salon can move any active booking from the admin, any number of times.
// The client rules live in lib/reschedule-rules, which the browser can load.
// ─────────────────────────────────────────────────────────────────────────────

import { adminDb } from '@/lib/supabase/admin'
import { FROM } from '@/lib/resend'
import { sendSafely } from '@/lib/payments'
import { formatBookingDate } from '@/lib/booking-time'
import { rescheduledHtml } from '@/emails/rescheduled'
import {
  sendSmsSafely, bookingRescheduledSms, clientRescheduledAdminSms, ADMIN_NOTIFY_PHONE,
} from '@/lib/sms'

export function manageUrl(cancelToken: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/manage/${cancelToken}`
}

type Row = Record<string, any>

/**
 * Moves the booking, but only if it is still active and still at the time it
 * was read, so two clicks or two tabs can't both move it. Returns the updated
 * row, null when someone else got there first, or 'taken' when the stylist
 * already has a booking starting at exactly that time.
 */
export async function moveBooking(
  booking: Row,
  to: { date: string; time: string; stylist?: { id: string; name: string } | null },
  by: 'client' | 'salon',
): Promise<Row | null | 'taken'> {
  const { data, error } = await adminDb
    .from('bookings')
    .update({
      booking_date: to.date,
      time_slot: to.time,
      ...(to.stylist && { stylist_id: to.stylist.id, stylist_name: to.stylist.name }),
      rescheduled_at: new Date().toISOString(),
      rescheduled_by: by,
      previous_booking_date: booking.booking_date,
      previous_time_slot: booking.time_slot,
      ...(by === 'client' && { reschedule_count: (booking.reschedule_count ?? 0) + 1 }),
    })
    .eq('id', booking.id)
    .eq('booking_date', booking.booking_date)
    .eq('time_slot', booking.time_slot)
    .in('status', ['pending', 'confirmed'])
    .select('*')
    .maybeSingle()

  // The per-stylist slot index (migration 010)
  if (error?.code === '23505') return 'taken'
  if (error) throw error
  return data
}

/** Email + SMS to the client; an SMS to the salon when the client moved it */
export async function sendRescheduledNotices(updated: Row, previous: Row, by: 'client' | 'salon') {
  if (updated.client_email) {
    await sendSafely('reschedule email', {
      from: FROM,
      to: updated.client_email,
      subject: `Appointment moved: ${updated.service_name} on ${formatBookingDate(updated.booking_date)}`,
      html: rescheduledHtml({
        clientName:   updated.client_name,
        serviceName:  updated.service_name,
        treatment:    updated.treatment,
        stylistName:  updated.stylist_name,
        bookingDate:  formatBookingDate(updated.booking_date),
        timeSlot:     updated.time_slot,
        previousDate: formatBookingDate(previous.booking_date),
        previousTime: previous.time_slot,
        movedBy:      by,
        manageUrl:    manageUrl(updated.cancel_token),
      }),
    })
  }

  const sms = updated as Parameters<typeof bookingRescheduledSms>[0]
  await sendSmsSafely('reschedule SMS', updated.client_phone, bookingRescheduledSms(sms, by))
  if (by === 'client') {
    await sendSmsSafely('admin reschedule SMS', ADMIN_NOTIFY_PHONE,
      clientRescheduledAdminSms(sms, { booking_date: previous.booking_date, time_slot: previous.time_slot }))
  }
}
