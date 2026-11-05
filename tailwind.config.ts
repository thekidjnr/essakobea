import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ink, paper and mist read from CSS variables (app/globals.css) so a page can
        // swap them, e.g. the gray booking page (.theme-gray). Defaults stay the same.
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        paper: "rgb(var(--paper-rgb) / <alpha-value>)",
        mist: "rgb(var(--mist-rgb) / <alpha-value>)",
        stone: "#9A9590",
        // Admin dashboard neutrals, built around the brand warm blue (ink).
        graphite: "#36363A",
        muted: "#6B6E75",
        line: "#E6E7EA",
        soft: "#F3F4F6",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Helvetica Neue", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.3em",
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        reveal: "reveal 260ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        reveal: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
