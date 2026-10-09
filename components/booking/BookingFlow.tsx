"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type {
  DbService,
  ServiceBookingOption,
  Stylist,
} from "@/lib/supabase/types";
import PhoneInput from "@/components/common/PhoneInput";
import { formatPhoneDisplay, isPhoneComplete } from "@/lib/phone";
import { useLightboxSwipe } from "@/components/works/useLightboxSwipe";
import {
  EMERGENCY_HOURS,
  minutesToSlot,
  slotToMinutes,
  todayInAccra,
} from "@/lib/booking-time";
import { cancellationPolicyText } from "@/lib/refunds";
import type { ServicePolicy } from "@/lib/policies";
import {
  bookingTotals,
  CUSTOMIZATION_FEES,
  EMERGENCY_FEE,
  isPriceRange,
} from "@/lib/booking-fees";
import { BOOKING_DRAFT_KEY } from "@/lib/booking-draft";
import { uploadImage } from "@/lib/upload-image";
import {
  BUNDLE_OPTIONS,
  bringsHair,
  getServiceRules,
  type HairOption,
  type HairUnitType,
} from "@/lib/service-rules";

// ─── Step icons ─────────────────────────────────────────────────────────────────

function IconSparkle({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className={className}
    >
      <path
        d="M11 2L13 9L20 11L13 13L11 20L9 13L2 11L9 9L11 2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className={className}
    >
      <path
        d="M18 6.5a7 7 0 1 0 1.5 6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M19.5 2.5v4.5H15"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconScissors({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className={className}
    >
      <circle cx="6" cy="6" r="2.3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="16" r="2.3" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M7.8 7.6L19 18M7.8 14.4L19 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className={className}
    >
      <circle cx="11" cy="11" r="8.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M11 6.5V11l3.2 2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className={className}
    >
      <path
        d="M12 2L4 13h6l-1 7 9-12h-6l1-6z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPerson({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <circle
        cx="10"
        cy="6.5"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M3.5 17c1-3.8 4-5.8 6.5-5.8s5.5 2 6.5 5.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const HAIR_ICONS: Record<HairOption["icon"], typeof IconSparkle> = {
  sparkle: IconSparkle,
  refresh: IconRefresh,
  scissors: IconScissors,
};

function HairIcon({
  icon,
  className,
}: {
  icon: HairOption["icon"];
  className?: string;
}) {
  const Icon = HAIR_ICONS[icon];
  return <Icon className={className} />;
}

function SelectBadge({ selected }: { selected: boolean }) {
  return (
    <span
      className={`absolute top-5 right-5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
        selected ? "bg-paper" : "border border-ink/30"
      }`}
    >
      {selected && (
        <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
          <path
            d="M1.5 4l2 2 3-3"
            stroke="var(--ink)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function OptionTile({
  opt,
  selected,
  onSelect,
}: {
  opt: ServiceBookingOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`text-left px-5 py-4 transition-colors duration-200 ${
        selected ? "bg-ink" : "hover:bg-mist"
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p
          className={`font-sans text-[15px] font-medium ${selected ? "text-paper" : "text-ink"}`}
        >
          {opt.name}
        </p>
        <p
          className={`font-sans text-[14px] font-medium tabular-nums whitespace-nowrap ${selected ? "text-paper" : "text-ink"}`}
        >
          {opt.price}
        </p>
      </div>
      {/* Note stays collapsed until the option is chosen, so the list
          scans as name + price only. */}
      {opt.note && (
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <p className="font-sans text-[13px] leading-snug text-paper/70 pt-2">
              {opt.note}
            </p>
          </div>
        </div>
      )}
    </button>
  );
}

// Names are often entered in all caps in the admin; show them in title case.
function displayName(name: string) {
  if (name !== name.toUpperCase()) return name;
  return name
    .toLowerCase()
    .replace(/(^|[\s\-/(])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface BookingService {
  id: string;
  number: string;
  name: string;
  description: string;
  image_url: string;
  options: ServiceBookingOption[];
}

function dbToBookingService(s: DbService): BookingService {
  return {
    id: s.slug,
    number: s.number,
    name: s.name,
    description: s.description,
    image_url: s.image_url,
    options: s.booking_options,
  };
}

function generateTimeSlots(open: string, close: string, interval: number) {
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const slots: string[] = [];
  let cur = toMins(open || "08:00");
  const end = toMins(close || "18:00");
  while (cur < end) {
    slots.push(minutesToSlot(cur));
    cur += interval;
  }
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
    {
      period: "Morning",
      test: (s: string) => {
        const h = toHour24(s);
        return h >= 0 && h < 12;
      },
    },
    {
      period: "Afternoon",
      test: (s: string) => {
        const h = toHour24(s);
        return h >= 12 && h < 17;
      },
    },
    {
      period: "Evening",
      test: (s: string) => {
        const h = toHour24(s);
        return h >= 17;
      },
    },
  ];
  return groups
    .map(({ period, test }) => ({ period, slots: slots.filter(test) }))
    .filter((g) => g.slots.length > 0);
}

const DEFAULT_SLOTS = generateTimeSlots(
  EMERGENCY_HOURS.open,
  EMERGENCY_HOURS.close,
  EMERGENCY_HOURS.interval,
);

// YYYY-MM-DD for the calendar day the client picked. Calendar dates are built
// at local midnight, so toISOString() would shift them back a day for anyone
// east of UTC (Nigeria, UK in summer, Europe...).
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Accra is UTC+0, so the salon's current time is just the UTC time.
function nowMinutesInAccra() {
  const now = new Date();
  return now.getUTCHours() * 60 + now.getUTCMinutes();
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Fees ──────────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALON_WHATSAPP = "https://wa.me/233557205803";

// ─── State ────────────────────────────────────────────────────────────────────

interface BookingState {
  serviceId: string;
  optionId: string;
  hairUnitType: HairUnitType | "";
  customizationType: "standard" | "express" | "";
  unitPhotos: string[];
  inspoPhotos: string[];
  bundleCount: number | null;
  isEmergency: boolean;
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

// ─── Draft (survives a refresh, and the trip to Paystack and back) ──────────
// Kept in sessionStorage, so it lasts for this tab only.

function saveDraft(b: BookingState, step: number) {
  try {
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({ ...b, date: b.date ? toDateStr(b.date) : null, step }),
    );
  } catch {}
}

function loadDraft(): { booking: BookingState; step: number } | null {
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return null;
    const { step, ...d } = JSON.parse(raw);
    const [y, m, day] = String(d.date ?? "").split("-").map(Number);
    return {
      booking: {
        bundleCount: null,
        inspoPhotos: [],
        ...d,
        date: y && m && day ? new Date(y, m - 1, day) : null,
      },
      step: Number.isInteger(step) ? Math.min(Math.max(step, 0), 6) : 0,
    };
  } catch {
    return null;
  }
}

// ─── Calendar ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function MiniCalendar({
  selected,
  onSelect,
  blocked,
  disabledDays,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
  blocked: string[];
  disabledDays: number[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [view, setView] = useState(() => {
    const d = selected ?? today;
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { year, month } = view;
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = Array(first).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const salonToday = todayInAccra();
  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isBlocked = (day: number) => {
    const dow = new Date(year, month, day).getDay();
    return blocked.includes(dateStr(day)) || disabledDays.includes(dow);
  };
  const isPast = (day: number) => dateStr(day) < salonToday;
  // No browsing back before the current month
  const atFirstMonth = `${year}-${String(month + 1).padStart(2, "0")}` <= salonToday.slice(0, 7);
  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getFullYear() === year &&
      selected.getMonth() === month &&
      selected.getDate() === day
    );
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
        <button
          onClick={prev}
          disabled={atFirstMonth}
          aria-label="Previous month"
          className="w-9 h-9 flex items-center justify-center text-[18px] text-ink/55 hover:text-ink hover:bg-mist rounded-full transition-colors disabled:opacity-0 disabled:cursor-default"
        >
          ‹
        </button>
        <span className="font-serif text-[1.375rem] text-ink lining-nums" aria-live="polite">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={next}
          aria-label="Next month"
          className="w-9 h-9 flex items-center justify-center text-[18px] text-ink/55 hover:text-ink hover:bg-mist rounded-full transition-colors"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center font-sans text-[11px] tracking-widest uppercase text-ink/45 pb-2"
          >
            {d}
          </div>
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
              aria-pressed={sel}
              aria-label={formatDate(new Date(year, month, day))}
              className={`aspect-square flex items-center justify-center font-sans text-[14px] tabular-nums transition-colors duration-150 ${
                sel
                  ? "bg-ink text-paper font-medium"
                  : disabled
                    ? "text-ink/20 cursor-not-allowed"
                    : "text-ink hover:bg-mist"
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

// Checked before the photo is shrunk in the browser, so it can be generous
const MAX_PHOTO_BYTES = 30 * 1024 * 1024;

function PhotoUpload({
  photos,
  onAdd,
  onRemove,
  onUploadingChange,
}: {
  photos: string[];
  onAdd: (url: string) => void;
  onRemove: (index: number) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadOne = async (file: File): Promise<string | null> => {
    const isImage = file.type.startsWith("image/") || /\.hei[cf]$/i.test(file.name);
    if (!isImage) return `"${file.name}" isn't an image. Please use a JPG or PNG.`;
    if (file.size > MAX_PHOTO_BYTES)
      return `"${file.name}" is over ${MAX_PHOTO_BYTES / 1024 / 1024} MB. Please choose a smaller photo.`;
    const result = await uploadImage("/api/bookings/upload", file);
    if ("error" in result) return result.error;
    onAdd(result.url);
    return null;
  };

  // Uploads one at a time, and always releases the "uploading" lock so the
  // client is never stuck on this step.
  const handleFiles = async (files: File[]) => {
    if (uploading || files.length === 0) return;
    setError("");
    setUploading(true);
    onUploadingChange?.(true);
    try {
      for (const file of files) {
        const err = await uploadOne(file);
        if (err) setError(err);
      }
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border border-dashed border-ink/20 py-8 px-4 text-center transition-colors ${
          uploading ? "cursor-wait" : "cursor-pointer hover:border-ink/40"
        }`}
      >
        {uploading ? (
          <p className="font-sans text-[13px] text-ink/55">Uploading…</p>
        ) : (
          <>
            <p className="font-sans text-[14px] text-ink/70">
              Drop a photo here or <span className="underline">browse</span>
            </p>
            <p className="font-sans text-[12px] text-ink/50 mt-1">
              JPG, PNG or iPhone photos
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {error && (
        <p className="font-sans text-[13px] text-red-500" role="alert">
          {error}
        </p>
      )}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative group w-20 h-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => onRemove(i)}
                aria-label="Remove photo"
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-ink text-paper text-[10px] flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Terms Modal ──────────────────────────────────────────────────────────────

function TermsModal({
  depositAmount,
  isRange,
  balanceDue,
  policy,
  onAgree,
  onClose,
}: {
  depositAmount: number;
  isRange: boolean;
  balanceDue: string;
  policy?: ServicePolicy;
  onAgree: () => void;
  onClose: () => void;
}) {
  const paymentLabel = isRange
    ? `A deposit of ₵${depositAmount} confirms your slot. It is deducted from your total, and you pay the rest ${balanceDue}.`
    : `The full price of ₵${depositAmount} is paid upfront to confirm your booking.`;

  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Focus the dialog, lock page scroll, close on Escape and keep Tab inside
  useEffect(() => {
    const el = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    el?.querySelector<HTMLButtonElement>("button")?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
      if (e.key !== "Tab" || !el) return;
      const focusable = el.querySelectorAll<HTMLElement>("button");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="bg-paper w-full max-w-[520px] max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">
          <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/50 mb-4">
            Booking Policy
          </p>
          <h2 id="terms-title" className="font-serif text-[1.75rem] font-light text-ink leading-snug mb-6">
            Before you <span className="italic">confirm.</span>
          </h2>
          <div className="flex flex-col gap-5 mb-8">
            {[
              [isRange ? "Deposit" : "Full Price", paymentLabel],
              [
                "Cancellations",
                cancellationPolicyText(isRange ? "deposit" : "payment"),
              ],
              [
                "Arriving late",
                "Please arrive on time. If you arrive more than 15 minutes late, your slot may be given to the next client.",
              ],
              [
                "Hair prep",
                "Come with clean, detangled hair unless a wash service is booked. This helps us give you the best result.",
              ],
              [
                "Changes on the day",
                "Any changes to your service on arrival may affect pricing. Our team will advise you before proceeding.",
              ],
            ].map(([title, body], i) => (
              <div key={title} className="flex gap-4">
                <span className="font-sans text-[11px] text-ink/40 tabular-nums flex-shrink-0 pt-0.5 w-5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-sans text-[15px] font-medium text-ink mb-1">
                    {title}
                  </p>
                  <p className="font-sans text-[14px] text-ink/65 leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {policy && <ServicePolicyBlock policy={policy} />}
          <div className="flex flex-col gap-3">
            <button
              onClick={onAgree}
              className="w-full bg-ink text-paper font-sans text-[12px] font-medium tracking-widest uppercase py-4 hover:bg-ink/85 active:scale-[0.98] transition-[background-color,transform] duration-150"
            >
              {isRange
                ? `I Agree, Pay ₵${depositAmount} Deposit`
                : `I Agree, Pay ₵${depositAmount} Full Price`}
            </button>
            <button
              onClick={onClose}
              className="w-full border border-ink/20 text-ink/65 font-sans text-[12px] tracking-widest uppercase py-3.5 hover:text-ink hover:border-ink/40 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServicePolicyBlock({ policy }: { policy: ServicePolicy }) {
  const body = "font-sans text-[14px] text-ink/65 leading-relaxed";
  return (
    <section aria-labelledby="service-policy-title" className="border-t border-ink/10 pt-6 mb-8">
      <p id="service-policy-title" className="font-sans text-[11px] tracking-widest2 uppercase text-ink/50 mb-2">
        {policy.title}
      </p>
      <p className={`${body} mb-5`}>{policy.intro}</p>
      <div className="flex flex-col gap-5">
        {policy.sections.map((section, i) => (
          <div key={i} className="flex flex-col gap-3">
            {section.heading && (
              <p className="font-sans text-[15px] font-medium text-ink">{section.heading}</p>
            )}
            {section.paragraphs?.map((p) => (
              <p key={p} className={body}>{p}</p>
            ))}
            {section.bullets && (
              <ul className="flex flex-col gap-3 list-disc pl-5 marker:text-ink/40">
                {section.bullets.map((b) => (
                  <li key={b} className={body}>{b}</li>
                ))}
              </ul>
            )}
            {section.numbered && (
              <ol className="flex flex-col gap-2 list-decimal pl-5 marker:text-ink/40">
                {section.numbered.map((n) => (
                  <li key={n} className={body}>{n}</li>
                ))}
              </ol>
            )}
            {section.after?.map((p) => (
              <p key={p} className={body}>{p}</p>
            ))}
          </div>
        ))}
      </div>
      <p className="font-sans text-[14px] font-medium text-ink leading-relaxed mt-5">{policy.closing}</p>
    </section>
  );
}

// ─── Step footer ──────────────────────────────────────────────────────────────

function StepFooter({
  canNext,
  onNext,
  showBack,
  onBack,
  backDisabled = false,
  nextLabel = "Continue",
}: {
  canNext: boolean;
  onNext: () => void;
  showBack: boolean;
  onBack: () => void;
  backDisabled?: boolean;
  nextLabel?: string;
}) {
  const visible = canNext || showBack;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-paper border-t border-ink/[0.07] transition-transform duration-300 ease-out"
      style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
    >
      <div className="max-w-[900px] mx-auto px-6 py-4 flex items-center gap-6">
        {showBack && (
          <button
            onClick={onBack}
            disabled={backDisabled}
            className="font-sans text-[12px] tracking-widest uppercase text-ink/55 hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!canNext}
          className="ml-auto bg-ink text-paper font-sans text-[12px] font-medium tracking-widest uppercase px-10 py-4 hover:bg-ink/85 active:scale-[0.98] transition-[background-color,transform] duration-150 disabled:opacity-25 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="py-5 sm:py-6 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 relative">
      <div className="sm:w-32 flex-shrink-0 sm:pt-1 pr-14 sm:pr-0">
        <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/50">
          {label}
        </p>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">{children}</div>
      <button
        onClick={onEdit}
        className="absolute right-0 top-5 sm:static font-sans text-[11px] tracking-widest uppercase text-ink/55 hover:text-ink border-b border-ink/20 hover:border-ink pb-px transition-colors flex-shrink-0 sm:mt-1"
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
  const [services, setServices] = useState<BookingService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [stylists, setStylists] = useState<Stylist[]>([]);

  // ── Service preview (work photos)
  const [previewPhotos, setPreviewPhotos] = useState<
    { id: string; image_url: string; caption: string | null }[]
  >([]);
  const [previewName, setPreviewName] = useState("");
  const [previewLoadingSlug, setPreviewLoadingSlug] = useState("");
  const [blockedDates, setBlocked] = useState<string[]>([]);
  const [bookedSlots, setBooked] = useState<string[]>([]);
  const [dayAvail, setDayAvail] = useState<{
    openTime: string;
    closeTime: string;
    slotInterval: number;
  } | null>(null);
  const [disabledDays, setDisabled] = useState<number[]>([]);
  const [dayStatus, setDayStatus] = useState<
    "loading" | "open" | "full" | "closed" | "error"
  >("loading");
  const [availRetry, setAvailRetry] = useState(0);

  // ── UI
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [inspoUploading, setInspoUploading] = useState(false);

  // ── Booking state
  const [booking, setBooking] = useState<BookingState>({
    serviceId: preselected,
    optionId: "",
    hairUnitType: "",
    customizationType: "",
    unitPhotos: [],
    inspoPhotos: [],
    bundleCount: null,
    isEmergency: false,
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
  const [lookingUp, setLookingUp] = useState(false);
  const [foundClient, setFoundClient] = useState<{
    firstName: string;
  } | null>(null);
  const phoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeSectionRef = useRef<HTMLDivElement>(null);

  // ── Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  // ── Derived
  const selectedService = services.find((s) => s.id === booking.serviceId);
  // Arriving from a service's "Book" link shows just that service, until the
  // client asks to see the rest.
  const [showAllServices, setShowAllServices] = useState(false);
  const hasValidPreselect =
    !showAllServices && !!preselected && services.some((s) => s.id === preselected);
  const visibleServices = hasValidPreselect
    ? services.filter((s) => s.id === preselected)
    : services;
  const preselectedService = hasValidPreselect ? visibleServices[0] : undefined;

  const preview = useLightboxSwipe(previewPhotos.length);
  const previewCurrent =
    preview.lightboxIndex !== null ? previewPhotos[preview.lightboxIndex] : null;

  const openPreview = useCallback(async (svc: BookingService) => {
    setPreviewName(svc.name);
    setPreviewPhotos([]);
    setPreviewLoadingSlug(svc.id);
    let works: { id: string; image_url: string; caption: string | null }[] = [];
    try {
      const res = await fetch(`/api/works?service=${svc.id}`);
      const data = await res.json();
      if (Array.isArray(data.works)) works = data.works;
    } catch {
      // Fall through to the service's own photo below
    } finally {
      setPreviewLoadingSlug("");
    }
    // Always show something: the service's main photo when no work photos load
    if (works.length === 0 && svc.image_url)
      works = [{ id: "main", image_url: svc.image_url, caption: null }];
    setPreviewPhotos(works);
    if (works.length > 0) preview.open(0);
  }, [preview]);

  const selectedOption = selectedService?.options.find(
    (o) => o.id === booking.optionId,
  );
  const baseDeposit = selectedOption?.price_raw ?? 0;
  const isRange = isPriceRange(selectedOption?.price);
  const emailInvalid =
    booking.email.length > 0 && !EMAIL_REGEX.test(booking.email.trim());
  const phoneComplete = isPhoneComplete(booking.phone);
  // Per-service hair rules. A saved choice this service doesn't offer (after
  // switching service, or from an old draft) counts as unanswered.
  const rules = getServiceRules(booking.serviceId);
  const hairUnitType = rules.hairOptions.some((o) => o.id === booking.hairUnitType)
    ? booking.hairUnitType
    : "";
  const customizationType = rules.customization ? booking.customizationType : "";
  const bundleCount = rules.askBundles ? booking.bundleCount : null;
  const showUnitStep = bringsHair(hairUnitType);
  const {
    customizationFee,
    emergencyFee,
    subtotal,
    serviceCharge: serviceFee,
    total: totalDeposit,
  } = bookingTotals({
    base: baseDeposit,
    stylistAdj: booking.stylistFeeAdj,
    // Some services settle Standard / Express with the salon, not online
    customizationType: rules.customizationFees ? customizationType : null,
    isEmergency: booking.isEmergency,
  });
  const allTimeSlots = booking.isEmergency
    ? DEFAULT_SLOTS
    : dayAvail
      ? generateTimeSlots(
          dayAvail.openTime,
          dayAvail.closeTime,
          dayAvail.slotInterval,
        )
      : DEFAULT_SLOTS;
  // Hide times that have already passed when booking for today
  const isToday = !!booking.date && toDateStr(booking.date) === todayInAccra();
  const nowMins = nowMinutesInAccra();
  const timeSlots = isToday
    ? allTimeSlots
        .map((g) => ({
          ...g,
          slots: g.slots.filter((s) => (slotToMinutes(s) ?? 0) > nowMins),
        }))
        .filter((g) => g.slots.length > 0)
    : allTimeSlots;

  // ── Step layout (Customization step only shown when new/existing unit)
  // Actual step indices stay fixed (0 Service, 1 Hair, 2 Customization,
  // 3 Stylist, 4 Schedule, 5 Details, 6 Review) — stylist is chosen before
  // schedule so slot availability can be filtered to that stylist.
  const stepLabels = showUnitStep
    ? [
        "Service",
        "Hair",
        rules.unitStepLabel,
        "Stylist",
        "Schedule",
        "Details",
        "Review",
      ]
    : ["Service", "Hair", "Stylist", "Schedule", "Details", "Review"];
  const totalSteps = stepLabels.length;
  // Map actual step index → bar index (customization step = index 2 only exists when showUnitStep)
  const barIndex = step <= 1 ? step : showUnitStep ? step : step - 1;
  const stepNum = step <= 2 || showUnitStep ? step + 1 : step;
  // Map bar index → actual step (for click handlers)
  const barToStep = (i: number) =>
    showUnitStep ? i : i <= 1 ? i : i + 1;

  // ── Restore a saved draft after a refresh. Coming back from an unfinished
  // payment (?resume=1) lands on Review so the client can pay again in one tap.
  const [draftChecked, setDraftChecked] = useState(false);
  useEffect(() => {
    const draft = loadDraft();
    // A "Book" link for a different service starts fresh
    if (draft && (!preselected || draft.booking.serviceId === preselected)) {
      let { booking: saved, step: savedStep } = draft;
      // A date that has since passed can't be booked
      if (saved.date && toDateStr(saved.date) < todayInAccra()) {
        saved = { ...saved, date: null, time: "" };
        savedStep = Math.min(savedStep, 4);
      }
      setBooking(saved);
      setStep(searchParams.get("resume") === "1" && saved.date ? 6 : savedStep);
    }
    setDraftChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Autosave (only once the saved draft has been read, so it isn't overwritten)
  useEffect(() => {
    if (draftChecked) saveDraft(booking, step);
  }, [booking, step, draftChecked]);

  // ── Back button from Paystack restores this page from the browser's cache
  // with "Processing…" still showing. Unlock it.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setSubmitting(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // ── Fetch on mount
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d: DbService[]) => {
        if (Array.isArray(d)) setServices(d.map(dbToBookingService));
      })
      .catch(() => {})
      .finally(() => setLoadingServices(false));

    fetch("/api/stylists")
      .then((r) => r.json())
      .then((d: Stylist[]) => {
        if (Array.isArray(d)) setStylists(d);
      })
      .catch(() => {});

    fetch("/api/availability/blocked")
      .then((r) => r.json())
      .then((d: { date: string }[]) => {
        if (Array.isArray(d)) setBlocked(d.map((x) => x.date));
      })
      .catch(() => {});

    fetch("/api/availability/settings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const off = (data as { day_of_week: number; is_available: boolean }[])
            .filter((d) => !d.is_available)
            .map((d) => d.day_of_week);
          setDisabled(off);
        }
      })
      .catch(() => {});
  }, []);

  // ── Fetch slots when date, stylist or service changes. Each stylist has
  // their own slots, and the option's duration decides which start times fit.
  useEffect(() => {
    if (!booking.date) return;
    const dateStr = toDateStr(booking.date);
    const params = new URLSearchParams({ date: dateStr });
    if (booking.stylistId) params.set("stylistId", booking.stylistId);
    if (booking.serviceId) params.set("serviceId", booking.serviceId);
    if (booking.optionId) params.set("optionId", booking.optionId);
    if (booking.isEmergency) params.set("emergency", "1");
    // Clear the previous day's slots so they never show against the new date,
    // and ignore responses that arrive after the client picked another day.
    let stale = false;
    setBooked([]);
    setDayAvail(null);
    setDayStatus("loading");
    fetch(`/api/availability?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("availability failed");
        return r.json();
      })
      .then((data) => {
        if (stale) return;
        setBooked(Array.isArray(data.bookedSlots) ? data.bookedSlots : []);
        if (data.openTime)
          setDayAvail({
            openTime: data.openTime,
            closeTime: data.closeTime,
            slotInterval: data.slotInterval ?? 60,
          });
        setDayStatus(
          data.available ? "open" : data.dayFull ? "full" : "closed",
        );
      })
      .catch(() => {
        if (!stale) setDayStatus("error");
      });
    return () => {
      stale = true;
    };
  }, [booking.date, booking.stylistId, booking.serviceId, booking.optionId, booking.isEmergency, availRetry]);

  // A different option can make the picked time too long to fit, so drop it
  useEffect(() => {
    setBooking((b) => (b.time && bookedSlots.includes(b.time) ? { ...b, time: "" } : b));
  }, [bookedSlots]);

  // ── Phone lookup with debounce
  useEffect(() => {
    const phone = booking.phone.trim();
    setFoundClient(null);
    if (!isPhoneComplete(phone)) return;
    let stale = false;
    phoneTimer.current = setTimeout(async () => {
      setLookingUp(true);
      try {
        const res = await fetch(
          `/api/bookings/lookup?phone=${encodeURIComponent(phone)}`,
        );
        const data = await res.json();
        const firstName = String(data.client?.firstName ?? "").trim();
        if (stale || !firstName) return;
        setFoundClient({ firstName });
        // The lookup only shares a first name (it's public), and only fills
        // the field if the client hasn't typed one
        setBooking((b) => ({
          ...b,
          firstName: b.firstName.trim() ? b.firstName : firstName,
        }));
      } catch {
        // Lookup is a convenience; the client can always type their details
      } finally {
        if (!stale) setLookingUp(false);
      }
    }, 600);
    return () => {
      stale = true;
      if (phoneTimer.current) clearTimeout(phoneTimer.current);
      setLookingUp(false);
    };
  }, [booking.phone]);

  const set = useCallback(
    <K extends keyof BookingState>(key: K, val: BookingState[K]) => {
      setBooking((b) => ({ ...b, [key]: val }));
    },
    [],
  );

  // ── Navigation with fade
  // Editing from Review (Edit links, step bar, Back) sets returnToReview, so
  // Continue jumps straight back to Review unless a later step now needs input.
  const [returnToReview, setReturnToReview] = useState(false);
  const goTo = (target: number) => {
    if (target === step) return;
    if (target === 6) setReturnToReview(false);
    else if (step === 6) setReturnToReview(true);
    setVisible(false);
    setTimeout(() => {
      setStep(target);
      // Start each step at the top; jump while faded out so it isn't seen
      window.scrollTo({ top: 0, behavior: "instant" });
      setVisible(true);
    }, 230);
  };
  const next = () => {
    if (returnToReview) goTo(firstIncompleteFrom(step + 1));
    // Skip the unit step (2) when hair = "none"
    else if (step === 1 && !showUnitStep) goTo(3);
    else goTo(step + 1);
  };
  const back = () => {
    // Skip back over the unit step (2) when hair = "none"
    if (step === 3 && !showUnitStep) goTo(1);
    else goTo(step - 1);
  };

  // ── Validation
  function stepDone(s: number) {
    if (s === 0) return !!booking.serviceId && !!booking.optionId;
    if (s === 1) return !!hairUnitType;
    if (s === 2)
      return (
        (!rules.customization || !!customizationType) &&
        (!rules.askBundles || !!bundleCount) &&
        booking.unitPhotos.length > 0 &&
        (!rules.inspoPhoto || booking.inspoPhotos.length > 0) &&
        !photoUploading &&
        !inspoUploading
      );
    if (s === 3) return true;
    if (s === 4) return !!booking.date && !!booking.time;
    if (s === 5)
      return (
        !!booking.firstName.trim() &&
        phoneComplete &&
        EMAIL_REGEX.test(booking.email.trim())
      );
    return false;
  }
  const canNext = () => stepDone(step);
  // The first step from `from` that still needs input, or 6 (Review)
  function firstIncompleteFrom(from: number) {
    for (let s = from; s <= 5; s++) {
      if (s === 2 && !showUnitStep) continue;
      if (!stepDone(s)) return s;
    }
    return 6;
  }

  // ── Payment
  const handlePayNow = async () => {
    setShowTerms(false);
    setSubmitting(true);
    setSubmitError("");

    let data: { bookingId?: string; paystackUrl?: string; error?: string };
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
          bookingDate: booking.date ? toDateStr(booking.date) : undefined,
          timeSlot: booking.time,
          notes: booking.notes || null,
          stylistId: booking.stylistId || null,
          stylistName: booking.stylistId ? booking.stylistName : null,
          stylistFeeAdjustment: booking.stylistFeeAdj,
          hairUnitType: hairUnitType || null,
          unitPhotos: showUnitStep ? booking.unitPhotos : [],
          inspoPhotos: showUnitStep && rules.inspoPhoto ? booking.inspoPhotos : [],
          bundleCount,
          customizationType: customizationType || null,
          isEmergency: booking.isEmergency,
          customizationFee,
          emergencyFee,
          serviceFee,
        }),
      });
      data = await res.json();
    } catch {
      setSubmitError(
        "Network error. Please check your connection and try again.",
      );
      setSubmitting(false);
      return;
    }

    if (!data.paystackUrl) {
      setSubmitError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    saveDraft(booking, step);
    window.location.href = data.paystackUrl;
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-paper pt-[72px]">
      {/* Step bar — sticks just below fixed Nav (72px tall) */}
      <div className="sticky top-[72px] z-30 bg-paper border-b border-ink/[0.07]">
        {/* Mobile and tablet: current step + progress bar */}
        <div className="lg:hidden max-w-[900px] mx-auto px-6 pt-4 pb-3">
          <div className="flex items-baseline justify-between mb-2.5">
            <p className="font-sans text-[12px] font-medium tracking-widest uppercase text-ink">
              {stepLabels[barIndex]}
            </p>
            <p className="font-sans text-[12px] text-ink/50 tabular-nums">
              {barIndex + 1} / {totalSteps}
            </p>
          </div>
          <div className="h-[2px] bg-ink/[0.08]">
            <div
              className="h-full bg-ink transition-[width] duration-500 ease-out"
              style={{ width: `${((barIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        <div className="hidden lg:block max-w-[900px] mx-auto px-6 py-4 overflow-x-auto">
          <div className="flex items-center">
            {stepLabels.map((label, i) => (
              <div key={label} className="contents">
                <button
                  disabled={i > barIndex}
                  onClick={() => i < barIndex && goTo(barToStep(i))}
                  className="flex items-center gap-2 flex-shrink-0 group disabled:cursor-default"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-sans text-[11px] tabular-nums flex-shrink-0 transition-all duration-300 ${
                      i <= barIndex
                        ? "bg-ink text-paper"
                        : "border border-ink/25 text-ink/45"
                    }`}
                  >
                    {i < barIndex ? (
                      <svg width="10" height="10" viewBox="0 0 8 8" fill="none">
                        <path
                          d="M1.5 4l2 2 3-3"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={`font-sans text-[11px] tracking-widest uppercase transition-colors duration-300 ${
                      i === barIndex
                        ? "text-ink font-medium"
                        : i < barIndex
                          ? "text-ink/60 group-hover:text-ink"
                          : "text-ink/35"
                    }`}
                  >
                    {label}
                  </span>
                </button>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`flex-1 min-w-3 h-px mx-2.5 transition-colors duration-300 ${i < barIndex ? "bg-ink/40" : "bg-ink/[0.12]"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="max-w-[900px] mx-auto px-6 py-12 md:py-16 pb-32"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? undefined : "translateY(10px)",
          transition: "opacity 230ms ease, transform 230ms ease",
        }}
      >
        {/* ─ STEP 0: Service ─────────────────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/50 mb-4">
              Step 1 of {totalSteps}
            </p>

            {loadingServices ? (
              <>
                <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-10">
                  Choose your <span className="italic">service.</span>
                </h2>
                <div className="flex flex-col gap-2.5 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border border-ink/15 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="h-2.5 w-20 bg-ink/[0.08] rounded-sm mb-3" />
                          <div className="h-3 w-2/3 max-w-xs bg-ink/[0.06] rounded-sm" />
                        </div>
                        <div className="w-4 h-4 rounded-full border border-ink/15 flex-shrink-0 mt-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : hasValidPreselect && preselectedService ? (
              <>
                <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-10">
                  {displayName(preselectedService.name)}
                  <span className="italic">.</span>
                </h2>

                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  {preselectedService.image_url && (
                    <button
                      onClick={() => openPreview(preselectedService)}
                      disabled={previewLoadingSlug === preselectedService.id}
                      className="relative w-full md:w-2/5 aspect-square md:aspect-auto flex-shrink-0 overflow-hidden bg-mist group border border-ink/15"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preselectedService.image_url}
                        alt={preselectedService.name}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/25 transition-all duration-300 ease-out flex items-center justify-center">
                        {previewLoadingSlug === preselectedService.id ? (
                          <span className="w-5 h-5 rounded-full border border-paper/40 border-t-paper animate-spin" />
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 ease-out">
                            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                              <circle cx="11" cy="11" r="10" stroke="white" strokeOpacity="0.6" strokeWidth="0.8"/>
                              <path d="M11 7v8M7 11h8" stroke="white" strokeOpacity="0.9" strokeWidth="1" strokeLinecap="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="absolute bottom-2 right-2 font-sans text-[10px] tracking-widest uppercase text-paper bg-ink/60 px-2 py-1">
                        View photos
                      </span>
                    </button>
                  )}

                  {preselectedService.options.length > 0 && (
                    <div className="border border-ink/15 flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 divide-y sm:divide-y-0 sm:divide-x md:divide-x-0 md:divide-y divide-ink/[0.07]">
                        {preselectedService.options.map((opt) => (
                          <OptionTile
                            key={opt.id}
                            opt={opt}
                            selected={booking.optionId === opt.id}
                            onSelect={() => set("optionId", opt.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowAllServices(true)}
                  className="mt-6 font-sans text-[12px] tracking-widest uppercase text-ink/60 hover:text-ink border-b border-ink/25 hover:border-ink pb-px transition-colors"
                >
                  See all services
                </button>
              </>
            ) : (
              <>
                <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-10">
                  Choose your <span className="italic">service.</span>
                </h2>
                <div className="flex flex-col gap-3">
                  {visibleServices.map((svc) => {
                    const selected = booking.serviceId === svc.id;
                    return (
                    <div
                      key={svc.id}
                      className={`border transition-[border-color,box-shadow] duration-200 ${
                        selected
                          ? "border-ink shadow-[0_4px_20px_rgba(26,33,43,0.08)]"
                          : "border-ink/15 hover:border-ink/40 hover:shadow-[0_2px_14px_rgba(26,33,43,0.06)]"
                      }`}
                    >
                      <div className="flex items-stretch">
                        {/* Compact thumbnail: opens the work photos. The rest
                            of the row selects the service. */}
                        {svc.image_url && (
                          <button
                            onClick={() => openPreview(svc)}
                            disabled={previewLoadingSlug === svc.id}
                            aria-label={`View photos of ${svc.name}`}
                            className="relative self-stretch w-24 sm:w-32 md:w-40 min-h-24 sm:min-h-32 flex-shrink-0 overflow-hidden bg-mist group"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={svc.image_url}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/25 transition-all duration-300 ease-out flex items-center justify-center">
                              {previewLoadingSlug === svc.id && (
                                <span className="w-5 h-5 rounded-full border border-paper/40 border-t-paper animate-spin" />
                              )}
                            </div>
                            <span className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 font-sans text-[9px] sm:text-[10px] tracking-widest uppercase text-paper bg-ink/60 px-1.5 py-0.5 sm:px-2 sm:py-1">
                              Photos
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (selected) return;
                            // Hair answers belong to the previous service's questions
                            setBooking((b) => ({
                              ...b,
                              serviceId: svc.id,
                              optionId: "",
                              hairUnitType: "",
                              customizationType: "",
                              unitPhotos: [],
                              inspoPhotos: [],
                              bundleCount: null,
                            }));
                          }}
                          aria-pressed={selected}
                          className="flex-1 min-w-0 text-left p-4 sm:p-6"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <span className="block font-sans text-[11px] tracking-widest text-ink/40 tabular-nums mb-1.5">
                                {svc.number}
                              </span>
                              <span className="block font-serif text-[1.375rem] sm:text-[1.625rem] text-ink leading-tight">
                                {displayName(svc.name)}
                              </span>
                              {/* Description stays collapsed until the service
                                  is chosen, keeping the list compact. */}
                              {svc.description && (
                                <div
                                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                                    selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                  }`}
                                >
                                  <div className="overflow-hidden">
                                    <p className="font-sans text-[13px] sm:text-[14px] text-ink/65 leading-relaxed pt-2">
                                      {svc.description}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <span
                              className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-1 transition-colors duration-200 ${
                                selected ? "border-ink bg-ink" : "border-ink/30"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full bg-paper transition-transform duration-200 ${selected ? "scale-100" : "scale-0"}`}
                              />
                            </span>
                          </div>
                        </button>
                      </div>

                      {selected && svc.options.length > 0 && (
                        <div className="border-t border-ink/15 motion-safe:animate-reveal">
                          <p className="px-5 pt-4 font-sans text-[11px] tracking-widest2 uppercase text-ink/50">
                            Choose an option
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 mt-1 [&>*]:border-ink/[0.08] [&>*+*]:border-t sm:[&>*:nth-child(2)]:border-t-0 sm:[&>*:nth-child(odd)]:border-r">
                            {svc.options.map((opt) => (
                              <OptionTile
                                key={opt.id}
                                opt={opt}
                                selected={booking.optionId === opt.id}
                                onSelect={() => set("optionId", opt.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─ STEP 1: Hair ────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/50 mb-4">
              Step 2 of {totalSteps}
            </p>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-3">
              {rules.hairTitle.lead}{" "}
              <span className="italic">{rules.hairTitle.italic}</span>
            </h2>
            <p className="font-sans text-[15px] text-ink/65 mb-10 max-w-md leading-relaxed">
              {rules.hairQuestion}
            </p>

            <div
              className={`grid grid-cols-1 gap-3 mb-10 ${rules.hairOptions.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
            >
              {rules.hairOptions.map((opt) => (
                <button
                  key={opt.id}
                  aria-pressed={hairUnitType === opt.id}
                  onClick={() => {
                    set("hairUnitType", opt.id);
                    if (opt.id === "none") {
                      set("customizationType", "");
                      set("unitPhotos", []);
                      set("inspoPhotos", []);
                      set("bundleCount", null);
                    }
                  }}
                  className={`flex flex-col text-left border p-6 sm:p-7 transition-[background-color,border-color,box-shadow] duration-200 ${
                    hairUnitType === opt.id
                      ? "border-ink bg-ink"
                      : "border-ink/15 hover:border-ink/40 hover:shadow-[0_2px_14px_rgba(26,33,43,0.06)]"
                  }`}
                >
                  <HairIcon
                    icon={opt.icon}
                    className={`mb-4 block ${hairUnitType === opt.id ? "text-paper/60" : "text-ink/45"}`}
                  />
                  <p
                    className={`font-sans text-[16px] font-medium mb-1 ${hairUnitType === opt.id ? "text-paper" : "text-ink"}`}
                  >
                    {opt.label}
                  </p>
                  <p
                    className={`font-sans text-[14px] ${hairUnitType === opt.id ? "text-paper/70" : "text-ink/60"}`}
                  >
                    {opt.sub}
                  </p>
                </button>
              ))}
            </div>

            {rules.hairNote && (
              <p className="font-sans text-[14px] text-ink/65 -mt-4 mb-10">
                {rules.hairNote}{" "}
                <a
                  href={SALON_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink border-b border-ink/40 hover:border-ink transition-colors"
                >
                  Message us on WhatsApp
                </a>
              </p>
            )}
          </div>
        )}

        {/* ─ STEP 2: Unit (customization / extensions) ───────────────────────── */}
        {step === 2 && (
          <div>
            <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/50 mb-4">
              Step 3 of {totalSteps}
            </p>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-3">
              {rules.unitStepTitle.lead}{" "}
              <span className="italic">{rules.unitStepTitle.italic}</span>
            </h2>
            <p className="font-sans text-[15px] text-ink/65 mb-10 max-w-md leading-relaxed">
              {rules.unitStepIntro}
            </p>

            {rules.customization && (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              <button
                onClick={() => set("customizationType", "standard")}
                aria-pressed={customizationType === "standard"}
                className={`flex flex-col text-left border p-6 sm:p-7 transition-[background-color,border-color,box-shadow] duration-200 ${
                  customizationType === "standard"
                    ? "border-ink bg-ink"
                    : "border-ink/15 hover:border-ink/40 hover:shadow-[0_2px_14px_rgba(26,33,43,0.06)]"
                }`}
              >
                <IconClock
                  className={`mb-4 block ${customizationType === "standard" ? "text-paper/60" : "text-ink/45"}`}
                />
                <p
                  className={`font-sans text-[16px] font-medium mb-1 ${customizationType === "standard" ? "text-paper" : "text-ink"}`}
                >
                  Standard
                </p>
                <p
                  className={`font-sans text-[14px] leading-relaxed mb-4 ${customizationType === "standard" ? "text-paper/70" : "text-ink/60"}`}
                >
                  {rules.customizationCopy.standard.sub}
                </p>
                {rules.customizationFees && (
                  <p
                    className={`mt-auto font-sans text-[15px] font-medium tabular-nums ${customizationType === "standard" ? "text-paper" : "text-ink"}`}
                  >
                    +₵{CUSTOMIZATION_FEES.standard}
                  </p>
                )}
              </button>

              <button
                onClick={() => set("customizationType", "express")}
                aria-pressed={customizationType === "express"}
                className={`flex flex-col text-left border p-6 sm:p-7 transition-[background-color,border-color,box-shadow] duration-200 ${
                  customizationType === "express"
                    ? "border-ink bg-ink"
                    : "border-ink/15 hover:border-ink/40 hover:shadow-[0_2px_14px_rgba(26,33,43,0.06)]"
                }`}
              >
                <IconBolt
                  className={`mb-4 block ${customizationType === "express" ? "text-paper/60" : "text-ink/45"}`}
                />
                <p
                  className={`font-sans text-[16px] font-medium mb-1 ${customizationType === "express" ? "text-paper" : "text-ink"}`}
                >
                  Express
                </p>
                <p
                  className={`font-sans text-[14px] leading-relaxed mb-4 ${customizationType === "express" ? "text-paper/70" : "text-ink/60"}`}
                >
                  {rules.customizationCopy.express.sub}
                </p>
                <p
                  className={`mt-auto font-sans text-[15px] font-medium tabular-nums ${customizationType === "express" ? "text-paper" : "text-ink"}`}
                >
                  {rules.customizationFees
                    ? `+₵${CUSTOMIZATION_FEES.express}`
                    : "Extra cost applies"}
                </p>
              </button>
            </div>

            {customizationType && (
              <div
                className={`border p-5 mb-10 flex gap-3 motion-safe:animate-reveal ${customizationType === "standard" ? "border-ink/10 bg-ink/[0.02]" : "border-amber-200 bg-amber-50/60"}`}
              >
                <span className="text-[0.95rem] flex-shrink-0 text-ink/45">
                  ℹ
                </span>
                <p className="font-sans text-[14px] text-ink/70 leading-relaxed">
                  {rules.customizationCopy[customizationType].info}
                </p>
              </div>
            )}
            </>
            )}

            <div className="border border-ink/10 p-6 mb-10">
              <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 mb-2">
                {rules.photoLabel}{" "}
                <span className="normal-case tracking-normal text-red-500/80">
                  *required
                </span>
              </p>
              <p className="font-sans text-[14px] text-ink/65 mb-5 leading-relaxed">
                {rules.photoHelp}
              </p>
              <PhotoUpload
                photos={booking.unitPhotos}
                onAdd={(url) =>
                  setBooking((b) => ({ ...b, unitPhotos: [...b.unitPhotos, url] }))
                }
                onRemove={(i) =>
                  setBooking((b) => ({
                    ...b,
                    unitPhotos: b.unitPhotos.filter((_, j) => j !== i),
                  }))
                }
                onUploadingChange={setPhotoUploading}
              />
            </div>

            {rules.inspoPhoto && (
              <div className="border border-ink/10 p-6 mb-10">
                <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 mb-2">
                  {rules.inspoPhoto.label}{" "}
                  <span className="normal-case tracking-normal text-red-500/80">
                    *required
                  </span>
                </p>
                <p className="font-sans text-[14px] text-ink/65 mb-5 leading-relaxed">
                  {rules.inspoPhoto.help}
                </p>
                <PhotoUpload
                  photos={booking.inspoPhotos}
                  onAdd={(url) =>
                    setBooking((b) => ({ ...b, inspoPhotos: [...b.inspoPhotos, url] }))
                  }
                  onRemove={(i) =>
                    setBooking((b) => ({
                      ...b,
                      inspoPhotos: b.inspoPhotos.filter((_, j) => j !== i),
                    }))
                  }
                  onUploadingChange={setInspoUploading}
                />
              </div>
            )}

            {rules.askBundles && (
              <div className="border border-ink/10 p-6 mb-10">
                <p
                  id="bundle-count-label"
                  className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 mb-2"
                >
                  How many bundles?{" "}
                  <span className="normal-case tracking-normal text-red-500/80">
                    *required
                  </span>
                </p>
                <p className="font-sans text-[14px] text-ink/65 mb-5 leading-relaxed">
                  So your stylist knows what to expect. It doesn&apos;t change
                  the price.
                </p>
                <div
                  role="group"
                  aria-labelledby="bundle-count-label"
                  className="grid grid-cols-6 gap-2 max-w-sm"
                >
                  {BUNDLE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => set("bundleCount", n)}
                      aria-pressed={bundleCount === n}
                      aria-label={`${n} bundle${n > 1 ? "s" : ""}`}
                      className={`aspect-square flex items-center justify-center border font-sans text-[16px] font-medium tabular-nums transition-colors duration-150 ${
                        bundleCount === n
                          ? "bg-ink text-paper border-ink"
                          : "border-ink/20 text-ink hover:border-ink/60 hover:bg-mist"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─ STEP 4: Schedule ────────────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/50 mb-4">
              Step {stepNum} of {totalSteps}
            </p>
            <h2
              className={`font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none ${rules.scheduleNote ? "mb-3" : "mb-10"}`}
            >
              Pick a <span className="italic">date & time.</span>
            </h2>
            {rules.scheduleNote && (
              <p className="font-sans text-[15px] text-ink/65 mb-10 max-w-md leading-relaxed">
                {rules.scheduleNote}
              </p>
            )}

            {/* Emergency toggle */}
            <div className="mb-10">
              <button
                aria-pressed={booking.isEmergency}
                onClick={() => {
                  const toggled = !booking.isEmergency;
                  setBooking((b) => ({
                    ...b,
                    isEmergency: toggled,
                    date: null,
                    time: "",
                  }));
                }}
                className={`w-full text-left border p-5 sm:p-6 transition-[background-color,border-color,box-shadow] duration-200 flex items-center gap-4 cursor-pointer ${
                  booking.isEmergency
                    ? "border-ink bg-ink"
                    : "border-ink/15 bg-mist hover:border-ink/40 hover:shadow-[0_2px_14px_rgba(26,33,43,0.06)]"
                }`}
              >
                <IconBolt
                  className={`flex-shrink-0 ${booking.isEmergency ? "text-paper/60" : "text-ink/50"}`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-sans text-[16px] font-medium mb-1 ${booking.isEmergency ? "text-paper" : "text-ink"}`}
                  >
                    Emergency Booking
                  </p>
                  <p
                    className={`font-sans text-[14px] ${booking.isEmergency ? "text-paper/70" : "text-ink/60"}`}
                  >
                    Book any date & time, priority handling.{" "}
                    <span
                      className={`font-medium tabular-nums ${booking.isEmergency ? "text-paper" : "text-ink"}`}
                    >
                      +₵{EMERGENCY_FEE}
                    </span>
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 font-sans text-[11px] font-medium tracking-widest uppercase px-3.5 py-2 border transition-colors duration-200 ${
                    booking.isEmergency
                      ? "border-paper/30 text-paper"
                      : "border-ink/30 text-ink bg-paper"
                  }`}
                >
                  {booking.isEmergency ? "Added ✓" : "Add"}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14">
              <div>
                <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 mb-5">
                  Date
                </p>
                <MiniCalendar
                  selected={booking.date}
                  onSelect={(d) => {
                    set("date", d);
                    set("time", "");
                    setTimeout(
                      () =>
                        timeSectionRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        }),
                      80,
                    );
                  }}
                  blocked={booking.isEmergency ? [] : blockedDates}
                  disabledDays={booking.isEmergency ? [] : disabledDays}
                />
                {booking.date && (
                  <p className="font-sans text-[14px] font-medium text-ink mt-4">
                    {formatDate(booking.date)}
                  </p>
                )}
              </div>

              <div ref={timeSectionRef} className="scroll-mt-36">
                <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 mb-5">
                  Time
                </p>
                {!booking.date ? (
                  <p className="font-sans text-[14px] text-ink/55 mt-2">
                    Select a date first
                  </p>
                ) : dayStatus === "loading" ? (
                  <p className="font-sans text-[14px] text-ink/55 mt-2">
                    Checking available times…
                  </p>
                ) : dayStatus === "error" ? (
                  <div className="mt-2">
                    <p className="font-sans text-[14px] text-ink/70 mb-3">
                      We couldn&apos;t load times for this day.
                    </p>
                    <button
                      onClick={() => setAvailRetry((n) => n + 1)}
                      className="font-sans text-[12px] tracking-widest uppercase text-ink border-b border-ink pb-px hover:opacity-60 transition-opacity"
                    >
                      Try again
                    </button>
                  </div>
                ) : dayStatus === "full" ? (
                  <p className="font-sans text-[14px] text-ink/70 mt-2 leading-relaxed">
                    {booking.stylistId
                      ? `${booking.stylistName} is fully booked on this day. Please choose another date or stylist.`
                      : "This day is fully booked. Please choose another date."}
                  </p>
                ) : dayStatus === "closed" && !booking.isEmergency ? (
                  <p className="font-sans text-[14px] text-ink/70 mt-2">
                    We&apos;re closed on this day. Please choose another date.
                  </p>
                ) : timeSlots.length === 0 ? (
                  <p className="font-sans text-[14px] text-ink/70 mt-2">
                    No times left today. Please choose another date.
                  </p>
                ) : (
                  <div className="flex flex-col gap-5">
                    {timeSlots.map((group) => (
                      <div key={group.period}>
                        <p className="font-sans text-[11px] tracking-widest uppercase text-ink/50 mb-3">
                          {group.period}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.slots.map((slot) => {
                            const taken = bookedSlots.includes(slot);
                            return (
                              <button
                                key={slot}
                                disabled={taken}
                                onClick={() => set("time", slot)}
                                aria-pressed={booking.time === slot}
                                className={`font-sans text-[14px] tabular-nums px-4 py-2.5 border transition-colors duration-150 ${
                                  booking.time === slot
                                    ? "bg-ink text-paper border-ink"
                                    : taken
                                      ? "text-ink/25 border-ink/[0.08] cursor-not-allowed line-through"
                                      : "border-ink/20 text-ink hover:border-ink/60 hover:bg-mist"
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
          </div>
        )}

        {/* ─ STEP 3: Stylist ─────────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/50 mb-4">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-10">
              Choose your <span className="italic">stylist.</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {/* Any Available */}
              <button
                onClick={() =>
                  setBooking((b) => ({
                    ...b,
                    stylistId: "",
                    stylistName: "Any Available",
                    stylistFeeAdj: 0,
                    date: null,
                    time: "",
                  }))
                }
                aria-pressed={booking.stylistId === ""}
                className={`relative text-left border p-5 sm:p-6 transition-[background-color,border-color,box-shadow] duration-200 cursor-pointer flex items-center gap-4 pr-12 sm:pr-6 sm:flex-col sm:items-start sm:gap-0 ${
                  booking.stylistId === ""
                    ? "border-ink bg-ink"
                    : "border-ink/15 hover:border-ink/40 hover:shadow-[0_2px_14px_rgba(26,33,43,0.06)]"
                }`}
              >
                <SelectBadge selected={booking.stylistId === ""} />
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-full flex items-center justify-center sm:mb-5 ${booking.stylistId === "" ? "bg-paper/15" : "bg-mist border border-ink/[0.08]"}`}
                >
                  <IconPerson
                    className={
                      booking.stylistId === "" ? "text-paper/70" : "text-ink/50"
                    }
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col self-stretch justify-center sm:justify-start">
                <p
                  className={`font-sans text-[16px] font-medium mb-1 ${booking.stylistId === "" ? "text-paper" : "text-ink"}`}
                >
                  Any Available
                </p>
                <p
                  className={`font-sans text-[14px] ${booking.stylistId === "" ? "text-paper/70" : "text-ink/60"}`}
                >
                  We'll assign the best fit
                </p>
                <p
                  className={`sm:mt-auto pt-2 sm:pt-5 font-sans text-[14px] font-medium ${booking.stylistId === "" ? "text-paper/80" : "text-ink/55"}`}
                >
                  No additional fee
                </p>
                </div>
              </button>

              {stylists.map((s) => (
                <button
                  key={s.id}
                  onClick={() =>
                    setBooking((b) => ({
                      ...b,
                      stylistId: s.id,
                      stylistName: s.name,
                      stylistFeeAdj: s.fee_adjustment,
                      date: null,
                      time: "",
                    }))
                  }
                  aria-pressed={booking.stylistId === s.id}
                  className={`relative text-left border p-5 sm:p-6 transition-[background-color,border-color,box-shadow] duration-200 cursor-pointer flex items-center gap-4 pr-12 sm:pr-6 sm:flex-col sm:items-start sm:gap-0 ${
                    booking.stylistId === s.id
                      ? "border-ink bg-ink"
                      : "border-ink/15 hover:border-ink/40 hover:shadow-[0_2px_14px_rgba(26,33,43,0.06)]"
                  }`}
                >
                  <SelectBadge selected={booking.stylistId === s.id} />
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-full overflow-hidden sm:mb-5 bg-mist">
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photo_url}
                        alt={s.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center ${booking.stylistId === s.id ? "bg-paper/15" : "bg-mist border border-ink/[0.08] rounded-full"}`}
                      >
                        <span
                          className={`font-serif text-[1.5rem] tracking-wide ${booking.stylistId === s.id ? "text-paper/80" : "text-ink/60"}`}
                        >
                          {initials(s.name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col self-stretch justify-center sm:justify-start">
                  <p
                    className={`font-sans text-[16px] font-medium mb-1 ${booking.stylistId === s.id ? "text-paper" : "text-ink"}`}
                  >
                    {displayName(s.name)}
                  </p>
                  <p
                    className={`font-sans text-[14px] ${booking.stylistId === s.id ? "text-paper/70" : "text-ink/60"}`}
                  >
                    {s.title}
                  </p>
                  {s.fee_adjustment !== 0 && (
                    <p
                      className={`sm:mt-auto pt-2 sm:pt-5 font-sans text-[14px] font-medium tabular-nums ${booking.stylistId === s.id ? "text-paper" : "text-ink"}`}
                    >
                      {s.fee_adjustment > 0
                        ? `+₵${s.fee_adjustment}`
                        : `−₵${Math.abs(s.fee_adjustment)}`}{" "}
                      deposit
                    </p>
                  )}
                  </div>
                </button>
              ))}
            </div>

            {/* Live deposit display — deliberately unlike the stylist cards above
                (tinted, centered, no border-card look) so it doesn't read as
                another stylist option in the grid */}
            {selectedOption && booking.stylistFeeAdj !== 0 && (
              <div className="bg-mist/50 border border-ink/10 px-6 py-8 mb-4 flex flex-col items-center text-center">
                <span
                  className={`inline-block px-2.5 py-1 rounded-sm font-sans text-[10px] tracking-widest uppercase font-semibold mb-4 ${isRange ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}
                >
                  {isRange ? "Deposit" : "Full Price"}
                </span>
                <p className="font-serif text-[2.75rem] font-light text-ink leading-none lining-nums mb-3">
                  ₵{subtotal}
                </p>
                <p className="inline-block bg-ink text-paper/90 font-sans text-[12px] px-4 py-2 rounded-sm">
                  ₵{baseDeposit} base
                  {booking.stylistFeeAdj !== 0 &&
                    ` ${booking.stylistFeeAdj > 0 ? "+" : "−"} ₵${Math.abs(booking.stylistFeeAdj)} stylist fee`}
                </p>
                {/* <p className="font-sans text-[13px] text-ink/60 font-light max-w-xs leading-relaxed mt-4">
                  {isRange
                    ? "This confirms your booking today."
                    : "Pay this in full to confirm your booking."}
                </p> */}
                {isRange && (
                  <p className="font-sans text-[13px] text-ink/75 font-medium mt-3">
                    Balance Depends on Styling
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─ STEP 5: Details ─────────────────────────────────────────────────── */}
        {step === 5 && (
          <div>
            <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/50 mb-4">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-10">
              Your <span className="italic">details.</span>
            </h2>

            <div className="max-w-[560px] flex flex-col gap-7">
              {/* Phone first — enables lookup */}
              <div className="relative">
                <label htmlFor="booking-phone" className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 block mb-2.5">
                  Phone *{" "}
                  <span className="normal-case tracking-normal text-ink/50">
                    (WhatsApp number recommended)
                  </span>
                </label>
                <PhoneInput
                  id="booking-phone"
                  value={booking.phone}
                  onChange={(v) => set("phone", v)}
                />
                {lookingUp && (
                  <span className="absolute right-0 -bottom-5 font-sans text-[11px] text-ink/50 tracking-widest uppercase">
                    Checking…
                  </span>
                )}
                {booking.phone && !phoneComplete && (
                  <p className="font-sans text-[13px] text-ink/60 mt-2">
                    Enter your full number so we can reach you on WhatsApp.
                  </p>
                )}
              </div>

              {/* Returning client banner */}
              {foundClient && (
                <div className="bg-mist border border-ink/10 px-5 py-4 flex items-start gap-3 motion-safe:animate-reveal">
                  <span className="text-ink/50 text-[0.95rem] flex-shrink-0">
                    ◎
                  </span>
                  <p className="font-sans text-[14px] text-ink/70 leading-relaxed">
                    Welcome back,{" "}
                    <span className="text-ink font-medium">
                      {foundClient.firstName}
                    </span>
                    . Please check your details below.
                  </p>
                </div>
              )}

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="booking-first-name" className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 block mb-2.5">
                    First name *
                  </label>
                  <input
                    id="booking-first-name"
                    autoComplete="given-name"
                    value={booking.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    placeholder="Akua"
                    className="w-full border border-ink/20 hover:border-ink/35 focus:border-ink px-4 py-4 font-sans text-[16px] text-ink placeholder:text-ink/30 bg-transparent focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="booking-last-name" className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 block mb-2.5">
                    Last name
                  </label>
                  <input
                    id="booking-last-name"
                    autoComplete="family-name"
                    value={booking.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder="Mensah"
                    className="w-full border border-ink/20 hover:border-ink/35 focus:border-ink px-4 py-4 font-sans text-[16px] text-ink placeholder:text-ink/30 bg-transparent focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="booking-email" className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 block mb-2.5">
                  Email *
                </label>
                <input
                  id="booking-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  aria-invalid={emailInvalid}
                  aria-describedby="booking-email-help"
                  value={booking.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="akua@example.com"
                  className={`w-full border px-4 py-4 font-sans text-[16px] text-ink placeholder:text-ink/30 bg-transparent focus:outline-none transition-colors ${
                    emailInvalid
                      ? "border-red-400 focus:border-red-500"
                      : "border-ink/20 hover:border-ink/35 focus:border-ink"
                  }`}
                />
                {emailInvalid ? (
                  <p id="booking-email-help" role="alert" className="font-sans text-[13px] text-red-500 mt-2">
                    Please enter a valid email address.
                  </p>
                ) : (
                  <p id="booking-email-help" className="font-sans text-[13px] text-ink/60 mt-2">
                    Confirmation and receipt sent here.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="booking-notes" className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 block mb-2.5">
                  Special notes
                </label>
                <textarea
                  id="booking-notes"
                  value={booking.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Allergies, preferences, or anything you'd like us to have ready for you…"
                  rows={4}
                  className="w-full border border-ink/20 hover:border-ink/35 focus:border-ink px-4 py-4 font-sans text-[16px] text-ink placeholder:text-ink/30 bg-transparent focus:outline-none transition-colors resize-none leading-relaxed"
                />
                <p className="font-sans text-[13px] text-ink/60 mt-2 leading-relaxed">
                  We offer complimentary drinks and light refreshments, just
                  ask. Let us know about allergies or preferences too.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─ STEP 6: Review ──────────────────────────────────────────────────── */}
        {step === 6 && (
          <div>
            <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/50 mb-4">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-10">
              Review & <span className="italic">confirm.</span>
            </h2>

            <div className="max-w-[620px] divide-y divide-ink/[0.1] border-t border-ink/[0.1]">
              <ReviewRow label="Service" onEdit={() => goTo(0)}>
                <p className="font-serif text-[1.375rem] text-ink leading-tight">
                  {selectedService ? displayName(selectedService.name) : ""}
                </p>
                <p className="font-sans text-[14px] text-ink/60">
                  {selectedOption?.name} · {selectedOption?.price}
                </p>
              </ReviewRow>

              <ReviewRow label="Hair" onEdit={() => goTo(1)}>
                <p className="font-sans text-[16px] font-medium text-ink">
                  {hairUnitType === "own_new"
                    ? "New unit (bringing)"
                    : hairUnitType === "own_existing"
                      ? "Existing unit (bringing)"
                      : hairUnitType === "own_extensions"
                        ? "Bringing extensions"
                        : "Service only"}
                </p>
                {showUnitStep && booking.unitPhotos.length > 0 && (
                  <p className="font-sans text-[14px] text-ink/60">
                    {bundleCount
                      ? `${bundleCount} bundle${bundleCount > 1 ? "s" : ""} · `
                      : ""}
                    {booking.unitPhotos.length + (rules.inspoPhoto ? booking.inspoPhotos.length : 0)} photo
                    {booking.unitPhotos.length + (rules.inspoPhoto ? booking.inspoPhotos.length : 0) > 1 ? "s" : ""} attached
                  </p>
                )}
              </ReviewRow>

              {customizationType && (
                <ReviewRow label={rules.unitStepLabel} onEdit={() => goTo(2)}>
                  <p className="font-sans text-[16px] font-medium text-ink capitalize">
                    {customizationType}
                  </p>
                  <p className="font-sans text-[14px] text-ink/60">
                    {rules.customizationCopy[customizationType].short}
                  </p>
                </ReviewRow>
              )}

              <ReviewRow label="Stylist" onEdit={() => goTo(3)}>
                <p className="font-sans text-[16px] font-medium text-ink">
                  {booking.stylistId ? displayName(booking.stylistName) : "Any Available"}
                </p>
              </ReviewRow>

              <ReviewRow label="Schedule" onEdit={() => goTo(4)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-sans text-[16px] font-medium text-ink">
                    {booking.date ? formatDate(booking.date) : "–"}
                  </p>
                  {booking.isEmergency && (
                    <span className="font-sans text-[10px] font-medium tracking-widest uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-sm">
                      Emergency
                    </span>
                  )}
                </div>
                <p className="font-sans text-[14px] text-ink/60">
                  {booking.time}
                </p>
              </ReviewRow>

              <ReviewRow label="Details" onEdit={() => goTo(5)}>
                <p className="font-sans text-[16px] font-medium text-ink">
                  {`${booking.firstName} ${booking.lastName}`.trim()}
                </p>
                <p className="font-sans text-[14px] text-ink/60 tabular-nums">
                  {formatPhoneDisplay(booking.phone)}
                </p>
                <p className="font-sans text-[14px] text-ink/60">
                  {booking.email}
                </p>
                {booking.notes && (
                  <p className="font-sans text-[14px] text-ink/60 italic mt-1">
                    "{booking.notes}"
                  </p>
                )}
              </ReviewRow>

              {/* Price breakdown */}
              <div className="py-7 flex flex-col gap-3">
                {isRange && (
                  <div className="border border-amber-200 bg-amber-50/60 px-5 py-4 mb-2 flex gap-3">
                    <span className="text-[0.95rem] flex-shrink-0 text-amber-600">
                      ◉
                    </span>
                    <p className="font-sans text-[14px] text-amber-900 leading-relaxed">
                      This service has a price range. You pay the{" "}
                      <span className="font-semibold">deposit</span> now to
                      confirm your booking, and the remaining balance is settled
                      once your service is complete.
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="font-sans text-[14px] text-ink/60">
                    {isRange ? "Deposit" : "Full Price"}
                  </p>
                  <p className="font-sans text-[14px] text-ink tabular-nums">
                    ₵{baseDeposit + booking.stylistFeeAdj}
                  </p>
                </div>
                {customizationFee > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="font-sans text-[14px] text-ink/60">
                      Customization ({customizationType})
                    </p>
                    <p className="font-sans text-[14px] text-ink tabular-nums">
                      +₵{customizationFee}
                    </p>
                  </div>
                )}
                {emergencyFee > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="font-sans text-[14px] text-ink/60">
                      Emergency fee
                    </p>
                    <p className="font-sans text-[14px] text-ink tabular-nums">
                      +₵{emergencyFee}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="font-sans text-[14px] text-ink/60">
                    Service charge (5%)
                  </p>
                  <p className="font-sans text-[14px] text-ink tabular-nums">
                    +₵{serviceFee}
                  </p>
                </div>
                <div className="flex items-end justify-between pt-5 mt-2 border-t border-ink/[0.1]">
                  <div>
                    <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/55 mb-1.5">
                      {isRange ? "Deposit Due Now" : "Total Due Now"}
                    </p>
                    <p className="font-sans text-[13px] text-ink/60">
                      {isRange
                        ? "Balance settled once your service is complete"
                        : ""}
                    </p>
                  </div>
                  <p className="font-serif text-[2.5rem] font-light text-ink leading-none lining-nums tabular-nums">
                    ₵{totalDeposit}
                  </p>
                </div>
              </div>
            </div>

            {submitError && (
              <p role="alert" className="font-sans text-[14px] text-red-500 mt-5 max-w-[620px]">
                {submitError}
              </p>
            )}

            <div className="mt-8 max-w-[620px] flex flex-col gap-3">
              <button
                onClick={() => setShowTerms(true)}
                disabled={submitting}
                className="w-full bg-ink text-paper font-sans text-[13px] font-medium tracking-widest uppercase py-5 hover:bg-ink/85 active:scale-[0.99] transition-[background-color,transform] duration-150 disabled:opacity-50"
              >
                {submitting
                  ? "Processing…"
                  : isRange
                    ? `Pay ₵${totalDeposit} Deposit →`
                    : `Pay ₵${totalDeposit} Full Price →`}
              </button>
            </div>

            <div className="mt-6 max-w-[620px]">
              <button
                onClick={back}
                className="font-sans text-[12px] tracking-widest uppercase text-ink/55 hover:text-ink transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shared floating step footer — rendered outside the transformed Content
          wrapper above, since a CSS transform on an ancestor makes `position: fixed`
          descendants anchor to that ancestor instead of the viewport. */}
      {step <= 5 && (
        <StepFooter
          canNext={canNext()}
          onNext={next}
          showBack={step > 0}
          onBack={back}
          backDisabled={step === 2 && photoUploading}
          nextLabel={
            returnToReview && firstIncompleteFrom(step + 1) === 6
              ? "Back to Review"
              : step === 5
                ? "Review Booking"
                : "Continue"
          }
        />
      )}

      {/* Terms modal */}
      {showTerms && (
        <TermsModal
          depositAmount={totalDeposit}
          isRange={isRange}
          balanceDue={rules.balanceDue}
          policy={rules.servicePolicy}
          onAgree={handlePayNow}
          onClose={() => setShowTerms(false)}
        />
      )}

      {/* Service photo preview */}
      {preview.lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            backgroundColor: `rgba(10,10,10,${preview.visible ? 0.96 : 0})`,
            transition: preview.isTouch.current ? "none" : "background-color 350ms cubic-bezier(0.4,0,0.2,1)",
          }}
          onClick={preview.close}
          onTouchStart={preview.onTouchStart}
          onTouchMove={preview.onTouchMove}
          onTouchEnd={preview.onTouchEnd}
        >
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-8 py-5 z-10"
            style={{ opacity: preview.visible ? 1 : 0, transition: preview.isTouch.current ? "none" : "opacity 400ms ease 100ms" }}
          >
            <div className="flex items-center gap-4">
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/25">
                {(preview.lightboxIndex + 1).toString().padStart(2, "0")} / {previewPhotos.length.toString().padStart(2, "0")}
              </p>
              <p className="font-sans text-[10px] tracking-widest uppercase text-paper/20">
                {previewName}
              </p>
            </div>
            <button onClick={preview.close} className="text-paper/30 hover:text-paper transition-colors duration-300" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); preview.prev(); }}
            aria-label="Previous"
            className="absolute left-4 md:left-7 top-1/2 -translate-y-1/2 z-10 group"
            style={{ opacity: preview.visible ? 1 : 0, transition: "opacity 400ms ease 150ms" }}
          >
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-paper/10 group-hover:border-paper/30 bg-paper/5 group-hover:bg-paper/12 flex items-center justify-center transition-all duration-300 ease-out">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 13L5 8l5-5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          <div
            className="relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            style={{
              opacity: preview.isTouch.current ? 1 : (preview.imgVisible ? 1 : 0),
              transform: `translateX(${preview.dragX}px) scale(${preview.isTouch.current ? 1 : (preview.imgVisible ? 1 : 0.97)})`,
              transition: preview.isTouch.current
                ? (preview.dragTransition ? "transform 220ms cubic-bezier(0.4,0,0.2,1)" : "none")
                : "opacity 280ms ease, transform 280ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {previewCurrent && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewCurrent.image_url}
                  alt={previewCurrent.caption ?? `${previewName} | Essakobea`}
                  className="max-w-[82vw] max-h-[78vh] w-auto h-auto object-contain"
                />
                {previewCurrent.caption && (
                  <p className="mt-5 font-sans text-[12px] tracking-wide text-paper/55 text-center max-w-[340px] leading-relaxed">
                    {previewCurrent.caption}
                  </p>
                )}
              </>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); preview.next(); }}
            aria-label="Next"
            className="absolute right-4 md:right-7 top-1/2 -translate-y-1/2 z-10 group"
            style={{ opacity: preview.visible ? 1 : 0, transition: "opacity 400ms ease 150ms" }}
          >
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-paper/10 group-hover:border-paper/30 bg-paper/5 group-hover:bg-paper/12 flex items-center justify-center transition-all duration-300 ease-out">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          {previewPhotos.length <= 20 && (
            <div
              className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5"
              style={{ opacity: preview.visible ? 1 : 0, transition: preview.isTouch.current ? "none" : "opacity 400ms ease 200ms" }}
            >
              {previewPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); preview.jumpTo(i); }}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: i === preview.lightboxIndex ? 16 : 4,
                    height: 4,
                    backgroundColor: i === preview.lightboxIndex ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
