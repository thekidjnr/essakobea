"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FinanceEntry, FinanceState } from "@/lib/finance";
import { DateRangePicker, formatRange, type DateRange } from "@/components/admin/DateRangePicker";
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
  Modal,
} from "@/components/admin/ui";

// "custom" is a range picked in the calendar; it has no tab of its own
type Period = "month" | "last_month" | "year" | "custom";

const PERIODS: { value: Period; label: string }[] = [
  { value: "month",      label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "year",       label: "This year" },
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

function periodStart(period: Period, now = new Date()): string | null {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const iso = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 1)).toISOString();
  switch (period) {
    case "month":      return iso(y, m);
    case "last_month": return iso(y, m - 1);
    case "year":       return iso(y, 0);
    case "custom":     return null;
  }
}

function periodEnd(period: Period, now = new Date()): string | null {
  return period === "last_month" ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString() : null;
}

function sum(list: FinanceEntry[], key: "gross" | "refund" | "fee" | "net") {
  return list.reduce((s, e) => s + e[key], 0);
}

function downloadCsv(rows: FinanceEntry[], period: string) {
  const header = ["Date", "Type", "Client", "Description", "Stylist", "Status", "Collected (GHS)", "Refund (GHS)", "Service fee (GHS)", "Net (GHS)", "Paid by", "Reference"];
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
    e.method,
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
  const [range, setRange]     = useState<DateRange | null>(null);
  const [query, setQuery]     = useState("");
  const [shown, setShown]     = useState(PAGE_SIZE);
  const [showLedger, setShowLedger] = useState(false);

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
  useEffect(() => { setShown(PAGE_SIZE); }, [period, range, query]);

  const inPeriod = useMemo(() => {
    if (period === "custom" && range) {
      // Whole days: from the start of `from` to the end of `to`
      return entries.filter((e) => e.date.slice(0, 10) >= range.from && e.date.slice(0, 10) <= range.to);
    }
    const start = periodStart(period);
    const end = periodEnd(period);
    return entries.filter((e) => (!start || e.date >= start) && (!end || e.date < end));
  }, [entries, period, range]);

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
    };
  }, [inPeriod]);

  const byService = useMemo(() => rank(inPeriod.filter((e) => e.kind === "booking"), (e) => e.description), [inPeriod]);
  const byStylist = useMemo(() => rank(inPeriod, (e) => e.stylist), [inPeriod]);
  const byMethod = useMemo(() => rank(inPeriod, (e) => e.method, 10), [inPeriod]);

  const ledger = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inPeriod;
    return inPeriod.filter((e) =>
      [e.client, e.description, e.stylist, e.reference, e.method].some((v) => v?.toLowerCase().includes(q)));
  }, [inPeriod, query]);

  const csvName = period === "custom" && range ? `${range.from}-to-${range.to}` : period;
  const periodLabel = period === "custom" && range
    ? formatRange(range)
    : (PERIODS.find((p) => p.value === period)?.label ?? "").toLowerCase();

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
        actions={
          <Button variant="secondary" onClick={() => setShowLedger(true)}>
            Transactions
          </Button>
        }
      />

      <div className="relative z-20 flex items-center gap-2 mb-8 fade-up">
        <Segmented<Period>
          options={PERIODS}
          value={period}
          onChange={(p) => { setPeriod(p); setRange(null); }}
          className="min-w-0"
        />
        <DateRangePicker
          value={period === "custom" ? range : null}
          onChange={(r) => { setRange(r); setPeriod(r ? "custom" : "month"); }}
        />
      </div>

      {/* Headline */}
      <section className="bg-ink text-paper rounded-[28px] p-6 md:p-10 fade-up">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <p className="font-sans text-[13px] text-paper/60">Yours to keep, {periodLabel}</p>
            <p className={`mt-2 font-serif font-light text-[48px] md:text-[60px] leading-none ${NUM}`}>{cedis(totals.net)}</p>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-4 md:gap-8 pt-6 lg:pt-0 border-t lg:border-t-0 border-paper/15 lg:max-w-[400px]">
            <div>
              <p className="font-sans text-[13px] leading-snug text-paper/60">From finished appointments</p>
              <p className={`mt-1 font-serif text-[26px] md:text-[28px] font-light leading-tight ${NUM}`}>{cedis(totals.earned)}</p>
            </div>
            <div className="w-px bg-paper/15" aria-hidden="true" />
            <div>
              <p className="font-sans text-[13px] leading-snug text-paper/60">Paid for upcoming</p>
              <p className={`mt-1 font-serif text-[26px] md:text-[28px] font-light leading-tight ${NUM}`}>{cedis(totals.upcoming)}</p>
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

      <div className="mt-10 md:mt-12 grid gap-10 lg:gap-7 lg:grid-cols-3 fade-up">
        {/* Statement */}
        <section>
          <SectionTitle italic="breakdown">The</SectionTitle>
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
              {byMethod.length > 1 && byMethod.map((m) => (
                <div key={m.label} className="flex justify-between gap-4 text-[13px] text-muted">
                  <dt>Paid by {m.label === "Paystack" ? "Paystack (online)" : m.label}</dt>
                  <dd>{cedis(m.net)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>

        <section>
          <SectionTitle italic="services">Top</SectionTitle>
          <Card><Ranking rows={byService} empty="No bookings in this period" /></Card>
        </section>
        <section>
          <SectionTitle italic="stylist">By</SectionTitle>
          <Card><Ranking rows={byStylist} empty="No bookings in this period" /></Card>
        </section>
      </div>

      {/* Transactions: opened from the header so they're one tap away */}
      <Modal
        open={showLedger}
        onClose={() => setShowLedger(false)}
        title="Transactions"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => downloadCsv(inPeriod, csvName)} disabled={inPeriod.length === 0}>
            Export CSV
          </Button>
        }
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Search client, service or reference" className="mb-2" />
        {ledger.length === 0 ? (
          <Empty title={query ? "Nothing matches that search" : "No payments in this period"} />
        ) : (
          <>
            <ul className="divide-y divide-line">
              {ledger.slice(0, shown).map((e) => {
                const st = STATE[e.state];
                const adjusted = e.net !== e.gross;
                return (
                  <li key={`${e.kind}-${e.id}`}>
                    <Link
                      href={e.kind === "booking" ? `/admin/bookings?open=${e.id}` : "/admin/orders"}
                      className="py-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 items-center hover:bg-soft/60 -mx-3 px-3 rounded-[14px] transition-colors"
                    >
                      <span className="min-w-0">
                        <span className="block font-sans text-[15px] font-medium text-ink truncate">{e.client}</span>
                        <span className="block font-sans text-[13px] text-muted truncate">{e.description}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <Pill tone={st.tone} className="hidden sm:inline-flex">{st.label}</Pill>
                        <span className="text-right">
                          <span className={`block font-serif text-[20px] leading-tight ${e.net > 0 ? "text-ink" : "text-muted"} ${NUM}`}>{cedis(e.net)}</span>
                          {adjusted && (
                            <span className={`block font-sans text-[12px] text-muted ${NUM}`}>of {cedis(e.gross)}</span>
                          )}
                        </span>
                      </span>
                      <Pill tone={st.tone} className="sm:hidden justify-self-start">{st.label}</Pill>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {ledger.length > shown && (
              <div className="pt-3 flex justify-center">
                <Button variant="ghost" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                  Show more ({ledger.length - shown} left)
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </Page>
  );
}
