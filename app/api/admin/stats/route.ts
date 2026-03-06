import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`

  const [
    { count: todayBookings },
    { count: pendingBookings },
    { count: pendingOrders },
    { data: monthBookings },
    { data: monthOrders },
  ] = await Promise.all([
    adminDb.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_date', today),
    adminDb.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    adminDb.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    adminDb.from('bookings').select('amount').eq('payment_status', 'paid').gte('created_at', firstOfMonth),
    adminDb.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', firstOfMonth),
  ])

  const bookingRevenue = (monthBookings ?? []).reduce((s: number, b: { amount: number }) => s + b.amount, 0)
  const orderRevenue = (monthOrders ?? []).reduce((s: number, o: { total: number }) => s + o.total, 0)
  const monthRevenueGHS = (bookingRevenue + orderRevenue) / 100

  return NextResponse.json({
    todayBookings: todayBookings ?? 0,
    pendingBookings: pendingBookings ?? 0,
    pendingOrders: pendingOrders ?? 0,
    monthRevenueGHS,
  })
}
