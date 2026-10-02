import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin as requireAdmin } from '@/lib/admin-auth'
import { todayInAccra } from '@/lib/booking-time'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, title, photo_url, fee_adjustment, is_available, display_order, daily_capacity } = body

  const { data, error } = await adminDb
    .from('stylists')
    .update({ name, title, photo_url, fee_adjustment, is_available, display_order, daily_capacity: daily_capacity ?? null })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update stylist' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Deleting a stylist would orphan their upcoming bookings and let those
  // slots be double-booked. Make the admin reassign or cancel them first.
  const { count, error: countError } = await adminDb
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('stylist_id', id)
    .in('status', ['pending', 'confirmed'])
    .gte('booking_date', todayInAccra())
  if (countError) return NextResponse.json({ error: 'Failed to check bookings' }, { status: 500 })
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `This stylist has ${count} upcoming booking${count === 1 ? '' : 's'}. Mark them unavailable instead, or cancel those bookings first.` },
      { status: 409 },
    )
  }

  const { error } = await adminDb.from('stylists').delete().eq('id', id)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete stylist' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
