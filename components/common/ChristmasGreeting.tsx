"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { todayInAccra } from "@/lib/booking-time";

// A Christmas thank-you that opens over the public site, once per visitor.
// Closing it (button, X, Escape or a click outside) remembers the choice in
// this browser. Dated, so it stops showing by itself after the season.
const LAST_DAY = "2026-12-31";
const SEEN_KEY = "essakobea:christmas-2026-seen";

export default function ChristmasGreeting() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin") || todayInAccra() > LAST_DAY) return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {}
    // A short pause so the page appears first
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    if (!el.open) el.showModal();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    ref.current?.close();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      onClose={close}
      onClick={(e) => e.target === e.currentTarget && close()}
      aria-labelledby="christmas-title"
      className="theme-ink greeting-pop m-auto w-[calc(100%-2rem)] max-w-[480px] bg-ink text-paper p-0 rounded-2xl overflow-hidden backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative px-8 pt-12 pb-9 md:px-12 text-center">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-paper/60 hover:text-paper hover:bg-paper/10 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-paper/60">
          From all of us at Essakobea
        </p>
        <h2
          id="christmas-title"
          className="font-serif font-light text-[2.75rem] md:text-[3.25rem] leading-[0.95] mt-6"
        >
          Merry <span className="italic">Christmas</span>
        </h2>
        <span aria-hidden className="block w-10 h-px bg-paper/30 mx-auto my-7" />
        <p className="font-sans text-[14px] md:text-[15px] text-paper/80 leading-relaxed">
          Thank you for trusting us with your hair this year. Every visit, every
          booking and every kind word has meant the world to us.
        </p>
        <p className="font-serif italic text-[1.15rem] text-paper/90 mt-5">
          Wishing you a joyful festive season.
        </p>

        <button
          type="button"
          onClick={close}
          className="mt-9 w-full bg-paper text-ink font-sans text-[11px] font-medium tracking-widest uppercase py-4 hover:bg-paper/90 transition-colors"
        >
          Continue to the site
        </button>
      </div>
    </dialog>
  );
}
