import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'bookings@essakobea.com'

// Customer-facing sends: booking/order confirmations, cancellations.
export const FROM = `Essakobea <${FROM_EMAIL}>`

// Internal notifications: new booking alerts, payout requests/updates.
export const FROM_ADMIN = `Essakobea Admin <${FROM_EMAIL}>`
