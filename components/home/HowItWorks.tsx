import Link from "next/link";

export default function HowItWorks() {
  return (
    <section className="bg-paper py-28 md:py-36 px-6 md:px-16 border-t border-ink/10">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <h3 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light text-ink leading-tight max-w-xl">
            Ready to experience{" "}
            <span className="italic">Essakobea?</span>
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/book"
              className="inline-block bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink/80 transition-colors duration-300"
            >
              Book Now
            </Link>
            <Link
              href="/shop"
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
