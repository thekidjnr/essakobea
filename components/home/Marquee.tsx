export default function Marquee() {
  const items = [
    "Wig Making",
    "Braids",
    "Installations",
    "Custom Units",
    "Lace Fronts",
    "Protective Styles",
    "Book · Shop · Elevate",
  ];

  const repeated = [...items, ...items];

  return (
    <div className="border-t border-b border-ink/10 py-4 overflow-hidden bg-paper">
      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((item, i) => (
          <span
            key={i}
            className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mx-8 flex-shrink-0"
          >
            {item}
            <span className="ml-8 text-ink/20">—</span>
          </span>
        ))}
      </div>
    </div>
  );
}
