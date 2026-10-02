"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { whatsAppLink } from "@/lib/phone";
import { isPriceRange } from "@/lib/booking-fees";
import type { DbService } from "@/lib/supabase/types";
import {
  Page, PageHeader, Segmented, SearchInput, Pill, Button, buttonClass, IconButton, CloseIcon,
  ConfirmDialog, Field, inputClass, ErrorNote, Empty, SkeletonRows,
} from "@/components/admin/ui";
import {
  type AdminBooking, bookingStatus, refundOwed, cedis, formatSlot, startOf, dayLabel, useServices, serviceFor,
} from "@/components/admin/bookingDisplay";
import { useRefundsOwed, notifyRefundsChanged } from "@/components/admin/useRefundsOwed";

type Booking = AdminBooking;
type Tab = "upcoming" | "past" | "attention";
type BookingAction = "cancel" | "refund";

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
  const paymentLine = isDeposit
    ? `*Payment:* ₵${amountGHS} deposit paid. The remaining balance depends on your styling and is settled on the day.`
    : `*Payment:* ₵${amountGHS} paid in full.`;

  const policyLine = `*Good to know:* Full refund if you cancel 24h+ before. Within 24h, 50% of your ${isDeposit ? "deposit" : "payment"} is refunded; no-shows aren't refunded.`;

  const message = `Hi ${firstName}, this is Essakobea confirming your appointment:\n\n*${b.service_name}* (${b.treatment})${stylistLine}\n${date} at ${b.time_slot}\n\n${paymentLine}\n\n*Location:* ${ADDRESS}\n${MAPS_LINK}\n\n${policyLine}\n\nSee you then!`;

  return whatsAppLink(b.client_phone, message);
}

const TAB_QUERY: Record<Tab, string> = {
  upcoming:  "status=all&when=upcoming",
  past:      "status=all&when=past",
  attention: "status=refunds",
};

// ─── Booking detail ──────────────────────────────────────────────────────────

