"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin",              label: "Overview",     icon: "◈" },
  { href: "/admin/bookings",     label: "Bookings",     icon: "◷" },
  { href: "/admin/orders",       label: "Orders",       icon: "◻" },
  { href: "/admin/availability", label: "Availability", icon: "◫" },
  { href: "/admin/services",     label: "Services",     icon: "◐" },
  { href: "/admin/shop",         label: "Shop",         icon: "◑" },
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
    <aside className="w-60 flex-shrink-0 bg-ink min-h-screen flex flex-col">
      {/* Brand */}
      <div className="px-7 pt-8 pb-10">
        <p className="font-sans text-[9px] tracking-widest2 uppercase text-paper/30 mb-1">
          Admin
        </p>
        <p className="font-serif text-[1.1rem] font-light text-paper italic">
          Essakobea
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-sm font-sans text-[11px] tracking-widest uppercase transition-all duration-200 mb-1 ${
                active
                  ? "bg-paper/10 text-paper"
                  : "text-paper/40 hover:text-paper/70 hover:bg-paper/5"
              }`}
            >
              <span className="text-[10px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 pb-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 font-sans text-[11px] tracking-widest uppercase text-paper/30 hover:text-paper/60 transition-colors"
        >
          <span className="text-[10px]">→</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
