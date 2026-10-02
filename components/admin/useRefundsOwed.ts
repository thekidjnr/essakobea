"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Fired by pages after an action that can change the refunds-owed count,
// so the nav badge updates without a reload.
export const REFUNDS_CHANGED_EVENT = "admin:refunds-changed";

export function notifyRefundsChanged() {
  window.dispatchEvent(new Event(REFUNDS_CHANGED_EVENT));
}

// Number of cancelled bookings still owed a refund, shown as a nav badge.
export function useRefundsOwed() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/admin/bookings?status=refunds")
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => { if (alive) setCount(Array.isArray(d) ? d.length : 0); })
        .catch(() => {});
    load();
    window.addEventListener(REFUNDS_CHANGED_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(REFUNDS_CHANGED_EVENT, load);
    };
  }, [pathname]);

  return count;
}
