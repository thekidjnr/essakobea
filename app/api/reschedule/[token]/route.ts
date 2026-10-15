import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { slotToMinutes, minutesToSlot } from '@/lib/booking-time'
import { freeStartTimes, type SlotStylist } from '@/lib/booking-slots'
import { clientRescheduleBlock } from '@/lib/reschedule-rules'
import { moveBooking, sendRescheduledNotices } from '@/lib/reschedule'

// The client moving their own booking from the manage link. Rules in lib/reschedule.

async function load(token: string) {
  const { data: booking } = await adminDb.from('bookings').select('*').eq('cancel_token', token).maybeSingle()
  if (!booking) return { error: NextResponse.json({ error: 'Invalid booking link' }, { status: 404 }) }

  const block = clientRescheduleBlock(booking)
  if (block) return { error: NextResponse.json({ error: block }, { status: 409 }) }

  // Clients keep their stylist, so the new time must suit them
  let stylist: SlotStylist | null = null
  if (booking.stylist_id) {
    const { data } = await adminDb.from('stylists').select('id, name, daily_capacity, is_available').eq('id', booking.stylist_id).maybeSingle()
    if (!data?.is_available) {
      return { error: NextResponse.json({ error: 'Your stylist isn\'t taking new times right now. Message us on WhatsApp and we\'ll help.' }, { status: 409 }) }
    }
    stylist = data
  }
  return { booking, stylist }
}

const options = (booking: Record<string, any>, stylist: SlotStylist | null, date: string) => ({
  date,
  duration: booking.duration_minutes ?? null,
  stylist,
  home: booking.location_type === 'home',
  excludeId: booking.id,
})

// GET ?date=YYYY-MM-DD: the start times this booking could move to that day
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const date = new URL(req.url).searchParams.get('date') ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const { booking, stylist, error } = await load(token)
  if (error) return error

  try {
    const day = await freeStartTimes(options(booking, stylist, date))
    // Their current time isn't somewhere they can move to
    const times = date === booking.booking_date ? day.times.filter((t) => t !== booking.time_slot) : day.times
    return NextResponse.json({ ...day, times })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Could not load times' }, { status: 500 })
  }
}

// POST { date, time }: move it
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { date, time } = await req.json().catch(() => ({}))
  const start = slotToMinutes(String(time ?? ''))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? '')) || start === null) {
    return NextResponse.json({ error: 'Choose a new date and time.' }, { status: 400 })
  }
  const slot = minutesToSlot(start)

  const { booking, stylist, error } = await load(token)
  if (error) return error
  if (date === booking.booking_date && slot === booking.time_slot) {
    return NextResponse.json({ error: 'That\'s your current time. Choose a different one.' }, { status: 400 })
  }

  // Only the times the page would offer
  let times: string[]
  try {
    times = (await freeStartTimes(options(booking, stylist, date))).times
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Could not check that time. Please try again.' }, { status: 500 })
  }
  if (!times.includes(slot)) {
    return NextResponse.json({ error: 'That time was just taken. Please choose another.' }, { status: 409 })
  }

  const updated = await moveBooking(booking, { date, time: slot }, 'client').catch((err) => {
    console.error(err)
    return undefined
  })
  if (updated === undefined) return NextResponse.json({ error: 'Could not move your booking. Please try again.' }, { status: 500 })
  if (updated === 'taken') return NextResponse.json({ error: 'That time was just taken. Please choose another.' }, { status: 409 })
  if (!updated) return NextResponse.json({ error: 'This booking was just changed. Please refresh the page.' }, { status: 409 })

  await sendRescheduledNotices(updated, booking, 'client')

  return NextResponse.json({ booking_date: updated.booking_date, time_slot: updated.time_slot })
}
