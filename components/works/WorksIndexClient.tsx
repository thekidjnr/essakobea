"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

type WorkPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
  service_id: string;
  service_name: string;
  service_slug: string;
};

type Service = {
  id: string;
  name: string;
  slug: string;
};

export default function WorksIndexClient({
  photos,
  services,
}: {
  photos: WorkPhoto[];
  services: Service[];
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [imgVisible, setImgVisible] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const filtered = activeFilter === "all" ? photos : photos.filter((p) => p.service_id === activeFilter);

  const open = useCallback((i: number) => {
    setLightboxIndex(i);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setVisible(true);
      setTimeout(() => setImgVisible(true), 60);
    }));
  }, []);

  const close = useCallback(() => {
    setImgVisible(false);
    setVisible(false);
    setTimeout(() => setLightboxIndex(null), 350);
  }, []);

  const navigate = useCallback((dir: "prev" | "next") => {
    setImgVisible(false);
    setTimeout(() => {
      setLightboxIndex((i) =>
        i === null ? null : dir === "prev"
          ? (i - 1 + filtered.length) % filtered.length
          : (i + 1) % filtered.length
      );
      setTimeout(() => setImgVisible(true), 30);
    }, 180);
  }, [filtered.length]);

  const prev = useCallback(() => navigate("prev"), [navigate]);
  const next = useCallback(() => navigate("next"), [navigate]);

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

  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  const current = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-12 md:mb-16">
        <button
          onClick={() => { setActiveFilter("all"); }}
          className={`font-sans text-[11px] tracking-widest uppercase px-5 py-2 border transition-all duration-300 ${
            activeFilter === "all"
              ? "bg-ink text-paper border-ink"
              : "text-ink/40 border-ink/15 hover:border-ink/40 hover:text-ink"
          }`}
        >
          All
        </button>
        {services.map((svc) => (
          <button
            key={svc.id}
            onClick={() => setActiveFilter(svc.id)}
            className={`font-sans text-[11px] tracking-widest uppercase px-5 py-2 border transition-all duration-300 ${
              activeFilter === svc.id
                ? "bg-ink text-paper border-ink"
                : "text-ink/40 border-ink/15 hover:border-ink/40 hover:text-ink"
            }`}
          >
            {svc.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-sans text-[13px] text-ink/25">No photos yet for this service.</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4 space-y-3 md:space-y-4">
          {filtered.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => open(i)}
              className="break-inside-avoid group relative overflow-hidden bg-mist w-full block cursor-pointer"
            >
              <Image
                src={photo.image_url}
                alt={photo.caption ?? `${photo.service_name} — Essakobea`}
                width={800}
                height={1000}
                className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-all duration-500 ease-out flex flex-col items-start justify-end p-4">
                <p className="opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 font-sans text-[9px] tracking-widest uppercase text-paper/70">
                  {photo.service_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
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
            <div className="flex items-center gap-4">
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/25">
                {(lightboxIndex + 1).toString().padStart(2, "0")} / {filtered.length.toString().padStart(2, "0")}
              </p>
              {current && (
                <p className="font-sans text-[10px] tracking-widest uppercase text-paper/20">
                  {current.service_name}
                </p>
              )}
            </div>
            <button onClick={close} className="text-paper/30 hover:text-paper transition-colors duration-300" aria-label="Close">
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
                  alt={current.caption ?? `${current.service_name} — Essakobea`}
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
          {filtered.length <= 20 && (
            <div
              className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5"
              style={{ opacity: visible ? 1 : 0, transition: "opacity 400ms ease 200ms" }}
            >
              {filtered.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setImgVisible(false);
                    setTimeout(() => { setLightboxIndex(i); setTimeout(() => setImgVisible(true), 30); }, 180);
                  }}
                  className="rounded-full transition-all duration-300"
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
