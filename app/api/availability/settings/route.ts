import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const { data } = await adminDb.from('availability').select('*').order('day_of_week')
  return NextResponse.json(data ?? [])
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = await req.json() // AvailabilityDay[]
  for (const day of days) {
    await adminDb.from('availability')
      .update({
        is_available:          day.is_available,
        open_time:             day.open_time,
        close_time:            day.close_time,
        slot_interval_minutes: day.slot_interval_minutes ?? 60,
        max_bookings_per_slot: day.max_bookings_per_slot ?? 1,
        max_bookings_per_day:  day.max_bookings_per_day  ?? 0,
      })
      .eq('day_of_week', day.day_of_week)
  }
  return NextResponse.json({ success: true })
}
