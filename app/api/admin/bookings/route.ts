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

  let query = adminDb.from('bookings').select('*').order('booking_date', { ascending: false }).order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  if (date) query = query.eq('booking_date', date)

  const { data } = await query
  return NextResponse.json(data ?? [])
}
