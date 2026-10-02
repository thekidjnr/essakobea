import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin, unauthorized } from '@/lib/admin-auth'

// Manually confirm a pending booking (e.g. the client paid in cash or by direct MoMo).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized()

  const { id } = await params
  const { data, error } = await adminDb
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'That stylist already has a booking at this time' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Only pending bookings can be confirmed' }, { status: 409 })
  return NextResponse.json({ success: true })
}
