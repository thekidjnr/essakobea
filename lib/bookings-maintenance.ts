import { adminDb } from '@/lib/supabase/admin'
import { todayInAccra } from '@/lib/booking-time'

// A confirmed appointment whose day has passed is treated as done: the salon
// keeps the payment whether or not the client showed up. Run lazily whenever
// the dashboard reads bookings, so nobody has to click "Complete" on each one.
export async function autoCompletePastBookings() {
  const { error } = await adminDb
    .from('bookings')
    .update({ status: 'completed' })
    .eq('status', 'confirmed')
    .lt('booking_date', todayInAccra())
  if (error) console.error('Failed to auto-complete past bookings', error)
}
