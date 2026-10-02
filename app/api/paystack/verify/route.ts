import { NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/paystack'
import { settlePayment, releaseUnpaidBooking } from '@/lib/payments'

// Called by the success page after Paystack redirects back. The webhook
// records the same payment independently, so this is safe to call repeatedly.
export async function POST(req: Request) {
  try {
    const { reference } = await req.json()
    if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 })

    const result = await verifyPayment(reference)
    if (!result.success) {
      // Abandoned or failed: nothing was charged, so free the slot right away.
      // Anything still in progress (e.g. a Mobile Money approval) is left alone.
      const bookingId = result.metadata.type === 'booking' ? result.metadata.bookingId : null
      const notPaid = result.status === 'abandoned' || result.status === 'failed'
      const inProgress = ['ongoing', 'pending', 'processing', 'queued'].includes(result.status)
      if (typeof bookingId === 'string' && notPaid) await releaseUnpaidBooking(bookingId)
      if (notPaid) {
        return NextResponse.json({ code: 'not_paid', error: 'Your payment was not completed, so you have not been charged.' }, { status: 400 })
      }
      if (inProgress) {
        return NextResponse.json({ code: 'pending', error: 'Your payment is still being processed. You will get a confirmation email once it goes through.' }, { status: 400 })
      }
      return NextResponse.json({ code: 'unknown_payment', error: 'We could not find this payment. If you were charged, please contact us.' }, { status: 400 })
    }

    const settled = await settlePayment(reference, result.amount, result.metadata)
    if (!settled) return NextResponse.json({ code: 'unknown', error: 'Unknown payment type' }, { status: 400 })
    if (settled.outcome === 'not_found') {
      return NextResponse.json({ code: 'not_found', error: settled.type === 'booking' ? 'Booking not found' : 'Order not found' }, { status: 404 })
    }
    if (settled.outcome === 'amount_mismatch') {
      return NextResponse.json({ code: 'amount_mismatch', error: 'Payment amount did not match. Please contact us.' }, { status: 400 })
    }
    if (settled.outcome === 'refund_owed') {
      return NextResponse.json(
        { code: 'refund_owed', error: 'Your payment went through, but this slot is no longer available. We will contact you about a full refund or a new time.' },
        { status: 409 },
      )
    }
    if (settled.type === 'booking' && settled.record?.status === 'cancelled') {
      return NextResponse.json({ code: 'cancelled', error: 'This booking has been cancelled.' }, { status: 409 })
    }

    return NextResponse.json({ type: settled.type, id: settled.id, [settled.type]: settled.record })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
