import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { data } = await adminDb.from('availability').select('*').order('day_of_week')
  return NextResponse.json(data ?? [])
}

export async function PUT(req: Request) {
  const user = await getAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = await req.json() // AvailabilityDay[]
  if (!Array.isArray(days)) return NextResponse.json({ error: 'Expected a list of days' }, { status: 400 })
  const failed: number[] = []
  for (const day of days) {
    const { error } = await adminDb.from('availability')
      .update({
        is_available:          day.is_available,
        open_time:             day.open_time,
        close_time:            day.close_time,
        slot_interval_minutes: day.slot_interval_minutes ?? 60,
        max_bookings_per_slot: day.max_bookings_per_slot ?? 1,
        max_bookings_per_day:  day.max_bookings_per_day  ?? 0,
      })
      .eq('day_of_week', day.day_of_week)
    if (error) {
      console.error(error)
      failed.push(day.day_of_week)
    }
  }
  if (failed.length > 0) {
    return NextResponse.json({ error: 'Some days could not be saved. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
