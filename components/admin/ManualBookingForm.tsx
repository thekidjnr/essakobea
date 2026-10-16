"use client";

// "Manual booking" in the admin: walk-ins, WhatsApp bookings, home service, and
// clients who pay cash, MoMo or bank transfer. Saved straight as confirmed.
// If it breaks the usual availability rules the server sends back warnings,
// and the salon can save anyway.

import { useEffect, useMemo, useState } from "react";
import type { DbService, Stylist } from "@/lib/supabase/types";
import { formatReadyEstimate, getServiceRules, readyEstimate } from "@/lib/service-rules";
import { PAYMENT_METHODS, type ManualPaymentMethod } from "@/lib/manual-bookings";
import { Modal, Field, Select, Segmented, Button, ErrorNote, inputClass, textareaClass } from "@/components/admin/ui";
import { type AdminBooking, cedis, todayISO } from "@/components/admin/bookingDisplay";
import { DateTimePicker } from "@/components/admin/DateTimePicker";

type Location = "salon" | "home";
type Payment = "paid" | "deposit" | "unpaid";

const LOCATIONS: { value: Location; label: string }[] = [
  { value: "salon", label: "In the salon" },
  { value: "home",  label: "Home service" },
];
const PAYMENTS: { value: Payment; label: string }[] = [
  { value: "paid",    label: "Paid in full" },
  { value: "deposit", label: "Part paid" },
  { value: "unpaid",  label: "Not paid yet" },
];

const EMPTY = {
  clientName: "", clientPhone: "", clientEmail: "", notes: "",
  location: "salon" as Location, homeAddress: "", travelFee: "",
  serviceId: "", optionId: "", customizationType: "" as "" | "standard" | "express",
  stylistId: "", date: "", time: "",
  servicePrice: "", payment: "paid" as Payment, amountPaid: "",
  method: "" as "" | ManualPaymentMethod, notify: true,
};
type FormState = typeof EMPTY;

const ghs = (v: string) => Math.max(0, Number(v) || 0);

