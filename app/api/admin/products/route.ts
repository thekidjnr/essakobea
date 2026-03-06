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
    .from('products')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { slug, name, category, category_label, price_raw, length, description, image_url, tag, in_stock, display_order } = body

  if (!slug || !name || !category) {
    return NextResponse.json({ error: 'slug, name, and category are required' }, { status: 400 })
  }

  // Auto-generate slug from name if not provided
  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const { data, error } = await adminDb
    .from('products')
    .insert({
      slug: finalSlug, name, category,
      category_label: category_label ?? category,
      price_raw: price_raw ?? 0,
      length: length || null,
      description: description ?? '',
      image_url: image_url ?? '',
      tag: tag || null,
      in_stock: in_stock ?? true,
      display_order: display_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
