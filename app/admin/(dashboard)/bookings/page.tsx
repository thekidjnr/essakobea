"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { whatsAppLink } from "@/lib/phone";
import { isPriceRange } from "@/lib/booking-fees";
import { cancellationPolicyText } from "@/lib/refunds";
import { customizationLabel, getServiceRules } from "@/lib/service-rules";
import type { DbService } from "@/lib/supabase/types";
import {
  Page, PageHeader, Segmented, SearchInput, Pill, Button, buttonClass, IconButton, CloseIcon,
  ConfirmDialog, Field, Select, inputClass, ErrorNote, Empty, SkeletonRows,
} from "@/components/admin/ui";
import {
  type AdminBooking, bookingStatus, refundOwed, cedis, formatSlot, startOf, dayLabel, useServices, serviceFor, todayISO,
} from "@/components/admin/bookingDisplay";
import { useRefundsOwed, notifyRefundsChanged } from "@/components/admin/useRefundsOwed";
import { thumbUrl } from "@/lib/media";
import { balanceDue, isHomeService, paymentMethodLabel, PAYMENT_METHODS, type ManualPaymentMethod } from "@/lib/manual-bookings";
import { ManualBookingForm } from "@/components/admin/ManualBookingForm";
import { RescheduleDialog } from "@/components/admin/RescheduleDialog";

type Booking = AdminBooking;
type Tab = "upcoming" | "past" | "attention";
type BookingAction = "cancel" | "refund" | "payment";
type Source = "all" | "online" | "manual";

const SOURCES: { value: Source; label: string }[] = [
  { value: "all",    label: "All bookings" },
  { value: "online", label: "Booked online" },
  { value: "manual", label: "Manual bookings" },
];

