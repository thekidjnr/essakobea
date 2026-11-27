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
      className="theme-ink greeting-pop m-auto w-[calc(100%-2rem)] max-w-[500px] p-0 rounded-2xl overflow-hidden bg-white text-ink backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {/* Square garland frame: the text sits in the white space between the
          garland at the top and the one along the bottom */}
      <div
        className="relative aspect-square bg-white bg-cover bg-center flex flex-col items-center justify-start text-center px-[11%] pt-[30%] pb-[13%]"
        style={{ backgroundImage: "url(/images/christmas-background.jpg)" }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white text-ink shadow-md hover:bg-white/90 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <p className="font-sans text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-ink/60">
          From all of us at Essakobea
        </p>
        <h2
          id="christmas-title"
          className="font-serif font-light text-[2.1rem] sm:text-[3rem] leading-[0.95] mt-2 sm:mt-4"
        >
          Merry <span className="italic">Christmas</span>
        </h2>
        <p className="font-sans text-[12.5px] sm:text-[14px] text-ink/75 leading-snug sm:leading-relaxed mt-3 sm:mt-5">
          Thank you for trusting us with your hair this year. Wishing you a
          joyful festive season.
        </p>

        <button
          type="button"
          onClick={close}
          className="mt-auto w-full max-w-[280px] bg-ink text-paper font-sans text-[10.5px] sm:text-[11px] font-medium tracking-widest uppercase py-3 sm:py-3.5 hover:bg-ink/85 transition-colors"
        >
          Continue to the site
        </button>
      </div>
    </dialog>
  );
}
