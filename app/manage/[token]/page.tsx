"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MiniCalendar from "@/components/booking/MiniCalendar";
import { formatBookingDate, slotToMinutes } from "@/lib/booking-time";
import { cancellationPolicyText } from "@/lib/refunds";
import { reschedulePolicyText } from "@/lib/reschedule-rules";

// The link in every confirmation email. The client can see their booking,
// move it once (rules in lib/reschedule) or cancel it.

interface BookingPreview {
  id: string; client_name: string; service_name: string; treatment: string; stylist_name: string | null;
  booking_date: string; time_slot: string; status: string;
  paid: boolean; paidPesewas: number; refundShare: number; refundPesewas: number;
  rescheduleBlock: string | null;
}

type View = "overview" | "reschedule" | "cancel" | "rescheduled" | "cancelled";
type DayState =
  | { status: "idle" } | { status: "loading" } | { status: "error" }
  | { status: "ready"; closed: boolean; full: boolean; times: string[] };

const SALON_WHATSAPP = "https://wa.me/233557205803";

const ghs = (pesewas: number) => `₵${(pesewas / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;

// Calendar days are local midnight, so build the date string from local parts
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// "Fri 23 Oct"
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).replace(",", "");

function groupTimes(times: string[]) {
  const groups = [
    { period: "Morning", test: (m: number) => m < 12 * 60 },
    { period: "Afternoon", test: (m: number) => m >= 12 * 60 && m < 17 * 60 },
    { period: "Evening", test: (m: number) => m >= 17 * 60 },
  ];
  return groups
    .map(({ period, test }) => ({ period, times: times.filter((t) => test(slotToMinutes(t) ?? 0)) }))
    .filter((g) => g.times.length > 0);
}

const label = "font-sans text-[10px] tracking-widest2 uppercase text-ink/40";
const primaryBtn = "bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-4 px-8 text-center hover:bg-ink/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const outlineBtn = "border border-ink/20 text-ink/70 font-sans text-[11px] tracking-widest uppercase py-4 px-8 text-center hover:border-ink hover:text-ink transition-colors";

function Summary({ rows }: { rows: [string, string][] }) {
  return (
    <div className="bg-mist p-6">
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-6 py-2.5 border-b border-ink/[0.07] last:border-0">
          <span className="font-sans text-[10px] tracking-widest uppercase text-ink/35 pt-0.5">{k}</span>
          <span className="font-sans text-[12px] text-ink text-right">{v}</span>
        </div>
      ))}
    </div>
  );
}

export default function ManageBookingPage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [token, setToken]     = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingPreview | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [view, setView] = useState<View>("overview");

  // Reschedule
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [closedDays, setClosedDays]     = useState<number[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [day, setDay]   = useState<DayState>({ status: "idle" });
  const [retry, setRetry] = useState(0);
  const timesRef = useRef<HTMLDivElement>(null);

  // Cancel
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Old "Cancel this appointment" email links land straight on the cancel form
  useEffect(() => {
    searchParams.then(({ view: v }) => { if (v === "cancel") setView("cancel"); });
  }, [searchParams]);

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      fetch(`/api/cancel/${t}`)
        .then(r => r.json())
        .then(d => {
          if (d.error) { setErrorMsg(d.error); setLoadState("error"); return; }
          setBooking(d);
          setLoadState("ready");
        })
        .catch(() => {
          setErrorMsg("We couldn't load your booking. Please check your connection and refresh the page.");
          setLoadState("error");
        });
    });
  }, [params]);

  // Closed days for the calendar, once the client opens the picker
  useEffect(() => {
    if (view !== "reschedule") return;
    fetch("/api/availability/blocked")
      .then(r => r.json())
      .then((d: { date: string }[]) => { if (Array.isArray(d)) setBlockedDates(d.map(x => x.date)); })
      .catch(() => {});
    fetch("/api/availability/settings")
      .then(r => r.json())
      .then((d: { day_of_week: number; is_available: boolean }[]) => {
        if (Array.isArray(d)) setClosedDays(d.filter(x => !x.is_available).map(x => x.day_of_week));
      })
      .catch(() => {});
  }, [view]);

  // Open times for the picked day. Ignore answers for a day they've moved on from.
  useEffect(() => {
    if (!token || !date) return;
    let stale = false;
    setDay({ status: "loading" });
    fetch(`/api/reschedule/${token}?date=${toDateStr(date)}`)
      .then(async r => {
        const d = await r.json().catch(() => null);
        if (!r.ok || !d || d.error) throw new Error(d?.error);
        if (!stale) setDay({ status: "ready", closed: d.closed, full: d.full, times: d.times ?? [] });
      })
      .catch(() => { if (!stale) setDay({ status: "error" }); });
    return () => { stale = true; };
  }, [token, date, retry]);

  const pickDate = (d: Date) => {
    setDate(d);
    setTime("");
    setSubmitError("");
    setTimeout(() => timesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const handleReschedule = async () => {
    if (!token || !date || !time || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/reschedule/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: toDateStr(date), time }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        // The time may have gone, so show the day as it is now
        setTime("");
        setRetry(n => n + 1);
        return;
      }
      setBooking(b => b && { ...b, booking_date: data.booking_date, time_slot: data.time_slot, rescheduleBlock: "You've already moved this appointment once." });
      setView("rescheduled");
      window.scrollTo({ top: 0 });
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!token || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/cancel/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.error === "Already cancelled") { setBooking(b => b && { ...b, status: "cancelled" }); return; }
      if (!res.ok || data.error) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setView("cancelled");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const go = (v: View) => { setSubmitError(""); setView(v); window.scrollTo({ top: 0 }); };

  if (loadState === "loading") return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <p className="font-sans text-[12px] text-ink/40">Loading…</p>
    </div>
  );

  if (loadState === "error" || !booking) return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-serif text-[2rem] font-light text-ink mb-4">Something went wrong.</p>
        <p className="font-sans text-[13px] text-ink/50 mb-8">{errorMsg}</p>
        <Link href="/book" className="font-sans text-[11px] tracking-widest uppercase text-ink border-b border-ink pb-px hover:opacity-60 transition-opacity">
          Book New Appointment
        </Link>
      </div>
    </div>
  );

  const summaryRows: [string, string][] = [
    ["Service",   booking.service_name],
    ["Treatment", booking.treatment],
    ["Stylist",   booking.stylist_name ?? ""],
    ["Date",      formatBookingDate(booking.booking_date)],
    ["Time",      booking.time_slot],
  ];

  // ── Finished states ────────────────────────────────────────────────────────
  if (view === "cancelled" || booking.status === "cancelled") return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-24">
      <div className="max-w-[480px] w-full text-center">
        <p className={`${label} mb-6`}>Appointment Cancelled</p>
        <h1 className="font-serif text-[clamp(2rem,5vw,4rem)] font-light text-ink leading-none mb-6">
          Cancelled<span className="italic">.</span>
        </h1>
        <p className="font-sans text-[13px] text-ink/50 font-light leading-relaxed mb-10 max-w-xs mx-auto">
          {view === "cancelled"
            ? "Your appointment has been cancelled. We've sent a confirmation to your email."
            : "This appointment has already been cancelled."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/book" className={primaryBtn}>Book Again</Link>
          <Link href="/" className={outlineBtn}>Home</Link>
        </div>
      </div>
    </div>
  );

  if (booking.status === "completed") return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-serif text-[2rem] font-light text-ink mb-4">Already completed.</p>
        <p className="font-sans text-[13px] text-ink/50 mb-8">This appointment has already taken place, so it can&apos;t be changed.</p>
        <Link href="/book" className="font-sans text-[11px] tracking-widest uppercase text-ink border-b border-ink pb-px hover:opacity-60 transition-opacity">
          Book New Appointment
        </Link>
      </div>
    </div>
  );

  if (view === "rescheduled") return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-24">
      <div className="max-w-[480px] w-full">
        <p className={`${label} mb-6 text-center`}>Appointment Moved</p>
        <h1 className="font-serif text-[clamp(2rem,5vw,4rem)] font-light text-ink leading-none mb-6 text-center">
          You&apos;re all <span className="italic">set.</span>
        </h1>
        <p className="font-sans text-[13px] text-ink/50 font-light leading-relaxed mb-10 max-w-xs mx-auto text-center">
          Your appointment has been moved. We&apos;ve sent the new details to your phone and email.
        </p>
        <Summary rows={summaryRows} />
        <p className="font-sans text-[11px] text-ink/40 leading-relaxed mt-6 text-center">
          Your payment stays with this booking. Need another change? Message us on{" "}
          <a href={SALON_WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-ink underline">WhatsApp</a>.
        </p>
        <div className="flex justify-center mt-10">
          <Link href="/" className={outlineBtn}>Home</Link>
        </div>
      </div>
    </div>
  );

  // ── Pick a new time ────────────────────────────────────────────────────────
  if (view === "reschedule") {
    const newWhen = date && time ? `${shortDate(toDateStr(date))}, ${time}` : null;
    return (
      <div className="min-h-screen bg-paper px-6 pt-24 pb-40 md:pb-24">
        <div className="max-w-[820px] mx-auto">
          <button onClick={() => go("overview")} className="font-sans text-[11px] tracking-widest uppercase text-ink/50 hover:text-ink transition-colors mb-8">
            ‹ Back
          </button>
          <p className={`${label} mb-2`}>Reschedule</p>
          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-4">
            Pick a new <span className="italic">time.</span>
          </h1>
          <p className="font-sans text-[13px] text-ink/50 leading-relaxed mb-10">
            Currently {shortDate(booking.booking_date)}, {booking.time_slot}
            {booking.stylist_name ? ` with ${booking.stylist_name}` : ""}. Same service{booking.stylist_name ? " and stylist" : ""}, new time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
            <div>
              <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 mb-5">Date</p>
              <MiniCalendar selected={date} onSelect={pickDate} blocked={blockedDates} disabledDays={closedDays} />
            </div>

            <div ref={timesRef} className="scroll-mt-24">
              <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 mb-5">Time</p>
              {!date ? (
                <p className="font-sans text-[14px] text-ink/55">Select a date first</p>
              ) : day.status === "loading" || day.status === "idle" ? (
                <p className="font-sans text-[14px] text-ink/55">Checking available times…</p>
              ) : day.status === "error" ? (
                <div>
                  <p className="font-sans text-[14px] text-ink/70 mb-3">We couldn&apos;t load times for this day.</p>
                  <button onClick={() => setRetry(n => n + 1)} className="font-sans text-[12px] tracking-widest uppercase text-ink border-b border-ink pb-px hover:opacity-60 transition-opacity">
                    Try again
                  </button>
                </div>
              ) : day.closed ? (
                <p className="font-sans text-[14px] text-ink/70">We&apos;re closed on this day. Please choose another date.</p>
              ) : day.full || day.times.length === 0 ? (
                <p className="font-sans text-[14px] text-ink/70 leading-relaxed">
                  {booking.stylist_name ? `${booking.stylist_name} is fully booked on this day.` : "This day is fully booked."} Please choose another date.
                </p>
              ) : (
                <div className="flex flex-col gap-5">
                  {groupTimes(day.times).map(g => (
                    <div key={g.period}>
                      <p className="font-sans text-[11px] tracking-widest uppercase text-ink/50 mb-3">{g.period}</p>
                      <div className="flex flex-wrap gap-2">
                        {g.times.map(t => (
                          <button
                            key={t}
                            onClick={() => { setTime(t); setSubmitError(""); }}
                            aria-pressed={time === t}
                            className={`font-sans text-[14px] tabular-nums px-4 py-2.5 border transition-colors duration-150 ${
                              time === t ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink hover:border-ink/60 hover:bg-mist"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Confirm: pinned to the bottom on phones, inline on larger screens */}
          <div className="fixed md:static inset-x-0 bottom-0 z-20 bg-paper border-t border-ink/10 md:border-0 px-6 md:px-0 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] md:pt-12 md:pb-0">
            <div className="max-w-[820px] mx-auto md:border-t md:border-ink/10 md:pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="font-sans text-[13px] leading-relaxed">
                <span className="text-ink/40 line-through">{shortDate(booking.booking_date)}, {booking.time_slot}</span>
                <span className="text-ink/40 mx-2">→</span>
                <span className={newWhen ? "text-ink font-medium" : "text-ink/40"}>{newWhen ?? "Choose a new time"}</span>
              </div>
              <button onClick={handleReschedule} disabled={!newWhen || submitting} className={`${primaryBtn} md:min-w-[240px]`}>
                {submitting ? "Moving…" : "Confirm New Time"}
              </button>
            </div>
            {submitError && <p className="max-w-[820px] mx-auto font-sans text-[12px] text-red-500 mt-3" role="alert">{submitError}</p>}
            <p className="max-w-[820px] mx-auto font-sans text-[11px] text-ink/40 leading-relaxed mt-3 hidden md:block">{reschedulePolicyText()}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────
  if (view === "cancel") {
    const refundLine = !booking.paid
      ? "This booking hasn't been paid, so there's nothing to refund."
      : booking.refundShare >= 1
        ? `You'll get a full refund of ${ghs(booking.refundPesewas)}.`
        : booking.refundShare > 0
          ? `Your appointment is less than 24 hours away, so you'll get 50% back: ${ghs(booking.refundPesewas)} of ${ghs(booking.paidPesewas)}.`
          : "Your appointment time has passed, so this cancellation isn't refunded.";

    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-24">
        <div className="max-w-[480px] w-full">
          <p className={`${label} mb-2`}>Cancel Appointment</p>
          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-8">
            Are you <span className="italic">sure?</span>
          </h1>

          <div className="mb-8"><Summary rows={summaryRows} /></div>

          {!booking.rescheduleBlock && (
            <div className="border border-ink/10 px-4 py-3 mb-4 flex items-center justify-between gap-4">
              <p className="font-sans text-[13px] text-ink leading-relaxed">Can&apos;t make this time? You can move it instead.</p>
              <button onClick={() => go("reschedule")} className="flex-shrink-0 font-sans text-[11px] tracking-widest uppercase text-ink border-b border-ink pb-px hover:opacity-60 transition-opacity">
                Reschedule
              </button>
            </div>
          )}

          <div className="border border-ink/10 px-4 py-3 mb-8">
            <p className={`${label} mb-1`}>Refund</p>
            <p className="font-sans text-[13px] text-ink leading-relaxed">{refundLine}</p>
          </div>

          <div className="mb-6">
            <label htmlFor="cancel-reason" className={`${label} block mb-2`}>Reason for cancellation (optional)</label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Let us know why you're cancelling…"
              rows={3}
              className="w-full border border-ink/15 px-4 py-3 font-sans text-[13px] text-ink placeholder:text-ink/25 font-light focus:outline-none focus:border-ink transition-colors resize-none bg-transparent"
            />
          </div>

          <p className="font-sans text-[11px] text-ink/40 leading-relaxed mb-6">{cancellationPolicyText()}</p>

          {submitError && <p className="font-sans text-[12px] text-red-500 mb-4" role="alert">{submitError}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={submitting}
              className="flex-1 bg-red-500 text-white font-sans text-[11px] tracking-widest uppercase py-4 hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {submitting ? "Cancelling…" : "Yes, Cancel Appointment"}
            </button>
            <button onClick={() => go("overview")} className={`flex-1 ${outlineBtn} px-0`}>
              Keep It
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Overview ───────────────────────────────────────────────────────────────
  const canMove = !booking.rescheduleBlock;
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-24">
      <div className="max-w-[480px] w-full">
        <p className={`${label} mb-2`}>Your Booking</p>
        <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-8">
          Hi, <span className="italic">{booking.client_name.trim().split(/\s+/)[0]}.</span>
        </h1>

        <div className="mb-8"><Summary rows={summaryRows} /></div>

        <div className="flex flex-col gap-3">
          <button onClick={() => go("reschedule")} disabled={!canMove} className={primaryBtn}>
            Reschedule
          </button>
          <button onClick={() => go("cancel")} className={outlineBtn}>
            Cancel Appointment
          </button>
        </div>

        <p className="font-sans text-[11px] text-ink/45 leading-relaxed mt-6">
          {canMove ? reschedulePolicyText() : (
            <>
              {booking.rescheduleBlock}{" "}
              <a href={SALON_WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-ink underline">Open WhatsApp</a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
