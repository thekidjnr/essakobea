"use client";

export default function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  // Kept for older call sites; the brand palette has one "on" colour.
  color?: "ink" | "emerald";
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${checked ? "bg-ink" : "bg-[#D5D7DB]"}`}
    >
      <span
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-paper shadow-[0_1px_3px_rgba(26,33,43,0.25)] transition-all duration-200"
        style={{ left: checked ? "calc(100% - 21px)" : "3px" }}
      />
    </button>
  );
}
