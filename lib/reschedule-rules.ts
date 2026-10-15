// Who can move a booking themselves, and the wording clients see. No server
// imports, so the manage page can share it. The full story is in lib/reschedule.

import { hoursUntilAppointment } from '@/lib/booking-time'

export const RESCHEDULE_NOTICE_HOURS = 24
export const CLIENT_RESCHEDULE_LIMIT = 1

// Client-facing wording of the rule below. Keep the two in step.
export function reschedulePolicyText() {
  return `You can move your appointment once, online, up to ${RESCHEDULE_NOTICE_HOURS} hours before it starts. After that, message us on WhatsApp.`
}

interface ReschedulableBooking {
  status:            string
  booking_date:      string
  time_slot:         string
  is_emergency?:     boolean | null
  reschedule_count?: number | null
}

/** Why the client can't move this booking themselves, or null when they can */
export function clientRescheduleBlock(b: ReschedulableBooking, now = Date.now()): string | null {
  if (b.status === 'cancelled') return 'This appointment has been cancelled.'
  if (b.status === 'completed') return 'This appointment has already taken place.'
  if (b.status !== 'confirmed') return 'This booking isn\'t confirmed yet, so it can\'t be moved.'
  if (b.is_emergency) return 'Emergency bookings can\'t be moved online. Message us on WhatsApp and we\'ll help.'
  if ((b.reschedule_count ?? 0) >= CLIENT_RESCHEDULE_LIMIT) {
    return 'You\'ve already moved this appointment once. Message us on WhatsApp if you need to change it again.'
  }
  if (hoursUntilAppointment(b.booking_date, b.time_slot, now) < RESCHEDULE_NOTICE_HOURS) {
    return `Your appointment is less than ${RESCHEDULE_NOTICE_HOURS} hours away, so it can't be moved online. Message us on WhatsApp.`
  }
  return null
}
