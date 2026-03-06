import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import ServiceSelector from "@/components/services/ServiceSelector";

export const metadata: Metadata = {
  title: "Services — Essakobea",
  description:
    "Professional wig making, installations, coloring, and frontal styling in Accra, East Legon. Book your appointment today.",
};

export const services = [
  {
    id: "wig-making",
    number: "01",
    name: "Wig Making",
    tagline: "Built for you. Only you.",
    description:
      "Every unit we make starts with a consultation — your texture, your density, your aesthetic. We source quality hair and construct each wig by hand from cap construction to knot bleaching, plucking, and finish.",
    image:
      "https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1200&q=90",
    imageAlt: "Wig Making — Essakobea",
    imagePosition: "object-top",
    flip: false,
    categories: [
      {
        label: "Wig Construction",
        items: [
          { name: "Frontal Wig Making", price: "₵300" },
          { name: "Closure (5×5 / 6×6 / Mini Frontal)", price: "₵250" },
          { name: "Closure (4×4, 2×4, 2×6)", price: "₵200" },
          { name: "Express Service", price: "₵100 – ₵300" },
          { name: "Express Color", price: "₵200 – ₵500", note: "1–3 days" },
          { name: "Bleach Only", price: "₵100" },
          { name: "Plucking Only", price: "₵100 – ₵200", note: "Depends on fullness" },
        ],
      },
      {
        label: "Styling Only",
        items: [
          { name: "Straightening", price: "₵150 – ₵250" },
          { name: "Curling", price: "₵150 – ₵250" },
          { name: "Layering", price: "₵100 – ₵200" },
          { name: "Crimping", price: "₵200 – ₵600" },
          { name: "Fringe", price: "₵150" },
          { name: "Wand Curls", price: "₵200 – ₵600" },
        ],
      },
    ],
  },
  {
    id: "installations",
    number: "02",
    name: "Installations",
    tagline: "Seamless. Undetectable. Natural.",
    description:
      "A great unit deserves a great install. We use professional technique — proper lace melting, edge styling, and adhesive or glueless methods — for a finish that looks second-skin. We also offer full revamp and treatment for existing wigs.",
    image:
      "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200&q=90",
    imageAlt: "Installations — Essakobea",
    imagePosition: "object-top",
    flip: true,
    categories: [
      {
        label: "Installation",
        items: [
          { name: "Glueless Frontal", price: "₵250 – ₵450" },
          { name: "Closure (2×6, 4×4, 5×5, 6×6)", price: "₵200 – ₵550" },
          { name: "Adhesive Frontal", price: "₵300 – ₵600" },
        ],
      },
      {
        label: "Revamp Service",
        items: [
          { name: "Wash Only", price: "₵100 – ₵150" },
          { name: "Revamp & Treatment", price: "From ₵200", note: "Deep cleanse, restyle & treatment" },
        ],
      },
    ],
  },
  {
    id: "coloring",
    number: "03",
    name: "Coloring",
    tagline: "Rich. Dimensional. Lasting.",
    description:
      "From classic black to vibrant statement colours — our coloring service is tailored to your wig's hair type, length, and density. All pricing is by inch range to keep it simple and transparent.",
    image:
      "https://images.pexels.com/photos/2876486/pexels-photo-2876486.jpeg?auto=compress&cs=tinysrgb&w=1200&q=90",
    imageAlt: "Coloring — Essakobea",
    imagePosition: "object-center",
    flip: false,
    categories: [
      {
        label: "Color by Length",
        sublabel: "Prices apply across all color types below",
        lengthBased: true,
        lengths: ["10–16 inch", "18–24 inch", "26–30 inch"],
        items: [
          { name: "Black / Jet Black", prices: ["₵400–550", "₵550–650", "₵650–750"] },
          { name: "Simple Blonde Colors", prices: ["₵400–550", "₵550–650", "₵650–750"] },
          { name: "Black to Loud Colors (Red, Ginger etc.)", prices: ["₵400–550", "₵550–650", "₵650–750"] },
          { name: "Highlights", prices: ["₵550–650", "₵650–750", "₵750–850"] },
          { name: "Balayage with Highlights", prices: ["₵650–800", "₵800–850", "₵850–1000"] },
        ],
      },
    ],
  },
  {
    id: "frontal-styling",
    number: "04",
    name: "Frontal Styling",
    tagline: "Versatile. Elevated. Effortless.",
    description:
      "Ponytails, half-up-half-down, and frontal styles — done right on both natural and relaxed hair. Quick turnaround, clean finish, every time.",
    image:
      "https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=1200&q=90",
    imageAlt: "Frontal Styling — Essakobea",
    imagePosition: "object-center",
    flip: true,
    categories: [
      {
        label: "Ponytails",
        items: [
          { name: "Normal Ponytail — Natural Hair (no extensions)", price: "₵200" },
          { name: "Normal Ponytail — Relaxed Hair (no extensions)", price: "₵150" },
          { name: "Frontal Ponytail — Natural Hair", price: "₵450" },
          { name: "Frontal Ponytail — Relaxed Hair", price: "₵400" },
        ],
      },
      {
        label: "Half Up / Half Down",
        items: [
          { name: "Half Up Half Down — Natural Hair", price: "₵270" },
          { name: "Half Up Half Down — Relaxed Hair", price: "₵250" },
          { name: "Frontal Half Up Half Down — Natural Hair", price: "₵500+" },
          { name: "Frontal Half Up Half Down — Relaxed Hair", price: "₵450+" },
        ],
      },
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <Nav />

      {/* Page hero */}
      <section className="pt-40 pb-16 md:pt-48 md:pb-20 px-6 md:px-16 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-5">
              Accra, East Legon — Book: 0557205803
            </p>
            <h1 className="font-serif text-[clamp(3.5rem,8vw,8rem)] leading-[0.88] font-light text-ink">
              Our<br />
              <span className="italic">Services.</span>
            </h1>
          </div>
          <div className="max-w-sm md:pb-3">
            <p className="font-sans text-[13px] text-ink/50 font-light leading-relaxed mb-7">
              Four signature services. Transparent pricing. Every appointment is a collaboration — your vision, our craft.
            </p>
            <p className="font-sans text-[11px] text-ink/30 font-light">
              Prices are subject to change based on hair length, density, and condition.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky service selector */}
      <ServiceSelector services={services.map(s => ({ id: s.id, number: s.number, name: s.name }))} />

      {/* Service sections */}
      {services.map((service, i) => (
        <section
          key={service.id}
          id={service.id}
          className={`${i % 2 === 0 ? "bg-paper" : "bg-mist"} scroll-mt-16`}
        >
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 min-h-[80vh]">
            {/* Image */}
            <div
              className={`relative min-h-[60vw] md:min-h-auto order-1 ${
                service.flip ? "md:order-2" : "md:order-1"
              }`}
            >
              <Image
                src={service.image}
                alt={service.imageAlt}
                fill
                className={`object-cover ${service.imagePosition}`}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute top-6 left-6">
                <span className="font-sans text-[10px] tracking-widest text-paper/70 bg-ink/50 backdrop-blur-sm px-3 py-1.5">
                  {service.number} — {service.name}
                </span>
              </div>
            </div>

            {/* Content */}
            <div
              className={`flex flex-col justify-start px-8 py-14 md:px-14 md:py-20 order-2 ${
                service.flip ? "md:order-1" : "md:order-2"
              } overflow-y-auto`}
            >
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-3">
                {service.tagline}
              </p>
              <h2 className="font-serif text-[clamp(2.25rem,3.5vw,3.5rem)] leading-none font-light text-ink mb-5">
                {service.name}
              </h2>
              <p className="font-sans text-[13px] text-ink/55 font-light leading-relaxed mb-10 max-w-sm">
                {service.description}
              </p>

              {/* Pricing categories */}
              <div className="flex flex-col gap-8 mb-10">
                {service.categories.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex items-center gap-3 mb-4">
                      <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 flex-shrink-0">
                        {cat.label}
                      </p>
                      <div className="h-px flex-1 bg-ink/8" />
                    </div>
                    {"sublabel" in cat && cat.sublabel && (
                      <p className="font-sans text-[11px] text-ink/40 font-light mb-4">{cat.sublabel}</p>
                    )}

                    {/* Length-based pricing (coloring) */}
                    {"lengthBased" in cat && cat.lengthBased ? (
                      <div>
                        {/* Header row */}
                        <div className="grid grid-cols-4 gap-2 mb-2 pb-2 border-b border-ink/8">
                          <span className="font-sans text-[10px] text-ink/30 col-span-1" />
                          {(cat as { lengths: string[] }).lengths.map((l: string) => (
                            <span key={l} className="font-sans text-[9px] tracking-wide uppercase text-ink/35 text-right">
                              {l}
                            </span>
                          ))}
                        </div>
                        {(cat as { items: { name: string; prices: string[] }[] }).items.map((item) => (
                          <div
                            key={item.name}
                            className="grid grid-cols-4 gap-2 py-2.5 border-b border-ink/[0.05] last:border-0"
                          >
                            <span className="font-sans text-[12px] text-ink/65 font-light col-span-1 leading-snug">
                              {item.name}
                            </span>
                            {item.prices.map((p: string, idx: number) => (
                              <span key={idx} className="font-sans text-[11px] text-ink/70 text-right">
                                {p}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Standard pricing rows */
                      <div className="flex flex-col">
                        {(cat as { items: { name: string; price: string; note?: string }[] }).items.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-start justify-between py-2.5 border-b border-ink/[0.05] last:border-0 gap-4"
                          >
                            <div>
                              <span className="font-sans text-[12px] text-ink/65 font-light block">
                                {item.name}
                              </span>
                              {item.note && (
                                <span className="font-sans text-[10px] text-ink/35 italic">
                                  {item.note}
                                </span>
                              )}
                            </div>
                            <span className="font-sans text-[12px] text-ink/80 font-medium flex-shrink-0">
                              {item.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Book CTA */}
              <Link
                href={`/book?service=${service.id}`}
                className="inline-block w-fit bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink/80 transition-colors duration-300"
              >
                Book {service.name} →
              </Link>
            </div>
          </div>
        </section>
      ))}

      {/* Bottom contact CTA */}
      <section className="bg-ink py-24 md:py-32 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/30 mb-5">
              Get in Touch
            </p>
            <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none font-light text-paper">
              Not sure what<br />
              <span className="italic">you need?</span>
            </h2>
          </div>
          <div className="flex flex-col gap-5 md:items-end">
            <p className="font-sans text-[13px] text-paper/40 font-light max-w-xs leading-relaxed md:text-right">
              Reach out and we&apos;ll walk you through every option — no pressure, no obligation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/book"
                className="inline-block bg-paper text-ink font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-paper/80 transition-colors duration-300"
              >
                Book an Appointment
              </Link>
              <Link
                href="mailto:essakobea@gmail.com"
                className="inline-block border border-paper text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-paper hover:text-ink transition-all duration-300"
              >
                Email Us
              </Link>
            </div>
            <p className="font-sans text-[10px] tracking-widest text-paper/20 uppercase">
              Accra, East Legon &nbsp;·&nbsp; 0557205803
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
