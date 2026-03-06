import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const { data } = await adminDb.from('product_stock').select('*')
  return NextResponse.json(data ?? [])
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId, inStock } = await req.json()
  await adminDb.from('product_stock')
    .upsert({ product_id: productId, in_stock: inStock })
  return NextResponse.json({ success: true })
}
