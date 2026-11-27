import { todayInAccra } from "@/lib/booking-time";

// Christmas greeting over the home hero: gentle snowfall and a frosted card
// under the nav. Monochrome, to stay on brand. Dated, so it comes down by
// itself (the home page revalidates every minute).
const LAST_DAY = "2026-12-31";

// Fixed "random" flakes, so the server and browser render the same snow
const FLAKES = Array.from({ length: 60 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    left: `${(r(1) * 100).toFixed(2)}%`,
    size: 2 + Math.round(r(2) * 4),
    duration: 9 + r(3) * 10,
    delay: -r(4) * 18,
    drift: Math.round((r(5) - 0.5) * 80),
    opacity: (0.35 + r(6) * 0.5).toFixed(2),
  };
});

function Snowflake({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
        <path d="M9.5 3.8L12 6l2.5-2.2M9.5 20.2L12 18l2.5 2.2" />
        <path d="M3.6 10.2l3.1-.9-.7-3.2M20.4 13.8l-3.1.9.7 3.2" />
        <path d="M3.6 13.8l3.1.9-.7 3.2M20.4 10.2l-3.1-.9.7-3.2" />
      </g>
    </svg>
  );
}

export default function HolidayBanner() {
  if (todayInAccra() > LAST_DAY) return null;
  return (
    <>
      {/* Snow sits over the photo but under the hero text */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        {FLAKES.map((f, i) => (
          <span
            key={i}
            className="snowflake"
            style={{
              left: f.left,
              width: f.size,
              height: f.size,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              filter: f.size > 4 ? "blur(1px)" : undefined,
              ["--flake-drift" as string]: `${f.drift}px`,
              ["--flake-opacity" as string]: f.opacity,
            }}
          />
        ))}
      </div>

      <aside
        aria-label="Christmas greeting"
        className="fade-up absolute top-[88px] md:top-[96px] inset-x-0 z-20 flex justify-center px-4"
      >
        <div className="relative w-full max-w-[560px] rounded-2xl border border-white/20 bg-black/35 backdrop-blur-md px-6 py-5 md:px-10 md:py-6 text-center text-white shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="h-px w-8 md:w-12 bg-white/40" />
            <p className="font-sans text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-white/80">
              Season&apos;s Greetings
            </p>
            <span className="h-px w-8 md:w-12 bg-white/40" />
          </div>
          <div className="flex items-center justify-center gap-3 md:gap-4">
            <Snowflake className="twinkle text-white/80 flex-shrink-0" />
            <p className="font-serif italic font-light text-[2rem] md:text-[2.5rem] leading-none">
              Merry Christmas
            </p>
            <Snowflake className="twinkle text-white/80 flex-shrink-0 [animation-delay:1.6s]" />
          </div>
          <p className="font-sans text-[13px] md:text-[14px] text-white/85 leading-relaxed mt-3">
            Thank you for choosing Essakobea this year.
            <br className="hidden sm:block" /> Wishing you a joyful, beautiful festive season.
          </p>
        </div>
      </aside>
    </>
  );
}
