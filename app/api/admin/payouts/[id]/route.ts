import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getResend, FROM_ADMIN } from '@/lib/resend'
import { payoutStatusUpdateHtml } from '@/emails/payout-status-update'
import type { Payout } from '@/lib/supabase/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Any signed-in admin (including essakobea's login) can view/request payouts.
// Only emails in OPERATOR_EMAILS can approve/reject/mark them paid — that's
// you, since you're the one actually holding and sending the money.
function isOperator(email: string | null | undefined) {
  const allowed = (process.env.OPERATOR_EMAILS ?? '')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  return !!email && allowed.includes(email.toLowerCase())
}

// Never let a delivery failure here break the status change that already happened.
async function notifyRequester(payout: Payout) {
  if (!payout.requested_by) return
  if (payout.status !== 'approved' && payout.status !== 'rejected' && payout.status !== 'paid') return

  try {
    await getResend().emails.send({
      from: FROM_ADMIN,
      to: payout.requested_by,
      subject: payout.status === 'paid'
        ? `Withdrawal sent: ₵${(payout.requested_amount / 100).toLocaleString()}`
        : payout.status === 'approved'
        ? `Withdrawal approved: ₵${(payout.requested_amount / 100).toLocaleString()}`
        : `Withdrawal declined: ₵${(payout.requested_amount / 100).toLocaleString()}`,
      html: payoutStatusUpdateHtml({
        status:           payout.status,
        amountGHS:        payout.requested_amount / 100,
        rejectedReason:   payout.rejected_reason,
        payoutReference:  payout.payout_reference,
        appUrl:           process.env.NEXT_PUBLIC_APP_URL ?? '',
      }),
    })
  } catch (err) {
    console.error('Failed to send payout status update email', err)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isOperator(user.email)) {
    return NextResponse.json({ error: 'Only the operator can process payouts' }, { status: 403 })
  }

  const { id } = await params
  const { action, adminNotes, rejectedReason, payoutReference } = await req.json()

  const { data: payout } = await adminDb.from('payouts').select('*').eq('id', id).single()
  if (!payout) return NextResponse.json({ error: 'Payout not found' }, { status: 404 })

  if (action === 'approve') {
    if (payout.status !== 'pending') {
      return NextResponse.json({ error: `Cannot approve a payout with status "${payout.status}"` }, { status: 409 })
    }
    const { data, error } = await adminDb
      .from('payouts')
      .update({ status: 'approved', approved_at: new Date().toISOString(), admin_notes: adminNotes || null })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to approve payout' }, { status: 500 })
    }
    await notifyRequester(data)
    return NextResponse.json(data)
  }

  if (action === 'reject') {
    if (!['pending', 'approved'].includes(payout.status)) {
      return NextResponse.json({ error: `Cannot reject a payout with status "${payout.status}"` }, { status: 409 })
    }
    if (!rejectedReason) return NextResponse.json({ error: 'rejectedReason is required' }, { status: 400 })
    const { data, error } = await adminDb
      .from('payouts')
      .update({ status: 'rejected', rejected_reason: rejectedReason, admin_notes: adminNotes || null })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to reject payout' }, { status: 500 })
    }
    await notifyRequester(data)
    return NextResponse.json(data)
  }

  if (action === 'mark_paid') {
    if (payout.status !== 'approved') {
      return NextResponse.json(
        { error: `Cannot mark paid a payout with status "${payout.status}" — approve it first` },
        { status: 409 }
      )
    }
    if (!payoutReference) return NextResponse.json({ error: 'payoutReference is required' }, { status: 400 })
    const { data, error } = await adminDb
      .from('payouts')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payout_reference: payoutReference,
        admin_notes: adminNotes || null,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to mark payout paid' }, { status: 500 })
    }
    await notifyRequester(data)
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
