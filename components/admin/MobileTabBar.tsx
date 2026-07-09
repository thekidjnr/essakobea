"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminIcons } from "@/components/admin/adminIcons";

const PRIMARY = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  // { href: "/admin/orders", label: "Orders" }, — Shop/Orders on hold for now
  { href: "/admin/services", label: "Services" },
];

const SECONDARY = [
  // { href: "/admin/shop", label: "Shop" }, — Shop/Orders on hold for now
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/works", label: "Works" },
  { href: "/admin/stylists", label: "Stylists" },
];

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

  const isPrimaryActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  const moreActive = SECONDARY.some((s) => pathname.startsWith(s.href));

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper/80 backdrop-blur-xl border-t border-ink/[0.08] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-16">
          {PRIMARY.map((item) => {
            const active = isPrimaryActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center gap-1"
              >
                {active && <span className="absolute top-0 w-8 h-[2px] bg-ink" />}
                <span className={active ? "text-ink" : "text-ink/35"}>{AdminIcons[item.label]}</span>
                <span className={`font-sans text-[9px] tracking-widest uppercase ${active ? "text-ink" : "text-ink/35"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="relative flex flex-col items-center justify-center gap-1"
          >
            {moreActive && <span className="absolute top-0 w-8 h-[2px] bg-ink" />}
            <span className={moreActive || sheetOpen ? "text-ink" : "text-ink/35"}>{AdminIcons.More}</span>
            <span className={`font-sans text-[9px] tracking-widest uppercase ${moreActive || sheetOpen ? "text-ink" : "text-ink/35"}`}>
              More
            </span>
          </button>
        </div>
      </nav>

      {sheetOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-ink/40"
            onClick={() => setSheetOpen(false)}
          />
          <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-paper border-t border-ink/[0.08] pb-[env(safe-area-inset-bottom)] animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="px-6 pt-5 pb-2 flex items-center justify-between">
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35">More</p>
              <button
                onClick={() => setSheetOpen(false)}
                className="font-sans text-[20px] text-ink/40 hover:text-ink leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col px-3 pb-2">
              {SECONDARY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-3.5 font-sans text-[11px] tracking-widest uppercase text-ink/70 border-b border-ink/[0.05] last:border-0"
                >
                  <span className="text-ink/40">{AdminIcons[item.label]}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="px-3 pt-2 pb-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3.5 font-sans text-[11px] tracking-widest uppercase text-ink/40"
              >
                <span className="text-ink/40">{AdminIcons.SignOut}</span>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
