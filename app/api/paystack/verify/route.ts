import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { verifyPayment } from '@/lib/paystack'
import { getResend, FROM } from '@/lib/resend'
import { bookingConfirmationHtml } from '@/emails/booking-confirmation'
import { orderConfirmationHtml } from '@/emails/order-confirmation'

export async function POST(req: Request) {
  try {
    const { reference } = await req.json()
    if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 })

    const result = await verifyPayment(reference)
    if (!result.success) return NextResponse.json({ error: 'Payment not successful' }, { status: 400 })

    const { metadata } = result

    if (metadata.type === 'booking') {
      const bookingId = metadata.bookingId as string
      const { data: booking } = await adminDb.from('bookings').select('*').eq('id', bookingId).single()
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

      await adminDb.from('bookings').update({
        payment_status: 'paid',
        payment_reference: reference,
        status: 'confirmed',
      }).eq('id', bookingId)

      if (booking.client_email) {
        const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
        const depositGHS = Math.round((booking.amount ?? 0) / 100)
        // Determine if this was a deposit (range-priced service) by checking the option's display price
        let isDeposit = false
        if (booking.service_id && booking.treatment) {
          const { data: svc } = await adminDb.from('services').select('booking_options').eq('slug', booking.service_id).single()
          const options = svc?.booking_options as { name?: string; price?: string }[] | null
          const opt = options?.find((o) => o.name === booking.treatment)
          if (opt?.price && /[-–]/.test(opt.price)) isDeposit = true
        }
        await getResend().emails.send({
          from: FROM,
          to: booking.client_email,
          subject: `Booking confirmed — ${booking.service_name} on ${formattedDate}`,
          html: bookingConfirmationHtml({
            clientName:  booking.client_name,
            serviceName: booking.service_name,
            treatment:   booking.treatment,
            bookingDate: formattedDate,
            timeSlot:    booking.time_slot,
            depositGHS,
            isDeposit,
            stylistName: booking.stylist_name ?? null,
            bookingId:   booking.id,
            cancelToken: booking.cancel_token,
            appUrl:      process.env.NEXT_PUBLIC_APP_URL ?? '',
          }),
        })
      }

      return NextResponse.json({ type: 'booking', id: bookingId, booking })
    }

    if (metadata.type === 'order') {
      const orderId = metadata.orderId as string
      const { data: order } = await adminDb.from('orders').select('*').eq('id', orderId).single()
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

      await adminDb.from('orders').update({
        payment_status: 'paid',
        payment_reference: reference,
        status: 'processing',
      }).eq('id', orderId)

      if (order.client_email) {
        await getResend().emails.send({
          from: FROM,
          to: order.client_email,
          subject: `Order confirmed — Essakobea`,
          html: orderConfirmationHtml({
            clientName: order.client_name,
            orderId: order.id,
            items: order.items,
            subtotal: order.subtotal,
            total: order.total,
            deliveryMethod: order.delivery_method,
            deliveryAddress: order.delivery_address,
            appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
          }),
        })
      }

      return NextResponse.json({ type: 'order', id: orderId, order })
    }

    return NextResponse.json({ error: 'Unknown payment type' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
