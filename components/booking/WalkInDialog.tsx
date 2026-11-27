"use client";

import { useEffect, useRef } from "react";

/** Shown when a client opens the walk-in month on the booking calendar */
export default function WalkInDialog({
  headStylist,
  onBookHead,
  onClose,
}: {
  headStylist?: { name: string; fee: number };
  onBookHead: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // A native modal dialog traps focus and closes on Escape by itself
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="walk-in-title"
      className="m-auto w-[calc(100%-2rem)] max-w-[460px] bg-paper text-ink p-8 backdrop:bg-black/70"
    >
      <p className="font-sans text-[11px] tracking-widest2 uppercase text-ink/75 mb-4">
        December
      </p>
      <h2 id="walk-in-title" className="font-serif text-[1.75rem] font-light leading-snug mb-5">
        Walk-in <span className="italic">only.</span>
      </h2>
      <p className="font-sans text-[15px] text-ink/80 leading-relaxed mb-3">
        December services are walk-in only and bookings are not being accepted.
      </p>
      {headStylist && (
        <p className="font-sans text-[15px] text-ink/80 leading-relaxed">
          Our Head Stylist, {headStylist.name}, can still be booked online
          {headStylist.fee > 0 ? ` (+₵${headStylist.fee} stylist fee)` : ""}.
        </p>
      )}
      <div className="flex flex-col gap-3 mt-8">
        {headStylist && (
          <button
            type="button"
            onClick={onBookHead}
            className="w-full bg-ink text-paper font-sans text-[12px] font-medium tracking-widest uppercase py-4 hover:bg-ink/85 transition-colors"
          >
            Book the Head Stylist
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full border border-ink/20 text-ink/75 font-sans text-[12px] tracking-widest uppercase py-3.5 hover:text-ink hover:border-ink/40 transition-colors"
        >
          Close
        </button>
      </div>
    </dialog>
  );
}
