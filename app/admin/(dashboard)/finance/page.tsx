"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FinanceEntry, FinanceState } from "@/lib/finance";
import {
  Page,
  PageHeader,
  SectionTitle,
  Card,
  Button,
  Pill,
  type PillTone,
  Segmented,
  SearchInput,
  ErrorNote,
  Empty,
  Skeleton,
  SkeletonRows,
} from "@/components/admin/ui";

type Period = "month" | "last_month" | "quarter" | "year" | "all";

const PERIODS: { value: Period; label: string }[] = [
  { value: "month",      label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "quarter",    label: "3 months" },
  { value: "year",       label: "This year" },
  { value: "all",        label: "All time" },
];

const STATE: Record<FinanceState, { label: string; tone: PillTone }> = {
  completed:   { label: "Completed",   tone: "solid" },
  upcoming:    { label: "Upcoming",    tone: "outline" },
  kept:        { label: "Deposit kept", tone: "soft" },
  refund_owed: { label: "Refund owed", tone: "outline" },
  refunded:    { label: "Refunded",    tone: "struck" },
};

const NUM = "[font-variant-numeric:lining-nums_tabular-nums]";
const PAGE_SIZE = 40;

// Pesewas → "₵1,234" (pesewas shown only when there are any).
function cedis(pesewas: number) {
  const ghs = pesewas / 100;
  return `₵${ghs.toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(ghs) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

// Accra is UTC+0, so month boundaries are plain UTC dates.
function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function periodStart(period: Period, now = new Date()): string | null {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const iso = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 1)).toISOString();
  switch (period) {
    case "month":      return iso(y, m);
    case "last_month": return iso(y, m - 1);
    case "quarter":    return iso(y, m - 2);
    case "year":       return iso(y, 0);
    case "all":        return null;
  }
}

function periodEnd(period: Period, now = new Date()): string | null {
  return period === "last_month" ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString() : null;
}

function sum(list: FinanceEntry[], key: "gross" | "refund" | "fee" | "net") {
  return list.reduce((s, e) => s + e[key], 0);
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function downloadCsv(rows: FinanceEntry[], period: Period) {
  const header = ["Date", "Type", "Client", "Description", "Stylist", "Status", "Collected (GHS)", "Refund (GHS)", "Service fee (GHS)", "Net (GHS)", "Reference"];
  const cell = (v: string | number | null) => {
    const s = v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((e) => [
    e.date.slice(0, 10),
    e.kind === "booking" ? "Booking" : "Shop",
    e.client,
    e.description,
    e.stylist,
    STATE[e.state].label,
    (e.gross / 100).toFixed(2),
    (e.refund / 100).toFixed(2),
    (e.fee / 100).toFixed(2),
    (e.net / 100).toFixed(2),
    e.reference,
  ].map(cell).join(","));
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `essakobea-finance-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Groups entries by a label and ranks them by net revenue.
function rank(list: FinanceEntry[], by: (e: FinanceEntry) => string | null, limit = 5) {
  const map = new Map<string, { net: number; count: number }>();
  for (const e of list) {
    const k = by(e);
    if (!k) continue;
    const row = map.get(k) ?? { net: 0, count: 0 };
    row.net += e.net;
    if (e.state !== "refunded") row.count += 1;
    map.set(k, row);
  }
  return [...map.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .filter((r) => r.net > 0)
    .sort((a, b) => b.net - a.net)
    .slice(0, limit);
}

function Ranking({ rows, empty }: { rows: { label: string; net: number; count: number }[]; empty: string }) {
  const top = rows[0]?.net ?? 0;
  if (rows.length === 0) {
    return <p className="py-6 text-center font-serif italic text-[18px] text-muted">{empty}</p>;
  }
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 truncate font-sans text-[14px] text-ink">{r.label}</span>
            <span className={`flex-shrink-0 font-sans text-[14px] text-ink ${NUM}`}>{cedis(r.net)}</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex-1 h-1.5 rounded-full bg-soft overflow-hidden">
              <span className="block h-full rounded-full bg-ink" style={{ width: `${top ? Math.max(4, (r.net / top) * 100) : 0}%` }} />
            </span>
            <span className={`w-[64px] text-right font-sans text-[12px] text-muted ${NUM}`}>
              {r.count} {r.count === 1 ? "booking" : "bookings"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminFinancePage() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [period, setPeriod]   = useState<Period>("month");
  const [query, setQuery]     = useState("");
  const [shown, setShown]     = useState(PAGE_SIZE);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/finance")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !data || data.error) throw new Error(data?.error ?? "Could not load finances.");
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setError("");
      })
      .catch((e: Error) => setError(e.message || "Could not load finances."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setShown(PAGE_SIZE); }, [period, query]);

  const inPeriod = useMemo(() => {
    const start = periodStart(period);
    const end = periodEnd(period);
    return entries.filter((e) => (!start || e.date >= start) && (!end || e.date < end));
  }, [entries, period]);

  const totals = useMemo(() => {
    const earned   = inPeriod.filter((e) => e.state === "completed" || e.state === "kept");
    const upcoming = inPeriod.filter((e) => e.state === "upcoming");
    const owed     = inPeriod.filter((e) => e.state === "refund_owed");
    const shop     = inPeriod.filter((e) => e.kind === "order");
    return {
      gross:      sum(inPeriod, "gross"),
      refunds:    sum(inPeriod, "refund"),
      fees:       sum(inPeriod, "fee"),
      net:        sum(inPeriod, "net"),
      earned:     sum(earned, "net"),
      upcoming:   sum(upcoming, "net"),
      owed:       sum(owed, "refund"),
      owedCount:  owed.length,
      shop:       sum(shop, "net"),
      payments:   inPeriod.length,
    };
  }, [inPeriod]);

  // The last 12 months, always, so the trend doesn't jump with the period tabs.
  const trend = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1));
      return { key: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }), net: 0 };
    });
    const index = new Map(months.map((m, i) => [m.key, i]));
    for (const e of entries) {
      const i = index.get(monthKey(e.date));
      if (i !== undefined) months[i].net += e.net;
    }
    return months;
  }, [entries]);
  const trendMax = Math.max(1, ...trend.map((m) => m.net));
  const currentKey = trend[trend.length - 1]?.key;

  const byService = useMemo(() => rank(inPeriod.filter((e) => e.kind === "booking"), (e) => e.description), [inPeriod]);
  const byStylist = useMemo(() => rank(inPeriod, (e) => e.stylist), [inPeriod]);

  const ledger = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inPeriod;
    return inPeriod.filter((e) =>
      [e.client, e.description, e.stylist, e.reference].some((v) => v?.toLowerCase().includes(q)));
  }, [inPeriod, query]);

  const periodLabel = PERIODS.find((p) => p.value === period)!.label.toLowerCase();
  const keptBookings = inPeriod.filter((e) => e.kind === "booking" && e.state !== "refunded");
  const avgBooking = keptBookings.length ? Math.round(sum(keptBookings, "net") / keptBookings.length) : 0;

  if (loading && entries.length === 0) return (
    <Page>
      <PageHeader title="Finance" />
      <Skeleton className="h-11 w-[420px] max-w-full rounded-full mb-8" />
      <Skeleton className="h-[260px] rounded-[28px] mb-10" />
      <div className="grid gap-7 lg:grid-cols-2 mb-10">
        <Skeleton className="h-[280px] rounded-[24px]" />
        <Skeleton className="h-[280px] rounded-[24px]" />
      </div>
      <SkeletonRows rows={5} />
    </Page>
  );

  if (error && entries.length === 0) return (
    <Page>
      <PageHeader title="Finance" />
      <Empty title="Finances didn't load">
        <ErrorNote className="mb-5">{error}</ErrorNote>
        <Button variant="secondary" onClick={load}>Try again</Button>
      </Empty>
    </Page>
  );

  return (
    <Page>
      <PageHeader
        title="Finance"
        subtitle="Money in, money out, money kept"
        actions={
          <Button variant="secondary" onClick={() => downloadCsv(inPeriod, period)} disabled={inPeriod.length === 0}>
            Export CSV
          </Button>
        }
      />

      <Segmented<Period> options={PERIODS} value={period} onChange={setPeriod} className="mb-8 fade-up" />

      {/* Headline */}
      <section className="bg-ink text-paper rounded-[28px] p-6 md:p-10 fade-up">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <p className="font-sans text-[13px] text-paper/60">Net revenue, {periodLabel}</p>
            <p className={`mt-2 font-serif font-light text-[48px] md:text-[60px] leading-none ${NUM}`}>{cedis(totals.net)}</p>
            <p className={`mt-3 font-sans text-[13px] text-paper/50 ${NUM}`}>
              {cedis(totals.gross)} collected across {totals.payments} {totals.payments === 1 ? "payment" : "payments"}
            </p>
          </div>

          <div className="flex gap-6 md:gap-8 pt-6 lg:pt-0 border-t lg:border-t-0 border-paper/15">
            <div>
              <p className="font-sans text-[13px] text-paper/60">Earned</p>
              <p className={`mt-1 font-serif text-[26px] md:text-[28px] font-light leading-tight ${NUM}`}>{cedis(totals.earned)}</p>
            </div>
            <div className="w-px bg-paper/15" aria-hidden="true" />
            <div>
              <p className="font-sans text-[13px] text-paper/60">Booked ahead</p>
              <p className={`mt-1 font-serif text-[26px] md:text-[28px] font-light leading-tight ${NUM}`}>{cedis(totals.upcoming)}</p>
            </div>
            <div className="w-px bg-paper/15" aria-hidden="true" />
            <div>
              <p className="font-sans text-[13px] text-paper/60">Per booking</p>
              <p className={`mt-1 font-serif text-[26px] md:text-[28px] font-light leading-tight ${NUM}`}>{cedis(avgBooking)}</p>
            </div>
          </div>
        </div>
      </section>

      {totals.owedCount > 0 && (
        <Link
          href="/admin/bookings?filter=refunds"
          className="mt-5 flex items-center justify-between gap-4 pl-3 pr-5 py-3 rounded-full border border-line hover:border-ink/30 transition-colors fade-up"
        >
          <span className="flex items-center gap-3.5 font-sans text-[14px] text-ink">
            <span className="w-7 h-7 flex-shrink-0 rounded-full bg-ink text-paper inline-flex items-center justify-center text-[12px] font-medium">
              {totals.owedCount}
            </span>
            <span>
              {totals.owedCount === 1 ? "Refund" : "Refunds"} still to send
              <span className="hidden sm:inline">, {cedis(totals.owed)} in total</span>
            </span>
          </span>
          <span className="flex items-center gap-2 font-sans text-[13px] text-graphite">
            <span className="hidden sm:inline">Review</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>
      )}

      <div className="mt-10 md:mt-12 grid gap-10 lg:gap-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] fade-up">
        {/* Statement */}
        <section>
          <SectionTitle italic="down">Breakdown</SectionTitle>
          <Card>
            <dl className={`flex flex-col gap-3.5 font-sans text-[14px] ${NUM}`}>
              <div className="flex justify-between gap-4">
                <dt className="text-graphite">Collected</dt>
                <dd className="text-ink">{cedis(totals.gross)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-graphite">
                  Refunds
                  {totals.owed > 0 && <span className="block text-[12px] text-muted">{cedis(totals.owed)} not sent yet</span>}
                </dt>
                <dd className="text-ink">{totals.refunds ? `−${cedis(totals.refunds)}` : cedis(0)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-graphite">Service fee (5%)</dt>
                <dd className="text-ink">{totals.fees ? `−${cedis(totals.fees)}` : cedis(0)}</dd>
              </div>
              <div className="mt-1 pt-4 border-t border-line flex justify-between items-baseline gap-4">
                <dt className="font-medium text-ink">Net revenue</dt>
                <dd className="font-serif text-[26px] leading-none text-ink">{cedis(totals.net)}</dd>
              </div>
              {totals.shop > 0 && (
                <div className="flex justify-between gap-4 text-[13px] text-muted">
                  <dt>Of which shop sales</dt>
                  <dd>{cedis(totals.shop)}</dd>
                </div>
              )}
            </dl>
          </Card>
        </section>

        {/* Trend */}
        <section>
          <SectionTitle italic="months">Last 12</SectionTitle>
          <Card>
            <div className="h-[184px] flex items-end gap-1.5 md:gap-2.5" role="img" aria-label="Net revenue for each of the last 12 months">
              {trend.map((m) => {
                const h = m.net > 0 ? Math.max(3, (m.net / trendMax) * 100) : 0;
                const current = m.key === currentKey;
                return (
                  <div key={m.key} className="group relative flex-1 h-full flex flex-col justify-end items-center gap-2" title={`${m.label}: ${cedis(m.net)}`}>
                    <span className={`pointer-events-none absolute -top-1 font-sans text-[11px] text-ink whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${NUM}`}>
                      {cedis(m.net)}
                    </span>
                    <span className="w-full flex-1 flex items-end">
                      <span
                        className={`w-full rounded-t-[6px] rounded-b-[2px] transition-colors ${current ? "bg-ink" : "bg-ink/20 group-hover:bg-ink/40"}`}
                        style={{ height: `${h}%`, minHeight: m.net > 0 ? 3 : 1 }}
                      />
                    </span>
                    <span className={`font-sans text-[10px] md:text-[11px] ${current ? "text-ink" : "text-muted"}`}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      </div>

      <div className="mt-10 md:mt-12 grid gap-10 lg:gap-7 lg:grid-cols-2 fade-up">
        <section>
          <SectionTitle italic="services">Top</SectionTitle>
          <Card><Ranking rows={byService} empty="No bookings in this period" /></Card>
        </section>
        <section>
          <SectionTitle italic="stylist">By</SectionTitle>
          <Card><Ranking rows={byStylist} empty="No bookings in this period" /></Card>
        </section>
      </div>

      {/* Ledger */}
      <section className="mt-10 md:mt-12 fade-up">
        <SectionTitle>Transactions</SectionTitle>
        <SearchInput value={query} onChange={setQuery} placeholder="Search client, service or reference" className="mb-4" />
        {ledger.length === 0 ? (
          <Card>
            <Empty title={query ? "Nothing matches that search" : "No payments in this period"} />
          </Card>
        ) : (
          <Card padded={false}>
            <ul className="divide-y divide-line">
              {ledger.slice(0, shown).map((e) => {
                const s = STATE[e.state];
                const adjusted = e.net !== e.gross;
                return (
                  <li key={`${e.kind}-${e.id}`}>
                    <Link
                      href={e.kind === "booking" ? `/admin/bookings?open=${e.id}` : "/admin/orders"}
                      className="px-5 md:px-7 py-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 items-center hover:bg-soft/60 transition-colors"
                    >
                      <span className="min-w-0">
                        <span className="block font-sans text-[15px] font-medium text-ink truncate">{e.client}</span>
                        <span className="block font-sans text-[13px] text-muted truncate">
                          {shortDate(e.date)} · {e.description}{e.stylist ? ` · ${e.stylist}` : ""}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <Pill tone={s.tone} className="hidden sm:inline-flex">{s.label}</Pill>
                        <span className="text-right">
                          <span className={`block font-serif text-[20px] leading-tight ${e.net > 0 ? "text-ink" : "text-muted"} ${NUM}`}>{cedis(e.net)}</span>
                          {adjusted && (
                            <span className={`block font-sans text-[12px] text-muted ${NUM}`}>of {cedis(e.gross)}</span>
                          )}
                        </span>
                      </span>
                      <Pill tone={s.tone} className="sm:hidden justify-self-start">{s.label}</Pill>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {ledger.length > shown && (
              <div className="px-5 md:px-7 py-4 border-t border-line flex justify-center">
                <Button variant="ghost" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                  Show more ({ledger.length - shown} left)
                </Button>
              </div>
            )}
          </Card>
        )}
      </section>
    </Page>
  );
}
