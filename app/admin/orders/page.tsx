"use client";

import { useEffect, useState, useCallback } from "react";

interface Order {
  id: string; client_name: string; client_email: string; client_phone: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number; total: number; status: string; payment_status: string;
  delivery_method: string; delivery_address: string | null; created_at: string;
}

const STATUS_OPTIONS = ["pending","processing","shipped","delivered","cancelled"];
const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-800",
  processing: "bg-violet-100 text-violet-800",
  shipped:    "bg-sky-100 text-sky-800",
  delivered:  "bg-emerald-100 text-emerald-800",
  cancelled:  "bg-red-100 text-red-800",
};

export default function AdminOrders() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [filter, setFilter]   = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/orders?status=${filter}`)
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); });
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div className="p-8 md:p-10 max-w-[1200px]">
      <div className="mb-8">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">Admin</p>
        <h1 className="font-serif text-[2.5rem] font-light text-ink leading-none">
          Orders<span className="italic">.</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {["all", ...STATUS_OPTIONS].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`font-sans text-[10px] tracking-widest uppercase px-4 py-2 border transition-all ${
              filter === f ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/50 hover:border-ink/50 hover:text-ink"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-sans text-[12px] text-ink/40">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="font-sans text-[13px] text-ink/40 py-12 text-center">No orders found.</p>
      ) : (
        <div className="bg-paper border border-ink/[0.07] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink/[0.07]">
                {["Ref", "Client", "Items", "Total", "Delivery", "Status", "Update Status"].map(h => (
                  <th key={h} className="px-5 py-4 text-left font-sans text-[10px] tracking-widest uppercase text-ink/35">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.05]">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-mist/40 transition-colors">
                  <td className="px-5 py-4 font-sans text-[11px] text-ink/40 font-mono">
                    {o.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-sans text-[13px] text-ink font-medium">{o.client_name}</p>
                    <p className="font-sans text-[11px] text-ink/40">{o.client_phone}</p>
                    <p className="font-sans text-[10px] text-ink/30">{o.client_email}</p>
                  </td>
                  <td className="px-5 py-4 max-w-[200px]">
                    <div className="flex flex-col gap-1">
                      {o.items.map((item, i) => (
                        <p key={i} className="font-sans text-[11px] text-ink/70">
                          {item.name} <span className="text-ink/35">×{item.quantity}</span>
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-sans text-[13px] text-ink">₵{(o.total / 100).toLocaleString()}</p>
                    <p className={`font-sans text-[10px] mt-0.5 ${o.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {o.payment_status}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-sans text-[11px] text-ink capitalize">{o.delivery_method}</p>
                    {o.delivery_address && <p className="font-sans text-[10px] text-ink/35 mt-0.5">{o.delivery_address}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wide uppercase font-medium ${STATUS_COLORS[o.status] ?? ""}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className="font-sans text-[11px] text-ink border border-ink/20 px-2 py-1.5 bg-paper focus:outline-none focus:border-ink"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
