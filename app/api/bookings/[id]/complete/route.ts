import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin, unauthorized } from '@/lib/admin-auth'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized()

  const { id } = await params
  // Only a confirmed booking can be completed; completing counts it toward earnings.
  const { data, error } = await adminDb
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', id)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Failed to complete booking' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Only confirmed bookings can be completed' }, { status: 409 })
  return NextResponse.json({ success: true })
}
