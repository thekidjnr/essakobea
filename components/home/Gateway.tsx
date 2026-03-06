import Image from "next/image";
import Link from "next/link";

export default function Gateway() {
  return (
    <section id="book" className="grid grid-cols-1 md:grid-cols-2 min-h-[90vh]">
      {/* Book */}
      <div className="relative group overflow-hidden min-h-[50vh] md:min-h-auto">
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
          <Image
            src="https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1200&q=90"
            alt="Book a Service"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="absolute inset-0 bg-ink/50 group-hover:bg-ink/40 transition-colors duration-500" />
        <div className="relative z-10 h-full flex flex-col justify-end p-10 md:p-16 min-h-[50vh] md:min-h-[90vh]">
          <span className="font-sans text-[10px] tracking-widest2 uppercase text-paper/50 mb-4 block">
            01 — Services
          </span>
          <h2 className="font-serif text-[clamp(2.5rem,4vw,4.5rem)] leading-none text-paper font-light mb-4">
            Book a<br />
            <span className="italic">Service</span>
          </h2>
          <p className="font-sans text-[13px] text-paper/60 font-light max-w-xs mb-8 leading-relaxed">
            Wig making, braids, installs, and more — crafted by professionals, tailored to you.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-3 font-sans text-[11px] tracking-widest uppercase text-paper group/link"
          >
            <span className="border-b border-paper/40 pb-px group-hover/link:border-paper transition-colors">
              Schedule Appointment
            </span>
            <span className="transition-transform group-hover/link:translate-x-1">→</span>
          </Link>
        </div>
      </div>

      {/* Shop */}
      <div className="relative group overflow-hidden min-h-[50vh] md:min-h-auto bg-mist">
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
          <Image
            src="https://images.pexels.com/photos/2065195/pexels-photo-2065195.jpeg?auto=compress&cs=tinysrgb&w=1200&q=90"
            alt="Shop Wigs"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="absolute inset-0 bg-paper/10 group-hover:bg-paper/5 transition-colors duration-500" />
        <div className="relative z-10 h-full flex flex-col justify-end p-10 md:p-16 min-h-[50vh] md:min-h-[90vh]">
          <span className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-4 block">
            02 — Collection
          </span>
          <h2 className="font-serif text-[clamp(2.5rem,4vw,4.5rem)] leading-none text-ink font-light mb-4">
            Shop the<br />
            <span className="italic">Collection</span>
          </h2>
          <p className="font-sans text-[13px] text-ink/50 font-light max-w-xs mb-8 leading-relaxed">
            Premium wigs, curated for quality. Find your perfect unit and wear it with confidence.
          </p>
          <Link
            href="#collection"
            className="inline-flex items-center gap-3 font-sans text-[11px] tracking-widest uppercase text-ink group/link"
          >
            <span className="border-b border-ink/40 pb-px group-hover/link:border-ink transition-colors">
              Browse All Wigs
            </span>
            <span className="transition-transform group-hover/link:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
