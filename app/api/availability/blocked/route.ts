import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { data } = await adminDb.from('blocked_dates').select('*').order('date')
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await getAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, endDate, reason } = await req.json()
  const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
  if (!isDate(date) || (endDate && !isDate(endDate))) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  // Expand a range into one row per day; a single date is a range of one
  const last = endDate || date
  if (last < date) return NextResponse.json({ error: 'End date must be on or after the start date' }, { status: 400 })
  const rows: { date: string; reason: string | null }[] = []
  for (let d = new Date(date + 'T00:00:00Z'); d.toISOString().slice(0, 10) <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    rows.push({ date: d.toISOString().slice(0, 10), reason: reason || null })
    if (rows.length > 366) return NextResponse.json({ error: 'Range is too long (max one year)' }, { status: 400 })
  }

  const { data, error } = await adminDb
    .from('blocked_dates')
    .upsert(rows, { onConflict: 'date', ignoreDuplicates: true })
    .select()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const user = await getAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date } = await req.json()
  const { error } = await adminDb.from('blocked_dates').delete().eq('date', date)
  if (error) return NextResponse.json({ error: 'Failed to unblock date' }, { status: 500 })
  return NextResponse.json({ success: true })
}
