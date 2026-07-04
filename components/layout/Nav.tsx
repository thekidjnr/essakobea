"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-paper border-b border-ink/[0.08] py-4"
            : isHome
            ? "bg-transparent py-6"
            : "bg-paper border-b border-ink/[0.08] py-4"
        }`}
      >
        <nav className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className={`font-sans text-[11px] tracking-widest2 font-medium uppercase transition-colors duration-500 ${
              transparent ? "text-paper" : "text-ink"
            }`}
          >
            Essakobea
          </Link>

          {/* Desktop links */}
          <div
            className={`hidden md:flex items-center gap-10 font-sans text-[11px] tracking-widest font-medium uppercase transition-colors duration-500 ${
              transparent ? "text-paper" : "text-ink"
            }`}
          >
            <Link href="/services" className="hover:opacity-50 transition-opacity duration-300">
              Services
            </Link>
            <Link href="/works" className="hover:opacity-50 transition-opacity duration-300">
              Works
            </Link>
            <Link href="/about" className="hover:opacity-50 transition-opacity duration-300">
              About
            </Link>
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/book"
              className={`font-sans text-[11px] tracking-widest font-medium uppercase px-5 py-2.5 transition-all duration-300 border ${
                transparent
                  ? "border-paper text-paper hover:bg-paper hover:text-ink"
                  : "border-ink text-ink hover:bg-ink hover:text-paper"
              }`}
            >
              Book Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden flex flex-col gap-[5px] transition-colors duration-500 ${
              transparent ? "text-paper" : "text-ink"
            }`}
            aria-label="Toggle menu"
          >
            <span
              className={`block h-px w-6 bg-current transition-all duration-300 ${
                menuOpen ? "rotate-45 translate-y-[7px]" : ""
              }`}
            />
            <span
              className={`block h-px w-4 bg-current transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-px w-6 bg-current transition-all duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
              }`}
            />
          </button>
        </nav>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 bg-ink flex flex-col justify-end pb-16 px-8 transition-all duration-700 ease-in-out ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-8">
          {[
            ["Services", "/services"],
            ["Works", "/works"],
            ["About", "/about"],
            ["Book Now", "/book"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="font-serif text-4xl text-paper font-light italic hover:opacity-50 transition-opacity"
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="font-sans text-[10px] tracking-widest text-stone uppercase mt-16">
          Essakobea &copy; {new Date().getFullYear()}
        </p>
      </div>
    </>
  );
}
