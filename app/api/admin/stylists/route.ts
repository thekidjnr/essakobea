import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const { data, error } = await adminDb
    .from('stylists')
    .select('*')
    .order('display_order')

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch stylists' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, title, bio, photo_url, fee_adjustment, is_available, display_order } = body

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await adminDb
    .from('stylists')
    .insert({
      name,
      title: title || 'Stylist',
      bio: bio || null,
      photo_url: photo_url || null,
      fee_adjustment: fee_adjustment ?? 0,
      is_available: is_available ?? true,
      display_order: display_order ?? 0,
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create stylist' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
