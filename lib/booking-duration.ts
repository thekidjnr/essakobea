// ─────────────────────────────────────────────────────────────────────────────
// Appointment length and overlap checks
// ─────────────────────────────────────────────────────────────────────────────
//
// Each booking option carries `duration_minutes`, set in the admin. A booking
// keeps the stylist busy from its start until start + duration, so a stylist
// is only free for a new appointment when it overlaps none of theirs. Shared
// by the availability API (which slots to grey out) and the bookings API
// (the final check before a booking is created).

import { slotToMinutes } from '@/lib/booking-time'

// Used when an option has no duration yet, keyed by service slug. Rough
// starting points; the salon sets the real ones per option in the admin.
const SERVICE_DEFAULT_MINUTES: Record<string, number> = {
  'installations':     180,
  'wig-making':        240,
  'coloring':          240,
  'regular-ponytails': 120,
  'frontal-ponytails': 180,
  'sew-in':            240,
}
const FALLBACK_MINUTES = 120

export function optionDuration(
  serviceSlug: string,
  option: { duration_minutes?: number | null } | null | undefined,
): number {
  const set = Number(option?.duration_minutes)
  if (set > 0) return set
  return SERVICE_DEFAULT_MINUTES[serviceSlug] ?? FALLBACK_MINUTES
}

// "4 hrs", "1 hr 30 mins", "45 mins"
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const parts: string[] = []
  if (h) parts.push(`${h} ${h === 1 ? 'hr' : 'hrs'}`)
  if (m) parts.push(`${m} mins`)
  return parts.join(' ') || '0 mins'
}

export interface ActiveBooking {
  time_slot:         string
  stylist_id:        string | null
  duration_minutes?: number | null
  status:            string
  payment_status:    string
  created_at:        string
}

// Of the pending + confirmed bookings, drops pending unpaid ones whose
// payment hold has run out
export function isActiveBooking(b: ActiveBooking, holdMs: number, now = Date.now()): boolean {
  if (b.status === 'pending' && b.payment_status === 'unpaid') {
    return new Date(b.created_at).getTime() > now - holdMs
  }
  return true
}

// [start, end) in minutes since midnight. Bookings made before durations
// existed fill one slot interval.
function span(b: ActiveBooking, fallbackMinutes: number): [number, number] | null {
  const start = slotToMinutes(b.time_slot)
  if (start === null) return null
  const length = Number(b.duration_minutes) > 0 ? Number(b.duration_minutes) : fallbackMinutes
  return [start, start + length]
}

function overlaps(b: ActiveBooking, start: number, end: number, fallbackMinutes: number): boolean {
  const s = span(b, fallbackMinutes)
  return !!s && s[0] < end && start < s[1]
}

/** Does this stylist have any booking that overlaps [start, start + duration)? */
export function stylistBusy(
  bookings: ActiveBooking[],
  stylistId: string,
  start: number,
  duration: number,
  fallbackMinutes: number,
): boolean {
  return bookings.some(
    (b) => b.stylist_id === stylistId && overlaps(b, start, start + duration, fallbackMinutes),
  )
}

/** Most clients in the salon at once at any point in [start, start + duration) */
export function peakOccupancy(
  bookings: ActiveBooking[],
  start: number,
  duration: number,
  fallbackMinutes: number,
): number {
  const end = start + duration
  const spans = bookings
    .map((b) => span(b, fallbackMinutes))
    .filter((s): s is [number, number] => !!s && s[0] < end && start < s[1])
  // Occupancy only rises when a booking starts, so checking the window's
  // start and every booking start inside it finds the peak.
  const points = [start, ...spans.map(([s]) => s).filter((s) => s > start)]
  return Math.max(0, ...points.map((p) => spans.filter(([s, e]) => s <= p && p < e).length))
}
