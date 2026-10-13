"use client";

// Calendar button that opens a month view for picking a date range. Drag
// across days, or tap a start day then an end day. Dates are YYYY-MM-DD;
// Accra is UTC+0, so everything is built in UTC.

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/admin/ui";

export interface DateRange { from: string; to: string }

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d = 1) => new Date(Date.UTC(y, m, d));
const order = (a: string, b: string): DateRange => (a <= b ? { from: a, to: b } : { from: b, to: a });

function shortDay(s: string) {
  return new Date(`${s}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** "3 Oct to 12 Oct", or "3 Oct" for a single day */
export function formatRange(r: DateRange) {
  return r.from === r.to ? shortDay(r.from) : `${shortDay(r.from)} to ${shortDay(r.to)}`;
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange | null;
  onChange: (r: DateRange | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = value ? new Date(`${value.from}T00:00:00Z`) : new Date();
    return utc(d.getUTCFullYear(), d.getUTCMonth());
  });
  const [draft, setDraft] = useState<DateRange | null>(value);
  // Day the current tap or drag started from
  const anchor = useRef<string | null>(null);
  const dragging = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    anchor.current = null;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open, value]);

  const y = month.getUTCFullYear();
  const m = month.getUTCMonth();
  const daysInMonth = utc(y, m + 1, 0).getUTCDate();
  const lead = (utc(y, m).getUTCDay() + 6) % 7; // Monday first
  const today = iso(new Date());
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => iso(utc(y, m, i + 1))),
  ];

  const dayAt = (x: number, yPos: number) =>
    (document.elementFromPoint(x, yPos) as HTMLElement | null)?.closest<HTMLElement>("[data-day]")?.dataset.day ?? null;

  const onDown = (e: React.PointerEvent, day: string) => {
    e.preventDefault();
    dragging.current = true;
    // Second tap of a tap-tap selection closes the range
    if (anchor.current && draft && draft.from === draft.to && draft.from === anchor.current && day !== anchor.current) {
      setDraft(order(anchor.current, day));
      anchor.current = null;
      dragging.current = false;
      return;
    }
    anchor.current = day;
    setDraft({ from: day, to: day });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || !anchor.current) return;
    const day = dayAt(e.clientX, e.clientY);
    if (day) setDraft(order(anchor.current, day));
  };
  const onUp = () => {
    dragging.current = false;
    // A drag finished a range; a single tap waits for the second tap
    if (draft && draft.from !== draft.to) anchor.current = null;
  };

  const inDraft = (d: string) => !!draft && d >= draft.from && d <= draft.to;
  const active = !!value;

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={active ? `Dates: ${formatRange(value!)}` : "Pick dates"}
        className={`h-11 inline-flex items-center gap-2 rounded-full font-sans text-[13px] transition-colors ${
          active ? "px-4 bg-ink text-paper" : "w-11 justify-center bg-soft text-graphite hover:text-ink"
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="3" width="12" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {active && <span className="whitespace-nowrap">{formatRange(value!)}</span>}
      </button>

      {open && (
        <div role="dialog" aria-label="Pick dates" className="absolute right-0 top-[calc(100%+8px)] z-30 w-[300px] p-4 rounded-[24px] bg-paper border border-line shadow-[0_12px_32px_rgba(26,33,43,0.14)]">
          <div className="flex items-center justify-between mb-3">
            <button type="button" aria-label="Previous month" onClick={() => setMonth(utc(y, m - 1))} className="w-9 h-9 rounded-full inline-flex items-center justify-center text-graphite hover:bg-soft">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <span className="font-serif text-[19px] text-ink">
              {month.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}
            </span>
            <button type="button" aria-label="Next month" onClick={() => setMonth(utc(y, m + 1))} className="w-9 h-9 rounded-full inline-flex items-center justify-center text-graphite hover:bg-soft">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4.5 2.5L8 6 4.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="h-7 inline-flex items-center justify-center font-sans text-[11px] text-muted">{d}</span>
            ))}
          </div>
          <div
            className="grid grid-cols-7 gap-y-1 select-none touch-none"
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          >
            {cells.map((d, i) => {
              if (!d) return <span key={`blank-${i}`} />;
              const on = inDraft(d);
              const edge = !!draft && (d === draft.from || d === draft.to);
              return (
                <button
                  key={d}
                  type="button"
                  data-day={d}
                  onPointerDown={(e) => onDown(e, d)}
                  className={`h-9 font-sans text-[13px] tabular-nums transition-colors ${
                    edge ? "bg-ink text-paper rounded-full" : on ? "bg-soft text-ink" : "text-ink hover:bg-soft/70 rounded-full"
                  } ${d === today && !on ? "font-semibold" : ""}`}
                >
                  {Number(d.slice(8))}
                </button>
              );
            })}
          </div>

          <p className="mt-3 font-sans text-[12px] text-muted min-h-[18px]">
            {draft ? formatRange(draft) : "Drag across days, or tap a start and end day"}
          </p>
          <div className="mt-3 flex justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => { onChange(null); setOpen(false); }} disabled={!value && !draft}>
              Clear
            </Button>
            <Button size="sm" onClick={() => { if (draft) onChange(draft); setOpen(false); }} disabled={!draft}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
