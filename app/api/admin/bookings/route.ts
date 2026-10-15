import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin } from '@/lib/admin-auth'
import { minutesToSlot, slotToMinutes, todayInAccra } from '@/lib/booking-time'
import { autoCompletePastBookings } from '@/lib/bookings-maintenance'
import { optionDuration } from '@/lib/booking-duration'
import { availabilityWarnings } from '@/lib/booking-slots'
import { getServiceRules } from '@/lib/service-rules'
import { isManualPaymentMethod } from '@/lib/manual-bookings'
import { sendBookingConfirmedEmails } from '@/lib/payments'
import type { ServiceBookingOption } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// GET /api/admin/bookings?status=all|pending|confirmed|completed|cancelled|refunds
//                         &when=upcoming|past|all&sort=date|recent&limit=N
export async function GET(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await autoCompletePastBookings()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date')
  const when = searchParams.get('when')
  const sort = searchParams.get('sort')
  const limit = Number(searchParams.get('limit')) || null

  let query = adminDb.from('bookings').select('*')
  query = sort === 'recent'
    ? query.order('created_at', { ascending: false })
    : query.order('booking_date', { ascending: false }).order('created_at', { ascending: false })

  if (status === 'refunds') {
    query = query.eq('status', 'cancelled').eq('payment_status', 'paid').gt('refund_amount', 0)
  } else if (status === 'pending') {
    // Checkouts that never completed. Payment timeouts are cancelled, not pending.
    query = query.eq('status', 'pending')
  } else if (status && status !== 'all') {
    query = query.eq('status', status)
  } else {
    // "All" leaves out abandoned checkouts: unpaid bookings that were never confirmed.
    query = query.neq('status', 'pending').or('payment_status.neq.unpaid,status.neq.cancelled')
  }
  if (date) query = query.eq('booking_date', date)

  const today = todayInAccra()
  if (when === 'upcoming') query = query.gte('booking_date', today)
  else if (when === 'past') query = query.lt('booking_date', today)
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

const toPesewas = (ghs: unknown) => Math.round((Number(ghs) || 0) * 100)

// Stored the way the booking form stores them: "+233557205803". A local
// Ghana number ("055 720 5803") gets the +233 prefix.
function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, '')
  if (!cleaned) return ''
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`
  if (cleaned.startsWith('233')) return `+${cleaned}`
  return `+233${cleaned.replace(/^0+/, '')}`
}

// POST /api/admin/bookings: a booking the salon adds by hand (walk-in,
// WhatsApp, home service, cash / MoMo / bank transfer). It goes straight to
// confirmed. Anything that breaks the usual availability rules comes back as
// a 409 with `warnings`; sending again with `force: true` saves it anyway.
export async function POST(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const {
    clientName, clientPhone, clientEmail, notes,
    serviceId, optionId, stylistId, customizationType,
    bookingDate, timeSlot, durationMinutes,
    locationType, homeAddress,
    servicePrice, travelFee,
    payment, amountPaid, paymentMethod, paymentReference,
    notify, force,
  } = body

  const name = String(clientName ?? '').trim()
  const phone = normalizePhone(String(clientPhone ?? ''))
  const email = String(clientEmail ?? '').trim()
  if (!name || !phone) return NextResponse.json({ error: 'Add the client\'s name and phone number.' }, { status: 400 })
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address doesn\'t look right.' }, { status: 400 })
  }
  const start = slotToMinutes(String(timeSlot ?? ''))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(bookingDate ?? '')) || start === null) {
    return NextResponse.json({ error: 'Choose a date and time.' }, { status: 400 })
  }
  const slot = minutesToSlot(start)
  const home = locationType === 'home'
  const address = String(homeAddress ?? '').trim()
  if (home && !address) return NextResponse.json({ error: 'Add the address for the home service.' }, { status: 400 })

  // ── Service, option, stylist ──────────────────────────────────────────────
  const { data: svc } = await adminDb.from('services').select('name, booking_options').eq('slug', serviceId).maybeSingle()
  const option = (svc?.booking_options as ServiceBookingOption[] | null)?.find((o) => o.id === optionId)
  if (!svc || !option) return NextResponse.json({ error: 'Choose a service and style.' }, { status: 400 })
  const duration = Number(durationMinutes) > 0 ? Math.round(Number(durationMinutes)) : optionDuration(serviceId, option)

  let stylist: { id: string; name: string; daily_capacity: number | null } | null = null
  if (stylistId) {
    const { data } = await adminDb.from('stylists').select('id, name, daily_capacity').eq('id', stylistId).maybeSingle()
    if (!data) return NextResponse.json({ error: 'That stylist no longer exists.' }, { status: 400 })
    stylist = data
  }

  const rules = getServiceRules(serviceId)
  const customization = rules.customization && (customizationType === 'standard' || customizationType === 'express')
    ? customizationType
    : null

  // ── Money ─────────────────────────────────────────────────────────────────
  const servicePesewas = toPesewas(servicePrice)
  const travelPesewas = home ? toPesewas(travelFee) : 0
  if (servicePesewas < 0 || travelPesewas < 0) return NextResponse.json({ error: 'Prices can\'t be negative.' }, { status: 400 })
  const total = servicePesewas + travelPesewas
  const paid = payment === 'paid' ? total : payment === 'deposit' ? toPesewas(amountPaid) : 0
  if (payment === 'deposit' && (paid <= 0 || paid > total)) {
    return NextResponse.json({ error: 'Enter how much was paid, up to the total.' }, { status: 400 })
  }
  if (paid > 0 && !isManualPaymentMethod(paymentMethod)) {
    return NextResponse.json({ error: 'Choose how they paid.' }, { status: 400 })
  }

  // ── Availability: warn, but let the salon save anyway ─────────────────────
  if (!force) {
    const warnings = await availabilityWarnings({ date: bookingDate, start, duration, stylist, home })
    if (warnings.length) return NextResponse.json({ warnings }, { status: 409 })
  }

  const { data: booking, error } = await adminDb
    .from('bookings')
    .insert({
      client_name: name,
      client_email: email,
      client_phone: phone,
      service_id: serviceId,
      service_name: svc.name,
      treatment: option.name,
      booking_date: bookingDate,
      time_slot: slot,
      duration_minutes: duration,
      notes: String(notes ?? '').trim() || null,
      status: 'confirmed',
      payment_status: paid > 0 ? 'paid' : 'unpaid',
      payment_reference: paid > 0 ? String(paymentReference ?? '').trim() || null : null,
      amount: paid,
      stylist_id: stylist?.id ?? null,
      stylist_name: stylist?.name ?? null,
      hair_unit_type: null,
      unit_photos: [],
      customization_type: customization,
      is_emergency: false,
      customization_fee: 0,
      emergency_fee: 0,
      service_charge: 0,
      source: 'manual',
      payment_method: paid > 0 ? paymentMethod : null,
      location_type: home ? 'home' : 'salon',
      home_address: home ? address : null,
      travel_fee: travelPesewas,
      total_price: total,
    })
    .select('*')
    .single()

  if (error || !booking) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: `${stylist?.name ?? 'That stylist'} already has a booking starting at exactly ${slot}. Pick another time or stylist.` },
        { status: 409 },
      )
    }
    console.error(error)
    return NextResponse.json({ error: 'Could not save the booking.' }, { status: 500 })
  }

  if (notify) await sendBookingConfirmedEmails(booking, { notifyAdmin: false })

  return NextResponse.json(booking)
}
