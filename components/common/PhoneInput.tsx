"use client";

import { useState, useEffect } from "react";
import { COUNTRIES, flagEmoji, composePhone, splitPhone } from "@/lib/phone";

export default function PhoneInput({
  value, onChange, className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [dial, setDial] = useState("+233");
  const [localDigits, setLocalDigits] = useState("");

  // Re-sync internal parts when the parent value changes from elsewhere
  // (e.g. a returning client's phone gets filled in by the lookup effect).
  useEffect(() => {
    if (!value) return;
    const parsed = splitPhone(value);
    if (composePhone(parsed.dial, parsed.localDigits) === value) {
      setDial(parsed.dial);
      setLocalDigits(parsed.localDigits);
    }
  }, [value]);

  const country = COUNTRIES.find((c) => c.dial === dial) ?? COUNTRIES[0];

  const handleDialChange = (newDial: string) => {
    setDial(newDial);
    onChange(composePhone(newDial, localDigits));
  };

  const handleDigitsChange = (raw: string) => {
    const digits = raw.replace(/[^\d\s]/g, "");
    setLocalDigits(digits);
    onChange(composePhone(dial, digits));
  };

  return (
    <div className={`flex ${className}`}>
      <select
        value={dial}
        onChange={(e) => handleDialChange(e.target.value)}
        className="border border-ink/15 focus:border-ink border-r-0 pl-3 pr-2 py-4 font-sans text-[13px] text-ink bg-transparent focus:outline-none transition-colors flex-shrink-0 max-w-[110px]"
      >
        {COUNTRIES.map((c) => (
          <option key={`${c.iso2}-${c.dial}`} value={c.dial}>
            {flagEmoji(c.iso2)} {c.dial}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="tel"
        value={localDigits}
        onChange={(e) => handleDigitsChange(e.target.value)}
        placeholder={country.example}
        className="w-full border border-ink/15 focus:border-ink px-4 py-4 font-sans text-[14px] text-ink bg-transparent focus:outline-none transition-colors"
      />
    </div>
  );
}
