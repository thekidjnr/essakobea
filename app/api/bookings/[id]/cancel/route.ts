import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { FROM } from '@/lib/resend'
import { sendSafely } from '@/lib/payments'
import { refundPolicy } from '@/lib/refunds'
import { formatBookingDate } from '@/lib/booking-time'
import { getAdmin, unauthorized } from '@/lib/admin-auth'
import { cancellationHtml } from '@/emails/cancellation'

// Admin cancellation: the salon cancelled, so a paid client is owed a full refund.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized()

  const { id } = await params
  const { reason } = await req.json().catch(() => ({ reason: '' }))

  const { data: booking } = await adminDb.from('bookings').select('*').eq('id', id).single()
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return NextResponse.json({ error: `Cannot cancel a ${booking.status} booking` }, { status: 409 })
  }

  const { share, refundPesewas } = refundPolicy(booking, 'salon')

  const { error } = await adminDb.from('bookings').update({
    status: 'cancelled',
    cancellation_reason: reason || 'Cancelled by salon',
    cancelled_at: new Date().toISOString(),
    refund_amount: refundPesewas,
  }).eq('id', id)
  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }

  if (booking.client_email) {
    await sendSafely('admin cancellation email', {
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
        cancelledBy: 'salon',
        paid:        booking.payment_status === 'paid',
        refundShare: share,
      }),
    })
  }

  return NextResponse.json({ success: true, refundAmount: refundPesewas })
}
