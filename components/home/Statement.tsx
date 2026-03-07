import Image from "next/image";
import { homeImages } from "@/public/images";

export default function Statement() {
  return (
    <section id="about" className="bg-ink overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh]">
        {/* Text */}
        <div className="flex flex-col justify-center px-10 md:px-20 py-24 md:py-32 order-2 md:order-1">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/30 mb-10">
            The Essakobea Way
          </p>
          <blockquote className="font-serif text-[clamp(2rem,4vw,3.75rem)] leading-[1.1] text-paper font-light">
            &ldquo;Beauty is not an
            <span className="italic"> accessory</span> — it is an{" "}
            <span className="italic">identity.</span>&rdquo;
          </blockquote>
          <p className="font-sans text-[13px] text-paper/40 font-light mt-10 max-w-sm leading-relaxed">
            We built Essakobea for women who know exactly who they are. Premium
            hair, professional craftsmanship, zero compromise.
          </p>
          <div className="flex items-center gap-6 mt-16">
            <div className="h-px flex-1 bg-paper/10" />
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/20">
              Est. 2018
            </p>
          </div>
        </div>

        {/* Portrait */}
        <div className="relative min-h-[50vh] md:min-h-auto order-1 md:order-2">
          <Image
            src={homeImages.eskWay}
            alt="The Essakobea Way"
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-ink/20" />
        </div>
      </div>
    </section>
  );
}
