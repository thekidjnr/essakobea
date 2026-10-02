import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin } from '@/lib/admin-auth'
import { todayInAccra } from '@/lib/booking-time'
import { autoCompletePastBookings } from '@/lib/bookings-maintenance'

export const dynamic = 'force-dynamic'

// GET /api/admin/bookings?status=all|pending|confirmed|completed|cancelled|refunds
//                         &when=upcoming|past|all&sort=date|recent&limit=N
export async function GET(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await autoCompletePastBookings()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date')
  const when = searchParams.get('when')
  const sort = searchParams.get('sort')
  const limit = Number(searchParams.get('limit')) || null

  let query = adminDb.from('bookings').select('*')
  query = sort === 'recent'
    ? query.order('created_at', { ascending: false })
    : query.order('booking_date', { ascending: false }).order('created_at', { ascending: false })

  if (status === 'refunds') {
    query = query.eq('status', 'cancelled').eq('payment_status', 'paid').gt('refund_amount', 0)
  } else if (status === 'pending') {
    // Checkouts that never completed. Payment timeouts are cancelled, not pending.
    query = query.eq('status', 'pending')
  } else if (status && status !== 'all') {
    query = query.eq('status', status)
  } else {
    // "All" leaves out abandoned checkouts: unpaid bookings that were never confirmed.
    query = query.neq('status', 'pending').or('payment_status.neq.unpaid,status.neq.cancelled')
  }
  if (date) query = query.eq('booking_date', date)

  const today = todayInAccra()
  if (when === 'upcoming') query = query.gte('booking_date', today)
  else if (when === 'past') query = query.lt('booking_date', today)
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}