export function ManualBookingForm({
  open, onClose, services, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  services: DbService[];
  onCreated: (b: AdminBooking) => void;
}) {
  const [f, setF] = useState<FormState>(EMPTY);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF({ ...EMPTY, date: todayISO() });
    setWarnings([]);
    setError("");
    fetch("/api/admin/stylists")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setStylists(d); })
      .catch(() => {});
  }, [open]);

  // Any change clears the warnings, so "Save anyway" always refers to what's on screen
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setF((prev) => ({ ...prev, [key]: value }));
    setWarnings([]);
    setError("");
  };

  const service = services.find((s) => s.slug === f.serviceId);
  const option = service?.booking_options.find((o) => o.id === f.optionId);
  const rules = getServiceRules(f.serviceId);

  const pickService = (slug: string) => {
    setF((prev) => ({ ...prev, serviceId: slug, optionId: "", servicePrice: "", customizationType: "" }));
    setWarnings([]);
  };
  const pickOption = (id: string) => {
    const o = service?.booking_options.find((x) => x.id === id);
    setF((prev) => ({
      ...prev,
      optionId: id,
      servicePrice: o && Number(o.price_raw) > 0 ? String(o.price_raw) : prev.servicePrice,
    }));
    setWarnings([]);
  };

  const travel = f.location === "home" ? ghs(f.travelFee) : 0;
  const total = ghs(f.servicePrice) + travel;
  const paid = f.payment === "paid" ? total : f.payment === "deposit" ? ghs(f.amountPaid) : 0;
  const ready = useMemo(
    () => readyEstimate(f.serviceId, f.customizationType, f.date),
    [f.serviceId, f.customizationType, f.date],
  );

  const missing =
    !f.clientName.trim() ? "Add the client's name." :
    f.clientPhone.replace(/\D/g, "").length < 9 ? "Add the client's phone number." :
    !f.serviceId || !f.optionId ? "Choose a service and style." :
    !f.date || !f.time ? "Choose a date and time." :
    f.location === "home" && !f.homeAddress.trim() ? "Add the address for the home service." :
    total <= 0 ? "Enter the price." :
    f.payment === "deposit" && (paid <= 0 || paid > total) ? "Enter how much was paid, up to the total." :
    paid > 0 && !f.method ? "Choose how they paid." :
    "";

  const submit = async (force: boolean) => {
    if (missing) { setError(missing); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: f.clientName,
          clientPhone: f.clientPhone,
          clientEmail: f.clientEmail,
          notes: f.notes,
          serviceId: f.serviceId,
          optionId: f.optionId,
          customizationType: f.customizationType || null,
          stylistId: f.stylistId || null,
          bookingDate: f.date,
          timeSlot: f.time,
          locationType: f.location,
          homeAddress: f.homeAddress,
          servicePrice: ghs(f.servicePrice),
          travelFee: travel,
          payment: f.payment,
          amountPaid: paid,
          paymentMethod: f.method || null,
          notify: f.notify,
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
      onCreated(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manual booking"
      size="lg"
      footer={
        <>
          <ErrorNote className="w-full text-right">{error}</ErrorNote>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => submit(warnings.length > 0)} disabled={busy || !f.optionId}>
            {busy ? "Saving…" : warnings.length ? "Save anyway" : "Save booking"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-8">
        {/* Service */}
        <section className="grid gap-4 md:grid-cols-2">
          <Field label="Service">
            <Select value={f.serviceId} onChange={(e) => pickService(e.target.value)}>
              <option value="">Choose a service</option>
              {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </Select>
          </Field>
          {service && (
            <Field label="Style" className="fade-up">
              <Select value={f.optionId} onChange={(e) => pickOption(e.target.value)}>
                <option value="">Choose a style</option>
                {service.booking_options.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}{o.price ? ` · ${o.price}` : ""}</option>
                ))}
              </Select>
            </Field>
          )}
          {rules.customization && service && f.optionId && (
            <Field label={rules.unitStepLabel} className="fade-up">
              <Select value={f.customizationType} onChange={(e) => set("customizationType", e.target.value as FormState["customizationType"])}>
                <option value="">None</option>
                <option value="standard">Standard ({rules.customizationCopy.standard.short.toLowerCase()})</option>
                <option value="express">Express ({rules.customizationCopy.express.short.toLowerCase()})</option>
              </Select>
            </Field>
          )}
        </section>

        {/* The rest appears once a style is chosen, so the form starts short */}
        {f.optionId && (
          <div className="flex flex-col gap-8 fade-up">
            {/* Where: before the date, since home visits don't take a salon seat */}
            <section className="flex flex-col gap-4">
              <Segmented<Location> options={LOCATIONS} value={f.location} onChange={(v) => set("location", v)} className="self-start" />
              {f.location === "home" && (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                  <Field label="Address">
                    <textarea rows={2} value={f.homeAddress} onChange={(e) => set("homeAddress", e.target.value)} placeholder="House number, street, area, landmark" className={textareaClass} />
                  </Field>
                  <Field label="Travel fee (₵)">
                    <input type="number" inputMode="decimal" min={0} value={f.travelFee} onChange={(e) => set("travelFee", e.target.value)} placeholder="0" className={inputClass} />
                  </Field>
                </div>
              )}
            </section>

            {/* Who and when */}
            <section className="flex flex-col gap-6">
              <Field label="Stylist">
                <Select value={f.stylistId} onChange={(e) => set("stylistId", e.target.value)}>
                  <option value="">Not assigned yet</option>
                  {stylists.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_available ? "" : " (unavailable)"}</option>)}
                </Select>
              </Field>
              <DateTimePicker
                date={f.date}
                time={f.time}
                onDate={(v) => set("date", v)}
                onTime={(v) => set("time", v)}
                dateLabel={ready ? "Drop-off date" : "Date"}
                dateNote={ready && (
                  <p className="font-sans text-[13px] text-graphite">Estimated ready: {formatReadyEstimate(ready)}</p>
                )}
                stylistId={f.stylistId}
                serviceId={f.serviceId}
                optionId={f.optionId}
                home={f.location === "home"}
              />
            </section>

            {/* Client */}
            <section className="grid gap-4 md:grid-cols-2">
              <Field label="Client name" className="md:col-span-2">
                <input value={f.clientName} onChange={(e) => set("clientName", e.target.value)} className={inputClass} autoComplete="off" />
              </Field>
              <Field label="Phone" hint="WhatsApp number if they have one">
                <input type="tel" inputMode="tel" value={f.clientPhone} onChange={(e) => set("clientPhone", e.target.value)} placeholder="055 123 4567" className={inputClass} autoComplete="off" />
              </Field>
              <Field label="Email (optional)">
                <input type="email" value={f.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} className={inputClass} autoComplete="off" />
              </Field>
            </section>

            {/* Payment */}
            <section className="flex flex-col gap-4">
              <Field label="Price (₵)" className="md:max-w-[50%]">
                <input type="number" inputMode="decimal" min={0} value={f.servicePrice} onChange={(e) => set("servicePrice", e.target.value)} className={inputClass} />
              </Field>
              {/* Only differs from the price when there's a travel fee */}
              {travel > 0 && (
                <p className="-mt-1 font-sans text-[13px] text-graphite">
                  Total with {cedis(Math.round(travel * 100))} travel fee: <span className="font-medium text-ink">{cedis(Math.round(total * 100))}</span>
                </p>
              )}
              <Segmented<Payment> options={PAYMENTS} value={f.payment} onChange={(v) => set("payment", v)} className="self-start" />
              {f.payment !== "unpaid" && (
                <div className="grid gap-4 md:grid-cols-2">
                  {f.payment === "deposit" && (
                    <Field label="Amount paid (₵)">
                      <input type="number" inputMode="decimal" min={0} value={f.amountPaid} onChange={(e) => set("amountPaid", e.target.value)} className={inputClass} />
                    </Field>
                  )}
                  <Field label="Paid by">
                    <Select value={f.method} onChange={(e) => set("method", e.target.value as FormState["method"])}>
                      <option value="">Choose</option>
                      {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </Select>
                  </Field>
                </div>
              )}
              {f.payment !== "paid" && total > 0 && (
                <p className="font-sans text-[13px] text-graphite">
                  {cedis(Math.round((total - paid) * 100))} to collect later. You can record it from the booking.
                </p>
              )}
            </section>

            <Field label="Notes (optional)">
              <textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} className={textareaClass} />
            </Field>

            <label className="flex items-start gap-3 font-sans text-[14px] text-ink cursor-pointer">
              <input type="checkbox" checked={f.notify} onChange={(e) => set("notify", e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#1a212b]" />
              <span>
                Send the client a confirmation
                <span className="block text-[13px] text-muted">By SMS{f.clientEmail.trim() ? " and email" : ", and email if you add one"}</span>
              </span>
            </label>
          </div>
        )}

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
    </Modal>
  );
}
