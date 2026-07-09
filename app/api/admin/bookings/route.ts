import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date')
  const when = searchParams.get('when')

  let query = adminDb.from('bookings').select('*').order('booking_date', { ascending: false }).order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  else query = query.neq('status', 'pending')
  if (date) query = query.eq('booking_date', date)

  const today = new Date().toISOString().slice(0, 10)
  if (when === 'upcoming') query = query.gte('booking_date', today)
  else if (when === 'past') query = query.lt('booking_date', today)

  const { data } = await query
  return NextResponse.json(data ?? [])
}
