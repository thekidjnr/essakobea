"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatBookingDate } from "@/lib/booking-time";
import { cancellationPolicyText } from "@/lib/refunds";

interface BookingPreview {
  id: string; client_name: string; service_name: string; treatment: string;
  booking_date: string; time_slot: string; status: string;
  paid: boolean; paidPesewas: number; refundShare: number; refundPesewas: number;
}

type Status = "loading" | "ready" | "submitting" | "cancelled" | "already_cancelled" | "completed" | "error";

const ghs = (pesewas: number) => `₵${(pesewas / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;

export default function CancelPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken]   = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingPreview | null>(null);
  const [reason, setReason]   = useState("");
  const [status, setStatus]   = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      fetch(`/api/cancel/${t}`)
        .then(r => r.json())
        .then(d => {
          if (d.error) { setErrorMsg(d.error); setStatus("error"); return; }
          setBooking(d);
          setStatus(d.status === "cancelled" ? "already_cancelled" : d.status === "completed" ? "completed" : "ready");
        })
        .catch(() => {
          setErrorMsg("We couldn't load your booking. Please check your connection and refresh the page.");
          setStatus("error");
        });
    });
  }, [params]);

  const handleCancel = async () => {
    if (!token || status === "submitting") return;
    setStatus("submitting");
    setSubmitError("");
    try {
      const res = await fetch(`/api/cancel/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.error === "Already cancelled") { setStatus("already_cancelled"); return; }
      if (!res.ok || data.error) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        setStatus("ready");
        return;
      }
      setStatus("cancelled");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
      setStatus("ready");
    }
  };

  if (status === "loading") return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <p className="font-sans text-[12px] text-ink/40">Loading…</p>
    </div>
  );

  if (status === "error" || status === "completed") return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-serif text-[2rem] font-light text-ink mb-4">
          {status === "completed" ? "Already completed." : "Something went wrong."}
        </p>
        <p className="font-sans text-[13px] text-ink/50 mb-8">
          {status === "completed"
            ? "This appointment has already taken place, so it can't be cancelled."
            : errorMsg}
        </p>
        <Link href="/book" className="font-sans text-[11px] tracking-widest uppercase text-ink border-b border-ink pb-px hover:opacity-60 transition-opacity">
          Book New Appointment
        </Link>
      </div>
    </div>
  );

  if (status === "cancelled" || status === "already_cancelled") return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-24">
      <div className="max-w-[480px] w-full text-center">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-6">Appointment Cancelled</p>
        <h1 className="font-serif text-[clamp(2rem,5vw,4rem)] font-light text-ink leading-none mb-6">
          Cancelled<span className="italic">.</span>
        </h1>
        <p className="font-sans text-[13px] text-ink/50 font-light leading-relaxed mb-10 max-w-xs mx-auto">
          {status === "already_cancelled"
            ? "This appointment has already been cancelled."
            : "Your appointment has been cancelled. We've sent a confirmation to your email."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/book" className="inline-block bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink/80 transition-colors">
            Book Again
          </Link>
          <Link href="/" className="inline-block border border-ink text-ink font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink hover:text-paper transition-all">
            Home
          </Link>
        </div>
      </div>
    </div>
  );

  const refundLine = !booking?.paid
    ? "This booking hasn't been paid, so there's nothing to refund."
    : booking.refundShare >= 1
      ? `You'll get a full refund of ${ghs(booking.refundPesewas)}.`
      : booking.refundShare > 0
        ? `Your appointment is less than 24 hours away, so you'll get 50% back: ${ghs(booking.refundPesewas)} of ${ghs(booking.paidPesewas)}.`
        : "Your appointment time has passed, so this cancellation isn't refunded.";

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-24">
      <div className="max-w-[480px] w-full">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-2">Cancel Appointment</p>
        <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-8">
          Are you <span className="italic">sure?</span>
        </h1>

        {/* Booking summary */}
        <div className="bg-mist p-6 mb-8">
          {[
            ["Service",   booking?.service_name ?? ""],
            ["Treatment", booking?.treatment ?? ""],
            ["Date",      booking ? formatBookingDate(booking.booking_date) : ""],
            ["Time",      booking?.time_slot ?? ""],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2.5 border-b border-ink/[0.07] last:border-0">
              <span className="font-sans text-[10px] tracking-widest uppercase text-ink/35">{label}</span>
              <span className="font-sans text-[12px] text-ink">{value}</span>
            </div>
          ))}
        </div>

        <div className="border border-ink/10 px-4 py-3 mb-8">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-1">Refund</p>
          <p className="font-sans text-[13px] text-ink leading-relaxed">{refundLine}</p>
        </div>

        <div className="mb-6">
          <label htmlFor="cancel-reason" className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
            Reason for cancellation (optional)
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Let us know why you're cancelling…"
            rows={3}
            className="w-full border border-ink/15 px-4 py-3 font-sans text-[13px] text-ink placeholder:text-ink/25 font-light focus:outline-none focus:border-ink transition-colors resize-none bg-transparent"
          />
        </div>

        <p className="font-sans text-[11px] text-ink/40 leading-relaxed mb-6">
          {cancellationPolicyText()}
        </p>

        {submitError && (
          <p className="font-sans text-[12px] text-red-500 mb-4" role="alert">{submitError}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={status === "submitting"}
            className="flex-1 bg-red-500 text-white font-sans text-[11px] tracking-widest uppercase py-4 hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {status === "submitting" ? "Cancelling…" : "Yes, Cancel Appointment"}
          </button>
          <Link
            href="/"
            className="flex-1 border border-ink/20 text-ink/60 font-sans text-[11px] tracking-widest uppercase py-4 text-center hover:border-ink hover:text-ink transition-colors"
          >
            Keep It
          </Link>
        </div>
      </div>
    </div>
  );
}
