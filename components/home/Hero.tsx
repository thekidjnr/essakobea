import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden">
      {/* Background portrait */}
      <div className="absolute inset-0 ken-burns">
        <Image
          src="https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=1920&q=90"
          alt="Essakobea — Premium Beauty"
          fill
          priority
          className="object-cover object-top"
          sizes="100vw"
        />
      </div>

      {/* Dark overlay — subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/30 to-ink/70" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-20 md:pb-24 px-6 md:px-16 max-w-[1400px] mx-auto">
        {/* Eyebrow */}
        <p className="fade-up fade-up-delay-1 font-sans text-[10px] md:text-[11px] tracking-widest2 uppercase text-paper/60 mb-6">
          Premium Beauty Platform
        </p>

        {/* Headline */}
        <h1 className="fade-up fade-up-delay-2 font-serif text-[clamp(3rem,8vw,7.5rem)] leading-[0.9] text-paper font-light max-w-4xl">
          The Art of{" "}
          <span className="italic">Beautiful</span>
          <br />
          Hair.
        </h1>

        {/* Sub */}
        <p className="fade-up fade-up-delay-3 font-sans text-[13px] md:text-[14px] text-paper/70 font-light mt-7 mb-10 max-w-sm leading-relaxed">
          Book your appointment or shop our curated wig collection — seamlessly, beautifully.
        </p>

        {/* CTAs */}
        <div className="fade-up fade-up-delay-4 flex flex-col sm:flex-row gap-3">
          <Link
            href="#book"
            className="inline-block bg-paper text-ink font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-paper/90 transition-colors duration-300"
          >
            Book a Service
          </Link>
          <Link
            href="#collection"
            className="inline-block border border-paper text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-paper hover:text-ink transition-all duration-300"
          >
            Shop Wigs
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 md:right-16 flex flex-col items-center gap-2 fade-up fade-up-delay-4">
        <span className="font-sans text-[9px] tracking-widest uppercase text-paper/50 [writing-mode:vertical-lr]">
          Scroll
        </span>
        <div className="w-px h-12 bg-paper/30 relative overflow-hidden">
          <div className="scroll-line absolute top-0 left-0 w-full bg-paper/70" />
        </div>
      </div>
    </section>
  );
}
