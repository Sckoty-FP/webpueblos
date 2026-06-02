import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:         "#0070cc",
        "primary-hover": "#1eaedb",
        commerce:        "#d53b00",
        "commerce-active": "#aa2f00",
        "accent-warm":   "#B8956A",
        "surface-dark":  "#121314",
        fog:             "#f5f7fa",
        divisor:         "#f3f3f3",
        "text-body":     "#1f1f1f",
        "text-muted":    "#6b6b6b",
        "text-subtle":   "#cccccc",
        error:           "#c81b3a",
        success:         "#059669",
        warning:         "#d97706",
      },
      fontFamily: {
        barlow:   ["var(--font-barlow-var)", "Barlow", "sans-serif"],
        fraunces: ["var(--font-fraunces-var)", "Fraunces", "serif"],
      },
      borderRadius: {
        input:    "3px",
        sm:       "6px",
        img:      "12px",
        card:     "19px",
        "card-lg":"24px",
        pill:     "999px",
      },
      transitionDuration: {
        "180": "180ms",
      },
    },
  },
  plugins: [],
};

export default config;
