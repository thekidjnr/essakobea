import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import WorksIndexClient from "@/components/works/WorksIndexClient";
import { adminDb } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Work — Essakobea",
  description: "A portfolio of our wig installations, frontal styling, coloring, and more. Real clients. Real results.",
};

export default async function WorksPage() {
  const { data: servicesData } = await adminDb
    .from("services")
    .select("id, name, slug, number")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const services = servicesData ?? [];

  const { data: worksData } = await adminDb
    .from("service_works")
    .select("id, image_url, caption, service_id, display_order")
    .order("display_order", { ascending: true });

  const works = worksData ?? [];

  // Enrich works with service info
  const serviceMap = Object.fromEntries(services.map((s) => [s.id, s]));
  const photos = works
    .filter((w) => serviceMap[w.service_id])
    .map((w) => ({
      id: w.id,
      image_url: w.image_url,
      caption: w.caption,
      service_id: w.service_id,
      service_name: serviceMap[w.service_id].name,
      service_slug: serviceMap[w.service_id].slug,
    }));

  return (
    <>
      <Nav />

      <main className="min-h-screen bg-paper">
        {/* Hero */}
        <section className="pt-40 pb-12 md:pt-48 md:pb-16 px-6 md:px-16 max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-5">
                Portfolio
              </p>
              <h1 className="font-serif text-[clamp(3.5rem,8vw,8rem)] leading-[0.88] font-light text-ink">
                Our<br />
                <span className="italic">Work.</span>
              </h1>
            </div>
            <div className="max-w-xs md:pb-3">
              <p className="font-sans text-[13px] text-ink/50 font-light leading-relaxed mb-6">
                {photos.length} photos across {services.length} services. Every look, a story.
              </p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 font-sans text-[11px] tracking-widest uppercase bg-ink text-paper px-6 py-3 hover:bg-ink/80 transition-colors"
              >
                Book Now <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="px-6 md:px-16 max-w-[1400px] mx-auto pb-32">
          {photos.length === 0 ? (
            <div className="py-32 text-center">
              <p className="font-sans text-[13px] text-ink/20">Photos coming soon.</p>
            </div>
          ) : (
            <WorksIndexClient photos={photos} services={services} />
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
