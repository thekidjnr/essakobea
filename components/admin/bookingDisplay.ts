"use client";

import { useEffect, useState } from "react";
import { appointmentStart, slotToMinutes } from "@/lib/booking-time";
import type { PillTone } from "@/components/admin/ui";
import type { DbService } from "@/lib/supabase/types";

export interface AdminBooking {
  id: string; client_name: string; client_email: string; client_phone: string;
  service_id: string; service_name: string; treatment: string; booking_date: string; time_slot: string;
  notes: string | null; status: string; payment_status: string; amount: number; created_at: string;
  refund_amount: number; refunded_at: string | null; cancellation_reason: string | null;
  customization_type: string | null; is_emergency: boolean;
  customization_fee: number; emergency_fee: number; service_charge: number;
  stylist_name: string | null;
  hair_unit_type: "own_new" | "own_existing" | "own_extensions" | "none" | null;
  unit_photos: string[];
  bundle_count?: number | null;
}

export function refundOwed(b: Pick<AdminBooking, "status" | "payment_status" | "refund_amount">) {
  return b.status === "cancelled" && b.payment_status === "paid" && b.refund_amount > 0;
}

// How a booking's status reads in the dashboard. One accent only: the
// solid warm-blue pill marks what needs the salon's attention.
export function bookingStatus(b: AdminBooking): { label: string; tone: PillTone; faded: boolean } {
  if (refundOwed(b)) return { label: "Refund owed", tone: "solid", faded: false };
  switch (b.status) {
    case "completed": return { label: "Done", tone: "soft", faded: true };
    case "confirmed": return { label: "Booked", tone: "outline", faded: false };
    case "pending":   return { label: "Unpaid", tone: "soft", faded: true };
    case "cancelled": return { label: b.payment_status === "refunded" ? "Refunded" : "Cancelled", tone: "struck", faded: true };
    default:          return { label: b.status, tone: "soft", faded: false };
  }
}

export const cedis = (pesewas: number) => `₵${(pesewas / 100).toLocaleString()}`;

// "2:00 PM" → "14:00". Falls back to the stored slot if it can't be parsed.
export function formatSlot(slot: string) {
  const m = slotToMinutes(slot);
  if (m === null) return slot;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function startOf(b: Pick<AdminBooking, "booking_date" | "time_slot">) {
  return appointmentStart(b.booking_date, b.time_slot);
}

// Accra is UTC+0, so the UTC date is the salon's date.
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// A day heading: a short word in the serif italic plus the full date.
export function dayLabel(iso: string): { word: string; date: string } {
  const d = new Date(`${iso}T00:00:00Z`);
  const today = todayISO();
  const date = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  if (iso === today) return { word: "Today", date };
  if (iso === addDays(today, 1)) return { word: "Tomorrow", date };
  if (iso === addDays(today, -1)) return { word: "Yesterday", date };
  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  return {
    word: d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" }),
    date: d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: sameYear ? undefined : "numeric", timeZone: "UTC" }),
  };
}

// "in 1h 20m" / "in 45m" / "now"
export function countdown(startMs: number, now = Date.now()) {
  const mins = Math.round((startMs - now) / 60_000);
  if (mins <= 0) return "now";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `in ${h}h${m ? ` ${m}m` : ""}` : `in ${m}m`;
}

// Services keyed by slug, so bookings can show their service photo.
export function useServices() {
  const [services, setServices] = useState<DbService[]>([]);
  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setServices(d); })
      .catch(() => {});
  }, []);
  return services;
}

export function serviceFor(services: DbService[], b: Pick<AdminBooking, "service_id">) {
  return services.find((s) => s.slug === b.service_id);
}
