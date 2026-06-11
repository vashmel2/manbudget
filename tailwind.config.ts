import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        hairline: "var(--hairline)",
        "hairline-2": "var(--hairline-2)",
        fg: "var(--text)",
        "fg-dim": "var(--text-dim)",
        "fg-faint": "var(--text-faint)",
        pos: "var(--pos)",
        warn: "var(--warn)",
        cyan: "var(--cyan)",
        neg: "var(--neg)",
      },
      fontFamily: {
        sans: ["var(--ui)"],
        mono: ["var(--mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
