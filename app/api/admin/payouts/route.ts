import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getResend, FROM_ADMIN } from '@/lib/resend'
import { payoutRequestedAlertHtml } from '@/emails/payout-requested-alert'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function operatorEmails() {
  return (process.env.OPERATOR_EMAILS ?? '')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}

function isOperator(email: string | null | undefined) {
  return !!email && operatorEmails().includes(email.toLowerCase())
}

// Earned balance is derived, not stored: completed+paid bookings (minus the
// 5% service_charge, which is our platform fee, not essakobea's) plus
// delivered+paid orders (no platform fee carved out of these yet), minus
// payouts already paid or still in flight (pending/approved) so the same
// money can't be requested twice.
async function computeBalance() {
  const [{ data: bookings }, { data: orders }, { data: payouts }] = await Promise.all([
    adminDb.from('bookings').select('amount, service_charge').eq('status', 'completed').eq('payment_status', 'paid'),
    adminDb.from('orders').select('total').eq('status', 'delivered').eq('payment_status', 'paid'),
    adminDb.from('payouts').select('requested_amount, status').in('status', ['pending', 'approved', 'paid']),
  ])

  const bookingsNetPesewas = (bookings ?? []).reduce((sum, b) => sum + (b.amount - b.service_charge), 0)
  const ordersNetPesewas   = (orders ?? []).reduce((sum, o) => sum + o.total, 0)
  const earnedPesewas      = bookingsNetPesewas + ordersNetPesewas

  const paidOutPesewas = (payouts ?? []).filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.requested_amount, 0)
  const pendingPesewas = (payouts ?? []).filter((p) => p.status !== 'paid').reduce((sum, p) => sum + p.requested_amount, 0)

  return {
    earnedGHS:    earnedPesewas / 100,
    paidOutGHS:   paidOutPesewas / 100,
    pendingGHS:   pendingPesewas / 100,
    availableGHS: (earnedPesewas - paidOutPesewas - pendingPesewas) / 100,
  }
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [balance, { data: account }, { data: payouts, error }] = await Promise.all([
    computeBalance(),
    adminDb.from('payout_account').select('*').maybeSingle(),
    adminDb.from('payouts').select('*').order('created_at', { ascending: false }),
  ])

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }

  return NextResponse.json({
    balance,
    account: account ?? null,
    payouts: payouts ?? [],
    isOperator: isOperator(user.email),
  })
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestedAmountGHS, notes } = await req.json()
  if (!requestedAmountGHS || requestedAmountGHS <= 0) {
    return NextResponse.json({ error: 'requestedAmountGHS must be greater than 0' }, { status: 400 })
  }

  const { data: account } = await adminDb.from('payout_account').select('*').maybeSingle()
  if (!account) {
    return NextResponse.json({ error: 'Add a withdrawal account before requesting a payout' }, { status: 400 })
  }

  const { availableGHS } = await computeBalance()
  if (requestedAmountGHS > availableGHS) {
    return NextResponse.json(
      { error: `Requested amount exceeds available balance (GHS ${availableGHS.toFixed(2)})` },
      { status: 400 }
    )
  }

  const { data, error } = await adminDb
    .from('payouts')
    .insert({
      requested_amount: Math.round(requestedAmountGHS * 100),
      destination: {
        method:         account.method,
        account_name:   account.account_name,
        momo_number:    account.momo_number,
        momo_network:   account.momo_network,
        bank_name:      account.bank_name,
        account_number: account.account_number,
      },
      requested_by: user.email ?? null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 })
  }

  // Never let a delivery failure here break the requester's already-created request.
  const operators = operatorEmails()
  if (operators.length > 0) {
    try {
      await getResend().emails.send({
        from: FROM_ADMIN,
        to: operators,
        subject: `Withdrawal requested: ₵${requestedAmountGHS.toLocaleString()}`,
        html: payoutRequestedAlertHtml({
          amountGHS:   requestedAmountGHS,
          requestedBy: user.email ?? null,
          notes:       notes || null,
          destination: data.destination,
          appUrl:      process.env.NEXT_PUBLIC_APP_URL ?? '',
        }),
      })
    } catch (err) {
      console.error('Failed to send payout request alert email', err)
    }
  }

  return NextResponse.json(data, { status: 201 })
}
