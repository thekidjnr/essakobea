import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin, unauthorized } from '@/lib/admin-auth'
import { minutesToSlot, slotToMinutes } from '@/lib/booking-time'
import { availabilityWarnings, type SlotStylist } from '@/lib/booking-slots'
import { moveBooking, sendRescheduledNotices } from '@/lib/reschedule'

// POST /api/admin/bookings/:id/reschedule  { date, time, stylistId?, notify, force }
// The salon moving a booking. No time or count limits, and it doesn't use up
// the client's own reschedule. Like manual bookings, anything that breaks the
// usual availability rules comes back as a 409 with `warnings`; sending again
// with `force: true` moves it anyway.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized()

  const { id } = await params
  const { date, time, stylistId, notify, force } = await req.json().catch(() => ({}))
  const start = slotToMinutes(String(time ?? ''))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? '')) || start === null) {
    return NextResponse.json({ error: 'Choose a date and time.' }, { status: 400 })
  }
  const slot = minutesToSlot(start)

  const { data: booking } = await adminDb.from('bookings').select('*').eq('id', id).single()
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return NextResponse.json({ error: `Cannot move a ${booking.status} booking` }, { status: 409 })
  }

  // Keeps the stylist unless the salon picks another
  let stylist: SlotStylist | null = null
  const newStylistId = stylistId || booking.stylist_id
  if (newStylistId) {
    const { data } = await adminDb.from('stylists').select('id, name, daily_capacity').eq('id', newStylistId).maybeSingle()
    if (!data) return NextResponse.json({ error: 'That stylist no longer exists.' }, { status: 400 })
    stylist = data
  }
  const stylistChanged = !!stylist && stylist.id !== booking.stylist_id

  if (date === booking.booking_date && slot === booking.time_slot && !stylistChanged) {
    return NextResponse.json({ error: 'That\'s the time it\'s already booked for.' }, { status: 400 })
  }

  if (!force) {
    const warnings = await availabilityWarnings({
      date,
      start,
      duration: booking.duration_minutes ?? 60,
      stylist,
      home: booking.location_type === 'home',
      excludeId: booking.id,
    })
    if (warnings.length) return NextResponse.json({ warnings }, { status: 409 })
  }

  const updated = await moveBooking(booking, { date, time: slot, stylist: stylistChanged ? stylist : null }, 'salon')
    .catch((err) => { console.error(err); return undefined })
  if (updated === undefined) return NextResponse.json({ error: 'Could not move the booking.' }, { status: 500 })
  if (updated === 'taken') {
    return NextResponse.json(
      { error: `${stylist?.name ?? 'That stylist'} already has a booking starting at exactly ${slot}. Pick another time or stylist.` },
      { status: 409 },
    )
  }
  if (!updated) return NextResponse.json({ error: 'This booking was just changed. Refresh and try again.' }, { status: 409 })

  if (notify) await sendRescheduledNotices(updated, booking, 'salon')

  return NextResponse.json(updated)
}
