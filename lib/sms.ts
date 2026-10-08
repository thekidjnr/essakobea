// ─────────────────────────────────────────────────────────────────────────────
// SMS via GateKeeperPro. Like sendSafely for email: a failed text is logged
// and never undoes or fails the booking action that triggered it.
// ─────────────────────────────────────────────────────────────────────────────

import { toInternationalDigits } from '@/lib/phone'

const SEND_SMS_URL = 'https://api.gatekeeperpro.live/api/send_sms'
const SENDER_ID = 'Essakobea'

// The business owner's phone for booking alerts. Defaults to the public salon number.
export const ADMIN_NOTIFY_PHONE = process.env.ADMIN_PHONE ?? '+233557205803'

// One non-GSM character (₵, curly quotes, en dashes) makes the whole message
// Unicode, which cuts each credit from 160 characters to 70. Service names
// come from the database, so swap the usual suspects for plain equivalents.
function toGsmFriendly(text: string): string {
  return text
    .replace(/₵/g, 'GHS ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[·•]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
}

export async function sendSmsSafely(label: string, phone: string | null | undefined, message: string) {
  const apiKey = process.env.GATEKEEPER_API_KEY
  if (!apiKey) {
    console.error(`Skipped ${label}: GATEKEEPER_API_KEY is not set`)
    return
  }
  const phoneNumber = phone ? toInternationalDigits(phone) : ''
  if (phoneNumber.length < 9) {
    console.error(`Skipped ${label}: unusable phone number`, phone)
    return
  }

  try {
    const res = await fetch(SEND_SMS_URL, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, message: toGsmFriendly(message), senderID: SENDER_ID }),
      signal: AbortSignal.timeout(10_000),
    })
    // The docs show a `success` flag, but real responses omit it, so trust the status code.
    if (!res.ok) console.error(`Failed to send ${label}`, res.status, await res.text().catch(() => ''))
  } catch (err) {
    console.error(`Failed to send ${label}`, err)
  }
}

// First name only keeps texts short and personal.
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? ''
}

// "2026-10-02" -> "Fri 2 Oct"
export function shortBookingDate(bookingDate: string): string {
  return new Date(`${bookingDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  }).replace(',', '')
}

type SmsBooking = {
  client_name: string
  client_phone: string
  service_name: string
  booking_date: string
  time_slot: string
}

function when(b: SmsBooking): string {
  return `${shortBookingDate(b.booking_date)} at ${b.time_slot}`
}

export function bookingConfirmedSms(
  b: SmsBooking & { stylist_name?: string | null; client_email?: string | null },
): string {
  const stylist = b.stylist_name ? ` with ${b.stylist_name}` : ''
  // Email is optional at booking, so only point to it when we actually sent one.
  const checkEmail = b.client_email ? ' Check your email for full booking details.' : ''
  return `Hi ${firstName(b.client_name)}, your Essakobea booking is confirmed: ${b.service_name}, ${when(b)}${stylist}.${checkEmail}`
}

export function bookingAdminSms(b: SmsBooking & { amount?: number | null }): string {
  const paid = Math.round((b.amount ?? 0) / 100)
  return `New booking: ${b.client_name} (${b.client_phone}), ${b.service_name}, ${when(b)}. Paid GHS ${paid.toLocaleString()}.`
}

export function bookingCancelledSms(b: SmsBooking, paid: boolean, refundShare: number): string {
  const refund = !paid
    ? ''
    : refundShare >= 1 ? ' You will get a full refund.'
    : refundShare > 0 ? ' You will get a 50% refund.'
    : ' This cancellation is not eligible for a refund.'
  return `Hi ${firstName(b.client_name)}, your Essakobea appointment for ${b.service_name} on ${when(b)} has been cancelled.${refund}`
}

export function clientCancelledAdminSms(b: SmsBooking, reason: string): string {
  return `Cancelled by client: ${b.client_name} (${b.client_phone}), ${b.service_name}, ${when(b)}.${reason ? ` Reason: ${reason}` : ''}`
}
