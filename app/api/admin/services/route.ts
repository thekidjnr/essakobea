import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin as requireAdmin } from '@/lib/admin-auth'
import { validateBookingOptions } from '@/lib/service-options'

export const dynamic = 'force-dynamic'

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
  const invalid = validateBookingOptions(booking_options)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

  const { data: existing, error: existingError } = await adminDb.from('services').select('slug, number, display_order')
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })
  const existingSlugs = new Set((existing ?? []).map((s: { slug: string }) => s.slug))
  const baseSlug = slugify(name) || 'service'
  let slug = baseSlug
  let n = 2
  while (existingSlugs.has(slug)) { slug = `${baseSlug}-${n}`; n += 1 }

  // Next number/position after the highest existing one, so deleting a
  // service never causes a new one to reuse a number.
  const maxNumber = Math.max(0, ...(existing ?? []).map((s: { number: string }) => parseInt(s.number, 10) || 0))
  const maxOrder  = Math.max(-1, ...(existing ?? []).map((s: { display_order: number }) => s.display_order ?? 0))
  const number = String(maxNumber + 1).padStart(2, '0')

  const { data, error } = await adminDb
    .from('services')
    .insert({ slug, name, number, description: description ?? '', image_url: image_url ?? '', image_position: image_position ?? 'object-center', flip: flip ?? false, booking_options: booking_options ?? [], is_active: is_active ?? true, display_order: maxOrder + 1 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
