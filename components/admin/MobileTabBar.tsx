"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_NAV, isNavActive } from "@/components/admin/Sidebar";

const ICONS: Record<string, React.ReactNode> = {
  Overview: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3.5 8.5L10 3.5l6.5 5V16a.5.5 0 0 1-.5.5h-4v-4.5h-4v4.5H4a.5.5 0 0 1-.5-.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  Bookings: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3.5" y="4.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.5 8.5h13M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Services: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3.5l1.6 4.4 4.4 1.6-4.4 1.6L10 15.5l-1.6-4.4L4 9.5l4.4-1.6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  More: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="5" cy="10" r="1.1" fill="currentColor" />
      <circle cx="10" cy="10" r="1.1" fill="currentColor" />
      <circle cx="15" cy="10" r="1.1" fill="currentColor" />
    </svg>
  ),
};

const PRIMARY_HREFS = ["/admin", "/admin/bookings", "/admin/services"];
const PRIMARY = ADMIN_NAV.filter((n) => PRIMARY_HREFS.includes(n.href));
const SECONDARY = ADMIN_NAV.filter((n) => !PRIMARY_HREFS.includes(n.href));

export default function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => { setSheetOpen(false); }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const moreActive = SECONDARY.some((s) => isNavActive(pathname, s.href));
  const tab = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 font-sans text-[10px] transition-colors ${active ? "text-paper" : "text-paper/55"}`;

  return (
    <>
      <nav className="md:hidden fixed inset-x-4 z-40 bottom-[calc(16px+env(safe-area-inset-bottom))] h-16 px-1.5 grid grid-cols-4 rounded-full bg-ink shadow-[0_12px_32px_rgba(26,33,43,0.28)]">
        {PRIMARY.map((item) => (
          <Link key={item.href} href={item.href} aria-current={isNavActive(pathname, item.href) ? "page" : undefined} className={tab(isNavActive(pathname, item.href))}>
            {ICONS[item.label]}
            {item.label}
          </Link>
        ))}
        <button type="button" onClick={() => setSheetOpen(true)} className={tab(moreActive || sheetOpen)}>
          {ICONS.More}
          More
        </button>
      </nav>

      {sheetOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-ink/45" onClick={() => setSheetOpen(false)} />
          <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-paper rounded-t-[28px] pb-[calc(20px+env(safe-area-inset-bottom))] animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="mx-auto mt-3 w-10 h-1 rounded-full bg-line" />
            <div className="flex flex-col px-3 pt-3">
              {SECONDARY.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-4 h-14 rounded-2xl font-serif text-[22px] ${active ? "bg-soft text-ink" : "text-ink"}`}
                  >
                    {item.label}
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-muted">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                );
              })}
            </div>
            <div className="mx-7 mt-3 pt-4 border-t border-line flex items-center justify-between">
              <a href="/" target="_blank" rel="noopener noreferrer" className="h-11 inline-flex items-center font-sans text-[14px] text-graphite">
                View website
              </a>
              <button onClick={handleLogout} className="h-11 font-sans text-[14px] text-muted">
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
