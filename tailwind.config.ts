import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Luminary Design Tokens ──────────────────────────
      colors: {
        silk:       "#fdf9f5",
        ivory:      "#faf6f0",
        champagne:  "#f7efe0",
        blush:      "#f5e6e0",
        petal:      "#f0d4c8",
        gold: {
          DEFAULT: "#c8a96e",
          light:   "#e8d5a3",
          muted:   "#d4bc89",
        },
        rose: {
          DEFAULT: "#c4817a",
          light:   "#e8b5ae",
        },
        lavender: {
          DEFAULT: "#ddd5e8",
          deep:    "#b8a8d0",
        },
        sage:       "#c8d8c8",
        ink: {
          DEFAULT: "#2a1f1a",
          mid:     "#5a4a42",
          soft:    "#8a7a72",
          ghost:   "rgba(42,31,26,0.06)",
        },
        // shadcn compat
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },

      // ── Typography ─────────────────────────────────────
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans:    ["var(--font-syne)", "system-ui", "sans-serif"],
        mono:    ["var(--font-dm-mono)", "Courier New", "monospace"],
      },

      fontSize: {
        "2xs": ["0.6rem",  { lineHeight: "1rem" }],
        "xs":  ["0.7rem",  { lineHeight: "1rem" }],
        "sm":  ["0.8rem",  { lineHeight: "1.3rem" }],
        "base":["0.875rem",{ lineHeight: "1.5rem" }],
      },

      letterSpacing: {
        widest:  "0.25em",
        wider:   "0.15em",
        wide:    "0.1em",
      },

      // ── Spacing ────────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },

      // ── Border Radius ──────────────────────────────────
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ── Animation ─────────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        breathe: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.85" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-12px)" },
        },
        "spin-slow": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulse: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.4" },
        },
        marquee: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-up":        "fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in":        "fade-in 0.6s ease both",
        breathe:          "breathe 8s ease-in-out infinite",
        float:            "float 6s ease-in-out infinite",
        "spin-slow":      "spin-slow 20s linear infinite",
        pulse:            "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        marquee:          "marquee 25s linear infinite",
        shimmer:          "shimmer 2s linear infinite",
      },

      // ── Backdrop Blur ──────────────────────────────────
      backdropBlur: {
        xs: "2px",
      },

      // ── Box Shadow ─────────────────────────────────────
      boxShadow: {
        glass:  "0 8px 32px rgba(42,31,26,0.06), 0 0 0 0.5px rgba(200,169,110,0.12)",
        "glass-lg": "0 40px 80px rgba(42,31,26,0.08), 0 0 0 0.5px rgba(200,169,110,0.1)",
        "gold": "0 4px 24px rgba(200,169,110,0.25)",
        "rose": "0 4px 24px rgba(196,129,122,0.2)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