// Filter button beside the search, with a small menu of booking sources
function SourceFilter({ value, onChange }: { value: Source; onChange: (v: Source) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  const active = value !== "all";
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Filter bookings"
        className={`h-11 inline-flex items-center gap-2 rounded-full font-sans text-[14px] transition-colors ${
          active ? "px-4 bg-ink text-paper" : "w-11 justify-center bg-soft text-graphite hover:text-ink"
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 4h12M4.5 8h7M7 12h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {active && <span className="whitespace-nowrap">{value === "online" ? "Online" : "Manual"}</span>}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-30 w-[200px] p-1.5 rounded-[20px] bg-paper border border-line shadow-[0_12px_32px_rgba(26,33,43,0.14)]">
          {SOURCES.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full h-10 px-3.5 flex items-center justify-between rounded-[14px] font-sans text-[14px] text-left transition-colors ${
                o.value === value ? "bg-soft text-ink" : "text-graphite hover:bg-soft/60 hover:text-ink"
              }`}
            >
              {o.label}
              {o.value === value && (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const HAIR_UNIT_LABELS: Record<string, string> = {
  own_new: "New unit",
  own_existing: "Existing unit",
  own_extensions: "Bringing extensions",
};

const ADDRESS   = "East Legon, Accra";
const MAPS_LINK = "https://maps.app.goo.gl/KumRn6Wt6VA3cx8w8?g_st=ic";

// A price is a "range" (e.g. "₵250 – ₵450") when it's a deposit: the rest
// is settled once the stylist can see how the style actually turns out.
function isDepositFor(b: Booking, services: DbService[]): boolean {
  if (b.source === "manual") return b.amount > 0 && balanceDue(b) > 0;
  const svc = serviceFor(services, b);
  const opt = svc?.booking_options.find((o) => o.name === b.treatment);
  return isPriceRange(opt?.price);
}

function whatsAppUrlFor(b: Booking, services: DbService[]): string {
  const firstName = b.client_name.split(" ")[0];
  const date = new Date(b.booking_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const amountGHS = (b.amount / 100).toLocaleString();
  const isDeposit = isDepositFor(b, services);
  const stylistLine = b.stylist_name ? `\nStylist: ${b.stylist_name}` : "";
  const stylistFee = (b.stylist_fee ?? 0) / 100;
  const stylistFeeNote = stylistFee > 0
    ? ` This includes the ₵${stylistFee.toLocaleString()} stylist fee, which is added on top of your service price and not deducted from your balance.`
    : "";
  const due = balanceDue(b);
  const paymentLine = b.source === "manual"
    ? b.amount === 0
      ? `*Payment:* ₵${(due / 100).toLocaleString()} due on the day.`
      : due > 0
        ? `*Payment:* ₵${amountGHS} paid, ₵${(due / 100).toLocaleString()} balance due on the day.`
        : `*Payment:* ₵${amountGHS} paid in full.`
    : isDeposit
    ? `*Payment:* ₵${amountGHS} deposit paid.${stylistFeeNote} The remaining balance depends on your styling and is settled on the day.`
    : `*Payment:* ₵${amountGHS} paid in full.`;
  const locationLine = isHomeService(b)
    ? `*Location:* Home service${b.home_address ? `, ${b.home_address}` : ""}`
    : `*Location:* ${ADDRESS}\n${MAPS_LINK}`;

  const custLabel = customizationLabel(b.service_id, b.customization_type);
  const custLine = custLabel ? `\n\n*${getServiceRules(b.service_id).unitStepLabel}:* ${custLabel}` : "";

  const policyLine = `*Good to know:* ${cancellationPolicyText(isDeposit ? "deposit" : "payment")}`;

  const message = `Hi ${firstName}, this is Essakobea confirming your appointment:\n\n*${b.service_name}* (${b.treatment})${stylistLine}\n${date} at ${b.time_slot}${custLine}\n\n${paymentLine}\n\n${locationLine}\n\n${policyLine}\n\nSee you then!`;

  return whatsAppLink(b.client_phone, message);
}

const TAB_QUERY: Record<Tab, string> = {
  upcoming:  "status=all&when=upcoming",
  past:      "status=all&when=past",
  attention: "status=refunds",
};

// ─── Booking detail ──────────────────────────────────────────────────────────

function BookingDetail({
  b, services, onClose, onAction, onReschedule, onPhoto,
}: {
  b: Booking;
  services: DbService[];
  onClose: () => void;
  onAction: (action: BookingAction) => void;
  onReschedule: () => void;
  onPhoto: (url: string) => void;
}) {
  const s = bookingStatus(b);
  const isDeposit = isDepositFor(b, services);
  const stylistFee = b.stylist_fee ?? 0;
  const extras = stylistFee + b.customization_fee + b.emergency_fee + b.service_charge;
  const manual = b.source === "manual";
  const due = balanceDue(b);
  const travel = b.travel_fee ?? 0;
  const base = manual ? Math.max(0, (b.total_price ?? b.amount) - travel) : Math.max(0, b.amount - extras);
  const when = new Date(`${b.booking_date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  // "Tue 3 Nov, 10:00 AM, by the client"
  const movedFrom = b.previous_booking_date && b.previous_time_slot
    ? `${new Date(`${b.previous_booking_date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).replace(",", "")}, ${formatSlot(b.previous_time_slot)}${b.rescheduled_by ? `, by ${b.rescheduled_by === "client" ? "the client" : "the salon"}` : ""}`
    : "";
  const unitLabel = b.hair_unit_type && b.hair_unit_type !== "none" ? HAIR_UNIT_LABELS[b.hair_unit_type] ?? b.hair_unit_type : null;
  const unit = unitLabel && b.bundle_count ? `${unitLabel}, ${b.bundle_count} bundle${b.bundle_count > 1 ? "s" : ""}` : unitLabel;
  const extrasList = [
    b.is_emergency && "Emergency",
    customizationLabel(b.service_id, b.customization_type),
  ].filter(Boolean).join(", ");

  const lines: [string, number][] = [[isDeposit && !manual ? "Deposit" : "Service", base]];
  if (travel > 0) lines.push(["Travel fee", travel]);
  if (manual && (travel > 0 || due > 0)) lines.push(["Total", b.total_price ?? b.amount]);
  if (manual && due > 0) lines.push(["Still to collect", due]);
  if (stylistFee !== 0)        lines.push([stylistFee > 0 ? "Stylist fee (on top of service price)" : "Stylist discount", stylistFee]);
  if (b.customization_fee > 0) lines.push(["Customisation", b.customization_fee]);
  if (b.emergency_fee > 0)     lines.push(["Emergency", b.emergency_fee]);
  if (b.service_charge > 0)    lines.push(["Service charge", b.service_charge]);

  const method = paymentMethodLabel(b);
  const totalLabel = b.payment_status === "refunded" ? "Refunded" : b.payment_status === "unpaid" ? "Paid so far" : `Paid${method ? ` by ${method}` : ""}`;
  let payNote = "";
  if (refundOwed(b)) payNote = `${cedis(b.refund_amount)} to refund`;
  else if (b.status === "cancelled" && b.payment_status === "refunded") payNote = `${cedis(b.refund_amount)} sent back`;
  else if (b.status === "cancelled" && b.payment_status === "paid") payNote = "Deposit kept";
  else if (manual && due > 0) payNote = b.payment_reference ? `Ref ${b.payment_reference}` : "";
  else if (manual && b.payment_reference) payNote = `Ref ${b.payment_reference}`;

  const details: [string, string][] = [
    ["Service", b.service_name],
    ["Style", b.treatment],
    ["Stylist", b.stylist_name ?? ""],
    ["Date", when],
    ["Time", formatSlot(b.time_slot)],
    ["Moved from", movedFrom],
    ["Where", isHomeService(b) ? `Home service${b.home_address ? `: ${b.home_address}` : ""}` : ""],
    ["Extras", extrasList],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div className="flex flex-col min-h-full bg-paper px-5 md:px-7 pt-[calc(16px+env(safe-area-inset-top))] md:pt-6 pb-7">
      <div className="flex items-center justify-between">
        <span className="flex flex-wrap gap-1.5">
          <Pill tone={s.tone}>{s.label}</Pill>
          {manual && <Pill tone="soft">Manual</Pill>}
          {isHomeService(b) && <Pill tone="soft">Home service</Pill>}
        </span>
        <IconButton label="Close" onClick={onClose} className="-mr-3">{CloseIcon}</IconButton>
      </div>

      <h2 className="mt-4 font-serif text-[36px] md:text-[38px] font-light leading-[1.05] text-ink">{b.client_name}</h2>

      <dl className="mt-5 border-t border-line">
        {details.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 py-3 border-b border-line">
            <dt className="font-sans text-[13px] text-muted">{label}</dt>
            <dd className="font-sans text-[14px] text-ink">{value}</dd>
          </div>
        ))}
        {unit && (
          <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 py-3 border-b border-line">
            <dt className="font-sans text-[13px] text-muted">{b.hair_unit_type === "own_extensions" ? "Hair" : "Hair unit"}</dt>
            <dd className="font-sans text-[14px] text-ink">
              {unit}
              {b.unit_photos.length > 0 && (
                <span className="mt-2.5 flex gap-2">
                  {b.unit_photos.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => onPhoto(url)}
                      aria-label={`View unit photo ${i + 1}`}
                      className="w-14 h-14 rounded-[14px] overflow-hidden bg-soft cursor-zoom-in"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbUrl(url)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </span>
              )}
            </dd>
          </div>
        )}
        {(b.inspo_photos?.length ?? 0) > 0 && (
          <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 py-3 border-b border-line">
            <dt className="font-sans text-[13px] text-muted">Inspo</dt>
            <dd className="font-sans text-[14px] text-ink">
              <span className="flex gap-2">
                {b.inspo_photos!.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => onPhoto(url)}
                    aria-label={`View inspo photo ${i + 1}`}
                    className="w-14 h-14 rounded-[14px] overflow-hidden bg-soft cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl(url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </span>
            </dd>
          </div>
        )}
      </dl>

      <div className="flex-1 flex flex-col">
        <div className="mt-6 grid grid-cols-2 gap-2">
          <a
            href={b.payment_status === "paid" || (manual && b.status === "confirmed") ? whatsAppUrlFor(b, services) : whatsAppLink(b.client_phone, `Hi ${b.client_name.split(" ")[0]}, this is Essakobea. `)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("primary")}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2.5 13.5l.9-2.7A5.5 5.5 0 1 1 5.6 13l-3.1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            WhatsApp
          </a>
          <a href={`tel:${b.client_phone}`} className={buttonClass("secondary")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 2.5h2.5l1.2 3-1.5 1a7 7 0 0 0 3.3 3.3l1-1.5 3 1.2V12a1.5 1.5 0 0 1-1.5 1.5A10.5 10.5 0 0 1 1.5 4 1.5 1.5 0 0 1 3 2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            Call
          </a>
        </div>
        <div className="mt-3 flex flex-col items-center gap-0.5 font-sans text-[13px] text-muted text-center">
          <span>{b.client_phone}</span>
          {b.client_email && <span className="break-all">{b.client_email}</span>}
        </div>

        {b.notes && (
          <p className="mt-6 font-serif italic text-[19px] leading-snug text-graphite">“{b.notes}”</p>
        )}
        {b.status === "cancelled" && b.cancellation_reason && (
          <p className="mt-4 font-sans text-[13px] text-muted">Cancelled: {b.cancellation_reason}</p>
        )}

        {(b.amount > 0 || due > 0) && (
          <div className="mt-6 px-5 py-4 rounded-[20px] bg-soft flex flex-col gap-2.5">
            {lines.map(([label, v]) => (
              <div key={label} className="flex justify-between font-sans text-[13px] text-graphite">
                <span>{label}</span><span className="tabular-nums">{cedis(v)}</span>
              </div>
            ))}
            <div className="flex justify-between items-baseline pt-2.5 border-t border-[#E1E3E7]">
              <span className="font-sans text-[13px] font-medium text-ink">{totalLabel}</span>
              <span className="font-serif text-[28px] text-ink [font-variant-numeric:lining-nums]">{cedis(b.amount)}</span>
            </div>
            {payNote && <p className="font-sans text-[12px] text-muted">{payNote}</p>}
          </div>
        )}

        <div className="mt-auto pt-6 flex flex-col gap-1">
          {refundOwed(b) && <Button className="h-12" onClick={() => onAction("refund")}>Mark refund as sent</Button>}
          {due > 0 && <Button className="h-12" onClick={() => onAction("payment")}>Record payment</Button>}
          {(b.status === "pending" || b.status === "confirmed") && (
            <>
              <Button variant="secondary" className="h-12" onClick={onReschedule}>Reschedule</Button>
              <Button variant="ghost" onClick={() => onAction("cancel")}>Cancel booking</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const services = useServices();
  const refundsCount = useRefundsOwed();
  const [tab, setTab]           = useState<Tab>("upcoming");
  const [query, setQuery]       = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refundRef, setRefundRef] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: BookingAction } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [moving, setMoving] = useState<Booking | null>(null);
  const [source, setSource] = useState<Source>("all");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"" | ManualPaymentMethod>("");

  // Deep links from the overview: ?filter=refunds, ?open=<booking id>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("filter") === "refunds") setTab("attention");
    const open = params.get("open");
    if (open) setSelectedId(open);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    fetch(`/api/admin/bookings?${TAB_QUERY[tab]}`)
      .then(async r => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !Array.isArray(data)) throw new Error(data?.error ?? "Could not load bookings");
        setBookings(data);
      })
      .catch(err => { setBookings([]); setLoadError(err.message || "Could not load bookings"); })
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  // Grouped by day: upcoming soonest first, everything else most recent first.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const list = bookings
      .filter((b) => source === "all" || (source === "manual") === (b.source === "manual"))
      .filter((b) => !q
        || b.client_name.toLowerCase().includes(q)
        || (b.client_email ?? "").toLowerCase().includes(q)
        || (digits.length >= 3 && b.client_phone.replace(/\D/g, "").includes(digits)))
      .sort((a, b) => tab === "upcoming" ? startOf(a) - startOf(b) : startOf(b) - startOf(a));
    const byDay = new Map<string, Booking[]>();
    for (const b of list) byDay.set(b.booking_date, [...(byDay.get(b.booking_date) ?? []), b]);
    return [...byDay.entries()];
  }, [bookings, query, tab, source]);

  const selected = bookings.find((b) => b.id === selectedId) ?? null;

  const closeModal = () => {
    setConfirmModal(null); setCancelReason(""); setRefundRef(""); setActionError("");
    setPayAmount(""); setPayMethod("");
  };

  const openAction = (b: Booking, action: BookingAction) => {
    if (action === "payment") setPayAmount(String(balanceDue(b) / 100));
    setConfirmModal({ id: b.id, action });
  };

  const handleCreated = (b: Booking) => {
    setCreating(false);
    setQuery("");
    setTab(b.booking_date >= todayISO() ? "upcoming" : "past");
    setSelectedId(b.id);
    load();
  };

  const handleAction = async (id: string, action: BookingAction) => {
    setBusy(true);
    setActionError("");
    const body = action === "cancel" ? { reason: cancelReason }
      : action === "refund" ? { reference: refundRef }
      : { amount: Number(payAmount), method: payMethod };
    const url = action === "payment" ? `/api/admin/bookings/${id}/payment` : `/api/bookings/${id}/${action}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setActionError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      closeModal();
      load();
      notifyRefundsChanged();
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const TABS: { value: Tab; label: string; count?: number }[] = [
    { value: "upcoming",  label: "Upcoming" },
    { value: "past",      label: "Past" },
    { value: "attention", label: "Needs attention", count: refundsCount },
  ];

  const MODAL_COPY: Record<BookingAction, { title: string; body: string; cta: string }> = {
    cancel:  { title: "Cancel booking?", body: "The client will be emailed. If they paid, the refund is recorded as owed.", cta: "Cancel booking" },
    refund:  { title: "Refund sent?", body: "Marks this refund as paid back to the client.", cta: "Mark as sent" },
    payment: { title: "Record payment", body: "Money the client paid in person, by MoMo or by transfer.", cta: "Record payment" },
  };

  // With the side panel open, drop the stylist and amount columns to make room.
  const compact = !!selected;
  const cols = `md:grid-cols-[64px_minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,0.9fr)_128px_80px] ${
    compact ? "lg:grid-cols-[60px_minmax(0,1fr)_minmax(0,1.3fr)_120px]" : ""
  }`;

  return (
    <div className={`lg:grid ${selected ? "lg:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
      <Page wide>
        <PageHeader
          title="Bookings"
          actions={
            <>
              <Button onClick={() => setCreating(true)} className="flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                New
              </Button>
            </>
          }
        />

        <div className="relative z-20 flex items-center gap-2 mb-5">
          <SearchInput value={query} onChange={setQuery} placeholder="Search" className="flex-1 sm:flex-none sm:w-[320px]" />
          <SourceFilter value={source} onChange={(v) => { setSource(v); setSelectedId(null); }} />
        </div>

        <Segmented options={TABS} value={tab} onChange={(t) => { setTab(t); setSelectedId(null); }} />

        <div className="mt-2 fade-up">
          {loading ? (
            <div className="mt-8"><SkeletonRows rows={6} /></div>
          ) : loadError ? (
            <Empty title="Bookings didn't load"><ErrorNote>{loadError}</ErrorNote></Empty>
          ) : groups.length === 0 ? (
            <Empty title={query || source !== "all" ? "No matches" : tab === "attention" ? "Nothing needs attention" : "No bookings yet"} />
          ) : (
            <div className="mt-6 md:border md:border-line md:rounded-[24px] md:overflow-hidden">
              <div className={`hidden md:grid ${cols} gap-4 px-5 h-11 items-center bg-soft/60 border-b border-line font-sans text-[12px] text-muted`}>
                <span>Time</span>
                <span>Client</span>
                <span>Service</span>
                <span className={compact ? "lg:hidden" : ""}>Stylist</span>
                <span>Status</span>
                <span className={`text-right ${compact ? "lg:hidden" : ""}`}>Paid</span>
              </div>
              {groups.map(([day, rows]) => {
                const d = dayLabel(day);
                return (
                  <section key={day} className="mt-7 first:mt-0 md:mt-0 md:[&+&]:border-t md:[&+&]:border-line">
                    <h2 className="flex items-baseline gap-3 pb-2 md:pb-0 md:px-5 md:h-12 md:items-center md:border-b md:border-line">
                      <span className="font-serif italic text-[22px] text-ink">{d.word}</span>
                      <span className="font-sans text-[12px] text-muted">{d.date}</span>
                    </h2>
                    <ul className="divide-y divide-line border-y border-line md:border-y-0">
                      {rows.map((b) => {
                        const s = bookingStatus(b);
                        const img = thumbUrl(serviceFor(services, b)?.image_url);
                        const active = b.id === selectedId;
                        const tone = s.faded ? "text-muted" : "text-ink";
                        return (
                          <li key={b.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedId(active ? null : b.id)}
                              aria-pressed={active}
                              className={`w-full grid grid-cols-[52px_minmax(0,1fr)_auto] ${cols} items-center gap-3 md:gap-4 py-3.5 md:px-5 text-left transition-colors ${
                                active ? "bg-soft" : "md:hover:bg-soft/50"
                              }`}
                            >
                              <span className={`font-serif text-[19px] [font-variant-numeric:lining-nums_tabular-nums] ${tone}`}>
                                {formatSlot(b.time_slot)}
                              </span>

                              {/* Client (mobile: client + service stacked) */}
                              <span className="min-w-0">
                                <span className={`block font-sans text-[14px] font-medium truncate ${tone}`}>{b.client_name}</span>
                                <span className="block md:hidden font-sans text-[12px] text-muted truncate">
                                  {b.treatment || b.service_name}{b.stylist_name ? ` · ${b.stylist_name}` : ""}
                                </span>
                                <span className="hidden md:block font-sans text-[12px] text-muted truncate">{b.client_phone}</span>
                              </span>

                              <span className="hidden md:flex items-center gap-3 min-w-0">
                                <span className={`relative w-9 h-9 flex-shrink-0 rounded-[11px] overflow-hidden bg-soft ${s.faded ? "opacity-50" : ""}`}>
                                  {img && <Image src={img} alt="" fill sizes="36px" className="object-cover" />}
                                </span>
                                <span className="min-w-0">
                                  <span className={`block font-sans text-[14px] truncate ${tone}`}>{b.treatment || b.service_name}</span>
                                  <span className="block font-sans text-[12px] text-muted truncate">
                                    {b.service_name}{isHomeService(b) ? " · Home service" : ""}
                                  </span>
                                </span>
                              </span>

                              <span className={`hidden md:block font-sans text-[14px] truncate ${s.faded ? "text-muted" : "text-graphite"} ${compact ? "lg:hidden" : ""}`}>
                                {b.stylist_name ?? "Any"}
                              </span>

                              <span className={s.tone === "outline" || s.label === "Done" ? "hidden md:block" : ""}>
                                <Pill tone={s.tone}>{s.label}</Pill>
                              </span>

                              <span className={`hidden md:block font-sans text-[14px] text-right tabular-nums ${tone} ${compact ? "lg:hidden" : ""}`}>
                                {b.amount > 0 ? cedis(b.amount) : balanceDue(b) > 0 ? "Unpaid" : ""}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}

        </div>
      </Page>

      {/* Detail: side panel on large screens, full screen on smaller ones */}
      {selected && (
        <aside className="fixed inset-0 z-[45] overflow-y-auto bg-paper lg:static lg:z-auto lg:p-6 lg:pl-0 lg:bg-transparent">
          <div className="min-h-full lg:min-h-0 lg:sticky lg:top-6 lg:rounded-[28px] lg:border lg:border-line lg:overflow-hidden lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto">
            <BookingDetail
              b={selected}
              services={services}
              onClose={() => setSelectedId(null)}
              onAction={(action) => openAction(selected, action)}
              onReschedule={() => setMoving(selected)}
              onPhoto={setLightboxUrl}
            />
          </div>
        </aside>
      )}

      <ManualBookingForm
        open={creating}
        onClose={() => setCreating(false)}
        services={services}
        onCreated={handleCreated}
      />

      <RescheduleDialog
        booking={moving}
        onClose={() => setMoving(null)}
        onMoved={(b) => {
          setMoving(null);
          setTab(b.booking_date >= todayISO() ? "upcoming" : "past");
          setSelectedId(b.id);
          load();
        }}
      />

      <ConfirmDialog
        open={!!confirmModal}
        title={confirmModal ? MODAL_COPY[confirmModal.action].title : ""}
        body={confirmModal ? MODAL_COPY[confirmModal.action].body : ""}
        confirmLabel={confirmModal ? MODAL_COPY[confirmModal.action].cta : ""}
        busy={busy}
        error={actionError}
        onClose={closeModal}
        onConfirm={() => confirmModal && handleAction(confirmModal.id, confirmModal.action)}
      >
        {confirmModal?.action === "cancel" && (
          <Field label="Reason (optional)">
            <input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="e.g. No availability that day" className={inputClass} />
          </Field>
        )}
        {confirmModal?.action === "payment" && (
          <div className="flex flex-col gap-4">
            <Field label="Amount (₵)">
              <input type="number" inputMode="decimal" min={0} value={payAmount} onChange={e => setPayAmount(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Paid by">
              <Select value={payMethod} onChange={e => setPayMethod(e.target.value as typeof payMethod)}>
                <option value="">Choose</option>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </Field>
          </div>
        )}
        {confirmModal?.action === "refund" && (
          <Field label="MoMo or Paystack reference (optional)">
            <input value={refundRef} onChange={e => setRefundRef(e.target.value)} className={inputClass} />
          </Field>
        )}
      </ConfirmDialog>

      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)} className="fixed inset-0 z-[60] bg-ink/90 flex items-center justify-center px-6 cursor-zoom-out">
          <IconButton label="Close" onClick={() => setLightboxUrl(null)} className="absolute top-6 right-6 text-paper hover:text-paper hover:bg-paper/10">
            {CloseIcon}
          </IconButton>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="Unit photo" onClick={(e) => e.stopPropagation()} className="max-w-full max-h-[85vh] rounded-[20px] object-contain cursor-default" />
        </div>
      )}
    </div>
  );
}
