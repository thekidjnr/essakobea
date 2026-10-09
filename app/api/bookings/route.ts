import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { initializePayment, generateReference, verifyPayment } from '@/lib/paystack'
import { settleBookingPayment, TIMEOUT_CANCEL_REASON } from '@/lib/payments'
import { dayOfWeek, slotToMinutes, appointmentStart, EMERGENCY_HOURS } from '@/lib/booking-time'
import { isActiveBooking, optionDuration, peakOccupancy, stylistBusy, type ActiveBooking } from '@/lib/booking-duration'
import { bookingTotals } from '@/lib/booking-fees'
import { getServiceRules, bringsHair, BUNDLE_OPTIONS } from '@/lib/service-rules'
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
      stylistId,
      hairUnitType, unitPhotos, inspoPhotos, bundleCount,
      customizationType, isEmergency,
    } = body

    if (!clientName || !clientPhone || !serviceId || !optionId || !bookingDate || !timeSlot) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json({ error: 'A valid email is required to process payment' }, { status: 400 })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || slotToMinutes(timeSlot) === null) {
      return NextResponse.json({ error: 'Invalid date or time' }, { status: 400 })
    }
    if (appointmentStart(bookingDate, timeSlot) <= Date.now()) {
      return NextResponse.json({ error: 'That time has already passed. Please choose another.' }, { status: 400 })
    }

    // ── 0. Salon open that day, at that time? ────────────────────────────────
    // Emergency bookings may land on closed days and outside opening hours,
    // but only on the fixed emergency grid the booking form offers.
    const emergency = isEmergency === true
    const [{ data: avail }, { data: blocked }] = await Promise.all([
      adminDb.from('availability').select('*').eq('day_of_week', dayOfWeek(bookingDate)).maybeSingle(),
      adminDb.from('blocked_dates').select('id').eq('date', bookingDate).maybeSingle(),
    ])
    if (!emergency && (!avail?.is_available || blocked)) {
      return NextResponse.json({ error: 'We are closed on that day. Please choose another date.' }, { status: 409 })
    }
    const slotMins  = slotToMinutes(timeSlot)!
    const openMins  = slotToMinutes(emergency ? EMERGENCY_HOURS.open : avail!.open_time) ?? 0
    const closeMins = slotToMinutes(emergency ? EMERGENCY_HOURS.close : avail!.close_time) ?? 0
    const interval  = emergency ? EMERGENCY_HOURS.interval : avail!.slot_interval_minutes ?? 60
    if (slotMins < openMins || slotMins >= closeMins || (slotMins - openMins) % interval !== 0) {
      return NextResponse.json({ error: 'That time is outside our opening hours. Please choose another.' }, { status: 409 })
    }
    // Legacy bookings with no stored duration fill one slot of the day's grid
    const dayInterval: number = avail?.slot_interval_minutes ?? 60

    // ── 1. Look up authoritative price from DB ────────────────────────────────
    const { data: svc } = await adminDb
      .from('services')
      .select('name, booking_options, is_active')
      .eq('slug', serviceId)
      .single()

    const option = (svc?.booking_options as ServiceBookingOption[] | null)
      ?.find((o) => o.id === optionId)

    if (!svc?.is_active || !option || !(Number(option.price_raw) > 0)) {
      return NextResponse.json(
        { error: 'This service option has changed. Please refresh the page and choose it again.' },
        { status: 409 },
      )
    }
    const baseDepositGHS = Number(option.price_raw)
    const duration = optionDuration(serviceId, option)
    if (!emergency && slotMins + duration > closeMins) {
      return NextResponse.json(
        { error: 'This appointment would run past closing time. Please choose an earlier time.' },
        { status: 409 },
      )
    }

    // ── 1a. Per-service hair rules: drop anything the form didn't offer ───────
    const rules = getServiceRules(serviceId)
    const hairType: string | null =
      rules.hairOptions.some((o) => o.id === hairUnitType) ? hairUnitType : null
    const bringing = bringsHair(hairType)
    const customization: string | null =
      bringing && rules.customization ? customizationType || null : null
    const bundles: number | null =
      bringing && rules.askBundles && (BUNDLE_OPTIONS as readonly number[]).includes(bundleCount)
        ? bundleCount
        : null
    const inspo: string[] | null =
      bringing && rules.inspoPhoto && Array.isArray(inspoPhotos)
        ? inspoPhotos.filter((u: unknown): u is string => typeof u === 'string')
        : null

    // ── 1b. Add-on fees are calculated server-side (see lib/booking-fees) ────
    let stylistAdj = 0   // set from the DB once the stylist is known

    // ── 2. Release stale pending slots (abandoned payments older than 30 min) ──
    // Ask Paystack first: a customer may have paid without reaching the
    // success page, and their booking must not be released.
    const staleThreshold = new Date(Date.now() - SLOT_HOLD_MS).toISOString()
    const { data: stale } = await adminDb
      .from('bookings')
      .select('id, payment_reference')
      .eq('booking_date', bookingDate)
      .eq('time_slot', timeSlot)
      .eq('status', 'pending')
      .eq('payment_status', 'unpaid')
      .lt('created_at', staleThreshold)

    for (const b of stale ?? []) {
      if (b.payment_reference) {
        const result = await verifyPayment(b.payment_reference).catch(() => null)
        if (result?.success) {
          await settleBookingPayment(b.id, b.payment_reference, result.amount)
          continue
        }
      }
      await adminDb
        .from('bookings')
        .update({ status: 'cancelled', cancellation_reason: TIMEOUT_CANCEL_REASON, cancelled_at: new Date().toISOString() })
        .eq('id', b.id)
        .eq('status', 'pending')
        .eq('payment_status', 'unpaid')
    }

    // ── 2b. Resolve stylist assignment (each stylist holds their own slot) ─────
    const { data: activeSameDay, error: activeError } = await adminDb
      .from('bookings')
      .select('stylist_id, time_slot, duration_minutes, status, payment_status, created_at')
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'confirmed'])

    if (activeError) {
      console.error(activeError)
      return NextResponse.json({ error: 'Could not check availability. Please try again.' }, { status: 500 })
    }
    const activeBookingsToday = ((activeSameDay ?? []) as ActiveBooking[])
      .filter((b) => isActiveBooking(b, SLOT_HOLD_MS))
    // A stylist is free only if none of their bookings overlap this appointment
    const busy = (id: string) => stylistBusy(activeBookingsToday, id, slotMins, duration, dayInterval)

    // Salon-wide limits: physical stations at once, and bookings per day.
    const maxPerSlot = avail?.max_bookings_per_slot ?? 1
    const maxPerDay  = avail?.max_bookings_per_day ?? 0
    if (peakOccupancy(activeBookingsToday, slotMins, duration, dayInterval) >= maxPerSlot) {
      return NextResponse.json({ error: 'This time slot was just taken. Please go back and choose a different time.' }, { status: 409 })
    }
    if (maxPerDay > 0 && activeBookingsToday.length >= maxPerDay) {
      return NextResponse.json({ error: 'That day is fully booked. Please choose a different date.' }, { status: 409 })
    }

    let resolvedStylistId: string | null = null
    let resolvedStylistName: string | null = null

    if (stylistId) {
      const { data: stylist } = await adminDb.from('stylists').select('*').eq('id', stylistId).single()
      if (!stylist || !stylist.is_available) {
        return NextResponse.json({ error: 'This stylist is no longer available. Please choose another.' }, { status: 409 })
      }
      const stylistCountToday = activeBookingsToday.filter((b) => b.stylist_id === stylistId).length
      if (stylist.daily_capacity && stylistCountToday >= stylist.daily_capacity) {
        return NextResponse.json({ error: 'This stylist is fully booked for that day. Please choose a different date or stylist.' }, { status: 409 })
      }
      if (busy(stylistId)) {
        return NextResponse.json({ error: 'This time slot was just taken. Please go back and choose a different time.' }, { status: 409 })
      }
      resolvedStylistId = stylist.id
      resolvedStylistName = stylist.name
      // Only a stylist the client picked adds their premium; "Any available"
      // is charged the base price they were shown.
      stylistAdj = Number(stylist.fee_adjustment) || 0
    } else {
      const { data: stylists } = await adminDb.from('stylists').select('*').eq('is_available', true)
      const eligible = (stylists as Stylist[] | null ?? [])
        .map((s) => ({
          stylist: s,
          countToday: activeBookingsToday.filter((b) => b.stylist_id === s.id).length,
          busy: busy(s.id),
        }))
        .filter((e) => !e.busy && (!e.stylist.daily_capacity || e.countToday < e.stylist.daily_capacity))
        .sort((a, b) => a.countToday - b.countToday)

      if (eligible.length === 0) {
        return NextResponse.json({ error: 'No stylists are available for that time. Please choose a different time.' }, { status: 409 })
      }
      resolvedStylistId = eligible[0].stylist.id
      resolvedStylistName = eligible[0].stylist.name
    }

    const {
      customizationFee: customizationFeeGHS,
      emergencyFee:     emergencyFeeGHS,
      serviceCharge:    serviceChargeGHS,
      total:            depositGHS,
    } = bookingTotals({
      base: baseDepositGHS,
      stylistAdj,
      // Some services settle Standard / Express with the salon, not online
      customizationType: rules.customizationFees ? customization : null,
      isEmergency: emergency,
    })
    if (depositGHS <= 0) {
      return NextResponse.json({ error: 'Could not price this booking. Please contact us.' }, { status: 409 })
    }

    // ── 3. Insert booking ─────────────────────────────────────────────────────
    const { data: booking, error } = await adminDb
      .from('bookings')
      .insert({
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        service_id: serviceId,
        service_name: svc.name ?? serviceName,
        treatment: option.name ?? treatment,
        booking_date: bookingDate,
        time_slot: timeSlot,
        duration_minutes: duration,
        notes: notes || null,
        status: 'pending',
        payment_status: 'unpaid',
        amount: depositGHS * 100, // stored in pesewas
        stylist_id: resolvedStylistId,
        stylist_name: resolvedStylistName,
        hair_unit_type: hairType,
        unit_photos: bringing ? unitPhotos || [] : [],
        // Only sent when set, so other bookings still insert before migration 016 runs
        ...(bundles !== null && { bundle_count: bundles }),
        // Same for inspo photos and migration 019 (only coloring asks for them)
        ...(inspo !== null && { inspo_photos: inspo }),
        customization_type: customization,
        is_emergency: emergency,
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

    // ── 3b. Two clients can pass the checks above at the same moment with
    // overlapping times. The database only stops identical start times, so
    // look again now both rows exist: the booking created first keeps the
    // stylist, and this one steps aside.
    const { data: sameStylist } = await adminDb
      .from('bookings')
      .select('id, stylist_id, time_slot, duration_minutes, status, payment_status, created_at')
      .eq('booking_date', bookingDate)
      .eq('stylist_id', resolvedStylistId)
      .in('status', ['pending', 'confirmed'])
      .neq('id', booking.id)
    const earlier = ((sameStylist ?? []) as (ActiveBooking & { id: string })[]).filter(
      (b) => isActiveBooking(b, SLOT_HOLD_MS) &&
        (b.created_at < booking.created_at || (b.created_at === booking.created_at && b.id < booking.id)),
    )
    if (resolvedStylistId && stylistBusy(earlier, resolvedStylistId, slotMins, duration, dayInterval)) {
      await adminDb
        .from('bookings')
        .update({ status: 'cancelled', cancellation_reason: 'Time taken by another booking', cancelled_at: new Date().toISOString() })
        .eq('id', booking.id)
      return NextResponse.json(
        { error: 'This time slot was just taken. Please go back and choose a different time.' },
        { status: 409 },
      )
    }

    // ── 4. Initialize Paystack deposit ────────────────────────────────────────
    // Store the reference before redirecting so the webhook and the stale
    // cleanup can always match the payment back to this booking.
    const reference = generateReference('book')
    await adminDb.from('bookings').update({ payment_reference: reference }).eq('id', booking.id)

    let url: string
    try {
      ({ url } = await initializePayment({
        email: clientEmail,
        amountGHS: depositGHS,
        reference,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/book/success`,
        metadata: { bookingId: booking.id, type: 'booking' },
      }))
    } catch (err) {
      console.error('Paystack init failed', err)
      // Free the slot immediately rather than holding it for 30 minutes.
      await adminDb
        .from('bookings')
        .update({ status: 'cancelled', cancellation_reason: 'Payment could not be started', cancelled_at: new Date().toISOString() })
        .eq('id', booking.id)
      return NextResponse.json({ error: 'We could not start the payment. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ bookingId: booking.id, paystackUrl: url })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
