"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { whatsAppLink } from "@/lib/phone";
import { Page, SectionTitle, Card, Pill, Skeleton, Button, ErrorNote, Empty, buttonClass } from "@/components/admin/ui";
import {
  type AdminBooking, bookingStatus, formatSlot, startOf, todayISO, countdown, useServices, serviceFor,
} from "@/components/admin/bookingDisplay";

interface Stats {
  todayBookings:     number;
  completedBookings: number;
  cancelledBookings: number;
  monthRevenueGHS:   number;
  refundsOwedGHS:    number;
  refundsOwedCount:  number;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function AdminDashboard() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [today, setToday]       = useState<AdminBooking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [now, setNow]           = useState(() => Date.now());
  const services = useServices();

  useEffect(() => {
    const getJson = async (url: string) => {
      const r = await fetch(url);
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? "Could not load the dashboard");
      return data;
    };
    Promise.all([
      getJson("/api/admin/stats"),
      getJson(`/api/admin/bookings?status=all&date=${todayISO()}`),
    ])
      .then(([s, b]) => {
        setStats(s);
        const list: AdminBooking[] = Array.isArray(b) ? b : [];
        setToday(list.filter((x) => x.status !== "cancelled").sort((x, y) => startOf(x) - startOf(y)));
      })
      .catch((err) => setError(err.message || "Could not load the dashboard"))
      .finally(() => setLoading(false));
  }, []);

  // Keep the "in 1h 20m" countdown honest.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (error) return (
    <Page>
      <Empty title="The dashboard didn't load">
        <ErrorNote className="mb-5">{error}</ErrorNote>
        <Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button>
      </Empty>
    </Page>
  );

  const next = today.find((b) => b.status === "confirmed" && startOf(b) > now);
  const nextImage = next ? serviceFor(services, next)?.image_url : undefined;
  const dateLine = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const month = new Date().toLocaleDateString("en-GB", { month: "long" });

  const FIGURES = [
    { value: String(stats?.todayBookings ?? 0),                         label: "appointments today" },
    { value: `₵${(stats?.monthRevenueGHS ?? 0).toLocaleString()}`,      label: `earned in ${month}` },
    { value: String(stats?.completedBookings ?? 0),                     label: "clients served" },
  ];

  return (
    <Page>
      {/* Welcome */}
      <section className="rounded-[28px] bg-ink text-paper px-6 py-7 md:px-12 md:py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8 fade-up">
        <div>
          <p className="font-sans text-[13px] text-paper/60">{dateLine}</p>
          <h1 className="mt-2 font-serif text-[40px] md:text-[52px] font-light leading-none tracking-[-0.01em]">
            {greeting()}<span className="italic">.</span>
          </h1>
        </div>
        <div className="flex">
          {FIGURES.map((f, i) => (
            <div key={f.label} className={`flex flex-col gap-1.5 ${i === 0 ? "pr-4 md:pr-7" : "px-4 md:px-7 border-l border-paper/15"} ${i === FIGURES.length - 1 ? "md:pr-0" : ""}`}>
              {loading ? (
                <span className="block h-[30px] w-14 rounded-xl bg-paper/10 animate-pulse" />
              ) : (
                <span className="font-serif text-[26px] md:text-[34px] leading-none [font-variant-numeric:lining-nums]">{f.value}</span>
              )}
              <span className="font-sans text-[11px] md:text-[12px] text-paper/60">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {(stats?.refundsOwedCount ?? 0) > 0 && (
        <Link
          href="/admin/bookings?filter=refunds"
          className="mt-5 flex items-center justify-between gap-4 pl-3 pr-5 py-3 rounded-full border border-line hover:border-ink/30 transition-colors fade-up fade-up-delay-1"
        >
          <span className="flex items-center gap-3.5 font-sans text-[14px] text-ink">
            <span className="w-7 h-7 flex-shrink-0 rounded-full bg-ink text-paper inline-flex items-center justify-center text-[12px] font-medium">
              {stats!.refundsOwedCount}
            </span>
            <span>
              {stats!.refundsOwedCount === 1 ? "Refund" : "Refunds"} waiting to be sent
              <span className="hidden sm:inline">, ₵{stats!.refundsOwedGHS.toLocaleString()} in total</span>
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

      <div className={`mt-9 grid gap-9 lg:gap-7 fade-up fade-up-delay-2 ${loading || next ? "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" : ""}`}>
        {/* Next up, only while there's someone still to come today */}
        {(loading || next) && (
        <section>
          <SectionTitle italic="up">Next</SectionTitle>
          {loading ? (
            <Skeleton className="h-[380px] lg:h-[440px] rounded-[24px]" />
          ) : next ? (
            <div className="relative h-[380px] lg:h-[440px] rounded-[24px] overflow-hidden bg-graphite text-paper">
              {nextImage && (
                <Image src={nextImage} alt="" fill sizes="(min-width: 1024px) 440px, 100vw" className="object-cover object-[center_30%]" />
              )}
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,33,43,0)_35%,rgba(26,33,43,0.92)_82%)]" />
              <span className="absolute top-4 left-4 h-8 px-3.5 inline-flex items-center rounded-full bg-paper/95 text-ink font-sans text-[12px] font-medium">
                {formatSlot(next.time_slot)} · {countdown(startOf(next), now)}
              </span>
              <div className="absolute inset-x-6 bottom-6">
                <p className="font-serif text-[34px] leading-none">{next.client_name}</p>
                <p className="mt-2 font-sans text-[13px] text-paper/75">
                  {next.treatment || next.service_name}{next.stylist_name ? ` · with ${next.stylist_name}` : ""}
                </p>
                <div className="mt-5 flex gap-2">
                  <a
                    href={whatsAppLink(next.client_phone, `Hi ${next.client_name.split(" ")[0]}, this is Essakobea. `)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonClass("light")} flex-1`}
                  >
                    WhatsApp
                  </a>
                  <Link href={`/admin/bookings?open=${next.id}`} className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-paper/35 hover:border-paper font-sans text-[14px] font-medium text-paper transition-colors">
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </section>
        )}

        {/* Today */}
        <section>
          <SectionTitle
            italic="appointments"
            action={<Link href="/admin/bookings" className="font-sans text-[13px] text-graphite hover:text-ink">All bookings</Link>}
          >
            Today’s
          </SectionTitle>
          <Card padded={false} className="px-4 md:px-6 py-2">
            {loading ? (
              <div className="py-3 flex flex-col gap-3">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : today.length === 0 ? (
              <p className="py-10 text-center font-serif italic text-[20px] text-muted">Nothing booked today</p>
            ) : (
              <ul className="divide-y divide-line">
                {today.map((b) => {
                  const s = bookingStatus(b);
                  const isNext = next?.id === b.id;
                  const img = serviceFor(services, b)?.image_url;
                  return (
                    <li key={b.id}>
                      <Link href={`/admin/bookings?open=${b.id}`} className="grid grid-cols-[48px_44px_minmax(0,1fr)_auto] md:grid-cols-[60px_48px_minmax(0,1fr)_auto] items-center gap-3 md:gap-4 py-3.5">
                        <span className={`font-serif text-[18px] md:text-[20px] [font-variant-numeric:lining-nums_tabular-nums] ${s.faded ? "text-muted" : "text-ink"}`}>
                          {formatSlot(b.time_slot)}
                        </span>
                        <span className={`relative w-11 h-11 md:w-12 md:h-12 rounded-[14px] overflow-hidden bg-soft ${s.faded ? "opacity-55" : ""}`}>
                          {img && <Image src={img} alt="" fill sizes="48px" className="object-cover" />}
                        </span>
                        <span className="min-w-0">
                          <span className={`block font-sans text-[15px] font-medium truncate ${s.faded ? "text-muted" : "text-ink"}`}>{b.client_name}</span>
                          <span className="block font-sans text-[13px] text-muted truncate">
                            {b.treatment || b.service_name}{b.stylist_name ? ` · ${b.stylist_name}` : ""}
                          </span>
                        </span>
                        {isNext ? <Pill tone="solid">Next</Pill> : <Pill tone={s.tone} className={s.tone === "outline" ? "hidden sm:inline-flex" : ""}>{s.label}</Pill>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </Page>
  );
}
