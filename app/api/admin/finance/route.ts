import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin } from '@/lib/admin-auth'
import { autoCompletePastBookings } from '@/lib/bookings-maintenance'
import { bookingSplit, type FinanceEntry, type FinanceState } from '@/lib/finance'

export const dynamic = 'force-dynamic'

const PAGE = 1000

// PostgREST caps a single response at 1000 rows, so page through.
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) return rows
  }
}

type BookingRow = {
  id: string; created_at: string; client_name: string; service_name: string; treatment: string | null
  stylist_name: string | null; status: string; payment_status: string; payment_reference: string | null
  amount: number; service_charge: number | null; refund_amount: number | null
}
type OrderRow = {
  id: string; created_at: string; client_name: string; items: { name: string; quantity: number }[] | null
  status: string; payment_reference: string | null; total: number
}

function bookingState(b: BookingRow, refund: number): FinanceState {
  if (b.status === 'completed') return 'completed'
  if (b.status !== 'cancelled') return 'upcoming'
  if (b.payment_status === 'refunded') return 'refunded'
  return refund > 0 ? 'refund_owed' : 'kept'
}

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await autoCompletePastBookings()

  let bookings: BookingRow[], orders: OrderRow[]
  try {
    [bookings, orders] = await Promise.all([
      fetchAll<BookingRow>((from, to) => adminDb
        .from('bookings')
        .select('id, created_at, client_name, service_name, treatment, stylist_name, status, payment_status, payment_reference, amount, service_charge, refund_amount')
        .in('payment_status', ['paid', 'refunded'])
        .order('created_at', { ascending: false })
        .range(from, to)),
      fetchAll<OrderRow>((from, to) => adminDb
        .from('orders')
        .select('id, created_at, client_name, items, status, payment_reference, total')
        .eq('payment_status', 'paid')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .range(from, to)),
    ])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to load finances' }, { status: 500 })
  }

  const entries: FinanceEntry[] = [
    ...bookings.map((b) => {
      const split = bookingSplit(b)
      return {
        id:          b.id,
        kind:        'booking' as const,
        date:        b.created_at,
        client:      b.client_name,
        description: b.treatment || b.service_name,
        stylist:     b.stylist_name,
        state:       bookingState(b, split.refund),
        ...split,
        reference:   b.payment_reference,
      }
    }),
    // Shop orders carry no platform fee or refund tracking yet.
    ...orders.map((o) => ({
      id:          o.id,
      kind:        'order' as const,
      date:        o.created_at,
      client:      o.client_name,
      description: (o.items ?? []).map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name)).join(', ') || 'Shop order',
      stylist:     null,
      state:       (o.status === 'delivered' ? 'completed' : 'upcoming') as FinanceState,
      gross:       o.total,
      refund:      0,
      fee:         0,
      net:         o.total,
      reference:   o.payment_reference,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return NextResponse.json({ entries })
}
