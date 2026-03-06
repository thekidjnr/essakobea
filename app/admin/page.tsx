"use client";

import { useEffect, useState } from "react";

interface Stats {
  todayBookings:   number;
  pendingBookings: number;
  pendingOrders:   number;
  monthRevenueGHS: number;
}

interface Booking {
  id: string; client_name: string; service_name: string; treatment: string;
  booking_date: string; time_slot: string; status: string; payment_status: string;
}

interface Order {
  id: string; client_name: string; items: { name: string; quantity: number }[];
  total: number; status: string; payment_status: string; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-800",
  confirmed:  "bg-emerald-100 text-emerald-800",
  completed:  "bg-blue-100 text-blue-800",
  cancelled:  "bg-red-100 text-red-800",
  processing: "bg-violet-100 text-violet-800",
  shipped:    "bg-sky-100 text-sky-800",
  delivered:  "bg-emerald-100 text-emerald-800",
};

function Badge({ label }: { label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wide uppercase font-medium ${STATUS_COLORS[label] ?? "bg-ink/10 text-ink/60"}`}>
      {label}
    </span>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then(r => r.json()),
      fetch("/api/admin/bookings?status=all").then(r => r.json()),
      fetch("/api/admin/orders?status=all").then(r => r.json()),
    ]).then(([s, b, o]) => {
      setStats(s);
      setBookings(Array.isArray(b) ? b.slice(0, 5) : []);
      setOrders(Array.isArray(o) ? o.slice(0, 5) : []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="p-10 font-sans text-[12px] text-ink/40">Loading…</div>
  );

  const STAT_CARDS = [
    { label: "Today's Bookings",  value: stats?.todayBookings ?? 0,                 sub: "appointments today" },
    { label: "Revenue (Month)",   value: `₵${(stats?.monthRevenueGHS ?? 0).toLocaleString()}`, sub: "paid this month" },
    { label: "Pending Bookings",  value: stats?.pendingBookings ?? 0,                sub: "awaiting confirmation" },
    { label: "Pending Orders",    value: stats?.pendingOrders ?? 0,                  sub: "awaiting processing" },
  ];

  return (
    <div className="p-8 md:p-10 max-w-[1200px]">
      {/* Header */}
      <div className="mb-10">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="font-serif text-[2.5rem] font-light text-ink leading-none">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}<span className="italic">.</span>
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="bg-paper p-6 border border-ink/[0.07]">
            <p className="font-sans text-[10px] tracking-widest uppercase text-ink/35 mb-3">{s.label}</p>
            <p className="font-serif text-[2rem] font-light text-ink leading-none mb-1">{s.value}</p>
            <p className="font-sans text-[11px] text-ink/35">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column: recent bookings + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-paper border border-ink/[0.07]">
          <div className="px-6 py-5 border-b border-ink/[0.07] flex items-center justify-between">
            <p className="font-sans text-[11px] tracking-widest uppercase text-ink font-medium">Recent Bookings</p>
            <a href="/admin/bookings" className="font-sans text-[10px] tracking-widest uppercase text-ink/40 hover:text-ink transition-colors">View all →</a>
          </div>
          <div className="divide-y divide-ink/[0.05]">
            {bookings.length === 0 && <p className="px-6 py-8 font-sans text-[12px] text-ink/35">No bookings yet.</p>}
            {bookings.map((b) => (
              <div key={b.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-sans text-[13px] text-ink font-medium">{b.client_name}</p>
                  <p className="font-sans text-[11px] text-ink/45 mt-0.5">{b.treatment}</p>
                  <p className="font-sans text-[10px] text-ink/30 mt-1">
                    {new Date(b.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {b.time_slot}
                  </p>
                </div>
                <Badge label={b.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-paper border border-ink/[0.07]">
          <div className="px-6 py-5 border-b border-ink/[0.07] flex items-center justify-between">
            <p className="font-sans text-[11px] tracking-widest uppercase text-ink font-medium">Recent Orders</p>
            <a href="/admin/orders" className="font-sans text-[10px] tracking-widest uppercase text-ink/40 hover:text-ink transition-colors">View all →</a>
          </div>
          <div className="divide-y divide-ink/[0.05]">
            {orders.length === 0 && <p className="px-6 py-8 font-sans text-[12px] text-ink/35">No orders yet.</p>}
            {orders.map((o) => (
              <div key={o.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-sans text-[13px] text-ink font-medium">{o.client_name}</p>
                  <p className="font-sans text-[11px] text-ink/45 mt-0.5">
                    {o.items.map(i => `${i.name} ×${i.quantity}`).join(", ")}
                  </p>
                  <p className="font-sans text-[10px] text-ink/30 mt-1">₵{(o.total / 100).toLocaleString()}</p>
                </div>
                <Badge label={o.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
