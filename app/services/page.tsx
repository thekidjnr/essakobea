import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import ServiceSelector from "@/components/services/ServiceSelector";
import { adminDb } from "@/lib/supabase/admin";
import type { DbService } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services — Essakobea",
  description:
    "Professional wig making, installations, coloring, and frontal styling in Accra, East Legon. Book your appointment today.",
};

export default async function ServicesPage() {
  const { data } = await adminDb
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const services = (data as DbService[] | null) ?? [];

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
              {services.length} signature services. Transparent pricing. Every appointment is a collaboration — your vision, our craft.
            </p>
            <p className="font-sans text-[11px] text-ink/30 font-light">
              Prices are subject to change based on hair length, density, and condition.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky service selector */}
      <ServiceSelector services={services.map((s) => ({ id: s.slug, number: s.number, name: s.name }))} />

      {/* Service sections */}
      {services.map((service, i) => (
        <section
          key={service.slug}
          id={service.slug}
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
                src={service.image_url}
                alt={`${service.name} — Essakobea`}
                fill
                className={`object-cover ${service.image_position}`}
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

              {/* Pricing */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 flex-shrink-0">
                    Pricing
                  </p>
                  <div className="h-px flex-1 bg-ink/8" />
                </div>
                <div className="flex flex-col">
                  {service.booking_options.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-start justify-between py-3 border-b border-ink/[0.05] last:border-0 gap-4"
                    >
                      <div>
                        <span className="font-sans text-[12px] text-ink/65 font-light block">
                          {opt.name}
                        </span>
                        {opt.note && (
                          <span className="font-sans text-[10px] text-ink/35 italic">
                            {opt.note}
                          </span>
                        )}
                      </div>
                      <span className="font-sans text-[12px] text-ink/80 font-medium flex-shrink-0">
                        {opt.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book CTA */}
              <Link
                href={`/book?service=${service.slug}`}
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
