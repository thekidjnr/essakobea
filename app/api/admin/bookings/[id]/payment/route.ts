import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin, unauthorized } from '@/lib/admin-auth'
import { balanceDue, isManualPaymentMethod } from '@/lib/manual-bookings'

// POST /api/admin/bookings/:id/payment  { amount (GHS), method, reference? }
// Records money collected in person on a manual booking: the rest of a
// deposit, or a booking that was added unpaid.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized()

  const { id } = await params
  const { amount, method, reference } = await req.json().catch(() => ({}))
  const pesewas = Math.round((Number(amount) || 0) * 100)

  const { data: booking } = await adminDb.from('bookings').select('*').eq('id', id).single()
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.source !== 'manual' || booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Payments can only be recorded on active manual bookings.' }, { status: 409 })
  }
  const due = balanceDue(booking)
  if (pesewas <= 0 || pesewas > due) {
    return NextResponse.json({ error: `Enter an amount up to the ₵${(due / 100).toLocaleString()} still due.` }, { status: 400 })
  }
  if (!isManualPaymentMethod(method)) return NextResponse.json({ error: 'Choose how they paid.' }, { status: 400 })

  // Only move forward from the amount we read, so two clicks can't count twice
  const { data: updated, error } = await adminDb
    .from('bookings')
    .update({
      amount: booking.amount + pesewas,
      payment_status: 'paid',
      // A booking keeps the method of its first payment
      payment_method: booking.payment_method ?? method,
      payment_reference: booking.payment_reference ?? (String(reference ?? '').trim() || null),
    })
    .eq('id', id)
    .eq('amount', booking.amount)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Could not record the payment.' }, { status: 500 })
  }
  if (!updated) return NextResponse.json({ error: 'This booking just changed. Refresh and try again.' }, { status: 409 })
  return NextResponse.json(updated)
}
