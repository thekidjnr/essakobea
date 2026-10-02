import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin } from '@/lib/admin-auth'
import { todayInAccra, firstOfMonthInAccra } from '@/lib/booking-time'
import { autoCompletePastBookings } from '@/lib/bookings-maintenance'
import { bookingSplit } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await autoCompletePastBookings()

  const today = todayInAccra()
  const firstOfMonth = firstOfMonthInAccra()

  const results = await Promise.all([
    // Real appointments today: paid-for or manually confirmed, not cancelled or abandoned.
    adminDb.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_date', today).in('status', ['confirmed', 'completed']),
    adminDb.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('booking_date', firstOfMonth).lte('booking_date', today),
    adminDb.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled').neq('payment_status', 'unpaid').gte('cancelled_at', firstOfMonth),
    // Money taken this month, net of refunds and the service fee (same as Finance).
    adminDb.from('bookings').select('amount, service_charge, refund_amount').in('payment_status', ['paid', 'refunded']).gte('created_at', firstOfMonth),
    adminDb.from('bookings').select('refund_amount').eq('status', 'cancelled').eq('payment_status', 'paid').gt('refund_amount', 0),
  ])
  const failed = results.find((r) => r.error)
  if (failed) {
    console.error(failed.error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
  const [today_, completed, cancelled, month, refunds] = results

  const monthRevenuePesewas = (month.data ?? []).reduce(
    (s: number, b: { amount: number; service_charge: number; refund_amount: number }) => s + bookingSplit(b).net, 0)
  const refundsOwedPesewas = (refunds.data ?? []).reduce(
    (s: number, b: { refund_amount: number }) => s + b.refund_amount, 0)

  return NextResponse.json({
    todayBookings:     today_.count ?? 0,
    completedBookings: completed.count ?? 0,
    cancelledBookings: cancelled.count ?? 0,
    monthRevenueGHS:   monthRevenuePesewas / 100,
    refundsOwedGHS:    refundsOwedPesewas / 100,
    refundsOwedCount:  (refunds.data ?? []).length,
  })
}
