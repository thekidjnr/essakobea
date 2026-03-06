import Image from "next/image";
import Link from "next/link";
import { adminDb } from "@/lib/supabase/admin";
import type { DbService } from "@/lib/supabase/types";

export default async function Services() {
  const { data } = await adminDb
    .from("services")
    .select("slug,number,name,description,image_url,image_position")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(3);

  const services = (data as Pick<DbService, "slug" | "number" | "name" | "description" | "image_url" | "image_position">[] | null) ?? [];

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

      {/* Service cards */}
      <div className="px-6 md:px-16 max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {services.map((service, i) => (
          <div key={service.slug} className="group cursor-pointer">
            <div
              className={`relative overflow-hidden bg-mist ${
                i === 1 ? "aspect-[3/4] md:aspect-[3/5]" : "aspect-[3/4]"
              }`}
            >
              <Image
                src={service.image_url}
                alt={`${service.name} — Essakobea`}
                fill
                className={`object-cover ${service.image_position} transition-transform duration-700 group-hover:scale-105`}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/15 transition-colors duration-500" />
              <span className="absolute top-5 left-5 font-sans text-[10px] tracking-widest text-paper/70 bg-ink/40 backdrop-blur-sm px-2.5 py-1">
                {service.number}
              </span>
              <div className="absolute bottom-5 left-5 right-5 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <Link
                  href={`/book?service=${service.slug}`}
                  className="inline-flex items-center gap-2 font-sans text-[10px] tracking-widest uppercase text-paper bg-ink px-4 py-2.5"
                >
                  Book This <span>→</span>
                </Link>
              </div>
            </div>
            <div className="pt-5 pb-2">
              <Link href={`/book?service=${service.slug}`}>
                <h3 className="font-serif text-[clamp(1.4rem,2vw,1.75rem)] font-light text-ink leading-none group-hover:italic transition-all duration-300 mb-2">
                  {service.name}
                </h3>
              </Link>
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
