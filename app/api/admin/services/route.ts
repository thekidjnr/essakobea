import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminDb
    .from('services')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { slug, name, number, tagline, description, image_url, image_position, flip, categories, booking_options, is_active, display_order } = body

  if (!slug || !name) return NextResponse.json({ error: 'slug and name are required' }, { status: 400 })

  const { data, error } = await adminDb
    .from('services')
    .insert({ slug, name, number: number ?? '01', tagline: tagline ?? '', description: description ?? '', image_url: image_url ?? '', image_position: image_position ?? 'object-center', flip: flip ?? false, categories: categories ?? [], booking_options: booking_options ?? [], is_active: is_active ?? true, display_order: display_order ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
