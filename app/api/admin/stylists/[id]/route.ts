import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, title, bio, photo_url, fee_adjustment, is_available, display_order } = body

  const { data, error } = await adminDb
    .from('stylists')
    .update({ name, title, bio, photo_url, fee_adjustment, is_available, display_order })
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
  const { error } = await adminDb.from('stylists').delete().eq('id', id)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete stylist' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
