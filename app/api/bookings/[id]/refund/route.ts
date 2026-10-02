import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin, unauthorized } from '@/lib/admin-auth'

// Record that a refund owed on a cancelled booking has been sent to the client.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized()

  const { id } = await params
  const { reference } = await req.json().catch(() => ({ reference: '' }))

  const { data, error } = await adminDb
    .from('bookings')
    .update({
      payment_status: 'refunded',
      refunded_at: new Date().toISOString(),
      refund_reference: reference || null,
    })
    .eq('id', id)
    .eq('status', 'cancelled')
    .eq('payment_status', 'paid')
    .gt('refund_amount', 0)
    .select('id')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Failed to record refund' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'No refund is owed on this booking' }, { status: 409 })
  return NextResponse.json({ success: true })
}
