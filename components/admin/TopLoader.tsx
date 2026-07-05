"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [duration, setDuration] = useState("1.8s");
  const runningRef = useRef(false);
  const mountedRef = useRef(false);
  const startedAtRef = useRef(0);

  // Below this, even an instant client-side nav still shows a brief,
  // satisfying fill instead of a flash straight to 100%.
  const MIN_VISIBLE_MS = 300;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/admin")) return;
      if (href === window.location.pathname) return;
      if (runningRef.current) return;

      runningRef.current = true;
      startedAtRef.current = Date.now();
      setDuration("1.8s");
      setVisible(true);
      setWidth(75);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!runningRef.current) return;

    const finish = () => {
      setDuration("200ms");
      setWidth(100);
      const fadeTimer = setTimeout(() => setVisible(false), 200);
      const resetTimer = setTimeout(() => {
        setWidth(0);
        runningRef.current = false;
      }, 400);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(resetTimer);
      };
    };

    const elapsed = Date.now() - startedAtRef.current;
    if (elapsed >= MIN_VISIBLE_MS) {
      return finish();
    }
    const delayTimer = setTimeout(finish, MIN_VISIBLE_MS - elapsed);
    return () => clearTimeout(delayTimer);
  }, [pathname]);

  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] h-[2px] bg-ink pointer-events-none"
      style={{
        width: `${width}%`,
        opacity: visible ? 1 : 0,
        transition: `width ${duration} ease-out, opacity 200ms ease-out`,
      }}
    />
  );
}
