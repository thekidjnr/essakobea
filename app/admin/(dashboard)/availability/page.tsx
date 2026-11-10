"use client";

import { useEffect, useState, useCallback } from "react";
import Toggle from "@/components/admin/Toggle";
import {
  Page,
  PageHeader,
  SectionTitle,
  Card,
  Button,
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
}
interface BlockedDate { id: string; date: string; reason: string | null; except_stylist_id: string | null; }
// Consecutive days with the same reason and stylist, shown as one range
interface BlockedRange extends BlockedDate { endDate: string; days: number; }

function groupBlocked(rows: BlockedDate[]): BlockedRange[] {
  const out: BlockedRange[] = [];
  for (const r of [...rows].sort((a, b) => a.date.localeCompare(b.date))) {
    const last = out[out.length - 1];
    const next = last && new Date(new Date(last.endDate + "T00:00:00Z").getTime() + 86400000).toISOString().slice(0, 10);
    if (last && next === r.date && last.reason === r.reason && last.except_stylist_id === r.except_stylist_id) {
      last.endDate = r.date;
      last.days += 1;
    } else {
      out.push({ ...r, endDate: r.date, days: 1 });
    }
  }
  return out;
}

interface StylistOption { id: string; name: string; }

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

export default function AdminAvailability() {
  const [schedule, setSchedule]   = useState<AvailDay[]>([]);
  const [blocked, setBlocked]     = useState<BlockedDate[]>([]);
  const [saving, setSaving]       = useState(false);
  const [saveOk, setSaveOk]       = useState(false);
  const [newDate, setNewDate]     = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newStylist, setNewStylist] = useState("");
  const [editing, setEditing]   = useState<BlockedRange | null>(null);
  const [stylists, setStylists]   = useState<StylistOption[]>([]);
  const [blocking, setBlocking]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [scheduleError, setScheduleError] = useState("");
  const [blockedError, setBlockedError]   = useState("");
  const [removeTarget, setRemoveTarget]   = useState<BlockedRange | null>(null);
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

  useEffect(() => {
    fetch("/api/stylists")
      .then((r) => r.json())
      .then((d: StylistOption[]) => { if (Array.isArray(d)) setStylists(d); })
      .catch(() => {});
  }, []);

  const toggleDay = (dow: number) =>
    setSchedule((prev) => prev.map((d) => d.day_of_week === dow ? { ...d, is_available: !d.is_available } : d));

  const updateTime = (dow: number, field: "open_time" | "close_time", value: string) =>
    setSchedule((prev) => prev.map((d) => d.day_of_week === dow ? { ...d, [field]: value } : d));

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
      body: JSON.stringify({ date: newDate, endDate: newEndDate || null, reason: newReason || null, exceptStylistId: newStylist || null }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) { setBlocking(false); setBlockedError(data.error ?? "Could not block date. Please try again."); return; }

    // Editing: the save above covered the new range, so drop any old days it no longer includes
    if (editing) {
      const newLast = newEndDate || newDate;
      const day = (d: string, n: number) => new Date(new Date(d + "T00:00:00Z").getTime() + n * 86400000).toISOString().slice(0, 10);
      const drop: [string, string][] = [];
      if (editing.date < newDate) drop.push([editing.date, day(newDate, -1)]);
      if (editing.endDate > newLast) drop.push([day(newLast, 1), editing.endDate]);
      for (const [from, to] of drop) await unblockDate(from, to);
    }
    setBlocking(false);
    resetForm(); loadBlocked();
  };

  const resetForm = () => {
    setNewDate(""); setNewEndDate(""); setNewReason(""); setNewStylist(""); setEditing(null);
  };

  const startEdit = (r: BlockedRange) => {
    setEditing(r);
    setNewDate(r.date);
    setNewEndDate(r.days > 1 ? r.endDate : "");
    setNewReason(r.reason ?? "");
    setNewStylist(r.except_stylist_id ?? "");
    setBlockedError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const unblockDate = async (date: string, endDate?: string) => {
    setBlockedError("");
    const res = await fetch("/api/availability/blocked", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, endDate }),
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

  const formatRange = (r: BlockedRange) => {
    if (r.days === 1) return formatDate(r.date);
    const short = (d: string) =>
      new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
    const year = new Date(r.endDate + "T00:00:00Z").getUTCFullYear();
    return `${short(r.date)} to ${short(r.endDate)} ${year}`;
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    await unblockDate(removeTarget.date, removeTarget.endDate);
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
          {/* Days off */}
          <section>
            <SectionTitle italic="off">Days</SectionTitle>
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <Field label="Date" className="sm:w-[28%]">
                  <input
                    type="date"
                    value={newDate}
                    min={editing ? undefined : new Date().toISOString().slice(0, 10)}
                    onChange={(e) => {
                      setNewDate(e.target.value);
                      if (newEndDate && e.target.value > newEndDate) setNewEndDate("");
                    }}
                    className={inputClass}
                  />
                </Field>
                <Field label="Until (optional)" className="sm:w-[28%]">
                  <input
                    type="date"
                    value={newEndDate}
                    min={newDate || (editing ? undefined : new Date().toISOString().slice(0, 10))}
                    onChange={(e) => setNewEndDate(e.target.value)}
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
              <Field label="Still bookable with (optional)" className="mt-3">
                <select
                  value={newStylist}
                  onChange={(e) => setNewStylist(e.target.value)}
                  className={inputClass}
                >
                  <option value="">No one, the whole salon is off</option>
                  {stylists.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} only</option>
                  ))}
                </select>
              </Field>
              <div className="mt-3 flex justify-end gap-3">
                {editing && (
                  <Button variant="ghost" onClick={resetForm} disabled={blocking} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                )}
                <Button onClick={blockDate} disabled={!newDate || blocking} className="w-full sm:w-auto">
                  {blocking ? "Saving…" : editing ? "Save changes" : newEndDate && newEndDate !== newDate ? "Block dates" : "Block date"}
                </Button>
              </div>

              <ErrorNote className="mt-4">{blockedError}</ErrorNote>

              <div className="mt-6 border-t border-line">
                {blocked.length === 0 ? (
                  <Empty title="No days off" />
                ) : (
                  <div className="flex flex-col divide-y divide-line">
                    {groupBlocked(blocked)
                      .map((b) => (
                        <div key={b.id} className="flex items-center justify-between gap-4 py-4">
                          <div className="min-w-0">
                            <p className="font-serif text-[19px] leading-snug text-ink">{formatRange(b)}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-[13px] text-muted">
                              {b.days > 1 && <span className="tabular-nums">{b.days} days</span>}
                              {b.reason && <span className="min-w-0 truncate">{b.reason}</span>}
                              {b.except_stylist_id && (
                                <span className="inline-flex items-center rounded-full border border-line bg-mist px-3 py-1 text-[12px] font-medium text-ink">
                                  Open for {stylists.find((s) => s.id === b.except_stylist_id)?.name.trim() ?? "one stylist"} only
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 items-center">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(b)} className="h-11">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(b)} className="h-11">
                              Remove
                            </Button>
                          </div>
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
        title={removeTarget && removeTarget.days > 1 ? "Remove days off?" : "Remove day off?"}
        body={removeTarget ? `${formatRange(removeTarget)} will open for bookings again.` : undefined}
        confirmLabel="Remove"
        busy={removing}
        onConfirm={confirmRemove}
        onClose={() => { if (!removing) setRemoveTarget(null); }}
      />
    </Page>
  );
}
