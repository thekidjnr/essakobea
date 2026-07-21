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

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, image_url, image_position, flip, booking_options, is_active } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const { data: existing } = await adminDb.from('services').select('slug')
  const existingSlugs = new Set((existing ?? []).map((s: { slug: string }) => s.slug))
  const baseSlug = slugify(name) || 'service'
  let slug = baseSlug
  let n = 2
  while (existingSlugs.has(slug)) { slug = `${baseSlug}-${n}`; n += 1 }

  const count = existingSlugs.size
  const number = String(count + 1).padStart(2, '0')

  const { data, error } = await adminDb
    .from('services')
    .insert({ slug, name, number, description: description ?? '', image_url: image_url ?? '', image_position: image_position ?? 'object-center', flip: flip ?? false, booking_options: booking_options ?? [], is_active: is_active ?? true, display_order: count })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
