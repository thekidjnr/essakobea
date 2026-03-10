import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'

// Matches the hold window in the bookings API
const SLOT_HOLD_MS = 30 * 60 * 1000

// GET /api/availability?date=YYYY-MM-DD
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const dayOfWeek = new Date(date).getDay()

  const [{ data: avail }, { data: blocked }, { data: bookings }] = await Promise.all([
    adminDb.from('availability').select('*').eq('day_of_week', dayOfWeek).single(),
    adminDb.from('blocked_dates').select('id').eq('date', date).maybeSingle(),
    adminDb
      .from('bookings')
      .select('time_slot, status, payment_status, created_at')
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed']),
  ])

  const staleThreshold = Date.now() - SLOT_HOLD_MS
  const maxPerSlot: number = avail?.max_bookings_per_slot ?? 1
  const maxPerDay: number  = avail?.max_bookings_per_day  ?? 0  // 0 = unlimited

  // Active bookings = confirmed, OR pending-unpaid within the hold window
  const activeBookings = (bookings ?? []).filter((b) => {
    if (b.status === 'confirmed') return true
    if (b.status === 'pending' && b.payment_status === 'unpaid') {
      return new Date(b.created_at).getTime() > staleThreshold
    }
    return true
  })

  // Count bookings per slot — a slot is "full" when its count >= maxPerSlot
  const slotCounts: Record<string, number> = {}
  for (const b of activeBookings) {
    slotCounts[b.time_slot] = (slotCounts[b.time_slot] ?? 0) + 1
  }
  const bookedSlots = Object.entries(slotCounts)
    .filter(([, count]) => count >= maxPerSlot)
    .map(([slot]) => slot)

  // Day is full when total active bookings reaches the daily cap (0 = no cap)
  const dayFull = maxPerDay > 0 && activeBookings.length >= maxPerDay

  return NextResponse.json({
    available: !blocked && !dayFull && (avail?.is_available ?? false),
    bookedSlots,
    openTime:      avail?.open_time,
    closeTime:     avail?.close_time,
    slotInterval:  avail?.slot_interval_minutes ?? 60,
    maxPerSlot,
    maxPerDay,
    bookingsToday: activeBookings.length,
  })
}
