import type { Config } from "tailwindcss";

// Tailwind CSS v4 default config scaffold.
// You're currently using inline @theme in src/app/globals.css.
// This file lets you gradually move customizations here if you prefer.

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: "var(--font-geist-sans)",
        mono: "var(--font-geist-mono)",
      },
    },
  },
  plugins: [],
} satisfies Config;
