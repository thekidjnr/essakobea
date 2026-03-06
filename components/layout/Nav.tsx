"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBag } from "@/contexts/BagContext";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count: bagCount } = useBag();
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
            <Link href="/shop" className="hover:opacity-50 transition-opacity duration-300">
              Shop
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
            <Link
              href="/shop"
              className={`font-sans text-[11px] tracking-widest font-medium uppercase px-5 py-2.5 transition-all duration-300 ${
                transparent
                  ? "bg-paper text-ink hover:bg-paper/80"
                  : "bg-ink text-paper hover:bg-ink/80"
              }`}
            >
              Shop
            </Link>
            <Link
              href="/bag"
              className={`relative font-sans text-[11px] tracking-widest font-medium uppercase px-3 py-2.5 transition-colors duration-300 ${
                transparent ? "text-paper hover:opacity-60" : "text-ink hover:opacity-60"
              }`}
            >
              Bag
              {bagCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-ink text-paper text-[8px] flex items-center justify-center border-2 border-paper">
                  {bagCount}
                </span>
              )}
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
            ["Shop", "/shop"],
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
