const MASONRY_HEIGHTS = [420, 300, 500, 360, 440, 320, 480, 380];

export default function Loading() {
  return (
    <main className="min-h-screen bg-paper">
      {/* Minimal fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-paper border-b border-ink/[0.07] px-6 md:px-12 h-14 flex items-center justify-between">
        <div className="h-2.5 w-16 bg-ink/[0.08] rounded-sm animate-pulse" />
        <div className="h-2.5 w-20 bg-ink/[0.08] rounded-sm animate-pulse" />
        <div className="h-8 w-24 bg-ink/[0.08] animate-pulse" />
      </header>

      {/* Hero */}
      <div className="pt-14">
        <div className="px-6 md:px-12 max-w-[1400px] mx-auto pt-16 pb-12 md:pt-20 md:pb-16">
          <div className="h-2.5 w-24 bg-ink/[0.08] rounded-sm mb-4 animate-pulse" />
          <div className="h-[3rem] md:h-[5.5rem] w-1/2 max-w-sm bg-ink/[0.06] rounded-sm animate-pulse" />
        </div>
      </div>

      {/* Gallery */}
      <div className="px-6 md:px-12 max-w-[1400px] mx-auto pb-32">
        <div className="columns-2 md:columns-3 gap-3 md:gap-4 space-y-3 md:space-y-4 animate-pulse">
          {MASONRY_HEIGHTS.map((h, i) => (
            <div key={i} className="break-inside-avoid bg-mist" style={{ height: `${h}px` }} />
          ))}
        </div>
      </div>
    </main>
  );
}
