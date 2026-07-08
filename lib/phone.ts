// ─────────────────────────────────────────────────────────────────────────────
// Phone — country dial codes + WhatsApp number normalization
// ─────────────────────────────────────────────────────────────────────────────

export interface Country {
  name:  string
  iso2:  string   // ISO 3166-1 alpha-2
  dial:  string   // e.g. "+233"
  example: string // placeholder shown for the local number part (no dial code)
}

// Ghana pinned first as the default. Rest covers West Africa + common
// diaspora/travel origins for clients booking from abroad.
export const COUNTRIES: Country[] = [
  { name: "Ghana",          iso2: "GH", dial: "+233", example: "24 123 4567" },
  { name: "Nigeria",        iso2: "NG", dial: "+234", example: "801 234 5678" },
  { name: "Côte d'Ivoire",  iso2: "CI", dial: "+225", example: "01 23 45 67 89" },
  { name: "Togo",           iso2: "TG", dial: "+228", example: "90 12 34 56" },
  { name: "Benin",          iso2: "BJ", dial: "+229", example: "90 12 34 56" },
  { name: "Burkina Faso",   iso2: "BF", dial: "+226", example: "70 12 34 56" },
  { name: "Senegal",        iso2: "SN", dial: "+221", example: "70 123 45 67" },
  { name: "Cameroon",       iso2: "CM", dial: "+237", example: "6 71 23 45 67" },
  { name: "Kenya",          iso2: "KE", dial: "+254", example: "712 345 678" },
  { name: "South Africa",   iso2: "ZA", dial: "+27",  example: "71 234 5678" },
  { name: "United Kingdom", iso2: "GB", dial: "+44",  example: "7911 123456" },
  { name: "United States",  iso2: "US", dial: "+1",   example: "201 555 0123" },
  { name: "Canada",         iso2: "CA", dial: "+1",   example: "201 555 0123" },
  { name: "Germany",        iso2: "DE", dial: "+49",  example: "1512 3456789" },
  { name: "France",         iso2: "FR", dial: "+33",  example: "6 12 34 56 78" },
  { name: "Netherlands",    iso2: "NL", dial: "+31",  example: "6 12345678" },
  { name: "United Arab Emirates", iso2: "AE", dial: "+971", example: "50 123 4567" },
]

export function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("")
}

// Composes a country dial code + locally-typed digits into an E.164-ish string.
// Strips a single leading 0 from the local part (common when people type
// their number as if dialing domestically, e.g. "0557205803" -> "557205803").
export function composePhone(dial: string, localDigits: string): string {
  const digits = localDigits.replace(/\D/g, "").replace(/^0+/, "")
  return digits ? `${dial}${digits}` : ""
}

// Splits a stored E.164-ish phone value back into { dial, localDigits } for
// re-populating the PhoneInput (e.g. when a returning client is found).
export function splitPhone(value: string): { dial: string; localDigits: string } {
  const cleaned = value.replace(/[^\d+]/g, "")
  const match = COUNTRIES
    .slice()
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => cleaned.startsWith(c.dial))
  if (match) return { dial: match.dial, localDigits: cleaned.slice(match.dial.length) }
  return { dial: "+233", localDigits: cleaned.replace(/^\+/, "") }
}

// Converts a stored phone value into digits-only, ready for a wa.me link.
// Handles legacy bookings stored as a raw Ghana local number (e.g. "0557205803")
// from before the country-code picker existed.
export function toWhatsAppDigits(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "")
  if (cleaned.startsWith("+")) return cleaned.slice(1)
  if (cleaned.startsWith("0")) return `233${cleaned.slice(1)}`
  return cleaned
}

export function whatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${toWhatsAppDigits(phone)}?text=${encodeURIComponent(message)}`
}
