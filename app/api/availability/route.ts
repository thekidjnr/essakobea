import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import type { ServiceBookingOption, Stylist } from '@/lib/supabase/types'
import { dayOfWeek, minutesToSlot, slotGrid, slotToMinutes, EMERGENCY_HOURS } from '@/lib/booking-time'
import {
  isActiveBooking, optionDuration, peakOccupancy, stylistBusy, type ActiveBooking,
} from '@/lib/booking-duration'

// Matches the hold window in the bookings API
const SLOT_HOLD_MS = 30 * 60 * 1000

// GET /api/availability?date=YYYY-MM-DD&stylistId=&serviceId=&optionId=&emergency=1
//
// A booking keeps its stylist busy for the option's full duration, so a start
// time is only offered when the chosen stylist is free for the whole
// appointment. With no stylistId ("Any Available"), a time is offered while
// at least one stylist is. Outside emergency bookings, the appointment must
// also finish by closing time.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const stylistId = searchParams.get('stylistId') || null
  const serviceId = searchParams.get('serviceId') || ''
  const optionId = searchParams.get('optionId') || ''
  const emergency = searchParams.get('emergency') === '1'
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const weekday = dayOfWeek(date)

  const [{ data: avail }, { data: blocked }, { data: bookings, error: bookingsError }, { data: stylists }, { data: svc }] = await Promise.all([
    adminDb.from('availability').select('*').eq('day_of_week', weekday).maybeSingle(),
    adminDb.from('blocked_dates').select('id').eq('date', date).maybeSingle(),
    adminDb
      .from('bookings')
      .select('time_slot, stylist_id, duration_minutes, status, payment_status, created_at')
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed']),
    adminDb.from('stylists').select('*').eq('is_available', true),
    serviceId
      ? adminDb.from('services').select('booking_options').eq('slug', serviceId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  // Never show a day as free because its bookings couldn't be read
  if (bookingsError) {
    console.error(bookingsError)
    return NextResponse.json({ error: 'Could not load availability' }, { status: 500 })
  }

  const interval: number = avail?.slot_interval_minutes ?? 60
  const option = (svc?.booking_options as ServiceBookingOption[] | null)?.find((o) => o.id === optionId)
  // Without a service the form hasn't picked one yet, so treat it as one slot
  const duration = serviceId ? optionDuration(serviceId, option) : interval

  const maxPerDay: number  = avail?.max_bookings_per_day  ?? 0  // 0 = unlimited, salon-wide
  // Physical station limit: how many clients the salon can seat at once,
  // independent of how many stylists are rostered.
  const maxPerSlot: number = avail?.max_bookings_per_slot ?? 1

  const activeBookings = ((bookings ?? []) as ActiveBooking[]).filter((b) => isActiveBooking(b, SLOT_HOLD_MS))

  const dayIsOpen = !blocked && (avail?.is_available ?? false)
  let dayFull = maxPerDay > 0 && activeBookings.length >= maxPerDay

  const allStylists = (stylists as Stylist[] | null) ?? []
  const underCap = (s: Stylist) =>
    !s.daily_capacity || activeBookings.filter((b) => b.stylist_id === s.id).length < s.daily_capacity

  let candidates: Stylist[]
  if (stylistId) {
    const stylist = allStylists.find((s) => s.id === stylistId)
    candidates = stylist && underCap(stylist) ? [stylist] : []
  } else {
    // "Any Available": the day is full once no stylist has capacity left
    candidates = allStylists.filter(underCap)
  }
  dayFull = dayFull || candidates.length === 0

  // Every start time the form may show: the day's grid, plus the emergency grid
  const closeMins = emergency ? null : slotToMinutes(avail?.close_time ?? '')
  const starts = new Set([
    ...(avail ? slotGrid(avail.open_time, avail.close_time, interval) : []),
    ...slotGrid(EMERGENCY_HOURS.open, EMERGENCY_HOURS.close, EMERGENCY_HOURS.interval),
  ])

  const bookedSlots = Array.from(starts)
    .filter((start) => {
      if (closeMins !== null && start + duration > closeMins) return true
      if (peakOccupancy(activeBookings, start, duration, interval) >= maxPerSlot) return true
      return candidates.every((s) => stylistBusy(activeBookings, s.id, start, duration, interval))
    })
    .sort((a, b) => a - b)
    .map(minutesToSlot)

  return NextResponse.json({
    available: dayIsOpen && !dayFull,
    bookedSlots,
    openTime:      avail?.open_time,
    closeTime:     avail?.close_time,
    slotInterval:  interval,
    duration,
    dayFull,
    bookingsToday: activeBookings.length,
  })
}
