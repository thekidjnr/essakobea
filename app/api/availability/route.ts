import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import type { Stylist } from '@/lib/supabase/types'

// Matches the hold window in the bookings API
const SLOT_HOLD_MS = 30 * 60 * 1000

interface ActiveBooking {
  time_slot:      string
  stylist_id:     string | null
  status:         string
  payment_status: string
  created_at:     string
}

// GET /api/availability?date=YYYY-MM-DD&stylistId=optional
//
// Availability is now scoped per stylist: each stylist holds at most one
// booking per exact time slot, and caps out at their own `daily_capacity`
// appointments per day. When no stylistId is given ("Any Available"), a slot
// is only shown as full once every available stylist is either booked at
// that slot or has hit their daily cap for the day.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const stylistId = searchParams.get('stylistId') || null
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const dayOfWeek = new Date(date).getDay()

  const [{ data: avail }, { data: blocked }, { data: bookings }, { data: stylists }] = await Promise.all([
    adminDb.from('availability').select('*').eq('day_of_week', dayOfWeek).single(),
    adminDb.from('blocked_dates').select('id').eq('date', date).maybeSingle(),
    adminDb
      .from('bookings')
      .select('time_slot, stylist_id, status, payment_status, created_at')
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed']),
    adminDb.from('stylists').select('*').eq('is_available', true),
  ])

  const staleThreshold = Date.now() - SLOT_HOLD_MS
  const maxPerDay: number  = avail?.max_bookings_per_day  ?? 0  // 0 = unlimited, salon-wide
  // Physical station limit — how many clients the salon can seat at once,
  // independent of how many stylists are rostered. Still applies on top of
  // each stylist's own per-slot exclusivity below.
  const maxPerSlot: number = avail?.max_bookings_per_slot ?? 1

  // Active bookings = confirmed, OR pending-unpaid within the hold window
  const activeBookings = ((bookings ?? []) as ActiveBooking[]).filter((b) => {
    if (b.status === 'confirmed') return true
    if (b.status === 'pending' && b.payment_status === 'unpaid') {
      return new Date(b.created_at).getTime() > staleThreshold
    }
    return true
  })

  const dayIsOpen = !blocked && (avail?.is_available ?? false)
  const salonDayFull = maxPerDay > 0 && activeBookings.length >= maxPerDay

  // Station limit — a slot is full once total bookings there (any stylist)
  // reach the salon's physical capacity, regardless of stylist assignment.
  const slotTotals: Record<string, number> = {}
  for (const b of activeBookings) slotTotals[b.time_slot] = (slotTotals[b.time_slot] ?? 0) + 1
  const stationFullSlots = new Set(Object.entries(slotTotals).filter(([, n]) => n >= maxPerSlot).map(([slot]) => slot))

  let bookedSlots: string[] = []
  let dayFull = salonDayFull

  if (stylistId) {
    const stylistBookings = activeBookings.filter((b) => b.stylist_id === stylistId)
    const stylist = (stylists as Stylist[] | null)?.find((s) => s.id === stylistId)
    const ownSlots = new Set(stylistBookings.map((b) => b.time_slot))
    bookedSlots = Array.from(new Set([...ownSlots, ...stationFullSlots]))
    const capacityFull = !!stylist?.daily_capacity && stylistBookings.length >= stylist.daily_capacity
    dayFull = dayFull || capacityFull || !stylist
  } else {
    // "Any Available" — a slot is full only once EVERY eligible stylist is
    // taken there (or the station limit is reached), and the day is full
    // once no stylist has capacity left.
    const eligibleStylists = (stylists as Stylist[] | null ?? []).filter((s) => {
      const count = activeBookings.filter((b) => b.stylist_id === s.id).length
      return !s.daily_capacity || count < s.daily_capacity
    })

    dayFull = dayFull || eligibleStylists.length === 0

    const allActiveSlots = new Set(activeBookings.map((b) => b.time_slot))
    const stylistExhaustedSlots = Array.from(allActiveSlots).filter((slot) =>
      eligibleStylists.every((s) => activeBookings.some((b) => b.stylist_id === s.id && b.time_slot === slot))
    )
    bookedSlots = Array.from(new Set([...stylistExhaustedSlots, ...stationFullSlots]))
  }

  return NextResponse.json({
    available: dayIsOpen && !dayFull,
    bookedSlots,
    openTime:      avail?.open_time,
    closeTime:     avail?.close_time,
    slotInterval:  avail?.slot_interval_minutes ?? 60,
    dayFull,
    bookingsToday: activeBookings.length,
  })
}
