import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Browse",
    description:
      "Explore our services and wig collection. Find what speaks to you.",
  },
  {
    number: "02",
    title: "Book or Buy",
    description:
      "Schedule your appointment in seconds, or add to cart — it's that seamless.",
  },
  {
    number: "03",
    title: "Show Up, Glow Up",
    description:
      "Walk in, sit down, and leave transformed. Or receive your unit, right at your door.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-paper py-28 md:py-36 px-6 md:px-16">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-20">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-4">
            How It Works
          </p>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none font-light text-ink">
            Simple as <span className="italic">that.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-ink/10">
          {steps.map((step) => (
            <div key={step.number} className="py-10 md:py-0 md:px-12 first:md:pl-0 last:md:pr-0">
              <span className="font-sans text-[11px] tracking-widest text-ink/20 font-medium block mb-8">
                {step.number}
              </span>
              <h3 className="font-serif text-[clamp(1.75rem,2.5vw,2.25rem)] font-light text-ink mb-4 leading-none">
                {step.title}
              </h3>
              <p className="font-sans text-[13px] text-ink/50 font-light leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-24 pt-16 border-t border-ink/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <h3 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light text-ink leading-tight max-w-xl">
            Ready to experience{" "}
            <span className="italic">Essakobea?</span>
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="#book"
              className="inline-block bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink/80 transition-colors duration-300"
            >
              Book Now
            </Link>
            <Link
              href="#collection"
              className="inline-block border border-ink text-ink font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink hover:text-paper transition-all duration-300"
            >
              Shop Wigs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
