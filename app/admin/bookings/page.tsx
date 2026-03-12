"use client";

import { useEffect, useState, useCallback } from "react";

interface Booking {
  id: string; client_name: string; client_email: string; client_phone: string;
  service_name: string; treatment: string; booking_date: string; time_slot: string;
  notes: string | null; status: string; payment_status: string; amount: number; created_at: string;
  customization_type: string | null; is_emergency: boolean;
  customization_fee: number; emergency_fee: number; service_charge: number;
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
  const [filter, setFilter]     = useState("all");
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: "cancel" | "confirm" | "complete" } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/bookings?status=${filter}`)
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data : []); setLoading(false); });
  }, [filter]);

  useEffect(() => { load(); }, [load]);

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

  const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];

  return (
    <div className="p-8 md:p-10 max-w-[1200px]">
      <div className="mb-8">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">Admin</p>
        <h1 className="font-serif text-[2.5rem] font-light text-ink leading-none">
          Bookings<span className="italic">.</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`font-sans text-[10px] tracking-widest uppercase px-4 py-2 border transition-all ${
              filter === f ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/50 hover:border-ink/50 hover:text-ink"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p className="font-sans text-[12px] text-ink/40">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="font-sans text-[13px] text-ink/40 py-12 text-center">No bookings found.</p>
      ) : (
        <div className="bg-paper border border-ink/[0.07] overflow-x-auto">
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
                    {b.client_email && <p className="font-sans text-[10px] text-ink/30">{b.client_email}</p>}
                    {b.notes && <p className="font-sans text-[10px] text-ink/30 mt-1 italic">"{b.notes}"</p>}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-sans text-[12px] text-ink">{b.service_name}</p>
                    <p className="font-sans text-[11px] text-ink/45">{b.treatment}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {b.is_emergency && (
                        <span className="inline-block px-1.5 py-0.5 rounded-sm font-sans text-[9px] tracking-wide uppercase font-medium bg-amber-100 text-amber-800">
                          ⚡ Emergency
                        </span>
                      )}
                      {b.customization_type && (
                        <span className="inline-block px-1.5 py-0.5 rounded-sm font-sans text-[9px] tracking-wide uppercase font-medium bg-ink/[0.07] text-ink/60">
                          {b.customization_type} customization
                        </span>
                      )}
                    </div>
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
                      <p className="font-sans text-[10px] text-ink/35 mt-1">₵{(b.amount / 100).toLocaleString()}</p>
                    )}
                    {(b.customization_fee > 0 || b.emergency_fee > 0) && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        {b.customization_fee > 0 && <p className="font-sans text-[9px] text-ink/30">+₵{b.customization_fee / 100} customization</p>}
                        {b.emergency_fee > 0 && <p className="font-sans text-[9px] text-ink/30">+₵{b.emergency_fee / 100} emergency</p>}
                        {b.service_charge > 0 && <p className="font-sans text-[9px] text-ink/30">+₵{b.service_charge / 100} service charge</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      {b.status === "pending" && (
                        <button onClick={() => setConfirmModal({ id: b.id, action: "confirm" })}
                          className="font-sans text-[10px] tracking-widest uppercase text-emerald-700 hover:text-emerald-900 transition-colors">
                          Confirm
                        </button>
                      )}
                      {b.status === "confirmed" && (
                        <button onClick={() => setConfirmModal({ id: b.id, action: "complete" })}
                          className="font-sans text-[10px] tracking-widest uppercase text-blue-700 hover:text-blue-900 transition-colors">
                          Complete
                        </button>
                      )}
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <button onClick={() => setConfirmModal({ id: b.id, action: "cancel" })}
                          className="font-sans text-[10px] tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}
