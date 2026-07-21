import Nav from "@/components/layout/Nav";

export default function Loading() {
  return (
    <>
      <Nav />

      {/* Page hero */}
      <section className="pt-28 pb-16 md:pt-48 md:pb-20 px-6 md:px-16 max-w-[1400px] mx-auto">
        <div className="h-[3.2rem] md:h-[6.5rem] w-2/3 max-w-lg bg-ink/[0.06] rounded-sm animate-pulse" />
      </section>

      {/* Service cards */}
      <section className="px-6 md:px-16 max-w-[1400px] mx-auto pb-24 md:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16 md:gap-y-20">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-mist aspect-[4/3]" />
              <div className="pt-6">
                <div className="h-7 w-1/2 bg-ink/[0.06] rounded-sm mb-8" />
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-2.5 w-14 bg-ink/[0.08] rounded-sm flex-shrink-0" />
                    <div className="h-px flex-1 bg-ink/8" />
                  </div>
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex items-center justify-between gap-4">
                        <div className="h-3 bg-ink/[0.06] rounded-sm" style={{ width: `${55 - j * 8}%` }} />
                        <div className="h-3 w-12 bg-ink/[0.06] rounded-sm flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-[52px] w-44 bg-ink/[0.08]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
