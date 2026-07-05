"use client";

export default function Toggle({
  checked,
  onChange,
  color = "ink",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: "ink" | "emerald";
}) {
  const bg = checked ? (color === "emerald" ? "bg-emerald-500" : "bg-ink") : "bg-ink/15";
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${bg}`}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-paper transition-all"
        style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}
