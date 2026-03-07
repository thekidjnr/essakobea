import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/supabase/admin";
import WorksGallery from "@/components/works/WorksGallery";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: service } = await adminDb
    .from("services")
    .select("name, tagline")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (!service) return {};
  return {
    title: `${service.name} — Our Work | Essakobea`,
    description: service.tagline,
  };
}

export default async function WorksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: service } = await adminDb
    .from("services")
    .select("id, name, slug, tagline, number")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!service) notFound();

  const { data: works } = await adminDb
    .from("service_works")
    .select("id, image_url, caption, display_order")
    .eq("service_id", service.id)
    .order("display_order", { ascending: true });

  const photos = works ?? [];

  return (
    <main className="min-h-screen bg-paper">
      {/* Minimal fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-paper border-b border-ink/[0.07] px-6 md:px-12 h-14 flex items-center justify-between">
        <Link
          href="/services"
          className="flex items-center gap-2.5 font-sans text-[10px] tracking-widest uppercase text-ink/40 hover:text-ink transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Services
        </Link>
        <Link href="/" className="font-sans text-[11px] tracking-widest2 font-medium uppercase text-ink">
          Essakobea
        </Link>
        <Link
          href={`/book?service=${service.slug}`}
          className="font-sans text-[10px] tracking-widest uppercase bg-ink text-paper px-4 py-2 hover:bg-ink/80 transition-colors"
        >
          Book Now
        </Link>
      </header>

      {/* Hero */}
      <div className="pt-14">
        <div className="px-6 md:px-12 max-w-[1400px] mx-auto pt-16 pb-12 md:pt-20 md:pb-16">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-4">
            {service.number} — Our Work
          </p>
          <h1 className="font-serif text-[clamp(3rem,7vw,7rem)] font-light text-ink leading-none">
            {service.name}<span className="italic">.</span>
          </h1>
          {service.tagline && (
            <p className="font-sans text-[13px] text-ink/40 font-light mt-4 max-w-sm leading-relaxed">
              {service.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Gallery */}
      {photos.length === 0 ? (
        <div className="px-6 md:px-12 pb-32 text-center">
          <p className="font-sans text-[13px] text-ink/25 py-24">
            Photos coming soon.
          </p>
        </div>
      ) : (
        <div className="px-6 md:px-12 max-w-[1400px] mx-auto pb-32">
          <WorksGallery photos={photos} serviceName={service.name} />
        </div>
      )}

      {/* Book CTA */}
      <div className="border-t border-ink/[0.07] bg-paper px-6 md:px-12 py-16 md:py-20">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-2">Ready?</p>
            <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-light text-ink leading-none">
              Book your <span className="italic">{service.name}</span>
            </h2>
          </div>
          <Link
            href={`/book?service=${service.slug}`}
            className="self-start md:self-auto inline-flex items-center gap-3 font-sans text-[11px] tracking-widest uppercase bg-ink text-paper px-8 py-4 hover:bg-ink/80 transition-colors"
          >
            Book Now <span>→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
