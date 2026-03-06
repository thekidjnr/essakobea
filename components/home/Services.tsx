import Image from "next/image";
import Link from "next/link";

const services = [
  {
    number: "01",
    name: "Wig Making",
    description:
      "Custom-crafted units built to your exact measurements — your texture, your density, your story.",
    detail: "From $250",
    image:
      "https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=900&q=85",
    imageAlt: "Wig Making — Essakobea",
    imagePosition: "object-top",
  },
  {
    number: "02",
    name: "Braids",
    description:
      "Protective styles executed with precision. From box braids to knotless — always intentional, always flawless.",
    detail: "From $120",
    image:
      "https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=900&q=85",
    imageAlt: "Braids — Essakobea",
    imagePosition: "object-center",
  },
  {
    number: "03",
    name: "Installations",
    description:
      "Seamless lace installs — fronts, full laces, closures — for a finish so natural, no one will know.",
    detail: "From $80",
    image:
      "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=900&q=85",
    imageAlt: "Installations — Essakobea",
    imagePosition: "object-top",
  },
];

export default function Services() {
  return (
    <section id="services" className="bg-paper py-28 md:py-36">
      {/* Header */}
      <div className="px-6 md:px-16 max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
        <div>
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-4">
            What We Do
          </p>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none font-light text-ink">
            Our <span className="italic">Services</span>
          </h2>
        </div>
        <p className="font-sans text-[13px] text-ink/50 font-light max-w-xs leading-relaxed md:text-right">
          Every service is a craft. Every appointment, an experience.
        </p>
      </div>

      {/* Service cards — 3 column editorial grid */}
      <div className="px-6 md:px-16 max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {services.map((service, i) => (
          <div key={service.number} className="group cursor-pointer">
            {/* Image — staggered heights for editorial rhythm */}
            <div
              className={`relative overflow-hidden bg-mist ${
                i === 1 ? "aspect-[3/4] md:aspect-[3/5]" : "aspect-[3/4]"
              }`}
            >
              <Image
                src={service.image}
                alt={service.imageAlt}
                fill
                className={`object-cover ${service.imagePosition} transition-transform duration-700 group-hover:scale-105`}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              {/* Subtle ink wash on hover */}
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/15 transition-colors duration-500" />

              {/* Number badge */}
              <span className="absolute top-5 left-5 font-sans text-[10px] tracking-widest text-paper/70 bg-ink/40 backdrop-blur-sm px-2.5 py-1">
                {service.number}
              </span>

              {/* Book CTA overlay */}
              <div className="absolute bottom-5 left-5 right-5 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <Link
                  href="#book"
                  className="inline-flex items-center gap-2 font-sans text-[10px] tracking-widest uppercase text-paper bg-ink px-4 py-2.5"
                >
                  Book This <span>→</span>
                </Link>
              </div>
            </div>

            {/* Text below image */}
            <div className="pt-5 pb-2">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-serif text-[clamp(1.4rem,2vw,1.75rem)] font-light text-ink leading-none group-hover:italic transition-all duration-300">
                  {service.name}
                </h3>
                <span className="font-sans text-[11px] text-ink/40 font-light flex-shrink-0 ml-4">
                  {service.detail}
                </span>
              </div>
              <p className="font-sans text-[12px] text-ink/50 font-light leading-relaxed">
                {service.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
