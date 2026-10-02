// How a single paid booking's money splits up. Everything is in pesewas.
//
// amount includes the 5% service_charge, which is the platform's fee, not the
// salon's. When part of a payment is refunded, the fee is only taken on the
// part the salon keeps, so a full refund leaves both sides at zero.
export function bookingSplit(b: { amount: number; service_charge: number | null; refund_amount: number | null }) {
  const gross  = b.amount
  const refund = Math.min(gross, Math.max(0, b.refund_amount ?? 0))
  const kept   = gross - refund
  const fee    = gross > 0 ? Math.round((b.service_charge ?? 0) * (kept / gross)) : 0
  return { gross, refund, fee, net: kept - fee }
}

// One payment as the Finance page sees it.
export type FinanceState = 'completed' | 'upcoming' | 'kept' | 'refund_owed' | 'refunded'

export interface FinanceEntry {
  id:          string
  kind:        'booking' | 'order'
  date:        string   // when the payment came in (created_at)
  client:      string
  description: string
  stylist:     string | null
  state:       FinanceState
  gross:       number   // pesewas
  refund:      number
  fee:         number
  net:         number
  reference:   string | null
}
