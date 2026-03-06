"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface BookingData {
  client_name: string; service_name: string; treatment: string;
  booking_date: string; time_slot: string; status: string;
}

function BookingSuccess() {
  const searchParams = useSearchParams();
  const reference  = searchParams.get("reference");
  const bookingId  = searchParams.get("trxref") ?? reference; // Paystack uses trxref

  const [data, setData]     = useState<{ booking: BookingData } | null>(null);
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
        else setData(d);
        setLoading(false);
      });
  }, [reference]);

  if (loading) return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <p className="font-sans text-[12px] text-ink/40">Confirming your booking…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-sans text-[12px] text-red-500 mb-6">{error}</p>
        <Link href="/book" className="font-sans text-[11px] tracking-widest uppercase text-ink underline">
          Try again
        </Link>
      </div>
    </div>
  );

  const booking = data?.booking;
  const clientName = booking?.client_name ?? "there";

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-24">
      <div className="max-w-[560px] w-full text-center">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-6">
          Booking Confirmed
        </p>
        <h1 className="font-serif text-[clamp(2.5rem,6vw,5rem)] font-light text-ink leading-none mb-6">
          You&apos;re all set,<br /><span className="italic">{clientName}.</span>
        </h1>
        <p className="font-sans text-[13px] text-ink/50 font-light leading-relaxed mb-12 max-w-sm mx-auto">
          Deposit received. Your appointment is confirmed — we&apos;ll message you on WhatsApp ahead of your visit.
        </p>

        {booking && (
          <div className="bg-mist p-8 text-left mb-10">
            {[
              ["Service",  booking.service_name],
              ["Treatment",booking.treatment],
              ["Date", new Date(booking.booking_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })],
              ["Time",     booking.time_slot],
              ["Location", "East Legon, Accra"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between py-3 border-b border-ink/[0.07] last:border-0">
                <span className="font-sans text-[10px] tracking-widest uppercase text-ink/35">{label}</span>
                <span className="font-sans text-[13px] text-ink font-light text-right">{value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="inline-block bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink/80 transition-colors">
            Back to Home
          </Link>
          <a href="https://wa.me/233557205803" target="_blank" rel="noopener noreferrer"
            className="inline-block border border-ink text-ink font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink hover:text-paper transition-all">
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  );
}

export default function BookSuccessPage() {
  return <Suspense><BookingSuccess /></Suspense>;
}
