// ─────────────────────────────────────────────────────────────────────────────
// Manual bookings: added by the salon from the admin (walk-ins, WhatsApp,
// home service, cash / MoMo / bank transfer). See migration 024.
//
// `amount` is always what has been paid so far. Manual bookings also store
// `total_price`, so the balance still to collect is total_price - amount.
// Online bookings leave payment_method null: they always go through Paystack.
// ─────────────────────────────────────────────────────────────────────────────

export const PAYMENT_METHODS = [
  { value: 'cash',          label: 'Cash' },
  { value: 'momo',          label: 'MoMo' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'card',          label: 'Card' },
  { value: 'other',         label: 'Other' },
] as const

export type ManualPaymentMethod = (typeof PAYMENT_METHODS)[number]['value']
export type PaymentMethod = ManualPaymentMethod | 'paystack'

export function isManualPaymentMethod(v: unknown): v is ManualPaymentMethod {
  return PAYMENT_METHODS.some((m) => m.value === v)
}

interface PaymentFields {
  source?: string | null
  payment_method?: string | null
  payment_status: string
}

/** "Cash", "MoMo", "Paystack"..., or null when nothing has been paid */
export function paymentMethodLabel(b: PaymentFields): string | null {
  if (b.payment_status === 'unpaid') return null
  if (b.payment_method === 'paystack' || (!b.payment_method && b.source !== 'manual')) return 'Paystack'
  return PAYMENT_METHODS.find((m) => m.value === b.payment_method)?.label ?? 'Other'
}

/** Pesewas still to collect on a manual booking; 0 for online ones */
export function balanceDue(b: { source?: string | null; total_price?: number | null; amount: number; status?: string }): number {
  if (b.source !== 'manual' || b.total_price == null || b.status === 'cancelled') return 0
  return Math.max(0, b.total_price - b.amount)
}

export const isHomeService = (b: { location_type?: string | null }) => b.location_type === 'home'
