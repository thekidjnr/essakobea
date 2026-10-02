import { hoursUntilAppointment } from '@/lib/booking-time'

export type CancelledBy = 'client' | 'salon'

// Cancellation policy, in one place so the email, the refund amount and the
// earnings all agree:
//   • salon cancels                    → full refund
//   • client cancels 24h+ ahead        → full refund
//   • client cancels within 24h        → 50% refund
//   • client cancels after start time  → no refund
// Client-facing wording of the rule below. Keep the two in step.
export function cancellationPolicyText(paymentWord = 'payment') {
  return `Cancel at least 24 hours before your appointment for a full refund. Cancel within 24 hours and you get 50% of your ${paymentWord} back. No-shows and cancellations after your appointment time are not refunded.`
}

export function refundPolicy(
  booking: { amount: number; payment_status: string; booking_date: string; time_slot: string },
  cancelledBy: CancelledBy,
) {
  const hoursNotice = hoursUntilAppointment(booking.booking_date, booking.time_slot)
  const share = cancelledBy === 'salon' || hoursNotice >= 24 ? 1 : hoursNotice >= 0 ? 0.5 : 0
  const paid = booking.payment_status === 'paid'
  return {
    hoursNotice,
    share: paid ? share : 0,
    refundPesewas: paid ? Math.round(booking.amount * share) : 0,
  }
}
