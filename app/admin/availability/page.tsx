"use client";

import { useEffect, useState, useCallback } from "react";

interface AvailDay {
  id: string;
  day_of_week: number;
  is_available: boolean;
  open_time: string;
  close_time: string;
  slot_interval_minutes: number;
}
interface BlockedDate { id: string; date: string; reason: string | null; }

// Mon → Sun display order
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Generate half-hour time options from 06:00 to 23:30
const TIME_OPTIONS: { value: string; label: string }[] = (() => {
  const opts = [];
  for (let h = 6; h <= 23; h++) {
    for (const m of [0, 30]) {
      if (h === 23 && m === 30) continue;
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const period = h < 12 ? "AM" : "PM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${h12}:${String(m).padStart(2, "0")} ${period}`;
      opts.push({ value, label });
    }
  }
  return opts;
})();

function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-ink/15 px-3 py-1.5 font-sans text-[12px] text-ink bg-paper focus:outline-none focus:border-ink appearance-none cursor-pointer pr-7 relative"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23000' stroke-width='1.2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
    >
      {TIME_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default function AdminAvailability() {
  const [schedule, setSchedule]   = useState<AvailDay[]>([]);
  const [blocked, setBlocked]     = useState<BlockedDate[]>([]);
  const [saving, setSaving]       = useState(false);
  const [saveOk, setSaveOk]       = useState(false);
  const [newDate, setNewDate]     = useState("");
  const [newReason, setNewReason] = useState("");
  const [blocking, setBlocking]   = useState(false);

  const loadSchedule = useCallback(() => {
    fetch("/api/availability/settings")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSchedule(data); });
  }, []);

  const loadBlocked = useCallback(() => {
    fetch("/api/availability/blocked")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBlocked(data); });
  }, []);

  useEffect(() => { loadSchedule(); loadBlocked(); }, [loadSchedule, loadBlocked]);

  const toggleDay = (dow: number) =>
    setSchedule((prev) => prev.map((d) => d.day_of_week === dow ? { ...d, is_available: !d.is_available } : d));

  const updateTime = (dow: number, field: "open_time" | "close_time", value: string) =>
    setSchedule((prev) => prev.map((d) => d.day_of_week === dow ? { ...d, [field]: value } : d));

  // Interval is global — same for all days; read from first row
  const slotInterval = schedule[0]?.slot_interval_minutes ?? 60;
  const setSlotInterval = (mins: number) =>
    setSchedule((prev) => prev.map((d) => ({ ...d, slot_interval_minutes: mins })));

  const saveSchedule = async () => {
    setSaving(true);
    await fetch("/api/availability/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    });
    setSaving(false);
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 2500);
  };

  const blockDate = async () => {
    if (!newDate) return;
    setBlocking(true);
    await fetch("/api/availability/blocked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, reason: newReason || null }),
    });
    setNewDate(""); setNewReason(""); setBlocking(false); loadBlocked();
  };

  const unblockDate = async (date: string) => {
    await fetch("/api/availability/blocked", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    loadBlocked();
  };

  const sortedSchedule = [...schedule].sort(
    (a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week)
  );

  return (
    <div className="p-8 md:p-10 max-w-[900px]">
      <div className="mb-8">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">Admin</p>
        <h1 className="font-serif text-[2.5rem] font-light text-ink leading-none">
          Availability<span className="italic">.</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly schedule */}
        <div className="bg-paper border border-ink/[0.07] p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="font-sans text-[11px] tracking-widest uppercase text-ink font-medium">
              Working Hours
            </p>
            {/* Slot interval toggle */}
            <div className="flex items-center gap-1 border border-ink/15 p-0.5">
              {([30, 60] as const).map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSlotInterval(mins)}
                  className={`font-sans text-[9px] tracking-widest uppercase px-3 py-1.5 transition-all ${
                    slotInterval === mins ? "bg-ink text-paper" : "text-ink/40 hover:text-ink"
                  }`}
                >
                  {mins === 30 ? "30 min" : "1 hr"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col divide-y divide-ink/[0.05]">
            {sortedSchedule.map((day) => (
              <div key={day.day_of_week} className="py-3">
                {/* Toggle + day name row */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDay(day.day_of_week)}
                    className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${day.is_available ? "bg-ink" : "bg-ink/15"}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-paper transition-all ${day.is_available ? "left-5" : "left-0.5"}`}
                    />
                  </button>
                  <span className={`font-sans text-[12px] flex-1 ${day.is_available ? "text-ink" : "text-ink/30"}`}>
                    {DAY_NAMES[day.day_of_week]}
                  </span>
                  {!day.is_available && (
                    <span className="font-sans text-[11px] text-ink/25 italic">Closed</span>
                  )}
                </div>

                {/* Time selects on second line, indented under day name */}
                {day.is_available && (
                  <div className="flex items-center gap-2 mt-2 pl-[52px]">
                    <TimeSelect
                      value={day.open_time}
                      onChange={(v) => updateTime(day.day_of_week, "open_time", v)}
                    />
                    <span className="font-sans text-[10px] text-ink/30">—</span>
                    <TimeSelect
                      value={day.close_time}
                      onChange={(v) => updateTime(day.day_of_week, "close_time", v)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={saveSchedule}
            disabled={saving}
            className="mt-6 w-full bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-3 hover:bg-ink/80 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : saveOk ? "Saved ✓" : "Save Schedule"}
          </button>
          <p className="font-sans text-[10px] text-ink/30 mt-3 text-center">
            Slot interval applies to all days
          </p>
        </div>

        {/* Blocked dates */}
        <div className="bg-paper border border-ink/[0.07] p-6">
          <p className="font-sans text-[11px] tracking-widest uppercase text-ink font-medium mb-6">
            Blocked Dates
          </p>

          {/* Add date form */}
          <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-ink/[0.07]">
            <div>
              <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-1.5">Date</label>
              <input
                type="date"
                value={newDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full border border-ink/15 px-3 py-2 font-sans text-[12px] text-ink bg-transparent focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-1.5">Reason (optional)</label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="e.g. Public holiday"
                className="w-full border border-ink/15 px-3 py-2 font-sans text-[12px] text-ink bg-transparent focus:outline-none focus:border-ink"
              />
            </div>
            <button
              onClick={blockDate}
              disabled={!newDate || blocking}
              className="bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-3 hover:bg-ink/80 transition-colors disabled:opacity-30"
            >
              {blocking ? "Blocking…" : "Block Date"}
            </button>
          </div>

          {/* Blocked list */}
          {blocked.length === 0 ? (
            <p className="font-sans text-[12px] text-ink/35 italic">No dates blocked.</p>
          ) : (
            <div className="flex flex-col">
              {[...blocked]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3 border-b border-ink/[0.05] last:border-0">
                    <div>
                      <p className="font-sans text-[12px] text-ink">
                        {new Date(b.date + "T00:00:00").toLocaleDateString("en-GB", {
                          weekday: "short", day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                      {b.reason && <p className="font-sans text-[10px] text-ink/35 mt-0.5">{b.reason}</p>}
                    </div>
                    <button
                      onClick={() => unblockDate(b.date)}
                      className="font-sans text-[10px] tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors ml-4 flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
