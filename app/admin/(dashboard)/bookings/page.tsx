"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { whatsAppLink } from "@/lib/phone";
import type { DbService } from "@/lib/supabase/types";

interface Booking {
  id: string; client_name: string; client_email: string; client_phone: string;
  service_id: string; service_name: string; treatment: string; booking_date: string; time_slot: string;
  notes: string | null; status: string; payment_status: string; amount: number; created_at: string;
  customization_type: string | null; is_emergency: boolean;
  customization_fee: number; emergency_fee: number; service_charge: number;
  stylist_name: string | null;
  hair_unit_type: "own_new" | "own_existing" | "none" | null;
  unit_photos: string[];
}

const HAIR_UNIT_LABELS: Record<string, string> = {
  own_new: "New unit",
  own_existing: "Existing unit",
};

function UnitPhotos({ b, onOpen }: { b: Booking; onOpen: (url: string) => void }) {
  if (!b.hair_unit_type || b.hair_unit_type === "none") return null;
  return (
    <div className="mt-1.5">
      <p className="font-sans text-[9px] tracking-wide uppercase text-ink/40">
        {HAIR_UNIT_LABELS[b.hair_unit_type] ?? b.hair_unit_type}
      </p>
      {b.unit_photos.length > 0 && (
        <div className="flex gap-1.5 mt-1">
          {b.unit_photos.map((url, i) => (
            <button key={url} type="button" onClick={() => onOpen(url)} title="View photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Unit photo ${i + 1}`} className="w-9 h-9 object-cover rounded-sm border border-ink/10 hover:border-ink/40 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ADDRESS   = "East Legon, Accra";
const MAPS_LINK = "https://maps.app.goo.gl/KumRn6Wt6VA3cx8w8?g_st=ic";

// A price is a "range" (e.g. "₵250 – ₵450") when it's a deposit — the rest
// is settled once the stylist can see how the style actually turns out.
function isDepositFor(b: Booking, services: DbService[]): boolean {
  const svc = services.find((s) => s.slug === b.service_id);
  const opt = svc?.booking_options.find((o) => o.name === b.treatment);
  return !!(opt?.price && /[-–]/.test(opt.price));
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

  const policyLine = `*Good to know:* Free cancellation up to 24h before. Cancelling a few hours before forfeits 50% of your ${isDeposit ? "deposit" : "payment"}; no-shows aren't refunded.`;

  const message = `Hi ${firstName}, this is Essakobea confirming your appointment:\n\n*${b.service_name}* (${b.treatment})${stylistLine}\n${date} at ${b.time_slot}\n\n${paymentLine}\n\n*Location:* ${ADDRESS}\n${MAPS_LINK}\n\n${policyLine}\n\nSee you then!`;

  return whatsAppLink(b.client_phone, message);
}

// ─── Action icons (desktop) ─────────────────────────────────────────────────

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm5.72 14.13c-.24.68-1.19 1.25-1.95 1.4-.53.11-1.22.2-3.55-.76-2.98-1.23-4.9-4.24-5.05-4.44-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.29.58-.36.78-.36.19 0 .39.002.56.01.18.008.42-.07.66.5.24.58.83 2 .9 2.15.07.15.11.32.02.51-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.19-.27.37-.22.63-.13.26.09 1.63.77 1.91.91.28.14.47.21.54.33.07.12.07.7-.17 1.38z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className}>
      <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className}>
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 3h12M4.5 8h7M7 13h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ActionIcon({
  href, onClick, title, colorClass, children,
}: {
  href?: string;
  onClick?: () => void;
  title: string;
  colorClass: string;
  children: React.ReactNode;
}) {
  const className = `w-8 h-8 flex-shrink-0 flex items-center justify-center border rounded-sm transition-colors ${colorClass}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} title={title} className={className}>
      {children}
    </button>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid:   "bg-ink/10 text-ink/50",
  paid:     "bg-emerald-100 text-emerald-800",
  refunded: "bg-orange-100 text-orange-700",
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<DbService[]>([]);
  const [filter, setFilter]     = useState("all");
  const [dateFilter, setDateFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: "cancel" | "confirm" | "complete" } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/bookings?status=${filter}&when=${dateFilter}`)
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data : []); setLoading(false); });
  }, [filter, dateFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    fetch("/api/admin/services").then(r => r.json()).then(d => { if (Array.isArray(d)) setServices(d); });
  }, []);

  const handleAction = async (id: string, action: "cancel" | "confirm" | "complete") => {
    setActionId(id);
    const url = `/api/bookings/${id}/${action}`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "cancel" ? { reason: cancelReason } : {}),
    });
    setConfirmModal(null);
    setCancelReason("");
    setActionId(null);
    load();
  };

  const FILTERS = ["all", "confirmed", "completed", "cancelled"];
  const DATE_FILTERS: { value: "upcoming" | "past" | "all"; label: string }[] = [
    { value: "upcoming", label: "Upcoming" },
    { value: "past", label: "Past" },
    { value: "all", label: "All Dates" },
  ];

  return (
    <div className="p-8 md:p-10 max-w-[1200px]">
      <div className="mb-8 fade-up">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">Admin</p>
        <h1 className="font-serif text-[2.5rem] font-light text-ink leading-none">
          Bookings<span className="italic">.</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex items-start justify-between gap-3 mb-8">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`font-sans text-[10px] tracking-widest uppercase px-4 py-2 border transition-all ${
                filter === f ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/50 hover:border-ink/50 hover:text-ink"
              }`}>
              {f}
            </button>
          ))}
        </div>

        <div className="relative flex-shrink-0" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(o => !o)}
            title="Filter by date"
            className={`relative w-8 h-8 flex items-center justify-center border rounded-sm transition-colors ${
              filterOpen ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/50 hover:border-ink/50 hover:text-ink"
            }`}>
            <IconFilter />
            {dateFilter !== "upcoming" && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-ink" />
            )}
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-10 z-10 bg-paper border border-ink/[0.08] shadow-sm min-w-[140px] py-1.5">
              {DATE_FILTERS.map(d => (
                <button
                  key={d.value}
                  onClick={() => { setDateFilter(d.value); setFilterOpen(false); }}
                  className={`w-full text-left px-4 py-2 font-sans text-[11px] tracking-wide uppercase transition-colors ${
                    dateFilter === d.value ? "text-ink font-medium" : "text-ink/50 hover:text-ink"
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="font-sans text-[12px] text-ink/40">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="font-sans text-[13px] text-ink/55 py-12 text-center">No bookings found.</p>
      ) : (
        <>
        <div className="hidden md:block bg-paper border border-ink/[0.07] overflow-x-auto fade-up">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink/[0.07]">
                {["Client", "Service & Treatment", "Date & Time", "Status", "Payment", "Actions"].map(h => (
                  <th key={h} className="px-5 py-4 text-left font-sans text-[10px] tracking-widest uppercase text-ink/35">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.05]">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-mist/40 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-sans text-[13px] text-ink font-medium">{b.client_name}</p>
                    <p className="font-sans text-[11px] text-ink/40">{b.client_phone}</p>
                    {b.client_email && <p className="font-sans text-[11px] text-ink/50">{b.client_email}</p>}
                    {b.notes && <p className="font-sans text-[11px] text-ink/50 mt-1 italic">"{b.notes}"</p>}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-sans text-[12px] text-ink">{b.service_name}</p>
                    <p className="font-sans text-[11px] text-ink/45">{b.treatment}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {b.is_emergency && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm font-sans text-[9px] tracking-wide uppercase font-medium bg-amber-100 text-amber-800">
                          <svg width="9" height="9" viewBox="0 0 22 22" fill="none">
                            <path d="M12 2L4 13h6l-1 7 9-12h-6l1-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                          Emergency
                        </span>
                      )}
                      {b.customization_type && (
                        <span className="inline-block px-1.5 py-0.5 rounded-sm font-sans text-[9px] tracking-wide uppercase font-medium bg-ink/[0.07] text-ink/60">
                          {b.customization_type} customization
                        </span>
                      )}
                    </div>
                    <UnitPhotos b={b} onOpen={setLightboxUrl} />
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-sans text-[12px] text-ink">
                      {new Date(b.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="font-sans text-[11px] text-ink/45">{b.time_slot}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wide uppercase font-medium ${STATUS_COLORS[b.status] ?? ""}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wide uppercase font-medium ${PAYMENT_COLORS[b.payment_status] ?? ""}`}>
                      {b.payment_status}
                    </span>
                    {b.amount > 0 && (
                      <p className="font-sans text-[11px] text-ink/50 mt-1">₵{(b.amount / 100).toLocaleString()}</p>
                    )}
                    {(b.customization_fee > 0 || b.emergency_fee > 0) && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        {b.customization_fee > 0 && <p className="font-sans text-[10px] text-ink/45">+₵{b.customization_fee / 100} customization</p>}
                        {b.emergency_fee > 0 && <p className="font-sans text-[10px] text-ink/45">+₵{b.emergency_fee / 100} emergency</p>}
                        {b.service_charge > 0 && <p className="font-sans text-[10px] text-ink/45">+₵{b.service_charge / 100} service charge</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {b.payment_status === "paid" && (
                        <ActionIcon href={whatsAppUrlFor(b, services)} title="Message WhatsApp" colorClass="border-green-200 text-green-700 hover:bg-green-50">
                          <IconWhatsApp />
                        </ActionIcon>
                      )}
                      {b.status === "pending" && (
                        <ActionIcon onClick={() => setConfirmModal({ id: b.id, action: "confirm" })} title="Confirm" colorClass="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                          <IconCheck />
                        </ActionIcon>
                      )}
                      {b.status === "confirmed" && (
                        <ActionIcon onClick={() => setConfirmModal({ id: b.id, action: "complete" })} title="Complete" colorClass="border-blue-200 text-blue-700 hover:bg-blue-50">
                          <IconCheck />
                        </ActionIcon>
                      )}
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <ActionIcon onClick={() => setConfirmModal({ id: b.id, action: "cancel" })} title="Cancel" colorClass="border-red-200 text-red-500 hover:bg-red-50">
                          <IconX />
                        </ActionIcon>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden flex flex-col gap-3 fade-up">
          {bookings.map(b => (
            <div key={b.id} className="bg-paper border border-ink/[0.07] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-[13px] text-ink font-medium">{b.client_name}</p>
                  <p className="font-sans text-[11px] text-ink/40">{b.client_phone}</p>
                  {b.client_email && <p className="font-sans text-[11px] text-ink/50">{b.client_email}</p>}
                  {b.notes && <p className="font-sans text-[11px] text-ink/50 mt-1 italic">"{b.notes}"</p>}
                </div>
                <span className={`inline-block flex-shrink-0 px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wide uppercase font-medium ${STATUS_COLORS[b.status] ?? ""}`}>
                  {b.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {b.is_emergency && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm font-sans text-[9px] tracking-wide uppercase font-medium bg-amber-100 text-amber-800">
                    <svg width="9" height="9" viewBox="0 0 22 22" fill="none">
                      <path d="M12 2L4 13h6l-1 7 9-12h-6l1-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    Emergency
                  </span>
                )}
                {b.customization_type && (
                  <span className="inline-block px-1.5 py-0.5 rounded-sm font-sans text-[9px] tracking-wide uppercase font-medium bg-ink/[0.07] text-ink/60">
                    {b.customization_type} customization
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 py-3 mt-2 border-t border-ink/[0.05]">
                <div>
                  <p className="font-sans text-[12px] text-ink">{b.service_name}</p>
                  <p className="font-sans text-[11px] text-ink/45">{b.treatment}</p>
                  <UnitPhotos b={b} onOpen={setLightboxUrl} />
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-sans text-[12px] text-ink">
                    {new Date(b.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="font-sans text-[11px] text-ink/45">{b.time_slot}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 py-3 border-t border-ink/[0.05]">
                <span className={`inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wide uppercase font-medium ${PAYMENT_COLORS[b.payment_status] ?? ""}`}>
                  {b.payment_status}
                </span>
                <div className="text-right">
                  {b.amount > 0 && (
                    <p className="font-sans text-[11px] text-ink/50">₵{(b.amount / 100).toLocaleString()}</p>
                  )}
                  {(b.customization_fee > 0 || b.emergency_fee > 0) && (
                    <div className="flex flex-col gap-0.5">
                      {b.customization_fee > 0 && <p className="font-sans text-[10px] text-ink/45">+₵{b.customization_fee / 100} customization</p>}
                      {b.emergency_fee > 0 && <p className="font-sans text-[10px] text-ink/45">+₵{b.emergency_fee / 100} emergency</p>}
                      {b.service_charge > 0 && <p className="font-sans text-[10px] text-ink/45">+₵{b.service_charge / 100} service charge</p>}
                    </div>
                  )}
                </div>
              </div>

              {b.payment_status === "paid" && (
                <a href={whatsAppUrlFor(b, services)} target="_blank" rel="noopener noreferrer"
                  className="block text-center font-sans text-[10px] tracking-widest uppercase text-green-700 border border-green-200 py-2.5 mt-3">
                  Message WhatsApp
                </a>
              )}

              {(b.status === "pending" || b.status === "confirmed") && (
                <div className="flex gap-2 pt-3 border-t border-ink/[0.05]">
                  {b.status === "pending" && (
                    <button onClick={() => setConfirmModal({ id: b.id, action: "confirm" })}
                      className="flex-1 font-sans text-[10px] tracking-widest uppercase text-emerald-700 border border-emerald-200 py-2.5">
                      Confirm
                    </button>
                  )}
                  {b.status === "confirmed" && (
                    <button onClick={() => setConfirmModal({ id: b.id, action: "complete" })}
                      className="flex-1 font-sans text-[10px] tracking-widest uppercase text-blue-700 border border-blue-200 py-2.5">
                      Complete
                    </button>
                  )}
                  <button onClick={() => setConfirmModal({ id: b.id, action: "cancel" })}
                    className="flex-1 font-sans text-[10px] tracking-widest uppercase text-red-500 border border-red-200 py-2.5">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      )}

      {/* Action modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-6">
          <div className="bg-paper p-8 max-w-sm w-full">
            <h3 className="font-serif text-[1.5rem] font-light text-ink mb-2">
              {confirmModal.action === "cancel" ? "Cancel booking?" :
               confirmModal.action === "confirm" ? "Confirm booking?" : "Mark as complete?"}
            </h3>
            {confirmModal.action === "cancel" && (
              <div className="mt-4">
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
                  Reason (optional)
                </label>
                <input
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. No availability on requested date"
                  className="w-full border border-ink/15 px-4 py-3 font-sans text-[13px] text-ink bg-transparent focus:outline-none focus:border-ink mb-4"
                />
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleAction(confirmModal.id, confirmModal.action)}
                disabled={actionId === confirmModal.id}
                className="flex-1 bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-3 hover:bg-ink/80 transition-colors disabled:opacity-50">
                {actionId === confirmModal.id ? "…" : "Confirm"}
              </button>
              <button onClick={() => { setConfirmModal(null); setCancelReason(""); }}
                className="flex-1 border border-ink/20 text-ink/60 font-sans text-[11px] tracking-widest uppercase py-3 hover:border-ink hover:text-ink transition-colors">
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 bg-ink/80 flex items-center justify-center z-50 px-6 cursor-zoom-out"
        >
          <button
            onClick={() => setLightboxUrl(null)}
            title="Close"
            className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center border border-paper/30 text-paper rounded-sm hover:border-paper transition-colors"
          >
            <IconX className="text-paper" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Unit photo"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain cursor-default"
          />
        </div>
      )}
    </div>
  );
}
