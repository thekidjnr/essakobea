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

export async function initializePayment(payload: InitPayload): Promise<{ url: string; reference: string }> {
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
  return { url: data.data.authorization_url, reference: data.data.reference }
}

export async function verifyPayment(reference: string): Promise<{
  success:  boolean
  amount:   number   // pesewas
  email:    string
  metadata: Record<string, unknown>
}> {
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
    headers: authHeaders(),
  })
  const data = await res.json()
  const tx = data.data

  return {
    success:  data.status && tx.status === 'success',
    amount:   tx.amount ?? 0,
    email:    tx.customer?.email ?? '',
    metadata: tx.metadata ?? {},
  }
}
