"use client";

import { useState, useEffect } from "react";
import { COUNTRIES, flagEmoji, composePhone, splitPhone, formatLocalDigits, expectedDigitCount } from "@/lib/phone";

export default function PhoneInput({
  value, onChange, className = "", id,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}) {
  // Tracked by country, not dial code: US and Canada share +1
  const [iso, setIso] = useState("GH");
  const [localDigits, setLocalDigits] = useState("");

  // Re-sync internal parts when the parent value changes from elsewhere
  // (e.g. a returning client's phone gets filled in by the lookup effect).
  useEffect(() => {
    if (!value) return;
    const parsed = splitPhone(value);
    if (composePhone(parsed.dial, parsed.localDigits) === value) {
      // Keep the chosen country when it already matches the dial code
      setIso((cur) =>
        COUNTRIES.find((c) => c.iso2 === cur)?.dial === parsed.dial
          ? cur
          : (COUNTRIES.find((c) => c.dial === parsed.dial)?.iso2 ?? "GH"),
      );
      setLocalDigits(parsed.localDigits);
    }
  }, [value]);

  const country = COUNTRIES.find((c) => c.iso2 === iso) ?? COUNTRIES[0];
  const dial = country.dial;
  const expected = expectedDigitCount(country.example);
  const isComplete = expected > 0 && localDigits.length >= (country.minDigits ?? expected);

  const handleCountryChange = (newIso: string) => {
    const next = COUNTRIES.find((c) => c.iso2 === newIso) ?? COUNTRIES[0];
    setIso(next.iso2);
    onChange(composePhone(next.dial, localDigits));
  };

  const handleDigitsChange = (raw: string) => {
    let digits = raw.replace(/\D/g, "");
    // Pasted with the country code ("+233 55 720 5803"): drop it.
    const dialDigits = dial.replace(/\D/g, "");
    if (expected && digits.length > expected && digits.startsWith(dialDigits)) {
      digits = digits.slice(dialDigits.length);
    }
    // Strip the domestic leading 0 ("0557205803") before capping the length,
    // otherwise the cap cuts off the last real digit.
    digits = digits.replace(/^0+/, "").slice(0, expected || undefined);
    setLocalDigits(digits);
    onChange(composePhone(dial, digits));
  };

  return (
    <div className={`flex ${className}`}>
      <select
        value={iso}
        onChange={(e) => handleCountryChange(e.target.value)}
        aria-label="Country code"
        autoComplete="tel-country-code"
        className="border border-ink/20 hover:border-ink/35 focus:border-ink border-r-0 pl-3 pr-2 py-4 font-sans text-[16px] text-ink bg-transparent focus:outline-none transition-colors flex-shrink-0 max-w-[120px]"
      >
        {COUNTRIES.map((c) => (
          <option key={c.iso2} value={c.iso2}>
            {flagEmoji(c.iso2)} {c.dial}
          </option>
        ))}
      </select>
      <div className="relative flex-1">
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={formatLocalDigits(localDigits, country.example)}
          onChange={(e) => handleDigitsChange(e.target.value)}
          placeholder={country.example}
          className={`w-full border px-4 py-4 pr-14 font-sans text-[16px] text-ink placeholder:text-ink/30 tabular-nums bg-transparent focus:outline-none transition-colors ${
            isComplete ? "border-emerald-400 focus:border-emerald-500" : "border-ink/20 hover:border-ink/35 focus:border-ink"
          }`}
        />
        {localDigits.length > 0 && expected > 0 && (
          <span
            className={`absolute right-4 top-1/2 -translate-y-1/2 font-sans text-[12px] tabular-nums tracking-wide pointer-events-none ${
              isComplete ? "text-emerald-600" : "text-ink/45"
            }`}
          >
            {isComplete ? "✓" : `${localDigits.length}/${expected}`}
          </span>
        )}
      </div>
    </div>
  );
}
