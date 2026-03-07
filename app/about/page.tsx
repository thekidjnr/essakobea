import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { aboutImages } from "@/public/images";

export const metadata: Metadata = {
  title: "About — Essakobea",
  description:
    "Essakobea is a premium beauty studio in Accra, East Legon — combining professional hair services with a curated wig collection.",
};

const pillars = [
  {
    number: "01",
    name: "Craft",
    description:
      "Every unit, every braid, every install is executed with deliberate precision. We don't rush. We don't cut corners. We build things that last.",
  },
  {
    number: "02",
    name: "Care",
    description:
      "Your hair's health is always the priority. Every service begins with a consultation and ends with aftercare guidance — because your hair doesn't stop mattering after you leave.",
  },
  {
    number: "03",
    name: "Confidence",
    description:
      "We believe great hair isn't vanity — it's armour. When you feel good in your hair, you move differently. That's what we're here for.",
  },
];

const stats = [
  { value: "2018", label: "Est." },
  { value: "400+", label: "Appointments" },
  { value: "4", label: "Core Services" },
  { value: "Accra", label: "East Legon" },
];

export default function AboutPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="pt-40 pb-0 md:pt-52 md:pb-0 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-6">
            About Essakobea
          </p>
          <h1 className="font-serif text-[clamp(3.5rem,9vw,10rem)] leading-[0.85] font-light text-ink">
            Beauty is
            <br />
            our <span className="italic">language.</span>
          </h1>
        </div>

        {/* Full-bleed editorial image below headline */}
        <div className="relative w-full h-[55vw] max-h-[680px] min-h-[320px] mt-16 overflow-hidden">
          <Image
            src={aboutImages.team}
            alt="The Essakobea Team"
            fill
            className="object-cover object-top"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-paper/60 via-transparent to-transparent" />
        </div>
      </section>

      {/* Story */}
      <section className="bg-paper py-28 md:py-36 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
          {/* Text */}
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-8">
              Our Story
            </p>
            <div className="flex flex-col gap-6">
              <p className="font-serif text-[1.5rem] md:text-[1.75rem] font-light text-ink leading-snug">
                Essakobea was born from a simple conviction — that premium hair
                services shouldn&apos;t feel inaccessible.
              </p>
              <p className="font-sans text-[13px] text-ink/55 font-light leading-relaxed">
                We started in Accra, East Legon, with one studio and an
                obsession with doing things properly. No shortcuts, no
                mediocrity — just well-crafted hair and a client experience that
                actually feels good.
              </p>
              <p className="font-sans text-[13px] text-ink/55 font-light leading-relaxed">
                Today, Essakobea sits at the intersection of in-studio service
                and ecommerce — so whether you want to book a full installation
                or pick up a ready-made unit, everything lives in one place.
              </p>
              <p className="font-sans text-[13px] text-ink/55 font-light leading-relaxed">
                We built this platform so that booking your next appointment
                feels as seamless as shopping your next look. Because great hair
                shouldn&apos;t come with friction.
              </p>
            </div>
          </div>

          {/* Portrait */}
          <div className="relative">
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={aboutImages.portrait}
                alt="Essakobea — Our Story"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* Floating caption */}
            <div className="absolute -bottom-6 -right-0 md:-right-6 bg-paper p-6 max-w-[220px]">
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-2">
                Location
              </p>
              <p className="font-serif text-[1.1rem] font-light text-ink leading-snug">
                Accra,
                <br />
                East Legon
              </p>
              <p className="font-sans text-[11px] text-ink/40 font-light mt-2">
                0557205803
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-t border-b border-ink/10 bg-mist">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-ink/10">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="py-12 px-6 md:px-10 first:pl-0 last:pr-0"
              >
                <p className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light text-ink leading-none mb-2">
                  {stat.value}
                </p>
                <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-paper py-28 md:py-36 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
            <div>
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-4">
                What We Stand For
              </p>
              <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none font-light text-ink">
                Our <span className="italic">Values</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-ink/10">
            {pillars.map((pillar) => (
              <div
                key={pillar.number}
                className="py-10 md:py-0 md:px-12 first:md:pl-0 last:md:pr-0"
              >
                <span className="font-sans text-[10px] tracking-widest text-ink/25 block mb-8">
                  {pillar.number}
                </span>
                <h3 className="font-serif text-[clamp(1.75rem,2.5vw,2.5rem)] font-light text-ink leading-none mb-5">
                  {pillar.name}
                </h3>
                <p className="font-sans text-[13px] text-ink/55 font-light leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The platform section */}
      <section className="bg-ink py-28 md:py-36 px-6 md:px-16 overflow-hidden">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/30 mb-6">
              The Platform
            </p>
            <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-[0.9] font-light text-paper mb-8">
              One place.
              <br />
              <span className="italic">Everything.</span>
            </h2>
            <p className="font-sans text-[13px] text-paper/50 font-light leading-relaxed mb-6 max-w-sm">
              Essakobea is not just a salon. It&apos;s a complete beauty system
              — book an appointment, shop a wig, manage it all from your phone.
            </p>
            <p className="font-sans text-[13px] text-paper/50 font-light leading-relaxed max-w-sm">
              We built the digital side of Essakobea so that our clients never
              have to chase us down. Your booking, your collection, your history
              — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-12">
              <Link
                href="/book"
                className="inline-block bg-paper text-ink font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-paper/80 transition-colors duration-300"
              >
                Book Now
              </Link>
              <Link
                href="/services"
                className="inline-block border border-paper/30 text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:border-paper/70 transition-colors duration-300"
              >
                View Services
              </Link>
            </div>
          </div>

          {/* Platform feature list */}
          <div className="flex flex-col gap-0 divide-y divide-paper/10">
            {[
              [
                "Appointment Booking",
                "Select your service, date, and time — done in under 2 minutes.",
              ],
              [
                "Wig Collection",
                "Browse and shop premium units from our curated collection.",
              ],
              [
                "Transparent Pricing",
                "Every service priced clearly. No surprises.",
              ],
              [
                "Accra-Based Studio",
                "Walk in knowing exactly what to expect. Accra, East Legon.",
              ],
            ].map(([title, desc]) => (
              <div key={title} className="py-8 flex gap-6 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-paper/30 flex-shrink-0 mt-2" />
                <div>
                  <p className="font-sans text-[12px] tracking-wide uppercase text-paper/60 mb-2">
                    {title}
                  </p>
                  <p className="font-sans text-[13px] text-paper/35 font-light leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit us */}
      <section className="bg-paper py-28 md:py-36 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-end">
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-6">
              Find Us
            </p>
            <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none font-light text-ink mb-8">
              Come see
              <br />
              <span className="italic">us.</span>
            </h2>

            <div className="flex flex-col gap-6">
              <div>
                <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-2">
                  Address
                </p>
                <p className="font-sans text-[14px] text-ink/70 font-light">
                  East Legon, Accra
                  <br />
                  Ghana
                </p>
              </div>
              <div>
                <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-2">
                  Hours
                </p>
                <p className="font-sans text-[14px] text-ink/70 font-light">
                  Monday – Saturday
                  <br />
                  8:00 AM – 6:00 PM
                </p>
              </div>
              <div>
                <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-2">
                  Contact
                </p>
                <a
                  href="tel:0557205803"
                  className="font-sans text-[14px] text-ink/70 font-light hover:text-ink transition-colors block"
                >
                  0557205803
                </a>
                <a
                  href="mailto:essakobea@gmail.com"
                  className="font-sans text-[14px] text-ink/70 font-light hover:text-ink transition-colors block"
                >
                  essakobea@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Big quote / closing statement */}
          <div className="border-l border-ink/10 pl-12 md:pl-16">
            <blockquote className="font-serif text-[clamp(1.75rem,3vw,2.75rem)] font-light text-ink leading-snug mb-8">
              &ldquo;We don&apos;t just do hair. We give women a reason to walk
              in the room first.&rdquo;
            </blockquote>
            <p className="font-sans text-[11px] tracking-widest uppercase text-ink/30">
              — Essakobea
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-3">
              <Link
                href="/book"
                className="inline-block bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink/80 transition-colors duration-300"
              >
                Book an Appointment
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
