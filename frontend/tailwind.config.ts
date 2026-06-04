import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "uct-blue": "#003366",
        "uct-blue-mid": "#004080",
        "uct-blue-light": "#0055aa",
        "uct-gold": "#FFD700",
        "uct-gold-soft": "#FFC832",
        "bg-deep": "#060d1a",
        "bg-surface": "#0a1628",
        "bg-card": "#0f1e35",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
