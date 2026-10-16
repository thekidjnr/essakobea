"use client";

// "Edit" on a booking in the admin: client details, notes, style, how long it
// takes, the home service address, and a manual booking's total. Date, time
// and stylist live in Reschedule. No money moves: a different style on an
// online booking is settled at the salon. If a longer appointment now
// overlaps something the server sends back warnings, and the salon can save
// anyway.

import { useEffect, useMemo, useState } from "react";
import type { DbService } from "@/lib/supabase/types";
import { formatDuration, optionDuration } from "@/lib/booking-duration";
import { Modal, Field, Select, Button, ErrorNote, inputClass, textareaClass } from "@/components/admin/ui";
import type { AdminBooking } from "@/components/admin/bookingDisplay";

// 30 minutes to 10 hours
const LENGTHS = Array.from({ length: 20 }, (_, i) => (i + 1) * 30);

export function EditBookingDialog({
  booking, services, onClose, onSaved,
}: {
  booking: AdminBooking | null;
  services: DbService[];
  onClose: () => void;
  onSaved: (b: AdminBooking) => void;
}) {
  const [f, setF] = useState({
    clientName: "", clientPhone: "", clientEmail: "", notes: "",
    serviceId: "", optionId: "", duration: 0, homeAddress: "", totalPrice: "",
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const active = booking?.status === "pending" || booking?.status === "confirmed";
  const manual = booking?.source === "manual";
  const home = booking?.location_type === "home";

  useEffect(() => {
    if (!booking) return;
    const svc = services.find((s) => s.slug === booking.service_id);
    const opt = svc?.booking_options.find((o) => o.name === booking.treatment);
    setF({
      clientName: booking.client_name,
      clientPhone: booking.client_phone,
      clientEmail: booking.client_email ?? "",
      notes: booking.notes ?? "",
      serviceId: booking.service_id,
      optionId: opt?.id ?? "",
      duration: booking.duration_minutes ?? optionDuration(booking.service_id, opt),
      homeAddress: booking.home_address ?? "",
      totalPrice: booking.total_price != null ? String(booking.total_price / 100) : "",
    });
    setWarnings([]);
    setError("");
  }, [booking, services]);

  const service = services.find((s) => s.slug === f.serviceId);
  const options = service?.booking_options ?? [];
  // A length that isn't on the 30 minute list still shows as itself
  const lengths = useMemo(
    () => (LENGTHS.includes(f.duration) || !f.duration ? LENGTHS : [...LENGTHS, f.duration].sort((a, b) => a - b)),
    [f.duration],
  );

  // Any change clears the warnings, so "Save anyway" always refers to what's on screen
  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => {
    setF((prev) => ({ ...prev, [key]: value }));
    setWarnings([]);
    setError("");
  };

  // A new style brings its usual length with it
  const pickStyle = (serviceId: string, optionId: string) => {
    const opt = services.find((s) => s.slug === serviceId)?.booking_options.find((o) => o.id === optionId);
    setF((prev) => ({ ...prev, serviceId, optionId, duration: opt ? optionDuration(serviceId, opt) : prev.duration }));
    setWarnings([]);
    setError("");
  };

  const styleChanged = !!booking && (f.serviceId !== booking.service_id
    || services.find((s) => s.slug === f.serviceId)?.booking_options.find((o) => o.id === f.optionId)?.name !== booking.treatment);

  const submit = async (force: boolean) => {
    if (!booking) return;
    if (active && !f.optionId) { setError("Choose a style."); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: f.clientName,
          clientPhone: f.clientPhone,
          clientEmail: f.clientEmail,
          notes: f.notes,
          serviceId: f.serviceId,
          optionId: f.optionId,
          durationMinutes: f.duration,
          homeAddress: f.homeAddress,
          ...(manual && f.totalPrice !== "" && { totalPrice: Number(f.totalPrice) }),
          force,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 409 && Array.isArray(data?.warnings)) {
        setWarnings(data.warnings);
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? "Could not save the booking.");
        return;
      }
      onSaved(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!booking}
      onClose={onClose}
      title="Edit booking"
      size="lg"
      footer={
        <>
          <ErrorNote className="w-full text-right">{error}</ErrorNote>
          <Button variant="ghost" onClick={onClose}>Go back</Button>
          <Button onClick={() => submit(warnings.length > 0)} disabled={busy}>
            {busy ? "Saving…" : warnings.length ? "Save anyway" : "Save changes"}
          </Button>
        </>
      }
    >
      {booking && (
        <div className="flex flex-col gap-8">
          <section className="grid gap-4 grid-cols-2">
            <Field label="Client name" className="col-span-2">
              <input value={f.clientName} onChange={(e) => set("clientName", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={f.clientPhone} onChange={(e) => set("clientPhone", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Email (optional)">
              <input type="email" value={f.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} className={inputClass} />
            </Field>
          </section>

          {active && (
            <section className="grid gap-4 grid-cols-2">
              <Field label="Service">
                <Select value={f.serviceId} onChange={(e) => pickStyle(e.target.value, "")}>
                  {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Style">
                <Select value={f.optionId} onChange={(e) => pickStyle(f.serviceId, e.target.value)}>
                  <option value="">Choose</option>
                  {options.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.price})</option>)}
                </Select>
              </Field>
              <Field label="How long it takes" className="col-span-2">
                <Select value={String(f.duration)} onChange={(e) => set("duration", Number(e.target.value))}>
                  {lengths.map((m) => <option key={m} value={m}>{formatDuration(m)}</option>)}
                </Select>
              </Field>
              {styleChanged && !manual && (
                <p className="col-span-2 font-sans text-[13px] text-graphite">
                  They paid online for {booking.treatment}. Any price difference for the new style is settled at the salon.
                </p>
              )}
            </section>
          )}

          {(home || manual) && (
            <section className="grid gap-4 grid-cols-2">
              {home && (
                <Field label="Home service address" className="col-span-2">
                  <input value={f.homeAddress} onChange={(e) => set("homeAddress", e.target.value)} className={inputClass} />
                </Field>
              )}
              {manual && (
                <Field label="Total price (₵)" className="col-span-2">
                  <input type="number" inputMode="decimal" min={0} value={f.totalPrice} onChange={(e) => set("totalPrice", e.target.value)} className={inputClass} />
                </Field>
              )}
            </section>
          )}

          <Field label="Notes (optional)">
            <textarea rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} className={textareaClass} />
          </Field>

          {warnings.length > 0 && (
            <div role="alert" className="rounded-[20px] border border-ink/20 bg-soft px-5 py-4">
              <p className="font-sans text-[14px] font-medium text-ink">Heads up before you save</p>
              <ul className="mt-2 flex flex-col gap-1 font-sans text-[13px] text-graphite list-disc pl-5">
                {warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
              <p className="mt-2 font-sans text-[13px] text-muted">Change the details, or press Save anyway.</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
