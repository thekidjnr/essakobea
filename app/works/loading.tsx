import Nav from "@/components/layout/Nav";

const MASONRY_HEIGHTS = [420, 300, 500, 360, 440, 320, 480, 380];

export default function Loading() {
  return (
    <>
      <Nav />

      <main className="min-h-screen bg-paper">
        {/* Hero */}
        <section className="pt-40 pb-12 md:pt-48 md:pb-16 px-6 md:px-16 max-w-[1400px] mx-auto">
          <div className="h-2.5 w-20 bg-ink/[0.08] rounded-sm mb-5 animate-pulse" />
          <div className="h-[3.2rem] md:h-[6rem] w-1/2 max-w-sm bg-ink/[0.06] rounded-sm animate-pulse" />
        </section>

        {/* Gallery */}
        <section className="px-6 md:px-16 max-w-[1400px] mx-auto pb-32">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-12 md:mb-16 animate-pulse">
            {[70, 110, 120, 90, 100].map((w, i) => (
              <div key={i} className="h-9 bg-ink/[0.06]" style={{ width: `${w}px` }} />
            ))}
          </div>

          {/* Masonry placeholders */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4 space-y-3 md:space-y-4 animate-pulse">
            {MASONRY_HEIGHTS.map((h, i) => (
              <div key={i} className="break-inside-avoid bg-mist" style={{ height: `${h}px` }} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
