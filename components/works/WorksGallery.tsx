"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";

type Photo = {
  id: string;
  image_url: string;
  caption: string | null;
};

export default function WorksGallery({ photos, serviceName }: { photos: Photo[]; serviceName: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);      // controls fade-in of backdrop
  const [imgVisible, setImgVisible] = useState(false); // controls image crossfade
  const touchStartX = useRef<number | null>(null);

  // Open with staggered fade
  const open = useCallback((i: number) => {
    setLightboxIndex(i);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
        setTimeout(() => setImgVisible(true), 60);
      });
    });
  }, []);

  // Close with fade-out
  const close = useCallback(() => {
    setImgVisible(false);
    setVisible(false);
    setTimeout(() => setLightboxIndex(null), 350);
  }, []);

  // Navigate — crossfade image
  const navigate = useCallback((dir: "prev" | "next") => {
    setImgVisible(false);
    setTimeout(() => {
      setLightboxIndex((i) =>
        i === null ? null : dir === "prev"
          ? (i - 1 + photos.length) % photos.length
          : (i + 1) % photos.length
      );
      setTimeout(() => setImgVisible(true), 30);
    }, 180);
  }, [photos.length]);

  const prev = useCallback(() => navigate("prev"), [navigate]);
  const next = useCallback(() => navigate("next"), [navigate]);

  // Keyboard
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, prev, next, close]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  const current = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      {/* Masonry grid */}
      <div className="columns-2 md:columns-3 gap-3 md:gap-4 space-y-3 md:space-y-4">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => open(i)}
            className="break-inside-avoid group relative overflow-hidden bg-mist w-full block cursor-pointer"
          >
            <Image
              src={photo.image_url}
              alt={photo.caption ?? `${serviceName} — Essakobea`}
              width={800}
              height={1000}
              className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            {/* Hover overlay — thin cross expand icon */}
            <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/25 transition-all duration-500 ease-out flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-400 ease-out">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="10" stroke="white" strokeOpacity="0.6" strokeWidth="0.8"/>
                  <path d="M11 7v8M7 11h8" stroke="white" strokeOpacity="0.9" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox — mounted while index set, visibility controlled by CSS */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            backgroundColor: `rgba(10,10,10,${visible ? 0.96 : 0})`,
            transition: "background-color 350ms cubic-bezier(0.4,0,0.2,1)",
          }}
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Top bar */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-8 py-5 z-10"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 400ms ease 100ms" }}
          >
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/25">
              {(lightboxIndex + 1).toString().padStart(2, "0")} / {photos.length.toString().padStart(2, "0")}
            </p>
            <button
              onClick={close}
              className="text-paper/30 hover:text-paper transition-colors duration-300"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous"
            className="absolute left-4 md:left-7 top-1/2 -translate-y-1/2 z-10 group"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 400ms ease 150ms" }}
          >
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-paper/10 group-hover:border-paper/30 bg-paper/5 group-hover:bg-paper/12 flex items-center justify-center transition-all duration-300 ease-out">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 13L5 8l5-5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          {/* Image */}
          <div
            className="relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            style={{
              opacity: imgVisible ? 1 : 0,
              transform: imgVisible ? "scale(1)" : "scale(0.97)",
              transition: "opacity 280ms ease, transform 280ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {current && (
              <>
                <Image
                  src={current.image_url}
                  alt={current.caption ?? `${serviceName} — Essakobea`}
                  width={1200}
                  height={1600}
                  className="max-w-[82vw] max-h-[78vh] w-auto h-auto object-contain"
                  sizes="90vw"
                  priority
                />
                {current.caption && (
                  <p className="mt-5 font-sans text-[11px] tracking-wide text-paper/35 text-center max-w-[340px] leading-relaxed">
                    {current.caption}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next"
            className="absolute right-4 md:right-7 top-1/2 -translate-y-1/2 z-10 group"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 400ms ease 150ms" }}
          >
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-paper/10 group-hover:border-paper/30 bg-paper/5 group-hover:bg-paper/12 flex items-center justify-center transition-all duration-300 ease-out">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          {/* Dot indicators */}
          {photos.length <= 20 && (
            <div
              className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5"
              style={{ opacity: visible ? 1 : 0, transition: "opacity 400ms ease 200ms" }}
            >
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setImgVisible(false); setTimeout(() => { setLightboxIndex(i); setTimeout(() => setImgVisible(true), 30); }, 180); }}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: i === lightboxIndex ? 16 : 4,
                    height: 4,
                    backgroundColor: i === lightboxIndex ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
