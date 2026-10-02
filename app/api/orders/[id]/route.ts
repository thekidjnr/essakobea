import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin } from '@/lib/admin-auth'

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()
  if (!ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const { data, error } = await adminDb.from('orders').update({ status }).eq('id', id).select('id').maybeSingle()
  if (error) return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
