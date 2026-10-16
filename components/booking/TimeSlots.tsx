"use client";

import { slotToMinutes } from "@/lib/booking-time";

// Start-time buttons grouped into Morning / Afternoon / Evening. Shared by the
// booking form and the admin picker. A taken time is struck through; clients
// can't pick it, but with `staff` the salon still can (saving then warns).
// A faded time (already passed, for the admin) stays plain but lighter.

export type SlotState = "free" | "taken" | "faded";

const PERIODS = [
  { period: "Morning", until: 12 * 60 },
  { period: "Afternoon", until: 17 * 60 },
  { period: "Evening", until: 24 * 60 },
];

export function groupByPeriod(slots: string[]) {
  return PERIODS.map(({ period, until }, i) => {
    const from = i === 0 ? 0 : PERIODS[i - 1].until;
    return {
      period,
      slots: slots.filter((s) => {
        const m = slotToMinutes(s) ?? 0;
        return m >= from && m < until;
      }),
    };
  }).filter((g) => g.slots.length > 0);
}

export default function TimeSlots({
  groups,
  selected,
  onSelect,
  stateOf = () => "free",
  staff = false,
}: {
  groups: { period: string; slots: string[] }[];
  selected: string;
  onSelect: (slot: string) => void;
  stateOf?: (slot: string) => SlotState;
  staff?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.period}>
          <p className="font-sans text-[11px] tracking-widest uppercase text-ink/50 mb-3">
            {group.period}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.slots.map((slot) => {
              const state = stateOf(slot);
              const sel = selected === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={state === "taken" && !staff}
                  onClick={() => onSelect(slot)}
                  aria-pressed={sel}
                  aria-label={state === "taken" && staff ? `${slot}, has a warning` : undefined}
                  className={`font-sans text-[14px] tabular-nums px-4 py-2.5 border transition-colors duration-150 ${
                    sel
                      ? "bg-ink text-paper border-ink"
                      : state === "taken"
                        ? staff
                          ? "text-ink/35 border-ink/[0.08] line-through decoration-ink/30 hover:border-ink/30 hover:text-ink/60"
                          : "text-ink/25 border-ink/[0.08] cursor-not-allowed line-through"
                        : state === "faded"
                          ? "text-ink/45 border-ink/10 hover:border-ink/40 hover:text-ink"
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
  );
}
