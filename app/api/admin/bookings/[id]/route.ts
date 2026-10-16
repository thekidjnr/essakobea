import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin, unauthorized } from '@/lib/admin-auth'
import { normalizePhone } from '@/lib/phone'
import { slotToMinutes } from '@/lib/booking-time'
import { availabilityWarnings } from '@/lib/booking-slots'
import { getServiceRules } from '@/lib/service-rules'
import { MAX_NOTES_LENGTH } from '@/lib/booking-edits'
import type { ServiceBookingOption } from '@/lib/supabase/types'

// PATCH /api/admin/bookings/:id
//   { clientName, clientPhone, clientEmail, notes, serviceId, optionId,
//     durationMinutes, homeAddress, totalPrice (GHS, manual only), force }
// The salon editing a booking's details. Date, time and stylist are moved with
// Reschedule. No money moves here: on an online booking a different style is
// settled at the salon; on a manual one the new total sets the balance due.
// A longer appointment that now overlaps something comes back as a 409 with
// `warnings`; sending again with `force: true` saves it anyway.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized()

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { data: booking } = await adminDb.from('bookings').select('*').eq('id', id).single()
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.status === 'cancelled') return NextResponse.json({ error: 'Cancelled bookings can\'t be edited.' }, { status: 409 })
  const active = booking.status === 'pending' || booking.status === 'confirmed'

  // ── Client ────────────────────────────────────────────────────────────────
  const name = String(body.clientName ?? '').trim()
  const phone = normalizePhone(String(body.clientPhone ?? ''))
  const email = String(body.clientEmail ?? '').trim()
  const notes = String(body.notes ?? '').trim()
  if (!name || phone.replace(/\D/g, '').length < 9) {
    return NextResponse.json({ error: 'Add the client\'s name and phone number.' }, { status: 400 })
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address doesn\'t look right.' }, { status: 400 })
  }
  if (notes.length > MAX_NOTES_LENGTH) {
    return NextResponse.json({ error: `Notes can be up to ${MAX_NOTES_LENGTH} characters.` }, { status: 400 })
  }
  const update: Record<string, unknown> = { client_name: name, client_phone: phone, client_email: email, notes: notes || null }

  // ── Style and length: only while the booking is still to come ────────────
  let duration: number = booking.duration_minutes ?? 60
  if (active) {
    const { data: svc } = await adminDb.from('services').select('name, booking_options').eq('slug', body.serviceId).maybeSingle()
    const option = (svc?.booking_options as ServiceBookingOption[] | null)?.find((o) => o.id === body.optionId)
    if (!svc || !option) return NextResponse.json({ error: 'Choose a service and style.' }, { status: 400 })
    if (body.serviceId !== booking.service_id || option.name !== booking.treatment) {
      update.service_id = body.serviceId
      update.service_name = svc.name
      update.treatment = option.name
      // Standard / Express only means something on services that offer it
      if (!getServiceRules(body.serviceId).customization) update.customization_type = null
    }
    const minutes = Math.round(Number(body.durationMinutes))
    if (!(minutes >= 15 && minutes <= 12 * 60)) {
      return NextResponse.json({ error: 'Choose how long the appointment takes.' }, { status: 400 })
    }
    duration = minutes
    update.duration_minutes = minutes
  }

  if (booking.location_type === 'home') {
    const address = String(body.homeAddress ?? '').trim()
    if (!address) return NextResponse.json({ error: 'Add the address for the home service.' }, { status: 400 })
    update.home_address = address
  }

  // ── Price: manual bookings keep their own total ───────────────────────────
  if (booking.source === 'manual' && body.totalPrice !== undefined) {
    const total = Math.round((Number(body.totalPrice) || 0) * 100)
    if (total < booking.amount) {
      return NextResponse.json({ error: `The total can't be less than the ₵${(booking.amount / 100).toLocaleString()} already paid.` }, { status: 400 })
    }
    update.total_price = total
  }

  // ── A longer appointment may now overlap something ────────────────────────
  const longer = active && duration > (booking.duration_minutes ?? 0)
  if (longer && !body.force) {
    let stylist = null
    if (booking.stylist_id) {
      const { data } = await adminDb.from('stylists').select('id, name, daily_capacity').eq('id', booking.stylist_id).maybeSingle()
      stylist = data
    }
    const warnings = (await availabilityWarnings({
      date: booking.booking_date,
      start: slotToMinutes(booking.time_slot) ?? 0,
      duration,
      stylist,
      home: booking.location_type === 'home',
      excludeId: booking.id,
    }))
      // Daily limits and past times were true before this edit too
      .filter((w) => !w.includes('limit of') && !w.includes('already passed') && !w.includes('closed that day'))
    if (warnings.length) return NextResponse.json({ warnings }, { status: 409 })
  }

  const { data: updated, error } = await adminDb
    .from('bookings')
    .update(update)
    .eq('id', id)
    .neq('status', 'cancelled')
    .select('*')
    .maybeSingle()
  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Could not save the booking.' }, { status: 500 })
  }
  if (!updated) return NextResponse.json({ error: 'This booking was just cancelled.' }, { status: 409 })

  return NextResponse.json(updated)
}
