import { adminDb } from "@/lib/supabase/admin";
import type { DbService } from "@/lib/supabase/types";
import Reveal from "@/components/common/Reveal";
import ServiceCard from "@/components/home/ServiceCard";

const MAX_CAROUSEL_IMAGES = 4;

export default async function Services() {
  const { data } = await adminDb
    .from("services")
    .select("id,slug,number,name,description,image_url,image_position")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(4);

  const services = (data as Pick<DbService, "id" | "slug" | "number" | "name" | "description" | "image_url" | "image_position">[] | null) ?? [];

  const { data: works } = await adminDb
    .from("service_works")
    .select("service_id,image_url")
    .in("service_id", services.map((s) => s.id))
    .order("display_order", { ascending: true });

  const worksByService = new Map<string, string[]>();
  for (const w of works ?? []) {
    const list = worksByService.get(w.service_id) ?? [];
    list.push(w.image_url);
    worksByService.set(w.service_id, list);
  }

  return (
    <section id="services" className="bg-paper py-28 md:py-36">
      {/* Header */}
      <Reveal className="px-6 md:px-16 max-w-[1400px] mx-auto mb-8">
        <div>
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-4">
            What We Do
          </p>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none font-light text-ink">
            Our <span className="italic">Services</span>
          </h2>
        </div>
      </Reveal>

      {/* Service cards */}
      <div className="px-6 md:px-16 max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-4 md:gap-y-12">
        {services.map((service, i) => {
          const extraWorks = (worksByService.get(service.id) ?? []).filter((url) => url !== service.image_url);
          const images = [service.image_url, ...extraWorks].slice(0, MAX_CAROUSEL_IMAGES);

          return (
            <Reveal key={service.slug} delay={i * 80}>
              <ServiceCard
                slug={service.slug}
                number={service.number}
                name={service.name}
                description={service.description}
                images={images}
                position={service.image_position}
              />
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
