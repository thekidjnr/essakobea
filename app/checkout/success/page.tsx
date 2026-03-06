"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Order } from "@/lib/supabase/types";

function OrderSuccess() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [order, setOrder]     = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!reference) { setLoading(false); return; }
    fetch("/api/paystack/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setOrder(d.order);
        setLoading(false);
      });
  }, [reference]);

  if (loading) return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <p className="font-sans text-[12px] text-ink/40">Confirming your order…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <p className="font-sans text-[12px] text-red-500 text-center">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-24">
      <div className="max-w-[520px] w-full text-center">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-6">
          Order Confirmed
        </p>
        <h1 className="font-serif text-[clamp(2.5rem,6vw,5rem)] font-light text-ink leading-none mb-6">
          Thank you,<br /><span className="italic">{order?.client_name ?? ""}.</span>
        </h1>
        <p className="font-sans text-[13px] text-ink/50 font-light leading-relaxed mb-12 max-w-sm mx-auto">
          Payment received. We&apos;ll reach out via WhatsApp to arrange{" "}
          {order?.delivery_method === "delivery" ? "delivery" : "your pickup"}.
          Check your email for confirmation.
        </p>

        {order && (
          <div className="bg-mist p-8 text-left mb-10">
            <div className="flex justify-between py-3 border-b border-ink/[0.07]">
              <span className="font-sans text-[10px] tracking-widest uppercase text-ink/35">Ref</span>
              <span className="font-sans text-[12px] text-ink font-mono">{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between py-3 border-b border-ink/[0.07]">
                <span className="font-sans text-[12px] text-ink">{item.name} ×{item.quantity}</span>
                <span className="font-sans text-[12px] text-ink">₵{(item.price / 100 * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between py-3">
              <span className="font-sans text-[11px] tracking-widest uppercase text-ink/35">Total Paid</span>
              <span className="font-serif text-[1.3rem] font-light text-ink">₵{(order.total / 100).toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="inline-block bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink/80 transition-colors">
            Back to Home
          </Link>
          <Link href="/shop" className="inline-block border border-ink text-ink font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink hover:text-paper transition-all">
            Shop More
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return <Suspense><OrderSuccess /></Suspense>;
}
