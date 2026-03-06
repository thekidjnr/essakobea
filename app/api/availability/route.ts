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

  // A slot is "booked" if:
  // - status is 'confirmed' (always blocks), OR
  // - status is 'pending' AND the booking is recent (< 30 min) — payment in progress
  const bookedSlots = (bookings ?? [])
    .filter((b) => {
      if (b.status === 'confirmed') return true
      if (b.status === 'pending' && b.payment_status === 'unpaid') {
        return new Date(b.created_at).getTime() > staleThreshold
      }
      return true
    })
    .map((b) => b.time_slot)

  return NextResponse.json({
    available: !blocked && (avail?.is_available ?? false),
    bookedSlots,
    openTime: avail?.open_time,
    closeTime: avail?.close_time,
    slotInterval: avail?.slot_interval_minutes ?? 60,
  })
}
