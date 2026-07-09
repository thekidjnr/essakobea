"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logo } from "@/public/images";
import { AdminIcons } from "@/components/admin/adminIcons";

const NAV = [
  { href: "/admin", label: "Overview", icon: AdminIcons.Overview },
  { href: "/admin/bookings", label: "Bookings", icon: AdminIcons.Bookings },
  // Shop/Orders on hold for now — not in use yet.
  // { href: "/admin/orders", label: "Orders", icon: AdminIcons.Orders },
  { href: "/admin/services", label: "Services", icon: AdminIcons.Services },
  // { href: "/admin/shop", label: "Shop", icon: AdminIcons.Shop },
  { href: "/admin/availability", label: "Availability", icon: AdminIcons.Availability },
  { href: "/admin/works", label: "Works", icon: AdminIcons.Works },
  { href: "/admin/stylists", label: "Stylists", icon: AdminIcons.Stylists },
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
        <p className="font-sans text-[9px] tracking-widest2 uppercase text-paper/25 mb-2">
          Admin Panel
        </p>
        <div className="relative h-3.5 w-[130px]">
          <Image src={logo.light} alt="Essakobea" fill className="object-contain object-left" />
        </div>
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
          <span className="flex-shrink-0">{AdminIcons.SignOut}</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
