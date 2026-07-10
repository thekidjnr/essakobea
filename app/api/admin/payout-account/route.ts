import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminDb.from('payout_account').select('*').maybeSingle()
  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch payout account' }, { status: 500 })
  }

  return NextResponse.json(data ?? null)
}

// Any admin can set this — it's essakobea's own bank/MoMo destination, not
// an operator-only concern. Upserts against the `singleton` unique column
// so there's only ever one row.
export async function PUT(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { method, accountName, momoNumber, momoNetwork, bankName, accountNumber } = await req.json()

  if (!method || !['momo', 'bank'].includes(method)) {
    return NextResponse.json({ error: 'method must be "momo" or "bank"' }, { status: 400 })
  }
  if (!accountName) {
    return NextResponse.json({ error: 'accountName is required' }, { status: 400 })
  }
  if (method === 'momo' && (!momoNumber || !momoNetwork)) {
    return NextResponse.json({ error: 'momoNumber and momoNetwork are required for method "momo"' }, { status: 400 })
  }
  if (method === 'bank' && (!bankName || !accountNumber)) {
    return NextResponse.json({ error: 'bankName and accountNumber are required for method "bank"' }, { status: 400 })
  }

  const { data, error } = await adminDb
    .from('payout_account')
    .upsert({
      singleton:      true,
      updated_at:     new Date().toISOString(),
      method,
      account_name:   accountName,
      momo_number:    method === 'momo' ? momoNumber : null,
      momo_network:   method === 'momo' ? momoNetwork : null,
      bank_name:      method === 'bank' ? bankName : null,
      account_number: method === 'bank' ? accountNumber : null,
    }, { onConflict: 'singleton' })
    .select()
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save payout account' }, { status: 500 })
  }

  return NextResponse.json(data)
}
