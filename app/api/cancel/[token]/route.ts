import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { FROM } from '@/lib/resend'
import { sendSafely } from '@/lib/payments'
import { refundPolicy } from '@/lib/refunds'
import { formatBookingDate } from '@/lib/booking-time'
import { cancellationHtml } from '@/emails/cancellation'
import { sendSmsSafely, bookingCancelledSms, clientCancelledAdminSms, ADMIN_NOTIFY_PHONE } from '@/lib/sms'

// GET — lookup booking by token (for the cancel confirmation page)
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data: booking } = await adminDb
    .from('bookings')
    .select('id,client_name,service_name,treatment,booking_date,time_slot,status,amount,payment_status')
    .eq('cancel_token', token)
    .single()

  if (!booking) return NextResponse.json({ error: 'Invalid cancellation link' }, { status: 404 })

  // What the client would get back if they cancelled right now
  const { share, refundPesewas } = refundPolicy(booking, 'client')
  const { amount, payment_status, ...rest } = booking
  return NextResponse.json({
    ...rest,
    paid: payment_status === 'paid',
    paidPesewas: payment_status === 'paid' ? amount : 0,
    refundShare: share,
    refundPesewas,
  })
}

// POST — execute cancellation
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { reason } = await req.json().catch(() => ({ reason: '' }))

  const { data: booking } = await adminDb
    .from('bookings')
    .select('*')
    .eq('cancel_token', token)
    .single()

  if (!booking) return NextResponse.json({ error: 'Invalid cancellation link' }, { status: 404 })
  if (booking.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
  if (booking.status === 'completed') return NextResponse.json({ error: 'Appointment already completed' }, { status: 400 })

  const { hoursNotice, share, refundPesewas } = refundPolicy(booking, 'client')

  const { data: updated } = await adminDb.from('bookings').update({
    status: 'cancelled',
    cancellation_reason: reason || 'Cancelled by client',
    cancelled_at: new Date().toISOString(),
    refund_amount: refundPesewas,
  }).eq('id', booking.id).in('status', ['pending', 'confirmed']).select('id').maybeSingle()

  if (!updated) return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })

  if (booking.client_email) {
    await sendSafely('client cancellation email', {
      from: FROM,
      to: booking.client_email,
      subject: 'Your Essakobea appointment has been cancelled',
      html: cancellationHtml({
        clientName:  booking.client_name,
        serviceName: booking.service_name,
        treatment:   booking.treatment,
        bookingDate: formatBookingDate(booking.booking_date),
        timeSlot:    booking.time_slot,
        reason,
        cancelledBy: 'client',
        paid:        booking.payment_status === 'paid',
        refundShare: share,
      }),
    })
  }

  await sendSmsSafely('client cancellation SMS', booking.client_phone,
    bookingCancelledSms(booking, booking.payment_status === 'paid', share))
  await sendSmsSafely('admin cancellation SMS', ADMIN_NOTIFY_PHONE, clientCancelledAdminSms(booking, reason))

  return NextResponse.json({ success: true, hoursNotice })
}
