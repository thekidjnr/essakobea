"use client";

// Date and time for a manual booking or a move. The same calendar and time
// buttons clients see, so both sides stay in step, but nothing is locked:
// past days, closed days and clashing times are marked, and the salon can
// still pick them. Each time carries the warnings saving it would give.

import { useEffect, useState } from "react";
import MiniCalendar from "@/components/booking/MiniCalendar";
import TimeSlots, { groupByPeriod, type SlotState } from "@/components/booking/TimeSlots";
import { formatBookingDate, slotToMinutes } from "@/lib/booking-time";
import { todayISO } from "@/components/admin/bookingDisplay";

interface StaffSlot { time: string; passed: boolean; warnings: string[] }
interface Day {
  closed: boolean;
  dayWarnings: string[];
  slots: StaffSlot[];
}

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const heading = "font-sans text-[13px] text-graphite mb-3";
const note = "font-sans text-[13px] leading-relaxed text-graphite";

export function DateTimePicker({
  date, time, onDate, onTime, dateLabel = "Date", dateNote,
  stylistId, serviceId, optionId, excludeId, home,
}: {
  date: string;
  time: string;
  onDate: (iso: string) => void;
  onTime: (slot: string) => void;
  dateLabel?: string;
  /** Shown under the chosen date, like a ready estimate */
  dateNote?: React.ReactNode;
  stylistId: string;
  serviceId?: string;
  optionId?: string;
  /** A booking being moved: uses its length, and it never clashes with itself */
  excludeId?: string;
  home: boolean;
}) {
  const [blocked, setBlocked] = useState<string[]>([]);
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [day, setDay] = useState<Day | "loading" | "error">("loading");
  const [retry, setRetry] = useState(0);

  // Closed weekdays and blocked dates, to mark them on the calendar
  useEffect(() => {
    fetch("/api/availability/blocked")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: { date: string }[]) => { if (Array.isArray(d)) setBlocked(d.map((x) => x.date)); })
      .catch(() => {});
    fetch("/api/availability/settings")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: { day_of_week: number; is_available: boolean }[]) => {
        if (Array.isArray(d)) setClosedDays(d.filter((x) => !x.is_available).map((x) => x.day_of_week));
      })
      .catch(() => {});
  }, []);

  // Times for the chosen day. Ignore answers for a day the salon has moved on from.
  useEffect(() => {
    if (!date) return;
    let stale = false;
    const params = new URLSearchParams({ date });
    if (stylistId) params.set("stylistId", stylistId);
    if (serviceId) params.set("serviceId", serviceId);
    if (optionId) params.set("optionId", optionId);
    if (excludeId) params.set("excludeId", excludeId);
    if (home) params.set("home", "1");
    setDay("loading");
    fetch(`/api/admin/availability?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("availability failed");
        return r.json();
      })
      .then((d: Day) => { if (!stale) setDay(d); })
      .catch(() => { if (!stale) setDay("error"); });
    return () => { stale = true; };
  }, [date, stylistId, serviceId, optionId, excludeId, home, retry]);

  const today = todayISO();
  const pastDay = !!date && date < today;
  const ready = typeof day === "object" ? day : null;
  const slots = ready?.slots ?? [];
  // A booking already set outside working hours (like 7:00 AM) still shows its time
  const all = time && ready && !slots.some((s) => s.time === time)
    ? [...slots, { time, passed: false, warnings: [] }].sort((a, b) => (slotToMinutes(a.time) ?? 0) - (slotToMinutes(b.time) ?? 0))
    : slots;
  const picked = all.find((s) => s.time === time);

  const stateOf = (slot: string): SlotState => {
    const s = all.find((x) => x.time === slot);
    if (!s) return "free";
    if (s.warnings.length) return "taken";
    // On a past day every time has passed, so only fade them on today
    return s.passed && !pastDay ? "faded" : "free";
  };

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-10">
      <div>
        <p className={heading}>{dateLabel}</p>
        <MiniCalendar
          staff
          selected={date ? fromISO(date) : null}
          onSelect={(d) => onDate(toISO(d))}
          blocked={blocked}
          disabledDays={closedDays}
        />
        {date && (
          <p className="mt-4 font-sans text-[14px] font-medium text-ink">{formatBookingDate(date)}</p>
        )}
        {pastDay && (
          <p className={`mt-1 ${note}`}>This date has passed. You can still log a booking that already happened.</p>
        )}
        {dateNote && <div className="mt-2">{dateNote}</div>}
      </div>

      <div>
        <p className={heading}>Time</p>
        {!date ? (
          <p className={note}>Choose a date first.</p>
        ) : day === "loading" ? (
          <p className={note}>Checking times…</p>
        ) : day === "error" ? (
          <div>
            <p className={`${note} mb-3`}>Couldn&apos;t load times for this day.</p>
            <button
              type="button"
              onClick={() => setRetry((n) => n + 1)}
              className="font-sans text-[13px] text-ink underline underline-offset-4 hover:opacity-60 transition-opacity"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {day.dayWarnings.length > 0 && (
              <div className="rounded-2xl bg-soft px-4 py-3">
                {day.dayWarnings.map((w) => <p key={w} className={note}>{w}</p>)}
                <p className="mt-1 font-sans text-[12px] text-muted">You can still pick a time.</p>
              </div>
            )}

            {all.length > 0 ? (
              <TimeSlots staff groups={groupByPeriod(all.map((s) => s.time))} selected={time} onSelect={onTime} stateOf={stateOf} />
            ) : (
              <p className={note}>No working hours are set for this day. Add them in Schedule.</p>
            )}

            {picked && picked.warnings.length > 0 && (
              <div role="status" className="rounded-2xl border border-ink/15 px-4 py-3">
                <p className="font-sans text-[13px] font-medium text-ink">Heads up for {picked.time}</p>
                <ul className="mt-1 flex flex-col gap-0.5 list-disc pl-5">
                  {picked.warnings.map((w) => <li key={w} className={note}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
