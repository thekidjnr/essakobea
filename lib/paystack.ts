// ─────────────────────────────────────────────────────────────────────────────
// Paystack — Ghana (GHS / Mobile Money + Card)
// ─────────────────────────────────────────────────────────────────────────────

const PAYSTACK_API = 'https://api.paystack.co'

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  }
}

export function generateReference(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export interface InitPayload {
  email:       string
  amountGHS:   number   // human GHS amount — we convert to pesewas internally
  reference:   string
  callbackUrl: string
  metadata?:   Record<string, unknown>
}

export async function initializePayment(payload: InitPayload): Promise<{ url: string; accessCode: string; reference: string }> {
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      email:        payload.email,
      amount:       Math.round(payload.amountGHS * 100), // to pesewas
      currency:     'GHS',
      reference:    payload.reference,
      callback_url: payload.callbackUrl,
      metadata:     payload.metadata ?? {},
    }),
  })

  const data = await res.json()
  if (!data.status) throw new Error(data.message ?? 'Paystack init failed')
  return { url: data.data.authorization_url, accessCode: data.data.access_code, reference: data.data.reference }
}

export async function verifyPayment(reference: string): Promise<{
  success:  boolean
  status:   string   // Paystack's own status: success, abandoned, failed, ongoing, pending...
  amount:   number   // pesewas
  email:    string
  metadata: Record<string, unknown>
}> {
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
    headers: authHeaders(),
  })
  const data = await res.json().catch(() => null)
  const tx = data?.data ?? {}

  return {
    success:  !!data?.status && tx.status === 'success',
    status:   typeof tx.status === 'string' ? tx.status : '',
    amount:   tx.amount ?? 0,
    email:    tx.customer?.email ?? '',
    metadata: tx.metadata ?? {},
  }
}

// Paystack signs webhook bodies with HMAC-SHA512 of the raw body, keyed by
// the secret key. Anything that doesn't match is not from Paystack.
export async function isValidWebhookSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false
  const { createHmac, timingSafeEqual } = await import('crypto')
  const expected = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}
