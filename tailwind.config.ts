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
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        aurora: {
          "0%": { backgroundPosition: "50% 50%, 50% 50%" },
          "50%": { backgroundPosition: "220% 55%, 180% 45%" },
          "100%": { backgroundPosition: "420% 50%, 360% 50%" },
        },
      },
      animation: {
        aurora: "aurora 60s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
