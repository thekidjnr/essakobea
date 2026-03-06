import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      {/* Top strip */}
      <div className="border-b border-paper/10 px-6 md:px-16 py-16 max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Brand */}
        <div>
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/30 mb-4">
            Essakobea
          </p>
          <p className="font-serif text-[1.5rem] font-light text-paper/80 leading-snug italic">
            Premium Beauty,<br />Elevated.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-4">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/30 mb-2">
            Navigate
          </p>
          {[
            ["Book a Service", "#book"],
            ["Shop Collection", "#collection"],
            ["Our Services", "#services"],
            ["About", "#about"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="font-sans text-[12px] text-paper/50 hover:text-paper transition-colors tracking-wide"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-4">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/30 mb-2">
            Connect
          </p>
          {[
            ["Instagram", "#"],
            ["TikTok", "#"],
            ["Email Us", "mailto:hello@essakobea.com"],
            ["Book a Consultation", "#book"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="font-sans text-[12px] text-paper/50 hover:text-paper transition-colors tracking-wide"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-6 md:px-16 py-6 max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <p className="font-sans text-[10px] tracking-widest text-paper/20 uppercase">
          &copy; {new Date().getFullYear()} Essakobea. All rights reserved.
        </p>
        <div className="flex gap-8">
          {["Privacy Policy", "Terms of Service"].map((item) => (
            <Link
              key={item}
              href="#"
              className="font-sans text-[10px] tracking-wider text-paper/20 hover:text-paper/50 transition-colors uppercase"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
