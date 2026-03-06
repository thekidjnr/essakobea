import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getResend, FROM } from '@/lib/resend'
import { cancellationHtml } from '@/emails/cancellation'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Admin-only route
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { reason } = await req.json()

  const { data: booking } = await adminDb.from('bookings').select('*').eq('id', id).single()
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await adminDb.from('bookings').update({
    status: 'cancelled',
    cancellation_reason: reason || 'Cancelled by admin',
    cancelled_at: new Date().toISOString(),
  }).eq('id', id)

  if (booking.client_email) {
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    const bookingTime = new Date(booking.booking_date).getTime()
    const hoursNotice = (bookingTime - Date.now()) / 3600000
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

  return NextResponse.json({ success: true })
}
