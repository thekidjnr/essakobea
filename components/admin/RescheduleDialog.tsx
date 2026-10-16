"use client";

// "Reschedule" on a booking in the admin. The salon can move any active
// booking to any time, and change the stylist. If the new time breaks the
// usual availability rules the server sends back warnings, and the salon can
// move it anyway. Doesn't use up the client's own online reschedule.

import { useEffect, useState } from "react";
import type { Stylist } from "@/lib/supabase/types";
import { Modal, Field, Select, Button, ErrorNote } from "@/components/admin/ui";
import type { AdminBooking } from "@/components/admin/bookingDisplay";
import { DateTimePicker } from "@/components/admin/DateTimePicker";

export function RescheduleDialog({
  booking, onClose, onMoved,
}: {
  booking: AdminBooking | null;
  onClose: () => void;
  onMoved: (b: AdminBooking) => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [notify, setNotify] = useState(true);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!booking) return;
    setDate(booking.booking_date);
    setTime(booking.time_slot);
    setStylistId(booking.stylist_id ?? "");
    setNotify(true);
    setWarnings([]);
    setError("");
    fetch("/api/admin/stylists")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setStylists(d); })
      .catch(() => {});
  }, [booking]);

  // Any change clears the warnings, so "Move anyway" always refers to what's on screen
  const change = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setWarnings([]); setError(""); };

  const submit = async (force: boolean) => {
    if (!booking) return;
    if (!date || !time) { setError("Choose a date and time."); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, stylistId: stylistId || null, notify, force }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 409 && Array.isArray(data?.warnings)) {
        setWarnings(data.warnings);
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? "Could not move the booking.");
        return;
      }
      onMoved(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const hasContact = !!booking?.client_email;

  return (
    <Modal
      open={!!booking}
      onClose={onClose}
      title="Reschedule"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Go back</Button>
          <Button onClick={() => submit(warnings.length > 0)} disabled={busy}>
            {busy ? "Moving…" : warnings.length ? "Move anyway" : "Move booking"}
          </Button>
        </>
      }
    >
      {booking && (
        <div className="flex flex-col gap-5">
          <p className="font-sans text-[14px] leading-relaxed text-graphite">
            {booking.client_name}, {booking.treatment || booking.service_name}. Payment stays with the booking.
          </p>
          <Field label="Stylist">
            <Select value={stylistId} onChange={(e) => change(setStylistId)(e.target.value)}>
              {!booking.stylist_id && <option value="">Not assigned yet</option>}
              {stylists.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_available ? "" : " (unavailable)"}</option>)}
            </Select>
          </Field>
          <DateTimePicker
            date={date}
            time={time}
            onDate={change(setDate)}
            onTime={change(setTime)}
            stylistId={stylistId}
            excludeId={booking.id}
            home={booking.location_type === "home"}
          />

          <label className="flex items-start gap-3 font-sans text-[14px] text-ink cursor-pointer">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#1a212b]" />
            <span>
              Let the client know
              <span className="block text-[13px] text-muted">By SMS{hasContact ? " and email" : ""}, with the new time</span>
            </span>
          </label>

          {warnings.length > 0 && (
            <div role="alert" className="rounded-[20px] border border-ink/20 bg-soft px-5 py-4">
              <p className="font-sans text-[14px] font-medium text-ink">Heads up before you move it</p>
              <ul className="mt-2 flex flex-col gap-1 font-sans text-[13px] text-graphite list-disc pl-5">
                {warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
              <p className="mt-2 font-sans text-[13px] text-muted">Change the details, or press Move anyway.</p>
            </div>
          )}
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
    </Modal>
  );
}
