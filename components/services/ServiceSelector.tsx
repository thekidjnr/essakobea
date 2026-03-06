"use client";

import { useEffect, useState } from "react";

interface ServiceTab {
  id: string;
  number: string;
  name: string;
}

export default function ServiceSelector({ services }: { services: ServiceTab[] }) {
  const [active, setActive] = useState<string>(services[0]?.id ?? "");

  // Highlight active service on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );

    services.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [services]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 64;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setActive(id);
  };

  return (
    <div className="sticky top-[57px] z-30 bg-paper border-b border-ink/10 overflow-x-auto hide-scrollbar">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">
        <div className="flex items-stretch min-w-max md:min-w-0">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => scrollTo(service.id)}
              className={`group flex items-center gap-2.5 px-5 py-4 border-b-2 transition-all duration-300 flex-shrink-0 ${
                active === service.id
                  ? "border-ink text-ink"
                  : "border-transparent text-ink/40 hover:text-ink/70"
              }`}
            >
              <span className="font-sans text-[9px] tracking-widest text-inherit/60">
                {service.number}
              </span>
              <span className="font-sans text-[11px] tracking-widest uppercase font-medium">
                {service.name}
              </span>
            </button>
          ))}

          {/* Book CTA — links to booking with active service pre-selected */}
          <div className="ml-auto pl-5 flex items-center flex-shrink-0">
            <a
              href={`/book?service=${active}`}
              className="font-sans text-[10px] tracking-widest uppercase text-paper bg-ink px-4 py-2 hover:bg-ink/80 transition-colors whitespace-nowrap"
            >
              Book Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
