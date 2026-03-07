// ─────────────────────────────────────────────────────────────────────────────
// Database types — mirrors supabase/migrations/001_initial.sql
// ─────────────────────────────────────────────────────────────────────────────

export type BookingStatus  = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type PaymentStatus  = 'unpaid'  | 'paid'      | 'refunded'
export type OrderStatus    = 'pending' | 'processing' | 'shipped'  | 'delivered' | 'cancelled'
export type DeliveryMethod = 'pickup'  | 'delivery'

export interface Booking {
  id:                  string
  created_at:          string
  client_name:         string
  client_email:        string
  client_phone:        string
  service_id:          string
  service_name:        string
  treatment:           string
  booking_date:        string   // ISO date "YYYY-MM-DD"
  time_slot:           string
  notes:               string | null
  status:              BookingStatus
  payment_status:      PaymentStatus
  payment_reference:   string | null
  amount:              number   // GHS pesewas
  cancellation_reason: string | null
  cancelled_at:        string | null
  cancel_token:        string
}

export interface OrderItem {
  productId: string
  name:      string
  price:     number  // GHS pesewas
  quantity:  number
}

export interface Order {
  id:                string
  created_at:        string
  client_name:       string
  client_email:      string
  client_phone:      string
  items:             OrderItem[]
  subtotal:          number
  total:             number
  status:            OrderStatus
  payment_status:    PaymentStatus
  payment_reference: string | null
  delivery_method:   DeliveryMethod
  delivery_address:  string | null
  notes:             string | null
}

export interface BlockedDate {
  id:         string
  date:       string
  reason:     string | null
  created_at: string
}

export interface AvailabilityDay {
  id:                    string
  day_of_week:           number   // 0=Sun … 6=Sat
  is_available:          boolean
  open_time:             string   // "HH:MM"
  close_time:            string
  slot_interval_minutes: number   // 30 or 60
}

export interface ProductStock {
  product_id: string
  in_stock:   boolean
}

// ─── Services ─────────────────────────────────────────────────────────────────

export interface ServiceBookingOption {
  id:        string
  name:      string
  price:     string   // display label e.g. "₵300" or "₵250 – ₵450"
  price_raw: number   // GHS cedis — charged as deposit for online payment
  note?:     string   // optional context shown on services page
}

export interface DbService {
  id:              string
  slug:            string
  name:            string
  number:          string
  tagline:         string
  description:     string
  image_url:       string
  image_position:  string
  flip:            boolean
  booking_options: ServiceBookingOption[]
  is_active:       boolean
  display_order:   number
  created_at:      string
}

// ─── Service Works ─────────────────────────────────────────────────────────────

export interface ServiceWork {
  id:            string
  service_id:    string
  image_url:     string
  caption:       string | null
  display_order: number
  created_at:    string
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface DbProduct {
  id:             string
  slug:           string
  name:           string
  category:       string
  category_label: string
  price_raw:      number   // GHS whole cedis
  length:         string | null
  description:    string
  image_url:      string
  tag:            string | null
  in_stock:       boolean
  display_order:  number
  created_at:     string
}
