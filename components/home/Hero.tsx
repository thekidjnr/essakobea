import Image from "next/image";
import Link from "next/link";
import { homeImages } from "@/public/images";
import HeroVideo from "./HeroVideo";

export default function Hero() {
  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden">
      {/* Background: poster image (LCP + reduced-motion fallback) with video on top */}
      <div className="absolute inset-0">
        {/* Mobile: native portrait framing */}
        <Image
          src={homeImages.heroVideoPosterMobile}
          alt="Essakobea | Premium Beauty"
          fill
          priority
          className="object-cover object-top md:hidden"
          sizes="100vw"
        />

        {/* Desktop: cropped widescreen framing */}
        <Image
          src={homeImages.heroVideoPoster}
          alt="Essakobea | Premium Beauty"
          fill
          priority
          className="hidden object-cover object-top md:block"
          sizes="100vw"
        />

        {/* Video mounts client-side once viewport width is known, so only one variant ever downloads */}
        <HeroVideo />
      </div>

      {/* Dark overlay — subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/30 to-ink/70" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 md:px-16 max-w-[1400px] mx-auto">
        {/* Eyebrow */}
        <p className="fade-up fade-up-delay-1 font-sans text-[10px] md:text-[11px] tracking-widest2 uppercase text-paper/60 mb-6">
          Premium Beauty Salon
        </p>

        {/* Headline */}
        <h1 className="fade-up fade-up-delay-2 font-serif text-[clamp(3rem,8vw,7.5rem)] leading-[0.9] text-paper font-light">
          Welcome to{" "}
          <span className="italic">Essakobea</span>
        </h1>

        {/* CTAs */}
        <div className="fade-up fade-up-delay-4 flex flex-col sm:flex-row gap-3 mt-10">
          <Link
            href="/services"
            className="inline-block bg-paper text-ink font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-paper/90 transition-colors duration-300"
          >
            Book a Service
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
