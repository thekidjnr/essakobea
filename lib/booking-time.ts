// Accra is UTC+0 with no daylight saving, so a booking's wall-clock time is
// also its UTC time. Every date/time here is built in UTC to stay correct no
// matter which timezone the server runs in.

// "2:00 PM" | "14:00" | "9:30 am" → minutes since midnight, or null if unparseable
export function slotToMinutes(slot: string): number | null {
  const m = slot.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2])
  const meridiem = m[3]?.toUpperCase()
  if (meridiem === 'PM' && h < 12) h += 12
  if (meridiem === 'AM' && h === 12) h = 0
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

// The moment an appointment starts, in ms since epoch. Falls back to midnight
// when the slot can't be parsed, so callers always get a real number.
export function appointmentStart(bookingDate: string, timeSlot: string): number {
  const day = Date.parse(`${bookingDate}T00:00:00Z`)
  const minutes = slotToMinutes(timeSlot) ?? 0
  return day + minutes * 60_000
}

export function hoursUntilAppointment(bookingDate: string, timeSlot: string, now = Date.now()): number {
  return (appointmentStart(bookingDate, timeSlot) - now) / 3_600_000
}

// Emergency bookings ignore closed days and opening hours, but still pick
// from this fixed grid. Shared by the booking form and the bookings API.
export const EMERGENCY_HOURS = { open: '08:00', close: '18:00', interval: 60 } as const

export function todayInAccra(): string {
  return new Date().toISOString().slice(0, 10)
}

export function firstOfMonthInAccra(): string {
  return `${todayInAccra().slice(0, 7)}-01`
}

// Day of week (0 = Sunday) for a YYYY-MM-DD date, independent of server timezone.
export function dayOfWeek(bookingDate: string): number {
  return new Date(`${bookingDate}T00:00:00Z`).getUTCDay()
}

// "Friday, 2 October 2026" for a YYYY-MM-DD date.
export function formatBookingDate(bookingDate: string): string {
  return new Date(`${bookingDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}
