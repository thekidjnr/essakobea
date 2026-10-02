import { NextResponse } from 'next/server'
import { isValidWebhookSignature, verifyPayment } from '@/lib/paystack'
import { settlePayment } from '@/lib/payments'

export const dynamic = 'force-dynamic'

// Paystack calls this server-to-server when a charge succeeds, so payments are
// recorded even if the customer closes the tab before reaching the success page.
// Set it in Paystack → Settings → API Keys & Webhooks:
//   https://essakobea.com/api/paystack/webhook
export async function POST(req: Request) {
  const raw = await req.text()
  if (!(await isValidWebhookSignature(raw, req.headers.get('x-paystack-signature')))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { event?: string; data?: { reference?: string } }
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (event.event !== 'charge.success' || !event.data?.reference) {
    return NextResponse.json({ received: true })
  }

  try {
    // Re-verify with Paystack rather than trusting the payload's amount.
    const result = await verifyPayment(event.data.reference)
    if (result.success) await settlePayment(event.data.reference, result.amount, result.metadata)
  } catch (err) {
    console.error('Paystack webhook failed', err)
    // 500 makes Paystack retry later.
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
