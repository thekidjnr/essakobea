"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logo, homeImages } from "@/public/images";
import { useRefundsOwed } from "@/components/admin/useRefundsOwed";

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  // Shop/Orders on hold for now, not in use yet.
  // { href: "/admin/orders", label: "Orders" },
  { href: "/admin/services", label: "Services" },
  // { href: "/admin/shop", label: "Shop" },
  { href: "/admin/works", label: "Works" },
  { href: "/admin/stylists", label: "Team" },
  { href: "/admin/availability", label: "Schedule" },
  { href: "/admin/finance", label: "Finance" },
];

export function isNavActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const refundsOwed = useRefundsOwed();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <aside className="w-[252px] flex-shrink-0 bg-ink text-paper h-screen sticky top-0 flex flex-col px-5 pt-10 pb-6">
      <Link href="/admin" className="block px-3.5">
        <span className="relative block h-[11px] w-[138px]">
          <Image src={logo.light} alt="Essakobea" fill sizes="138px" className="object-contain object-left" />
        </span>
      </Link>

      <nav className="mt-12 flex flex-col gap-1 overflow-y-auto hide-scrollbar">
        {ADMIN_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          const count = item.href === "/admin/bookings" ? refundsOwed : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-sans text-[14px] transition-colors duration-200 ${
                active ? "bg-paper/[0.09] text-paper" : "text-paper/60 hover:text-paper hover:bg-paper/[0.05]"
              }`}
            >
              {item.label}
              {count > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-paper text-ink text-[11px] font-medium">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 flex flex-col gap-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block h-[132px] rounded-2xl overflow-hidden"
        >
          <Image
            src={homeImages.eskWay}
            alt=""
            fill
            sizes="212px"
            className="object-cover object-[center_40%] transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <span className="absolute inset-0 bg-gradient-to-b from-ink/0 via-ink/20 to-ink/85" />
          <span className="absolute left-3.5 right-3.5 bottom-3 flex items-center justify-between font-sans text-[13px] text-paper">
            View website
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5 11l6-6M6 5h5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
        <button
          onClick={handleLogout}
          className="self-start px-3.5 py-2 font-sans text-[13px] text-paper/50 hover:text-paper transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
