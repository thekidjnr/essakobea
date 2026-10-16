// What a client can change on their own booking from the manage link, with no
// effect on price or timing: their phone and email, their notes, and the
// photos they added. Style, service and stylist changes go through the salon
// (Edit booking in the admin). No server imports, so the manage page shares it.

import { appointmentStart } from '@/lib/booking-time'
import { bringsHair, getServiceRules } from '@/lib/service-rules'

export const MAX_NOTES_LENGTH = 1000
export const MAX_PHOTOS = 6

interface EditableBooking {
  status:          string
  booking_date:    string
  time_slot:       string
  service_id:      string
  hair_unit_type?: string | null
}

/** Why the client can't change details themselves, or null when they can */
export function clientEditBlock(b: EditableBooking, now = Date.now()): string | null {
  if (b.status === 'cancelled') return 'This appointment has been cancelled.'
  if (b.status === 'completed') return 'This appointment has already taken place.'
  if (b.status !== 'confirmed') return 'This booking isn\'t confirmed yet, so it can\'t be changed.'
  if (appointmentStart(b.booking_date, b.time_slot) <= now) return 'This appointment has already started.'
  return null
}

/** Which photo lists this booking has, labelled the way the booking form labels them */
export function editablePhotos(b: EditableBooking) {
  const rules = getServiceRules(b.service_id)
  const bringing = bringsHair(b.hair_unit_type)
  return {
    unit:  bringing ? { label: rules.photoLabel, help: rules.photoHelp } : null,
    inspo: bringing && rules.inspoPhoto ? rules.inspoPhoto : null,
  }
}
