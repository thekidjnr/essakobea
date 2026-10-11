"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageCarousel from "@/components/common/ImageCarousel";

export default function ServiceCard({
  slug,
  number,
  name,
  description,
  images,
  position,
}: {
  slug: string;
  number: string;
  name: string;
  description: string;
  images: string[];
  position: string;
}) {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);

  return (
    <div className="group cursor-pointer">
      <div className="relative">
        {images.length === 0 ? (
          // No photos yet: a plain tile so the service still shows
          <button
            type="button"
            onClick={() => router.push(`/book?service=${slug}`)}
            aria-label={`Book ${name}`}
            className="relative block w-full aspect-[3/4] bg-mist border border-ink/[0.08] overflow-hidden"
          >
            <span className="absolute top-5 left-5 font-sans text-[10px] tracking-widest text-ink/50 bg-ink/[0.06] px-2.5 py-1">
              {number}
            </span>
            <span className="absolute inset-0 flex items-center justify-center px-6 font-serif italic text-[clamp(1.25rem,2vw,1.75rem)] text-ink/30 text-center leading-tight">
              {name.toLowerCase()}
            </span>
          </button>
        ) : (
        <ImageCarousel
          images={images}
          alt={`${name} | Essakobea`}
          position={position}
          aspectClassName="aspect-[3/4]"
          number={number}
          onTap={() => router.push(`/book?service=${slug}`)}
          ariaLabel={`Book ${name}`}
          onDraggingChange={setDragging}
          imageClassName={`transition-transform duration-700 ${dragging ? "" : "group-hover:scale-105"}`}
        />
        )}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/15 transition-colors duration-500 pointer-events-none" />
      </div>

      <div className="pt-5 pb-2">
        <Link href={`/services#${slug}`}>
          <h3 className="font-serif text-[clamp(1.15rem,1.6vw,1.5rem)] font-light text-ink leading-none group-hover:italic transition-all duration-300">
            {name}
          </h3>
        </Link>
        <p className="hidden md:block font-sans text-[13px] text-ink/60 font-light leading-relaxed mt-2 line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
}
