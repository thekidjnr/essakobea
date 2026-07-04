"use client";

import { useEffect, useState } from "react";
import { homeImages } from "@/public/images";

type Variant = "mobile" | "desktop";

const sources: Record<Variant, { webm: string; mp4: string; poster: string }> = {
  mobile: {
    webm: "/videos/hero-mobile.webm",
    mp4: "/videos/hero-mobile.mp4",
    poster: homeImages.heroVideoPosterMobile,
  },
  desktop: {
    webm: "/videos/hero.webm",
    mp4: "/videos/hero.mp4",
    poster: homeImages.heroVideoPoster,
  },
};

export default function HeroVideo() {
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setVariant(mql.matches ? "desktop" : "mobile");
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  if (!variant) return null;

  const { webm, mp4, poster } = sources[variant];

  return (
    <video
      key={variant}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={poster}
      className="absolute inset-0 w-full h-full object-cover object-top motion-reduce:hidden"
    >
      <source src={webm} type="video/webm" />
      <source src={mp4} type="video/mp4" />
    </video>
  );
}
