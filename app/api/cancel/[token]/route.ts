import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getResend, FROM } from '@/lib/resend'
import { cancellationHtml } from '@/emails/cancellation'

// GET — lookup booking by token (for the cancel confirmation page)
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data: booking } = await adminDb
    .from('bookings')
    .select('id,client_name,service_name,treatment,booking_date,time_slot,status')
    .eq('cancel_token', token)
    .single()

  if (!booking) return NextResponse.json({ error: 'Invalid cancellation link' }, { status: 404 })
  return NextResponse.json(booking)
}

// POST — execute cancellation
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { reason } = await req.json()

  const { data: booking } = await adminDb
    .from('bookings')
    .select('*')
    .eq('cancel_token', token)
    .single()

  if (!booking) return NextResponse.json({ error: 'Invalid cancellation link' }, { status: 404 })
  if (booking.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
  if (booking.status === 'completed') return NextResponse.json({ error: 'Appointment already completed' }, { status: 400 })

  const bookingTime = new Date(`${booking.booking_date}T${booking.time_slot.replace(/[AP]M/, '')}`).getTime()
  const hoursNotice = (bookingTime - Date.now()) / 3600000

  await adminDb.from('bookings').update({
    status: 'cancelled',
    cancellation_reason: reason || 'Cancelled by client',
    cancelled_at: new Date().toISOString(),
  }).eq('id', booking.id)

  if (booking.client_email) {
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    await getResend().emails.send({
      from: FROM,
      to: booking.client_email,
      subject: 'Your Essakobea appointment has been cancelled',
      html: cancellationHtml({
        clientName: booking.client_name,
        serviceName: booking.service_name,
        treatment: booking.treatment,
        bookingDate: formattedDate,
        timeSlot: booking.time_slot,
        reason,
        hoursNotice,
      }),
    })
  }

  return NextResponse.json({ success: true, hoursNotice })
}
