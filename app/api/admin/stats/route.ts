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
    { count: completedBookings },
    { count: cancelledBookings },
    { data: monthBookings },
  ] = await Promise.all([
    adminDb.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_date', today),
    adminDb.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('booking_date', firstOfMonth),
    adminDb.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled').gte('booking_date', firstOfMonth),
    adminDb.from('bookings').select('amount').eq('payment_status', 'paid').gte('created_at', firstOfMonth),
  ])

  const monthRevenueGHS = (monthBookings ?? []).reduce((s: number, b: { amount: number }) => s + b.amount, 0) / 100

  return NextResponse.json({
    todayBookings: todayBookings ?? 0,
    completedBookings: completedBookings ?? 0,
    cancelledBookings: cancelledBookings ?? 0,
    monthRevenueGHS,
  })
}
