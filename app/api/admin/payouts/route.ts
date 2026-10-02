import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getResend, FROM_ADMIN } from '@/lib/resend'
import { getAdmin as requireAdmin, isOperatorEmail as isOperator } from '@/lib/admin-auth'
import { autoCompletePastBookings } from '@/lib/bookings-maintenance'
import { payoutRequestedAlertHtml } from '@/emails/payout-requested-alert'

function operatorEmails() {
  return (process.env.OPERATOR_EMAILS ?? '')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}

// Earned balance is derived, not stored: completed+paid bookings (minus the
// 5% service_charge, which is our platform fee, not essakobea's), plus the
// part of cancelled bookings' payments that wasn't refunded (forfeited
// deposits, same proportional fee carved out), plus delivered+paid orders
// (no platform fee carved out of these yet), minus payouts already paid or
// still in flight (pending/approved) so the same money can't be requested twice.
//
// Throws if any query fails: a missing table read must never be treated as
// zero, or the available balance would be overstated.
async function computeBalance() {
  await autoCompletePastBookings()

  const [bookingsRes, cancelledRes, ordersRes, payoutsRes] = await Promise.all([
    adminDb.from('bookings').select('amount, service_charge').eq('status', 'completed').eq('payment_status', 'paid'),
    adminDb.from('bookings').select('amount, service_charge, refund_amount').eq('status', 'cancelled').in('payment_status', ['paid', 'refunded']),
    adminDb.from('orders').select('total').eq('status', 'delivered').eq('payment_status', 'paid'),
    adminDb.from('payouts').select('requested_amount, status').in('status', ['pending', 'approved', 'paid']),
  ])
  const failed = [bookingsRes, cancelledRes, ordersRes, payoutsRes].find((r) => r.error)
  if (failed) throw failed.error

  const bookings = bookingsRes.data
  const orders   = ordersRes.data
  const payouts  = payoutsRes.data

  const completedNetPesewas = (bookings ?? []).reduce((sum, b) => sum + (b.amount - b.service_charge), 0)
  const forfeitedNetPesewas = (cancelledRes.data ?? []).reduce((sum, b) => {
    const kept = Math.max(0, b.amount - (b.refund_amount ?? 0))
    if (kept === 0 || b.amount <= 0) return sum
    return sum + kept - Math.round(b.service_charge * (kept / b.amount))
  }, 0)
  const bookingsNetPesewas = completedNetPesewas + forfeitedNetPesewas
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

  let balance: Awaited<ReturnType<typeof computeBalance>>
  try {
    balance = await computeBalance()
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to calculate balance' }, { status: 500 })
  }

  const [{ data: account }, { data: payouts, error }] = await Promise.all([
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

  let availableGHS: number
  try {
    ({ availableGHS } = await computeBalance())
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to calculate balance' }, { status: 500 })
  }
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

  // Two requests submitted at the same moment can both pass the check above.
  // Re-check now that ours is counted, and withdraw it if we overdrew.
  const after = await computeBalance().catch(() => null)
  if (!after || after.availableGHS < -0.005) {
    await adminDb.from('payouts').delete().eq('id', data.id)
    return NextResponse.json(
      { error: 'Requested amount exceeds available balance. Please refresh and try again.' },
      { status: 409 },
    )
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
