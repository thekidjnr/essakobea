import { todayInAccra } from "@/lib/booking-time";

// Christmas greeting across the top of the hero, under the nav. Dated, so it
// comes down by itself (the home page revalidates every minute).
const LAST_DAY = "2026-12-31";

export default function HolidayBanner() {
  if (todayInAccra() > LAST_DAY) return null;
  return (
    <aside
      aria-label="Christmas greeting"
      className="absolute top-[72px] inset-x-0 z-20 bg-paper text-ink text-center px-6 py-3"
    >
      <p className="font-serif italic text-[1.25rem] leading-tight">Merry Christmas</p>
      <p className="font-sans text-[13px] leading-relaxed mt-1">
        Thank you for choosing Essakobea. We wish you a joyful festive season.
      </p>
    </aside>
  );
}
