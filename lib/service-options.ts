import type { ServiceBookingOption } from '@/lib/supabase/types'

// Every bookable option needs a stable id and a positive online price,
// otherwise the booking API can't charge for it.
export function validateBookingOptions(options: unknown): string | null {
  if (options === undefined) return null
  if (!Array.isArray(options)) return 'booking_options must be a list'
  const ids = new Set<string>()
  for (const o of options as Partial<ServiceBookingOption>[]) {
    if (!o?.id || !o.name?.trim()) return 'Every booking option needs a name'
    if (ids.has(o.id)) return `Two booking options share the id "${o.id}"`
    ids.add(o.id)
    if (!(Number(o.price_raw) > 0)) return `"${o.name}" needs an online price above ₵0`
  }
  return null
}

// Fields an admin may edit on a service. Anything else in the body is ignored.
export const EDITABLE_SERVICE_FIELDS = [
  'name', 'description', 'image_url', 'image_position', 'flip', 'booking_options', 'is_active', 'display_order',
] as const

export function pickServiceFields(body: Record<string, unknown>) {
  return Object.fromEntries(EDITABLE_SERVICE_FIELDS.filter((k) => k in body).map((k) => [k, body[k]]))
}
