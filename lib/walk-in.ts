// December 2026 is walk-in only: no online bookings, except with the Head
// Stylist. The month is dated, so the rule switches itself off afterwards.

export const WALK_IN_MONTH = '2026-12'

export const WALK_IN_MESSAGE =
  'December services are walk-in only and bookings are not being accepted. Only our Head Stylist can be booked online.'

/** Every date in the walk-in month, for greying them out on a calendar */
export const WALK_IN_DATES = Array.from(
  { length: 31 },
  (_, i) => `${WALK_IN_MONTH}-${String(i + 1).padStart(2, '0')}`,
)

/** Read from the stylist's title, which the salon sets in the admin */
export const isHeadStylist = (stylist: { title?: string | null } | null | undefined) =>
  /head\s+stylist/i.test(stylist?.title ?? '')

/** True when this date can't be booked online with this stylist (none = "Any Available") */
export const isWalkInOnly = (date: string, stylist: { title?: string | null } | null | undefined) =>
  date.startsWith(WALK_IN_MONTH) && !isHeadStylist(stylist)
