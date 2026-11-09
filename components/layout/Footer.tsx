import Image from "next/image";
import Link from "next/link";
import { logo } from "@/public/images";

export default function Footer() {
  return (
    <footer className="theme-ink bg-ink text-paper border-t border-paper/10">
      {/* Top strip */}
      <div className="border-b border-paper/10 px-6 md:px-16 py-16 max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Brand */}
        <div>
          <div className="relative h-4 w-[150px] mb-4">
            <Image src={logo.light} alt="Essakobea" fill unoptimized className="object-contain object-left" />
          </div>
          <p className="font-serif text-[1.5rem] font-light text-paper/85 leading-snug italic">
            Premium Beauty,<br />Elevated.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-4">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/50 mb-2">
            Navigate
          </p>
          {[
            ["Our Services", "/services"],
            ["Our Work", "/works"],
            ["About", "/about"],
            ["Book an Appointment", "/book"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="font-sans text-[12px] text-paper/70 hover:text-paper transition-colors tracking-wide w-fit"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-4">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/50 mb-2">
            Connect
          </p>
          {[
            ["Instagram", "https://www.instagram.com/houseofessakobea/"],
            ["TikTok", "https://www.tiktok.com/@essakobeaa"],
            ["WhatsApp Us", "https://wa.me/233557205803"],
            ["Email Us", "mailto:essakobea@gmail.com"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
              className="font-sans text-[12px] text-paper/70 hover:text-paper transition-colors tracking-wide w-fit"
            >
              {label}
            </a>
          ))}
          <p className="font-sans text-[12px] text-paper/50 tracking-wide mt-2">
            East Legon, Accra
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-6 md:px-16 py-6 max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <p className="font-sans text-[10px] tracking-widest text-paper/45 uppercase">
          &copy; {new Date().getFullYear()} Essakobea. All rights reserved.
        </p>
        <p className="font-sans text-[10px] tracking-widest text-paper/45 uppercase">
          Tuesday to Sunday &nbsp;·&nbsp; Closed Mondays
        </p>
      </div>
    </footer>
  );
}
