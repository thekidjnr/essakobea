import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin, unauthorized } from '@/lib/admin-auth'
import type { ServiceBookingOption } from '@/lib/supabase/types'
import { optionDuration } from '@/lib/booking-duration'
import { staffSlots, type SlotStylist } from '@/lib/booking-slots'

// GET /api/admin/availability?date=YYYY-MM-DD&stylistId=&home=1
//   &serviceId=&optionId=   (a new booking: its length comes from the option)
//   &excludeId=             (a booking being moved: its own length, and it never clashes with itself)
//
// The admin date and time picker. Lists every time the salon could choose,
// each with the warnings saving it would give, using the same checks as the
// manual booking and reschedule APIs.
export async function GET(req: Request) {
  if (!(await getAdmin())) return unauthorized()

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') ?? ''
  const stylistId = searchParams.get('stylistId') || null
  const serviceId = searchParams.get('serviceId') || ''
  const optionId = searchParams.get('optionId') || ''
  const excludeId = searchParams.get('excludeId') || undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date required' }, { status: 400 })
  }

  let duration = 60
  if (excludeId) {
    const { data } = await adminDb.from('bookings').select('duration_minutes').eq('id', excludeId).maybeSingle()
    duration = data?.duration_minutes ?? 60
  } else if (serviceId) {
    const { data } = await adminDb.from('services').select('booking_options').eq('slug', serviceId).maybeSingle()
    const option = (data?.booking_options as ServiceBookingOption[] | null)?.find((o) => o.id === optionId)
    duration = optionDuration(serviceId, option)
  }

  let stylist: SlotStylist | null = null
  if (stylistId) {
    const { data } = await adminDb.from('stylists').select('id, name, daily_capacity').eq('id', stylistId).maybeSingle()
    stylist = data
  }

  try {
    const day = await staffSlots({ date, duration, stylist, home: searchParams.get('home') === '1', excludeId })
    return NextResponse.json({ ...day, duration })
  } catch (err) {
    // Never show a day as free because its bookings couldn't be read
    console.error(err)
    return NextResponse.json({ error: 'Could not load availability' }, { status: 500 })
  }
}
