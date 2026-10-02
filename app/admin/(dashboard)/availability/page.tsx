"use client";

import { useEffect, useState, useCallback } from "react";
import Toggle from "@/components/admin/Toggle";
import {
  Page,
  PageHeader,
  SectionTitle,
  Card,
  Button,
  IconButton,
  Segmented,
  inputClass,
  Field,
  ErrorNote,
  Empty,
  Skeleton,
  ConfirmDialog,
} from "@/components/admin/ui";

interface AvailDay {
  id: string;
  day_of_week: number;
  is_available: boolean;
  open_time: string;
  close_time: string;
  slot_interval_minutes: number;
  max_bookings_per_slot: number;
  max_bookings_per_day: number;
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

const CHEVRON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B6E75' stroke-width='1.2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")";

function TimeSelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`${inputClass} appearance-none cursor-pointer pr-9`}
      style={{ backgroundImage: CHEVRON, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
    >
      {TIME_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

const MinusIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3 7h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
const PlusIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3 7h8M7 3v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

function Stepper({
  label,
  hint,
  value,
  display,
  min,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  display?: string;
  min: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="font-sans text-[15px] text-ink">{label}</p>
        <p className="font-sans text-[13px] text-muted mt-0.5">{hint}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <IconButton
          label={`Decrease ${label.toLowerCase()}`}
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          className="border border-line disabled:opacity-40 disabled:pointer-events-none"
        >
          {MinusIcon}
        </IconButton>
        <span className="font-serif text-[26px] leading-none text-ink w-10 text-center tabular-nums">
          {display ?? value}
        </span>
        <IconButton
          label={`Increase ${label.toLowerCase()}`}
          onClick={() => onChange(value + 1)}
          className="border border-line"
        >
          {PlusIcon}
        </IconButton>
      </div>
    </div>
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
  const [loading, setLoading]     = useState(true);
  const [scheduleError, setScheduleError] = useState("");
  const [blockedError, setBlockedError]   = useState("");
  const [removeTarget, setRemoveTarget]   = useState<BlockedDate | null>(null);
  const [removing, setRemoving]           = useState(false);

  const loadSchedule = useCallback(() => {
    fetch("/api/availability/settings")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !Array.isArray(data)) throw new Error(data?.error ?? "Could not load working hours.");
        setSchedule(data);
      })
      .catch((e: Error) => setScheduleError(e.message || "Could not load working hours."))
      .finally(() => setLoading(false));
  }, []);

  const loadBlocked = useCallback(() => {
    fetch("/api/availability/blocked")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !Array.isArray(data)) throw new Error(data?.error ?? "Could not load blocked dates.");
        setBlocked(data);
      })
      .catch((e: Error) => setBlockedError(e.message || "Could not load blocked dates."));
  }, []);

  useEffect(() => { loadSchedule(); loadBlocked(); }, [loadSchedule, loadBlocked]);

  const toggleDay = (dow: number) =>
    setSchedule((prev) => prev.map((d) => d.day_of_week === dow ? { ...d, is_available: !d.is_available } : d));

  const updateTime = (dow: number, field: "open_time" | "close_time", value: string) =>
    setSchedule((prev) => prev.map((d) => d.day_of_week === dow ? { ...d, [field]: value } : d));

  // These are global settings, the same for all days; read from first row
  const slotInterval = schedule[0]?.slot_interval_minutes ?? 60;
  const setSlotInterval = (mins: number) =>
    setSchedule((prev) => prev.map((d) => ({ ...d, slot_interval_minutes: mins })));

  const maxPerSlot = schedule[0]?.max_bookings_per_slot ?? 1;
  const setMaxPerSlot = (n: number) =>
    setSchedule((prev) => prev.map((d) => ({ ...d, max_bookings_per_slot: Math.max(1, n) })));

  const maxPerDay = schedule[0]?.max_bookings_per_day ?? 0;
  const setMaxPerDay = (n: number) =>
    setSchedule((prev) => prev.map((d) => ({ ...d, max_bookings_per_day: Math.max(0, n) })));

  const saveSchedule = async () => {
    setSaving(true);
    setScheduleError("");
    const res = await fetch("/api/availability/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setSaving(false);
    if (!res?.ok) { setScheduleError(data.error ?? "Could not save schedule. Please try again."); return; }
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 2500);
  };

  const blockDate = async () => {
    if (!newDate) return;
    setBlocking(true);
    setBlockedError("");
    const res = await fetch("/api/availability/blocked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, reason: newReason || null }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBlocking(false);
    if (!res?.ok) { setBlockedError(data.error ?? "Could not block date. Please try again."); return; }
    setNewDate(""); setNewReason(""); loadBlocked();
  };

  const unblockDate = async (date: string) => {
    setBlockedError("");
    const res = await fetch("/api/availability/blocked", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) { setBlockedError(data.error ?? "Could not remove blocked date. Please try again."); return; }
    loadBlocked();
  };

  const sortedSchedule = [...schedule].sort(
    (a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week)
  );

  const formatDate = (date: string) =>
    new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    });

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    await unblockDate(removeTarget.date);
    setRemoving(false);
    setRemoveTarget(null);
  };

  return (
    <Page>
      <PageHeader title="Schedule" subtitle="Opening hours and days off" />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 lg:gap-8 items-start fade-up">
        {/* Opening hours */}
        <section>
          <SectionTitle italic="hours">Opening</SectionTitle>
          <Card>
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : sortedSchedule.length === 0 ? (
              <Empty title="No hours set" />
            ) : (
              <div className="flex flex-col divide-y divide-line -my-2">
                {sortedSchedule.map((day) => (
                  <div
                    key={day.day_of_week}
                    className="py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 sm:min-h-[72px]"
                  >
                    <div className="flex items-center gap-4 sm:w-[170px] sm:flex-shrink-0 min-h-[44px]">
                      <span className={`flex-1 font-sans text-[15px] ${day.is_available ? "text-ink" : "text-muted"}`}>
                        {DAY_NAMES[day.day_of_week]}
                      </span>
                      {!day.is_available && (
                        <span className="sm:hidden font-sans text-[14px] text-muted">Closed</span>
                      )}
                      <Toggle
                        checked={day.is_available}
                        onChange={() => toggleDay(day.day_of_week)}
                        label={DAY_NAMES[day.day_of_week]}
                      />
                    </div>
                    {day.is_available ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <TimeSelect
                            label={`${DAY_NAMES[day.day_of_week]} opens`}
                            value={day.open_time}
                            onChange={(v) => updateTime(day.day_of_week, "open_time", v)}
                          />
                        </div>
                        <span className="font-sans text-[13px] text-muted">to</span>
                        <div className="flex-1 min-w-0">
                          <TimeSelect
                            label={`${DAY_NAMES[day.day_of_week]} closes`}
                            value={day.close_time}
                            onChange={(v) => updateTime(day.day_of_week, "close_time", v)}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="hidden sm:block font-sans text-[14px] text-muted">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <ErrorNote className="mt-6">{scheduleError}</ErrorNote>

            <div className="mt-6 pt-5 border-t border-line flex items-center justify-end gap-4">
              {saveOk && <span role="status" className="font-sans text-[13px] text-muted">Saved</span>}
              <Button onClick={saveSchedule} disabled={saving || schedule.length === 0}>
                {saving ? "Saving…" : "Save schedule"}
              </Button>
            </div>
          </Card>
        </section>

        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Booking rules */}
          <section>
            <SectionTitle italic="rules">Booking</SectionTitle>
            <Card>
              <div className="flex items-center justify-between gap-4 pb-4">
                <p className="font-sans text-[15px] text-ink">Slot length</p>
                <Segmented
                  options={[
                    { value: "30", label: "30 min" },
                    { value: "60", label: "1 hr" },
                  ]}
                  value={slotInterval === 30 ? "30" : "60"}
                  onChange={(v) => setSlotInterval(Number(v))}
                />
              </div>
              <div className="divide-y divide-line border-t border-line">
                <Stepper
                  label="Stations per slot"
                  hint="Chairs in use at the same time"
                  value={maxPerSlot}
                  min={1}
                  onChange={setMaxPerSlot}
                />
                <Stepper
                  label="Daily booking cap"
                  hint="Most bookings per day · 0 means no limit"
                  value={maxPerDay}
                  display={maxPerDay === 0 ? "∞" : undefined}
                  min={0}
                  onChange={setMaxPerDay}
                />
              </div>
              <p className="pt-4 border-t border-line font-sans text-[13px] text-muted">
                Saved with opening hours.
              </p>
            </Card>
          </section>

          {/* Days off */}
          <section>
            <SectionTitle italic="off">Days</SectionTitle>
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <Field label="Date" className="sm:w-[44%]">
                  <input
                    type="date"
                    value={newDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setNewDate(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Reason (optional)" className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Public holiday"
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="mt-3 flex justify-end">
                <Button onClick={blockDate} disabled={!newDate || blocking} className="w-full sm:w-auto">
                  {blocking ? "Blocking…" : "Block date"}
                </Button>
              </div>

              <ErrorNote className="mt-4">{blockedError}</ErrorNote>

              <div className="mt-6 border-t border-line">
                {blocked.length === 0 ? (
                  <Empty title="No days off" />
                ) : (
                  <div className="flex flex-col divide-y divide-line">
                    {[...blocked]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((b) => (
                        <div key={b.id} className="flex items-center justify-between gap-4 py-4">
                          <div className="min-w-0">
                            <p className="font-serif text-[19px] leading-snug text-ink">{formatDate(b.date)}</p>
                            {b.reason && <p className="font-sans text-[13px] text-muted mt-0.5 truncate">{b.reason}</p>}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(b)} className="h-11 flex-shrink-0">
                            Remove
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </Card>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove day off?"
        body={removeTarget ? `${formatDate(removeTarget.date)} will open for bookings again.` : undefined}
        confirmLabel="Remove"
        busy={removing}
        onConfirm={confirmRemove}
        onClose={() => { if (!removing) setRemoveTarget(null); }}
      />
    </Page>
  );
}
