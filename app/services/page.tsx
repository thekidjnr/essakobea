import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { adminDb } from "@/lib/supabase/admin";
import type { DbService } from "@/lib/supabase/types";
import Reveal from "@/components/common/Reveal";
import ImageCarousel from "@/components/common/ImageCarousel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services | Essakobea",
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

  const { data: works } = await adminDb
    .from("service_works")
    .select("service_id,image_url")
    .order("display_order", { ascending: true });

  const worksByService = new Map<string, string[]>();
  for (const w of works ?? []) {
    const list = worksByService.get(w.service_id) ?? [];
    list.push(w.image_url);
    worksByService.set(w.service_id, list);
  }

  return (
    <>
      <Nav />

      {/* Page hero */}
      <section className="pt-28 pb-16 md:pt-48 md:pb-20 px-6 md:px-16 max-w-[1400px] mx-auto">
        <Reveal>
          <h1 className="font-serif text-[clamp(3.5rem,8vw,8rem)] leading-[0.88] font-light text-ink">
            Our <span className="italic">Services.</span>
          </h1>
        </Reveal>
      </section>

      {/* Service cards */}
      <section className="px-6 md:px-16 max-w-[1400px] mx-auto pb-24 md:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16 md:gap-y-20">
          {services.map((service, i) => {
            const extraWorks = (worksByService.get(service.id) ?? []).filter((url) => url !== service.image_url);
            const images = [service.image_url, ...extraWorks];

            return (
            <div key={service.slug} id={service.slug} className="scroll-mt-24">
            <Reveal delay={(i % 2) * 80}>
              {/* Image */}
              <ImageCarousel
                images={images}
                alt={`${service.name} | Essakobea`}
                position={service.image_position}
                aspectClassName="aspect-[4/3]"
                number={service.number}
              />

              {/* Content */}
              <div className="pt-6">
                <h2 className="font-serif text-[clamp(1.75rem,2.5vw,2.5rem)] leading-none font-light text-ink mb-8">
                  {service.name}
                </h2>

                {/* Pricing */}
                <div className="mb-8">
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
                          <span className="font-sans text-[13px] text-ink/75 font-light block">
                            {opt.name}
                          </span>
                          {opt.note && (
                            <span className="font-sans text-[11px] text-ink/50 italic">
                              {opt.note}
                            </span>
                          )}
                        </div>
                        <span className="font-sans text-[13px] text-ink/90 font-medium flex-shrink-0">
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
            </Reveal>
            </div>
            );
          })}
        </div>

        <p className="font-sans text-[11px] text-ink/40 font-light mt-16 md:mt-20">
          Prices are subject to change based on hair length, density, and condition.
        </p>
      </section>

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
            <p className="font-sans text-[14px] text-paper/60 font-light max-w-xs leading-relaxed md:text-right">
              Reach out and we&apos;ll walk you through every option, no pressure, no obligation.
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
