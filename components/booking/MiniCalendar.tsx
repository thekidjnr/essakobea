"use client";

import { useState } from "react";
import { todayInAccra } from "@/lib/booking-time";

// Month calendar for picking an appointment day. Shared by the booking form,
// the reschedule page and the admin. Past days, closed weekdays and blocked
// dates are greyed out. With `staff`, the admin can still pick them (the salon
// may log a walk-in that already happened, or open on a closed day), so they
// are only marked, and earlier months can be browsed.

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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

export default function MiniCalendar({
  selected,
  onSelect,
  blocked,
  disabledDays,
  staff = false,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
  blocked: string[];
  disabledDays: number[];
  staff?: boolean;
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
  // Clients can't browse back before the current month
  const atFirstMonth = !staff && `${year}-${String(month + 1).padStart(2, "0")}` <= salonToday.slice(0, 7);
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
          type="button"
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
          type="button"
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
          const closed = isBlocked(day);
          const unavailable = isPast(day) || closed;
          const sel = isSelected(day);
          const isToday = dateStr(day) === salonToday;
          return (
            <button
              key={day}
              type="button"
              disabled={unavailable && !staff}
              onClick={() => onSelect(new Date(year, month, day))}
              aria-pressed={sel}
              aria-label={`${formatDate(new Date(year, month, day))}${isToday ? ", today" : ""}${staff && closed ? ", closed" : ""}`}
              className={`relative aspect-square flex items-center justify-center font-sans text-[14px] tabular-nums transition-colors duration-150 ${
                sel
                  ? "bg-ink text-paper font-medium"
                  : !unavailable
                    ? "text-ink hover:bg-mist"
                    : staff
                      ? `text-ink/35 hover:bg-mist hover:text-ink/60 ${closed ? "line-through decoration-ink/30" : ""}`
                      : "text-ink/20 cursor-not-allowed"
              }`}
            >
              {day}
              {isToday && (
                <span
                  aria-hidden
                  className={`absolute bottom-[18%] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${sel ? "bg-paper" : "bg-ink/60"}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
