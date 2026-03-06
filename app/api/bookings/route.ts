import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { initializePayment, generateReference } from '@/lib/paystack'
import type { ServiceBookingOption } from '@/lib/supabase/types'

// How long a pending+unpaid booking holds a slot before it's freed (30 min)
const SLOT_HOLD_MS = 30 * 60 * 1000

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      clientName, clientEmail, clientPhone,
      serviceId, optionId,
      serviceName, treatment,
      bookingDate, timeSlot, notes,
    } = body

    if (!clientName || !clientPhone || !serviceId || !optionId || !bookingDate || !timeSlot) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── 1. Look up authoritative price from DB ────────────────────────────────
    const { data: svc } = await adminDb
      .from('services')
      .select('booking_options')
      .eq('slug', serviceId)
      .single()

    const option = (svc?.booking_options as ServiceBookingOption[] | null)
      ?.find((o) => o.id === optionId)

    const depositGHS = (option?.price_raw ?? 0) > 0 ? (option!.price_raw) : 100

    // ── 2. Release stale pending slots (abandoned payments older than 30 min) ──
    const staleThreshold = new Date(Date.now() - SLOT_HOLD_MS).toISOString()
    await adminDb
      .from('bookings')
      .update({ status: 'cancelled', cancellation_reason: 'Payment timeout — slot released' })
      .eq('booking_date', bookingDate)
      .eq('time_slot', timeSlot)
      .eq('status', 'pending')
      .eq('payment_status', 'unpaid')
      .lt('created_at', staleThreshold)

    // ── 3. Insert booking ─────────────────────────────────────────────────────
    const { data: booking, error } = await adminDb
      .from('bookings')
      .insert({
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        service_id: serviceId,
        service_name: serviceName,
        treatment,
        booking_date: bookingDate,
        time_slot: timeSlot,
        notes: notes || null,
        status: 'pending',
        payment_status: 'unpaid',
        amount: depositGHS * 100, // stored in pesewas
      })
      .select()
      .single()

    if (error) {
      // Unique constraint violation → slot was just taken
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This time slot was just taken. Please go back and choose a different time.' },
          { status: 409 }
        )
      }
      console.error(error)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // ── 4. Initialize Paystack deposit ────────────────────────────────────────
    if (!clientEmail) {
      return NextResponse.json({ error: 'Email is required to process payment' }, { status: 400 })
    }

    const reference = generateReference('book')
    const { url } = await initializePayment({
      email: clientEmail,
      amountGHS: depositGHS,
      reference,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/book/success`,
      metadata: { bookingId: booking.id, type: 'booking' },
    })

    await adminDb.from('bookings').update({ payment_reference: reference }).eq('id', booking.id)

    return NextResponse.json({ bookingId: booking.id, paystackUrl: url })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
