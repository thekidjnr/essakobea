"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { DbService, ServiceBookingOption, Stylist } from "@/lib/supabase/types";

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface BookingService {
  id: string;
  number: string;
  name: string;
  description: string;
  options: ServiceBookingOption[];
}

function dbToBookingService(s: DbService): BookingService {
  return { id: s.slug, number: s.number, name: s.name, description: s.description, options: s.booking_options };
}

function generateTimeSlots(open: string, close: string, interval: number) {
  const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const toLabel = (mins: number) => {
    const h = Math.floor(mins / 60), m = mins % 60;
    const period = h < 12 ? "AM" : "PM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  };
  const slots: string[] = [];
  let cur = toMins(open || "08:00");
  const end = toMins(close || "18:00");
  while (cur < end) { slots.push(toLabel(cur)); cur += interval; }
  // 12:XX AM = midnight (not shown in a salon context)
  // 12:XX PM = noon → Afternoon
  // 1–4 PM   → Afternoon
  // 5–11 PM  → Evening
  const toHour24 = (s: string) => {
    const [time, period] = s.split(" ");
    const [h] = time.split(":").map(Number);
    if (period === "AM") return h === 12 ? 0 : h;
    return h === 12 ? 12 : h + 12;
  };
  const groups = [
    { period: "Morning",   test: (s: string) => { const h = toHour24(s); return h >= 0 && h < 12; } },
    { period: "Afternoon", test: (s: string) => { const h = toHour24(s); return h >= 12 && h < 17; } },
    { period: "Evening",   test: (s: string) => { const h = toHour24(s); return h >= 17; } },
  ];
  return groups.map(({ period, test }) => ({ period, slots: slots.filter(test) })).filter(g => g.slots.length > 0);
}

const DEFAULT_SLOTS = generateTimeSlots("08:00", "18:00", 60);

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ─── Step labels ───────────────────────────────────────────────────────────────

const STEP_LABELS = ["Service", "Hair", "Schedule", "Stylist", "Details", "Review"];

// ─── State ────────────────────────────────────────────────────────────────────

type HairUnitType = "own_new" | "own_existing" | "none";

interface BookingState {
  serviceId: string;
  optionId: string;
  hairUnitType: HairUnitType | "";
  unitPhotos: string[];
  date: Date | null;
  time: string;
  stylistId: string;
  stylistName: string;
  stylistFeeAdj: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
}

// ─── Calendar ────────────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function MiniCalendar({
  selected, onSelect, blocked, disabledDays,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
  blocked: string[];
  disabledDays: number[];
}) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [view, setView] = useState(() => {
    const d = selected ?? today;
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { year, month } = view;
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = Array(first).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const isBlocked = (day: number) => {
    const str = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const dow = new Date(year, month, day).getDay();
    return blocked.includes(str) || disabledDays.includes(dow);
  };
  const isPast = (day: number) => new Date(year, month, day) < today;
  const isSelected = (day: number) => {
    if (!selected) return false;
    return selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
  };

  const prev = () => {
    if (month === 0) setView({ year: year - 1, month: 11 });
    else setView({ year, month: month - 1 });
  };
  const next = () => {
    if (month === 11) setView({ year: year + 1, month: 0 });
    else setView({ year, month: month + 1 });
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center text-ink/40 hover:text-ink transition-colors">‹</button>
        <span className="font-sans text-[12px] tracking-widest uppercase text-ink">{MONTHS[month]} {year}</span>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center text-ink/40 hover:text-ink transition-colors">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center font-sans text-[9px] tracking-widest uppercase text-ink/30 pb-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const disabled = isPast(day) || isBlocked(day);
          const sel = isSelected(day);
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => onSelect(new Date(year, month, day))}
              className={`aspect-square flex items-center justify-center font-sans text-[11px] transition-all duration-150 ${
                sel ? "bg-ink text-paper" :
                disabled ? "text-ink/15 cursor-not-allowed" :
                "text-ink hover:bg-ink/[0.06]"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hair Unit Photo Upload ────────────────────────────────────────────────────

function PhotoUpload({ photos, onChange }: { photos: string[]; onChange: (urls: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/bookings/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) onChange([...photos, data.url]);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-ink/20 py-8 px-4 text-center cursor-pointer hover:border-ink/40 transition-colors"
      >
        {uploading ? (
          <p className="font-sans text-[12px] text-ink/40">Uploading…</p>
        ) : (
          <>
            <p className="font-sans text-[12px] text-ink/50">Drop a photo here or <span className="underline">browse</span></p>
            <p className="font-sans text-[10px] text-ink/25 mt-1">JPG, PNG up to 10 MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative group w-20 h-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => onChange(photos.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-ink text-paper text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Terms Modal ──────────────────────────────────────────────────────────────

function TermsModal({ depositAmount, isRange, onAgree, onClose }: { depositAmount: number; isRange: boolean; onAgree: () => void; onClose: () => void }) {
  const paymentLabel = isRange
    ? `A non-refundable deposit of ₵${depositAmount} is required to secure your slot. This is deducted from your total on the day.`
    : `The full payment of ₵${depositAmount} is collected upfront to confirm your booking.`;

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4">
      <div className="bg-paper w-full max-w-[520px] max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-3">Booking Policy</p>
          <h2 className="font-serif text-[1.75rem] font-light text-ink leading-snug mb-6">
            Before you <span className="italic">confirm.</span>
          </h2>
          <div className="flex flex-col gap-5 mb-8">
            {[
              [isRange ? "Deposit" : "Payment", paymentLabel],
              ["Cancellations", `We require at least 24 hours notice to cancel or reschedule. Cancellations with less than 24 hours notice forfeit the ${isRange ? "deposit" : "payment"}.`],
              ["Arriving late", "Please arrive on time. If you arrive more than 15 minutes late, your slot may be given to the next client."],
              ["Hair prep", "Come with clean, detangled hair unless a wash service is booked. This helps us give you the best result."],
              ["Changes on the day", "Any changes to your service on arrival may affect pricing. Our team will advise you before proceeding."],
            ].map(([title, body], i) => (
              <div key={title} className="flex gap-4">
                <span className="font-sans text-[10px] text-ink/20 flex-shrink-0 pt-0.5 w-5">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-sans text-[11px] tracking-wide uppercase text-ink/60 mb-1">{title}</p>
                  <p className="font-sans text-[12px] text-ink/45 leading-relaxed font-light">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={onAgree}
              className="w-full bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-4 hover:bg-ink/80 transition-colors"
            >
              {isRange ? `I Agree — Pay ₵${depositAmount} Deposit` : `I Agree — Pay ₵${depositAmount} Now`}
            </button>
            <button
              onClick={onClose}
              className="w-full border border-ink/20 text-ink/50 font-sans text-[11px] tracking-widest uppercase py-3 hover:text-ink hover:border-ink/40 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step footer ──────────────────────────────────────────────────────────────

function StepFooter({
  canNext, onNext, showBack, onBack, nextLabel = "Continue",
}: {
  canNext: boolean;
  onNext: () => void;
  showBack: boolean;
  onBack: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center gap-6 mt-12">
      {showBack && (
        <button
          onClick={onBack}
          className="font-sans text-[11px] tracking-widest uppercase text-ink/35 hover:text-ink transition-colors"
        >
          ← Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canNext}
        className="bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-10 py-4 hover:bg-ink/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {nextLabel}
      </button>
    </div>
  );
}

// ─── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({
  label, onEdit, children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="py-5 flex items-start gap-6">
      <div className="w-24 flex-shrink-0 pt-0.5">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35">{label}</p>
      </div>
      <div className="flex-1 flex flex-col gap-0.5">{children}</div>
      <button
        onClick={onEdit}
        className="font-sans text-[10px] tracking-widest uppercase text-ink/30 hover:text-ink transition-colors flex-shrink-0 pt-0.5"
      >
        Edit
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function BookingFlow() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("service") ?? "";

  // ── Data
  const [services, setServices]     = useState<BookingService[]>([]);
  const [stylists, setStylists]     = useState<Stylist[]>([]);
  const [blockedDates, setBlocked]  = useState<string[]>([]);
  const [bookedSlots, setBooked]    = useState<string[]>([]);
  const [dayAvail, setDayAvail]     = useState<{ openTime: string; closeTime: string; slotInterval: number } | null>(null);
  const [disabledDays, setDisabled] = useState<number[]>([]);

  // ── UI
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(true);

  // ── Booking state
  const [booking, setBooking] = useState<BookingState>({
    serviceId: preselected,
    optionId: "",
    hairUnitType: "",
    unitPhotos: [],
    date: null,
    time: "",
    stylistId: "",
    stylistName: "Any Available",
    stylistFeeAdj: 0,
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
  });

  // ── Returning client lookup
  const [lookingUp, setLookingUp]     = useState(false);
  const [foundClient, setFoundClient] = useState<{ name: string; email: string } | null>(null);
  const phoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showTerms, setShowTerms]   = useState(false);

  // ── Derived
  const selectedService = services.find(s => s.id === booking.serviceId);
  const selectedOption  = selectedService?.options.find(o => o.id === booking.optionId);
  const baseDeposit     = selectedOption?.price_raw ?? 0;
  // A price is a "range" when the display string contains a dash/en-dash (e.g. "₵250 – ₵450")
  const isPriceRange    = !!(selectedOption?.price && /[-–]/.test(selectedOption.price));
  const totalDeposit    = baseDeposit + booking.stylistFeeAdj;
  const timeSlots       = dayAvail
    ? generateTimeSlots(dayAvail.openTime, dayAvail.closeTime, dayAvail.slotInterval)
    : DEFAULT_SLOTS;

  // ── Fetch on mount
  useEffect(() => {
    fetch("/api/services").then(r => r.json()).then((d: DbService[]) => {
      if (Array.isArray(d)) setServices(d.map(dbToBookingService));
    }).catch(() => {});

    fetch("/api/stylists").then(r => r.json()).then((d: Stylist[]) => {
      if (Array.isArray(d)) setStylists(d);
    }).catch(() => {});

    fetch("/api/availability/blocked").then(r => r.json()).then((d: { date: string }[]) => {
      if (Array.isArray(d)) setBlocked(d.map(x => x.date));
    }).catch(() => {});

    fetch("/api/availability/settings").then(r => r.json()).then((data) => {
      if (Array.isArray(data)) {
        const off = (data as { day_of_week: number; is_available: boolean }[])
          .filter(d => !d.is_available).map(d => d.day_of_week);
        setDisabled(off);
      }
    }).catch(() => {});
  }, []);

  // ── Fetch slots when date changes
  useEffect(() => {
    if (!booking.date) return;
    const dateStr = booking.date.toISOString().slice(0, 10);
    fetch(`/api/availability?date=${dateStr}`).then(r => r.json()).then(data => {
      if (data.bookedSlots) setBooked(data.bookedSlots);
      if (data.openTime) setDayAvail({ openTime: data.openTime, closeTime: data.closeTime, slotInterval: data.slotInterval ?? 60 });
    }).catch(() => {});
  }, [booking.date]);

  // ── Phone lookup with debounce
  useEffect(() => {
    const phone = booking.phone.trim();
    if (phone.length < 9) { setFoundClient(null); return; }
    if (phoneTimer.current) clearTimeout(phoneTimer.current);
    phoneTimer.current = setTimeout(async () => {
      setLookingUp(true);
      try {
        const res = await fetch(`/api/bookings/lookup?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (data.client) {
          setFoundClient(data.client);
          const [first, ...rest] = (data.client.name as string).split(" ");
          setBooking(b => ({
            ...b,
            firstName: first ?? b.firstName,
            lastName: rest.join(" ") || b.lastName,
            email: data.client.email ?? b.email,
          }));
        } else {
          setFoundClient(null);
        }
      } catch { setFoundClient(null); }
      setLookingUp(false);
    }, 600);
  }, [booking.phone]);

  const set = useCallback(<K extends keyof BookingState>(key: K, val: BookingState[K]) => {
    setBooking(b => ({ ...b, [key]: val }));
  }, []);

  // ── Navigation with fade
  const goTo = (target: number) => {
    if (target === step) return;
    setVisible(false);
    setTimeout(() => { setStep(target); setVisible(true); }, 230);
  };
  const next = () => goTo(step + 1);
  const back = () => goTo(step - 1);

  // ── Validation
  const canNext = () => {
    if (step === 0) return !!booking.serviceId && !!booking.optionId;
    if (step === 1) return !!booking.hairUnitType;
    if (step === 2) return !!booking.date && !!booking.time;
    if (step === 3) return true;
    if (step === 4) return !!booking.firstName && !!booking.phone && !!booking.email;
    return false;
  };

  // ── Payment
  const handlePayNow = async () => {
    setShowTerms(false);
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: `${booking.firstName} ${booking.lastName}`.trim(),
          clientEmail: booking.email,
          clientPhone: booking.phone,
          serviceId: booking.serviceId,
          optionId: booking.optionId,
          serviceName: selectedService?.name,
          treatment: selectedOption?.name,
          bookingDate: booking.date?.toISOString().slice(0, 10),
          timeSlot: booking.time,
          notes: booking.notes || null,
          stylistId: booking.stylistId || null,
          stylistName: booking.stylistId ? booking.stylistName : null,
          stylistFeeAdjustment: booking.stylistFeeAdj,
          hairUnitType: booking.hairUnitType || null,
          unitPhotos: booking.unitPhotos,
        }),
      });
      const data = await res.json();
      if (data.paystackUrl) {
        window.location.href = data.paystackUrl;
      } else {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-paper pt-[54px]">
      {/* Step bar — sticks just below fixed Nav (~54px tall) */}
      <div className="sticky top-[54px] z-30 bg-paper border-b border-ink/[0.07]">
        <div className="max-w-[900px] mx-auto px-6 py-4 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center">
                <button
                  disabled={i > step}
                  onClick={() => i < step && goTo(i)}
                  className="flex items-center gap-2 group disabled:cursor-default"
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-sans text-[9px] flex-shrink-0 transition-all duration-300 ${
                    i < step  ? "bg-ink text-paper" :
                    i === step ? "bg-ink text-paper" :
                    "border border-ink/20 text-ink/25"
                  }`}>
                    {i < step ? (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : i + 1}
                  </span>
                  <span className={`font-sans text-[9px] tracking-widest uppercase transition-colors duration-300 ${
                    i === step ? "text-ink" : i < step ? "text-ink/45 group-hover:text-ink" : "text-ink/20"
                  }`}>
                    {label}
                  </span>
                </button>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`w-6 md:w-10 h-px mx-2.5 flex-shrink-0 transition-colors duration-300 ${i < step ? "bg-ink/25" : "bg-ink/[0.08]"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="max-w-[900px] mx-auto px-6 py-12 md:py-16"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)", transition: "opacity 230ms ease, transform 230ms ease" }}
      >

        {/* ─ STEP 0: Service ─────────────────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-3">Step 1 of 6</p>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-10">
              Choose your <span className="italic">service.</span>
            </h2>
            <div className="flex flex-col gap-2.5">
              {services.map(svc => (
                <div key={svc.id}>
                  <button
                    onClick={() => { set("serviceId", svc.id); set("optionId", ""); }}
                    className={`w-full text-left border transition-all duration-200 p-5 ${
                      booking.serviceId === svc.id ? "border-ink" : "border-ink/15 hover:border-ink/35"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="font-sans text-[9px] tracking-widest text-ink/25">{svc.number}</span>
                          <span className="font-sans text-[12px] tracking-wide uppercase text-ink font-medium">{svc.name}</span>
                        </div>
                        <p className="font-sans text-[12px] text-ink/45 font-light leading-relaxed">{svc.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 transition-all ${
                        booking.serviceId === svc.id ? "border-ink bg-ink" : "border-ink/25"
                      }`} />
                    </div>
                  </button>

                  {booking.serviceId === svc.id && svc.options.length > 0 && (
                    <div className="border-l border-r border-b border-ink/15">
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-ink/[0.07]">
                        {svc.options.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => set("optionId", opt.id)}
                            className={`text-left p-4 transition-colors duration-200 ${
                              booking.optionId === opt.id ? "bg-ink" : "hover:bg-ink/[0.03]"
                            }`}
                          >
                            <p className={`font-sans text-[12px] font-medium mb-0.5 ${booking.optionId === opt.id ? "text-paper" : "text-ink"}`}>{opt.name}</p>
                            <p className={`font-sans text-[11px] ${booking.optionId === opt.id ? "text-paper/70" : "text-ink/45"}`}>{opt.price}</p>
                            {opt.note && <p className={`font-sans text-[10px] mt-1 ${booking.optionId === opt.id ? "text-paper/50" : "text-ink/30"}`}>{opt.note}</p>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <StepFooter canNext={canNext()} onNext={next} showBack={false} onBack={back} />
          </div>
        )}

        {/* ─ STEP 1: Hair ────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-3">Step 2 of 6</p>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-3">
              Your <span className="italic">hair unit.</span>
            </h2>
            <p className="font-sans text-[13px] text-ink/45 font-light mb-10 max-w-sm leading-relaxed">
              Will you be bringing a hair unit, or do you only need the service?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
              {([
                { id: "own_new" as HairUnitType, label: "I have a new unit", sub: "Brand new — never installed", icon: "✦" },
                { id: "own_existing" as HairUnitType, label: "I have an existing unit", sub: "Previously worn or installed", icon: "◈" },
                { id: "none" as HairUnitType, label: "Just the service", sub: "No unit needed from me", icon: "◇" },
              ]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => set("hairUnitType", opt.id)}
                  className={`text-left border p-6 transition-all duration-200 ${
                    booking.hairUnitType === opt.id ? "border-ink bg-ink" : "border-ink/15 hover:border-ink/40"
                  }`}
                >
                  <span className={`text-[1.25rem] mb-4 block ${booking.hairUnitType === opt.id ? "text-paper/50" : "text-ink/20"}`}>{opt.icon}</span>
                  <p className={`font-sans text-[12px] tracking-wide uppercase mb-1 ${booking.hairUnitType === opt.id ? "text-paper" : "text-ink"}`}>{opt.label}</p>
                  <p className={`font-sans text-[11px] font-light ${booking.hairUnitType === opt.id ? "text-paper/55" : "text-ink/40"}`}>{opt.sub}</p>
                </button>
              ))}
            </div>

            {(booking.hairUnitType === "own_new" || booking.hairUnitType === "own_existing") && (
              <div className="border border-ink/10 p-6 mb-10">
                <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/40 mb-1">Photos <span className="normal-case tracking-normal text-ink/25">(optional)</span></p>
                <p className="font-sans text-[12px] text-ink/40 font-light mb-5 leading-relaxed">
                  Share a photo of your unit so your stylist can prepare in advance.
                </p>
                <PhotoUpload photos={booking.unitPhotos} onChange={(urls) => set("unitPhotos", urls)} />
              </div>
            )}

            <StepFooter canNext={canNext()} onNext={next} showBack={true} onBack={back} />
          </div>
        )}

        {/* ─ STEP 2: Schedule ────────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-3">Step 3 of 6</p>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-10">
              Pick a <span className="italic">date & time.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14">
              <div>
                <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-5">Date</p>
                <MiniCalendar
                  selected={booking.date}
                  onSelect={(d) => { set("date", d); set("time", ""); }}
                  blocked={blockedDates}
                  disabledDays={disabledDays}
                />
                {booking.date && (
                  <p className="font-sans text-[11px] text-ink/45 mt-4">{formatDate(booking.date)}</p>
                )}
              </div>

              <div>
                <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-5">Time</p>
                {!booking.date ? (
                  <p className="font-sans text-[12px] text-ink/25 italic mt-2">Select a date first</p>
                ) : (
                  <div className="flex flex-col gap-5">
                    {timeSlots.map(group => (
                      <div key={group.period}>
                        <p className="font-sans text-[9px] tracking-widest uppercase text-ink/25 mb-2.5">{group.period}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.slots.map(slot => {
                            const taken = bookedSlots.includes(slot);
                            return (
                              <button
                                key={slot}
                                disabled={taken}
                                onClick={() => set("time", slot)}
                                className={`font-sans text-[11px] px-4 py-2 border transition-all duration-150 ${
                                  booking.time === slot ? "bg-ink text-paper border-ink" :
                                  taken ? "text-ink/15 border-ink/[0.07] cursor-not-allowed line-through" :
                                  "border-ink/15 text-ink hover:border-ink/50"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <StepFooter canNext={canNext()} onNext={next} showBack={true} onBack={back} />
          </div>
        )}

        {/* ─ STEP 3: Stylist ─────────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-3">Step 4 of 6</p>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-3">
              Choose your <span className="italic">stylist.</span>
            </h2>
            <p className="font-sans text-[13px] text-ink/45 font-light mb-10 max-w-sm leading-relaxed">
              All our stylists are trained professionals. Pick whoever you're most comfortable with, or let us decide.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {/* Any Available */}
              <button
                onClick={() => { set("stylistId", ""); set("stylistName", "Any Available"); set("stylistFeeAdj", 0); }}
                className={`text-left border p-5 transition-all duration-200 ${
                  booking.stylistId === "" ? "border-ink bg-ink" : "border-ink/15 hover:border-ink/40"
                }`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${booking.stylistId === "" ? "bg-paper/15" : "bg-ink/[0.05]"}`}>
                  <span className={`font-serif text-[1.25rem] italic ${booking.stylistId === "" ? "text-paper/60" : "text-ink/25"}`}>~</span>
                </div>
                <p className={`font-sans text-[12px] tracking-wide uppercase mb-0.5 ${booking.stylistId === "" ? "text-paper" : "text-ink"}`}>Any Available</p>
                <p className={`font-sans text-[11px] font-light mb-2 ${booking.stylistId === "" ? "text-paper/55" : "text-ink/40"}`}>We'll assign the best fit</p>
                <p className={`font-sans text-[10px] ${booking.stylistId === "" ? "text-paper/40" : "text-ink/25"}`}>No additional fee</p>
              </button>

              {stylists.map(s => (
                <button
                  key={s.id}
                  onClick={() => { set("stylistId", s.id); set("stylistName", s.name); set("stylistFeeAdj", s.fee_adjustment); }}
                  className={`text-left border p-5 transition-all duration-200 ${
                    booking.stylistId === s.id ? "border-ink bg-ink" : "border-ink/15 hover:border-ink/40"
                  }`}
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden mb-4">
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${booking.stylistId === s.id ? "bg-paper/15" : "bg-ink/[0.05]"}`}>
                        <span className={`font-serif text-[1.1rem] italic ${booking.stylistId === s.id ? "text-paper/60" : "text-ink/25"}`}>{s.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <p className={`font-sans text-[12px] tracking-wide uppercase mb-0.5 ${booking.stylistId === s.id ? "text-paper" : "text-ink"}`}>{s.name}</p>
                  <p className={`font-sans text-[11px] font-light mb-2 ${booking.stylistId === s.id ? "text-paper/55" : "text-ink/40"}`}>{s.title}</p>
                  {s.bio && <p className={`font-sans text-[10px] font-light leading-relaxed mb-2 ${booking.stylistId === s.id ? "text-paper/45" : "text-ink/30"}`}>{s.bio}</p>}
                  {s.fee_adjustment !== 0 && (
                    <p className={`font-sans text-[10px] ${booking.stylistId === s.id ? "text-paper/40" : "text-ink/30"}`}>
                      {s.fee_adjustment > 0 ? `+₵${s.fee_adjustment}` : `−₵${Math.abs(s.fee_adjustment)}`} deposit
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Live deposit display */}
            {selectedOption && (
              <div className="border border-ink/10 px-5 py-4 flex items-center justify-between mb-4 max-w-md">
                <p className="font-sans text-[11px] text-ink/40">{isPriceRange ? "Deposit required" : "Price"}</p>
                <div className="text-right">
                  <p className="font-serif text-[1.5rem] font-light text-ink leading-none">₵{totalDeposit}</p>
                  {booking.stylistFeeAdj !== 0 && (
                    <p className="font-sans text-[10px] text-ink/30 mt-0.5">
                      ₵{baseDeposit} base {booking.stylistFeeAdj > 0 ? "+" : "−"} ₵{Math.abs(booking.stylistFeeAdj)} stylist fee
                    </p>
                  )}
                </div>
              </div>
            )}

            <StepFooter canNext={canNext()} onNext={next} showBack={true} onBack={back} />
          </div>
        )}

        {/* ─ STEP 4: Details ─────────────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-3">Step 5 of 6</p>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-10">
              Your <span className="italic">details.</span>
            </h2>

            <div className="max-w-[560px] flex flex-col gap-5">
              {/* Phone first — enables lookup */}
              <div className="relative">
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Phone *</label>
                <input
                  type="tel"
                  value={booking.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="0557205803"
                  className="w-full border border-ink/15 focus:border-ink px-4 py-4 font-sans text-[14px] text-ink bg-transparent focus:outline-none transition-colors"
                />
                {lookingUp && (
                  <span className="absolute right-4 bottom-4 font-sans text-[10px] text-ink/30 tracking-widest uppercase">Checking…</span>
                )}
              </div>

              {/* Returning client banner */}
              {foundClient && (
                <div className="bg-ink/[0.04] border border-ink/10 px-4 py-3 flex items-start gap-3">
                  <span className="text-ink/40 text-[0.85rem] flex-shrink-0 mt-0.5">◎</span>
                  <p className="font-sans text-[11px] text-ink/55 leading-relaxed">
                    Welcome back, <span className="text-ink font-medium">{foundClient.name.split(" ")[0]}</span>. We've filled in your details — feel free to update anything.
                  </p>
                </div>
              )}

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">First name *</label>
                  <input
                    value={booking.firstName}
                    onChange={e => set("firstName", e.target.value)}
                    placeholder="Akua"
                    className="w-full border border-ink/15 focus:border-ink px-4 py-4 font-sans text-[14px] text-ink bg-transparent focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Last name</label>
                  <input
                    value={booking.lastName}
                    onChange={e => set("lastName", e.target.value)}
                    placeholder="Mensah"
                    className="w-full border border-ink/15 focus:border-ink px-4 py-4 font-sans text-[14px] text-ink bg-transparent focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Email *</label>
                <input
                  type="email"
                  value={booking.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="akua@example.com"
                  className="w-full border border-ink/15 focus:border-ink px-4 py-4 font-sans text-[14px] text-ink bg-transparent focus:outline-none transition-colors"
                />
                <p className="font-sans text-[10px] text-ink/25 mt-1.5">Confirmation and receipt sent here.</p>
              </div>

              {/* Notes */}
              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Special notes</label>
                <textarea
                  value={booking.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="Allergies, preferences, or anything your stylist should know…"
                  rows={4}
                  className="w-full border border-ink/15 focus:border-ink px-4 py-4 font-sans text-[13px] text-ink bg-transparent focus:outline-none transition-colors resize-none leading-relaxed"
                />
                <p className="font-sans text-[10px] text-ink/25 mt-1.5">The more we know, the better we can prepare.</p>
              </div>
            </div>

            <StepFooter canNext={canNext()} onNext={next} showBack={true} onBack={back} nextLabel="Review Booking" />
          </div>
        )}

        {/* ─ STEP 5: Review ──────────────────────────────────────────────────── */}
        {step === 5 && (
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-3">Step 6 of 6</p>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-10">
              Review & <span className="italic">confirm.</span>
            </h2>

            <div className="max-w-[620px] divide-y divide-ink/[0.07]">
              <ReviewRow label="Service" onEdit={() => goTo(0)}>
                <p className="font-sans text-[14px] text-ink">{selectedService?.name}</p>
                <p className="font-sans text-[12px] text-ink/50">{selectedOption?.name} · {selectedOption?.price}</p>
              </ReviewRow>

              <ReviewRow label="Hair" onEdit={() => goTo(1)}>
                <p className="font-sans text-[14px] text-ink">
                  {booking.hairUnitType === "own_new"      ? "New unit (bringing)" :
                   booking.hairUnitType === "own_existing" ? "Existing unit (bringing)" :
                   "No unit — service only"}
                </p>
                {booking.unitPhotos.length > 0 && (
                  <p className="font-sans text-[11px] text-ink/35">{booking.unitPhotos.length} photo{booking.unitPhotos.length > 1 ? "s" : ""} attached</p>
                )}
              </ReviewRow>

              <ReviewRow label="Schedule" onEdit={() => goTo(2)}>
                <p className="font-sans text-[14px] text-ink">{booking.date ? formatDate(booking.date) : "—"}</p>
                <p className="font-sans text-[12px] text-ink/50">{booking.time}</p>
              </ReviewRow>

              <ReviewRow label="Stylist" onEdit={() => goTo(3)}>
                <p className="font-sans text-[14px] text-ink">{booking.stylistId ? booking.stylistName : "Any Available"}</p>
              </ReviewRow>

              <ReviewRow label="Details" onEdit={() => goTo(4)}>
                <p className="font-sans text-[14px] text-ink">{`${booking.firstName} ${booking.lastName}`.trim()}</p>
                <p className="font-sans text-[12px] text-ink/50">{booking.phone}</p>
                <p className="font-sans text-[12px] text-ink/50">{booking.email}</p>
                {booking.notes && (
                  <p className="font-sans text-[12px] text-ink/35 italic mt-1">"{booking.notes}"</p>
                )}
              </ReviewRow>

              {/* Deposit */}
              <div className="py-6 flex items-end justify-between">
                <div>
                  <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">{isPriceRange ? "Deposit due now" : "Total"}</p>
                  <p className="font-sans text-[10px] text-ink/30 font-light">{isPriceRange ? "Balance confirmed and paid on the day" : "Full payment collected upfront"}</p>
                </div>
                <p className="font-serif text-[2rem] font-light text-ink">₵{totalDeposit}</p>
              </div>
            </div>

            {submitError && (
              <p className="font-sans text-[12px] text-red-500 mt-5 max-w-[620px]">{submitError}</p>
            )}

            <div className="mt-8 max-w-[620px] flex flex-col gap-3">
              <button
                onClick={() => setShowTerms(true)}
                disabled={submitting}
                className="w-full bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-5 hover:bg-ink/80 transition-colors disabled:opacity-50"
              >
                {submitting ? "Processing…" : isPriceRange ? `Pay ₵${totalDeposit} Deposit →` : `Pay ₵${totalDeposit} Now →`}
              </button>
              <p className="font-sans text-[10px] text-ink/25 text-center">
                Secured by Paystack · You'll review our booking policy before confirming
              </p>
            </div>

            <div className="mt-6 max-w-[620px]">
              <button onClick={back} className="font-sans text-[11px] tracking-widest uppercase text-ink/35 hover:text-ink transition-colors">
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Terms modal */}
      {showTerms && (
        <TermsModal
          depositAmount={totalDeposit}
          isRange={isPriceRange}
          onAgree={handlePayNow}
          onClose={() => setShowTerms(false)}
        />
      )}
    </div>
  );
}
