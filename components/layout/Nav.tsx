"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logo } from "@/public/images";

const LINKS = [
  ["Services", "/services"],
  ["Works", "/works"],
  ["About", "/about"],
] as const;

// Pages on the charcoal gray theme (.theme-gray), which need the light logo and
// a gray bar. Shop, bag and checkout stay on the default white.
const GRAY_PATHS = ["/services", "/works", "/about", "/book", "/manage"];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !menuOpen;
  const onGray = isHome || GRAY_PATHS.some((p) => pathname.startsWith(p));
  const isActive = (href: string) => pathname.startsWith(href);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page behind the open menu and let Escape close it
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center transition-all duration-500 ${
          transparent || menuOpen
            ? "theme-ink bg-transparent"
            : onGray
            ? "theme-gray bg-paper/90 backdrop-blur-md border-b border-ink/[0.08]"
            : "bg-paper border-b border-ink/[0.08]"
        }`}
      >
        <nav className="w-full max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative block h-4 w-[150px] md:w-[170px]">
            <Image
              src={transparent || menuOpen || onGray ? logo.light : logo.dark}
              alt="Essakobea"
              fill
              priority
              unoptimized
              className="object-contain object-left"
            />
          </Link>

          {/* Desktop links */}
          <div
            className={`hidden md:flex items-center gap-10 font-sans text-[11px] tracking-widest font-medium uppercase transition-colors duration-500 ${
              transparent ? "text-paper" : "text-ink"
            }`}
          >
            {LINKS.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`relative py-1 hover:opacity-50 transition-opacity duration-300 after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:bg-current after:origin-left after:transition-transform after:duration-300 ${
                  isActive(href) ? "after:scale-x-100" : "after:scale-x-0"
                }`}
              >
                {label}
              </Link>
            ))}
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
              transparent || menuOpen ? "text-paper" : "text-ink"
            }`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
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
        id="mobile-menu"
        inert={!menuOpen}
        className={`theme-ink fixed inset-0 z-40 bg-ink flex flex-col justify-end pb-16 px-8 transition-all duration-700 ease-in-out ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-8">
          {[...LINKS, ["Book Now", "/book"] as const].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive(href) ? "page" : undefined}
              className={`font-serif text-4xl font-light italic hover:opacity-50 transition-opacity ${
                isActive(href) ? "text-paper" : "text-paper/70"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="font-sans text-[10px] tracking-widest text-paper/50 uppercase mt-16">
          Essakobea &copy; {new Date().getFullYear()}
        </p>
      </div>
    </>
  );
}
