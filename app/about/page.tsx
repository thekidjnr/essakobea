import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { aboutImages } from "@/public/images";
import Reveal from "@/components/common/Reveal";

export const metadata: Metadata = {
  title: "About | Essakobea",
  description:
    "Essakobea is a premium beauty studio in Accra, East Legon, combining professional hair services with a curated wig collection.",
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
      "Your hair's health is always the priority. Every service begins with a consultation and ends with aftercare guidance, because your hair doesn't stop mattering after you leave.",
  },
  {
    number: "03",
    name: "Confidence",
    description:
      "We believe great hair isn't vanity, it's armour. When you feel good in your hair, you move differently. That's what we're here for.",
  },
];

const stats = [
  { value: "2023", label: "Est." },
  { value: "1000+", label: "Bookings" },
  { value: "4", label: "Core Services" },
  { value: "Accra", label: "East Legon" },
];

export default function AboutPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="pt-40 pb-0 md:pt-52 md:pb-0 overflow-hidden">
        <Reveal className="max-w-[1400px] mx-auto px-6 md:px-16">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-6">
            About Essakobea
          </p>
          <h1 className="font-serif text-[clamp(3.5rem,9vw,10rem)] leading-[0.85] font-light text-ink">
            Beauty is
            <br />
            our <span className="italic">language.</span>
          </h1>
        </Reveal>

        {/* Full-bleed editorial image below headline */}
        <Reveal delay={150} className="relative w-full h-[55vw] max-h-[680px] min-h-[320px] mt-16 overflow-hidden">
          <Image
            src={aboutImages.team}
            alt="The Essakobea Team"
            fill
            className="object-cover object-top"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-paper/60 via-transparent to-transparent" />
        </Reveal>
      </section>

      {/* Story */}
      <section className="bg-paper py-28 md:py-36 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
          {/* Text */}
          <Reveal>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-8">
              From The Founder
            </p>
            <div className="flex flex-col gap-6">
              <p className="font-serif text-[1.5rem] md:text-[1.75rem] font-light text-ink leading-snug">
                I began in my hostel room at the University of Ghana, long
                before Essakobea had a name.
              </p>
              <p className="font-sans text-[14px] text-ink/70 font-light leading-relaxed">
                Back then it was just me, doing hair for friends and
                coursemates because I loved it, with no brand name attached,
                just skill and word of mouth. After school, I kept going from
                home, working with what I had before I ever had a studio to
                call my own.
              </p>
              <p className="font-sans text-[14px] text-ink/70 font-light leading-relaxed">
                My first shop opened in East Legon, and we&apos;ve since moved
                into a new space, also in East Legon, built for the studio
                I&apos;d always pictured. Essakobea as a brand was founded in
                2023, but the craft behind it started years earlier, in a
                university hostel with nothing but a comb, a client, and the
                belief that hair could be someone&apos;s whole confidence.
              </p>
              <p className="font-sans text-[14px] text-ink/70 font-light leading-relaxed">
                I built this platform so booking your next appointment feels
                as seamless as shopping your next look, because great hair
                shouldn&apos;t come with friction.
              </p>
            </div>
            <div className="mt-10 pt-6 border-t border-ink/10">
              <p className="font-serif text-[1.1rem] font-light text-ink leading-none">
                Vanessa Akosua Menkobea Bampoe
              </p>
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mt-2">
                Founder &amp; CEO
              </p>
            </div>
          </Reveal>

          {/* Portrait */}
          <Reveal delay={150} className="relative">
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={aboutImages.portrait}
                alt="Vanessa Akosua Menkobea Bampoe, Founder & CEO of Essakobea"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* Floating caption */}
            <div className="absolute -bottom-6 -right-0 md:-right-6 bg-paper p-6 max-w-[220px]">
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-2">
                Founder &amp; CEO
              </p>
              <p className="font-serif text-[1.1rem] font-light text-ink leading-snug">
                Vanessa Akosua Menkobea Bampoe
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-t border-b border-ink/10 bg-mist">
        <Reveal className="max-w-[1400px] mx-auto px-6 md:px-16">
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
        </Reveal>
      </section>

      {/* Pillars */}
      <section className="bg-paper py-28 md:py-36 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
            <div>
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-4">
                What We Stand For
              </p>
              <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none font-light text-ink">
                Our <span className="italic">Values</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-ink/10">
            {pillars.map((pillar, i) => (
              <Reveal
                key={pillar.number}
                delay={i * 80}
                className="py-10 md:py-0 md:px-12 first:md:pl-0 last:md:pr-0"
              >
                <span className="font-sans text-[10px] tracking-widest text-ink/25 block mb-8">
                  {pillar.number}
                </span>
                <h3 className="font-serif text-[clamp(1.75rem,2.5vw,2.5rem)] font-light text-ink leading-none mb-5">
                  {pillar.name}
                </h3>
                <p className="font-sans text-[14px] text-ink/70 font-light leading-relaxed">
                  {pillar.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* The platform section */}
      <section className="bg-ink py-28 md:py-36 px-6 md:px-16 overflow-hidden">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/30 mb-6">
              The Platform
            </p>
            <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-[0.9] font-light text-paper mb-8">
              One place.
              <br />
              <span className="italic">Everything.</span>
            </h2>
            <p className="font-sans text-[14px] text-paper/65 font-light leading-relaxed mb-6 max-w-sm">
              Essakobea is not just a salon. It&apos;s a complete beauty system:
              book an appointment, shop a wig, manage it all from your phone.
            </p>
            <p className="font-sans text-[14px] text-paper/65 font-light leading-relaxed max-w-sm">
              We built the digital side of Essakobea so that our clients never
              have to chase us down. Your booking, your collection, your history,
              all in one place.
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
          </Reveal>

          {/* Platform feature list */}
          <div className="flex flex-col gap-0 divide-y divide-paper/10">
            {[
              [
                "Appointment Booking",
                "Select your service, date, and time, done in under 2 minutes.",
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
            ].map(([title, desc], i) => (
              <Reveal key={title} delay={i * 80} className="py-8 flex gap-6 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-paper/30 flex-shrink-0 mt-2" />
                <div>
                  <p className="font-sans text-[12px] tracking-wide uppercase text-paper/60 mb-2">
                    {title}
                  </p>
                  <p className="font-sans text-[14px] text-paper/60 font-light leading-relaxed">
                    {desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Visit us */}
      <section className="bg-paper py-28 md:py-36 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-end">
          <Reveal>
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
                  Tuesday – Sunday
                  <br />
                  Closed Mondays
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
          </Reveal>

          {/* Big quote / closing statement */}
          <Reveal delay={150} className="border-l border-ink/10 pl-12 md:pl-16">
            <blockquote className="font-serif text-[clamp(1.75rem,3vw,2.75rem)] font-light text-ink leading-snug mb-8">
              &ldquo;We don&apos;t just do hair. We give women a reason to walk
              in the room first.&rdquo;
            </blockquote>
            <p className="font-sans text-[11px] tracking-widest uppercase text-ink/45">
              Essakobea
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-3">
              <Link
                href="/book"
                className="inline-block bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink/80 transition-colors duration-300"
              >
                Book an Appointment
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