function BookingDetail({
  b, services, onClose, onAction, onPhoto,
}: {
  b: Booking;
  services: DbService[];
  onClose: () => void;
  onAction: (action: BookingAction) => void;
  onPhoto: (url: string) => void;
}) {
  const s = bookingStatus(b);
  const isDeposit = isDepositFor(b, services);
  const extras = b.customization_fee + b.emergency_fee + b.service_charge;
  const base = Math.max(0, b.amount - extras);
  const when = new Date(`${b.booking_date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const unitLabel = b.hair_unit_type && b.hair_unit_type !== "none" ? HAIR_UNIT_LABELS[b.hair_unit_type] ?? b.hair_unit_type : null;
  const unit = unitLabel && b.bundle_count ? `${unitLabel}, ${b.bundle_count} bundle${b.bundle_count > 1 ? "s" : ""}` : unitLabel;
  const extrasList = [
    b.is_emergency && "Emergency",
    b.customization_type && `${b.customization_type[0].toUpperCase()}${b.customization_type.slice(1)} customisation`,
  ].filter(Boolean).join(", ");

  const lines: [string, number][] = [[isDeposit ? "Deposit" : "Service", base]];
  if (b.customization_fee > 0) lines.push(["Customisation", b.customization_fee]);
  if (b.emergency_fee > 0)     lines.push(["Emergency", b.emergency_fee]);
  if (b.service_charge > 0)    lines.push(["Service charge", b.service_charge]);

  const totalLabel = b.payment_status === "refunded" ? "Refunded" : b.payment_status === "unpaid" ? "Unpaid" : "Paid";
  let payNote = "";
  if (refundOwed(b)) payNote = `${cedis(b.refund_amount)} to refund`;
  else if (b.status === "cancelled" && b.payment_status === "refunded") payNote = `${cedis(b.refund_amount)} sent back`;
  else if (b.status === "cancelled" && b.payment_status === "paid") payNote = "Deposit kept";
  else if (isDeposit && b.payment_status === "paid") payNote = "Balance settled on the day";

  const details: [string, string][] = [
    ["Service", b.service_name],
    ["Style", b.treatment],
    ["Stylist", b.stylist_name ?? ""],
    ["Date", when],
    ["Time", formatSlot(b.time_slot)],
    ["Extras", extrasList],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div className="flex flex-col min-h-full bg-paper px-5 md:px-7 pt-[calc(16px+env(safe-area-inset-top))] md:pt-6 pb-7">
      <div className="flex items-center justify-between">
        <Pill tone={s.tone}>{s.label}</Pill>
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
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </span>
              )}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex-1 flex flex-col">
        <div className="mt-6 grid grid-cols-2 gap-2">
          <a
            href={b.payment_status === "paid" ? whatsAppUrlFor(b, services) : whatsAppLink(b.client_phone, `Hi ${b.client_name.split(" ")[0]}, this is Essakobea. `)}
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

        {b.amount > 0 && (
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
          {(b.status === "pending" || b.status === "confirmed") && (
            <Button variant="ghost" onClick={() => onAction("cancel")}>Cancel booking</Button>
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
      .filter((b) => !q
        || b.client_name.toLowerCase().includes(q)
        || (b.client_email ?? "").toLowerCase().includes(q)
        || (digits.length >= 3 && b.client_phone.replace(/\D/g, "").includes(digits)))
      .sort((a, b) => tab === "upcoming" ? startOf(a) - startOf(b) : startOf(b) - startOf(a));
    const byDay = new Map<string, Booking[]>();
    for (const b of list) byDay.set(b.booking_date, [...(byDay.get(b.booking_date) ?? []), b]);
    return [...byDay.entries()];
  }, [bookings, query, tab]);

  const selected = bookings.find((b) => b.id === selectedId) ?? null;
  const upcomingCount = tab === "upcoming" ? bookings.filter((b) => b.status === "confirmed").length : null;

  const closeModal = () => { setConfirmModal(null); setCancelReason(""); setRefundRef(""); setActionError(""); };

  const handleAction = async (id: string, action: BookingAction) => {
    setBusy(true);
    setActionError("");
    const body = action === "cancel" ? { reason: cancelReason } : action === "refund" ? { reference: refundRef } : {};
    try {
      const res = await fetch(`/api/bookings/${id}/${action}`, {
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
          subtitle={upcomingCount && !loading ? `${upcomingCount} coming up` : undefined}
          actions={<SearchInput value={query} onChange={setQuery} placeholder="Search" className="w-full sm:w-[260px]" />}
        />

        <Segmented options={TABS} value={tab} onChange={(t) => { setTab(t); setSelectedId(null); }} />

        <div className="mt-2 fade-up">
          {loading ? (
            <div className="mt-8"><SkeletonRows rows={6} /></div>
          ) : loadError ? (
            <Empty title="Bookings didn't load"><ErrorNote>{loadError}</ErrorNote></Empty>
          ) : groups.length === 0 ? (
            <Empty title={query ? "No matches" : tab === "attention" ? "Nothing needs attention" : "No bookings yet"} />
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
                        const img = serviceFor(services, b)?.image_url;
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
                                  <span className="block font-sans text-[12px] text-muted truncate">{b.service_name}</span>
                                </span>
                              </span>

                              <span className={`hidden md:block font-sans text-[14px] truncate ${s.faded ? "text-muted" : "text-graphite"} ${compact ? "lg:hidden" : ""}`}>
                                {b.stylist_name ?? "Any"}
                              </span>

                              <span className={s.tone === "outline" || s.label === "Done" ? "hidden md:block" : ""}>
                                <Pill tone={s.tone}>{s.label}</Pill>
                              </span>

                              <span className={`hidden md:block font-sans text-[14px] text-right tabular-nums ${tone} ${compact ? "lg:hidden" : ""}`}>
                                {b.amount > 0 ? cedis(b.amount) : ""}
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
              onAction={(action) => setConfirmModal({ id: selected.id, action })}
              onPhoto={setLightboxUrl}
            />
          </div>
        </aside>
      )}

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
