// ─────────────────────────────────────────────────────────────────────────────
// Will a booking fit at this date and time? Shared by the admin (manual
// bookings and moves, which warn but can be overridden, and the picker that
// shows those warnings up front) and the client reschedule page (which only
// offers times that pass every check).
//
// `excludeId` leaves a booking out of the counts, so a booking being moved
// never blocks its own new time.
// ─────────────────────────────────────────────────────────────────────────────

import { adminDb } from '@/lib/supabase/admin'
import { appointmentStart, dayOfWeek, minutesToSlot, slotGrid, slotToMinutes } from '@/lib/booking-time'
import { isActiveBooking, peakOccupancy, stylistBusy, type ActiveBooking } from '@/lib/booking-duration'

// Matches the hold window in the bookings API
const SLOT_HOLD_MS = 30 * 60 * 1000

type DayBooking = ActiveBooking & { id: string; location_type?: string }

export interface SlotStylist {
  id: string
  name: string
  daily_capacity: number | null
}

async function loadDay(date: string, excludeId?: string) {
  const [{ data: avail }, { data: blocked }, { data: sameDay, error }] = await Promise.all([
    adminDb.from('availability').select('*').eq('day_of_week', dayOfWeek(date)).maybeSingle(),
    adminDb.from('blocked_dates').select('id').eq('date', date).maybeSingle(),
    adminDb.from('bookings').select('*').eq('booking_date', date).in('status', ['pending', 'confirmed']),
  ])
  // Never treat a day as free because its bookings couldn't be read
  if (error) throw error
  const active = ((sameDay ?? []) as DayBooking[])
    .filter((b) => b.id !== excludeId && isActiveBooking(b, SLOT_HOLD_MS))
  return {
    avail,
    closed: !!blocked || !avail?.is_available,
    interval: (avail?.slot_interval_minutes as number | undefined) ?? 60,
    active,
    // Home service visits keep their stylist busy but don't take a seat in the salon
    inSalon: active.filter((b) => b.location_type !== 'home'),
  }
}

type Day = Awaited<ReturnType<typeof loadDay>>

interface SlotArgs {
  date: string
  duration: number
  stylist: SlotStylist | null
  home: boolean
}

// Rules that hold for the whole day, whatever the time: closed, or a daily limit reached
function dayWarnings(day: Day, { stylist, home }: SlotArgs): string[] {
  const { avail, closed, active, inSalon } = day
  const warnings: string[] = []
  if (closed) warnings.push('The salon is closed that day.')
  if (stylist) {
    const count = active.filter((b) => b.stylist_id === stylist.id).length
    if (stylist.daily_capacity && count >= stylist.daily_capacity) {
      warnings.push(`${stylist.name} is already at their limit of ${stylist.daily_capacity} bookings that day.`)
    }
  }
  const maxPerDay = avail?.max_bookings_per_day ?? 0
  if (!home && maxPerDay > 0 && inSalon.length >= maxPerDay) {
    warnings.push(`The salon already has its limit of ${maxPerDay} bookings that day.`)
  }
  return warnings
}

// Rules that depend on the start time: opening hours, the stylist's diary, seats
function timeWarnings(day: Day, start: number, { duration, stylist, home }: SlotArgs): string[] {
  const { avail, closed, interval, active, inSalon } = day
  const warnings: string[] = []
  if (!closed) {
    const open = slotToMinutes(avail.open_time) ?? 0
    const close = slotToMinutes(avail.close_time) ?? 0
    if (start < open || start + duration > close) {
      warnings.push(`It runs outside opening hours (${minutesToSlot(open)} to ${minutesToSlot(close)}).`)
    }
  }
  if (stylist && stylistBusy(active, stylist.id, start, duration, interval)) {
    warnings.push(`${stylist.name} already has a booking at that time.`)
  }
  // Home visits don't take a seat in the salon
  if (!home && peakOccupancy(inSalon, start, duration, interval) >= (avail?.max_bookings_per_slot ?? 1)) {
    warnings.push('The salon is already full at that time.')
  }
  return warnings
}

/** Everything about this time that breaks the usual rules, in the salon's words */
export async function availabilityWarnings({ start, excludeId, ...args }: SlotArgs & {
  start: number
  excludeId?: string
}): Promise<string[]> {
  const day = await loadDay(args.date, excludeId)
  const passed = appointmentStart(args.date, minutesToSlot(start)) <= Date.now()
  return [
    ...(passed ? ['This date and time have already passed.'] : []),
    ...dayWarnings(day, args),
    ...timeWarnings(day, start, args),
  ]
}

export interface StaffSlot {
  time: string
  passed: boolean
  /** What saving at this time would warn about, beyond the day-wide notes */
  warnings: string[]
}

/**
 * The day's working-hours times, each with the same warnings saving it would
 * give. A closed or blocked day still gets its weekday's usual hours, so the
 * salon can open on it. Day-wide warnings (closed, daily limits) come once.
 */
export async function staffSlots({ excludeId, ...args }: SlotArgs & { excludeId?: string }) {
  const day = await loadDay(args.date, excludeId)
  const grid = day.avail ? slotGrid(day.avail.open_time, day.avail.close_time, day.interval) : []
  const slots: StaffSlot[] = grid.map((start) => ({
    time: minutesToSlot(start),
    passed: appointmentStart(args.date, minutesToSlot(start)) <= Date.now(),
    warnings: timeWarnings(day, start, args),
  }))
  return { closed: day.closed, dayWarnings: dayWarnings(day, args), slots }
}

/**
 * Start times on the day's normal grid where this booking fits with no rule
 * broken: the salon is open, it finishes by closing, the stylist is free for
 * the whole appointment and under their daily limit, and the salon has a
 * seat and room in its daily cap.
 */
export async function freeStartTimes({ date, duration: length, stylist, home, excludeId }: {
  date: string
  /** null for bookings made before durations, which fill one slot */
  duration: number | null
  stylist: SlotStylist | null
  home: boolean
  excludeId?: string
}): Promise<{ closed: boolean; full: boolean; times: string[] }> {
  const { avail, closed, interval, active, inSalon } = await loadDay(date, excludeId)
  if (closed) return { closed: true, full: false, times: [] }

  const duration = length && length > 0 ? length : interval
  const maxPerSlot = avail.max_bookings_per_slot ?? 1
  const maxPerDay = avail.max_bookings_per_day ?? 0
  const stylistFull = !!stylist?.daily_capacity &&
    active.filter((b) => b.stylist_id === stylist.id).length >= stylist.daily_capacity
  const salonFull = !home && maxPerDay > 0 && inSalon.length >= maxPerDay
  if (stylistFull || salonFull) return { closed: false, full: true, times: [] }

  const close = slotToMinutes(avail.close_time) ?? 0
  const times = slotGrid(avail.open_time, avail.close_time, interval)
    .filter((start) =>
      start + duration <= close &&
      appointmentStart(date, minutesToSlot(start)) > Date.now() &&
      !(stylist && stylistBusy(active, stylist.id, start, duration, interval)) &&
      (home || peakOccupancy(inSalon, start, duration, interval) < maxPerSlot))
    .map(minutesToSlot)
  return { closed: false, full: false, times }
}
