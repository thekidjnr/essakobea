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

  const { date, reason } = await req.json()
  const { data, error } = await adminDb.from('blocked_dates').insert({ date, reason }).select().single()
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
