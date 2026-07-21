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
