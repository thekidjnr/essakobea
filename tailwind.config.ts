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
        ink: "#1A212B",
        paper: "#FFFFFF",
        mist: "#F7F6F4",
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
