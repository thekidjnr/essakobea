import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { initializePayment, generateReference } from '@/lib/paystack'
import type { ServiceBookingOption, Stylist } from '@/lib/supabase/types'

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
      stylistId, stylistName, stylistFeeAdjustment,
      hairUnitType, unitPhotos,
      customizationType, isEmergency,
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

    const baseDepositGHS = (option?.price_raw ?? 0) > 0 ? (option!.price_raw) : 100
    const stylistAdj     = stylistFeeAdjustment ?? 0

    // ── 1b. Calculate add-on fees server-side ─────────────────────────────────
    const customizationFeeGHS = customizationType === 'standard' ? 100
                              : customizationType === 'express'  ? 150 : 0
    const emergencyFeeGHS     = isEmergency ? 200 : 0
    const subtotalGHS         = baseDepositGHS + stylistAdj + customizationFeeGHS + emergencyFeeGHS
    const serviceChargeGHS    = Math.round(subtotalGHS * 0.05)
    const depositGHS          = subtotalGHS + serviceChargeGHS

    // ── 2. Release stale pending slots (abandoned payments older than 30 min) ──
    const staleThreshold = new Date(Date.now() - SLOT_HOLD_MS).toISOString()
    await adminDb
      .from('bookings')
      .update({ status: 'cancelled', cancellation_reason: 'Payment timeout, slot released' })
      .eq('booking_date', bookingDate)
      .eq('time_slot', timeSlot)
      .eq('status', 'pending')
      .eq('payment_status', 'unpaid')
      .lt('created_at', staleThreshold)

    // ── 2b. Resolve stylist assignment (each stylist holds their own slot) ─────
    const { data: activeSameDay } = await adminDb
      .from('bookings')
      .select('stylist_id, time_slot, status, payment_status, created_at')
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'confirmed'])

    const staleThresholdMs = Date.now() - SLOT_HOLD_MS
    const activeBookingsToday = (activeSameDay ?? []).filter((b) => {
      if (b.status === 'confirmed') return true
      if (b.status === 'pending' && b.payment_status === 'unpaid') {
        return new Date(b.created_at).getTime() > staleThresholdMs
      }
      return true
    })

    let resolvedStylistId = stylistId || null
    let resolvedStylistName = stylistName || null

    if (stylistId) {
      const { data: stylist } = await adminDb.from('stylists').select('*').eq('id', stylistId).single()
      if (!stylist || !stylist.is_available) {
        return NextResponse.json({ error: 'This stylist is no longer available. Please choose another.' }, { status: 409 })
      }
      const stylistCountToday = activeBookingsToday.filter((b) => b.stylist_id === stylistId).length
      if (stylist.daily_capacity && stylistCountToday >= stylist.daily_capacity) {
        return NextResponse.json({ error: 'This stylist is fully booked for that day. Please choose a different date or stylist.' }, { status: 409 })
      }
      if (activeBookingsToday.some((b) => b.stylist_id === stylistId && b.time_slot === timeSlot)) {
        return NextResponse.json({ error: 'This time slot was just taken. Please go back and choose a different time.' }, { status: 409 })
      }
    } else {
      const { data: stylists } = await adminDb.from('stylists').select('*').eq('is_available', true)
      const eligible = (stylists as Stylist[] | null ?? [])
        .map((s) => ({
          stylist: s,
          countToday: activeBookingsToday.filter((b) => b.stylist_id === s.id).length,
          takenThisSlot: activeBookingsToday.some((b) => b.stylist_id === s.id && b.time_slot === timeSlot),
        }))
        .filter((e) => !e.takenThisSlot && (!e.stylist.daily_capacity || e.countToday < e.stylist.daily_capacity))
        .sort((a, b) => a.countToday - b.countToday)

      if (eligible.length === 0) {
        return NextResponse.json({ error: 'No stylists are available for that time. Please choose a different time.' }, { status: 409 })
      }
      resolvedStylistId = eligible[0].stylist.id
      resolvedStylistName = eligible[0].stylist.name
    }

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
        stylist_id: resolvedStylistId,
        stylist_name: resolvedStylistName,
        hair_unit_type: hairUnitType || null,
        unit_photos: unitPhotos || [],
        customization_type: customizationType || null,
        is_emergency: isEmergency ?? false,
        customization_fee: customizationFeeGHS * 100,
        emergency_fee: emergencyFeeGHS * 100,
        service_charge: serviceChargeGHS * 100,
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
