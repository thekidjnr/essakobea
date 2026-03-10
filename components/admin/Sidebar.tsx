"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    href: "/admin",
    label: "Overview",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="8.5" y="1" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="1" y="8.5" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="2.5" width="13" height="11" rx="0.75" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 1v3M10 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M1 6.5h13" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="5" cy="10" r="0.8" fill="currentColor"/>
        <circle cx="7.5" cy="10" r="0.8" fill="currentColor"/>
        <circle cx="10" cy="10" r="0.8" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M2 2h1.5l2 7h6l1.5-5H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6.5" cy="12.5" r="1" stroke="currentColor" strokeWidth="1.1"/>
        <circle cx="10.5" cy="12.5" r="1" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    ),
  },
  {
    href: "/admin/services",
    label: "Services",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 1.5a6 6 0 100 12 6 6 0 000-12z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7.5 4.5v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/admin/shop",
    label: "Shop",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M1.5 2h12l-1.5 5H3L1.5 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M3 7v5.5h9V7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M5.5 7v3h4V7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/admin/availability",
    label: "Availability",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7.5 4v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/admin/works",
    label: "Works",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="5.5" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="8.5" y="1" width="5.5" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="8.5" y="7" width="5.5" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="1" y="10" width="5.5" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    href: "/admin/stylists",
    label: "Stylists",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M2 13c0-2.761 2.462-5 5.5-5s5.5 2.239 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <aside className="w-56 flex-shrink-0 bg-ink h-screen sticky top-0 flex flex-col">
      {/* Brand */}
      <div className="px-6 pt-8 pb-8 border-b border-paper/[0.07]">
        <p className="font-sans text-[9px] tracking-widest2 uppercase text-paper/25 mb-1.5">
          Admin Panel
        </p>
        <p className="font-serif text-[1.15rem] font-light text-paper italic tracking-wide">
          Essakobea
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 font-sans text-[10.5px] tracking-widest uppercase transition-all duration-200 ${
                active
                  ? "bg-paper/[0.12] text-paper"
                  : "text-paper/35 hover:text-paper/65 hover:bg-paper/[0.06]"
              }`}
            >
              <span className={`flex-shrink-0 transition-colors ${active ? "text-paper" : "text-paper/35"}`}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto w-1 h-1 rounded-full bg-paper/60 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 pt-4 border-t border-paper/[0.07]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 font-sans text-[10.5px] tracking-widest uppercase text-paper/25 hover:text-paper/50 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0">
            <path d="M5.5 2H2.5A.5.5 0 002 2.5v10a.5.5 0 00.5.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M10 5l3 2.5L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 7.5H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
