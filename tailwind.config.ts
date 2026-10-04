import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        fibrasa: {
          DEFAULT: "#147846",
          50: "#effaf3",
          100: "#d6f2e0",
          200: "#b0e5c4",
          300: "#7fd3a1",
          400: "#44ac34",
          500: "#147846", // Verde Fibrasa Oficial
          600: "#0f6138",
          700: "#0d4e2d",
          800: "#0c3f25",
          900: "#0b3420",
          blue: {
            DEFAULT: "#0066b3", // Azul Fibrasa Oficial
            50: "#eef6fc",
            100: "#d7eaf7",
            200: "#b3d8f0",
            300: "#7ebde5",
            400: "#419dd6",
            500: "#0066b3",
            600: "#005292",
            700: "#004276",
          },
          dark: "#1d1d1b",
        },
        sidebar: {
          DEFAULT: "#0f172a",
          foreground: "#f8fafc",
          hover: "#1e293b",
          active: "#147846",
          border: "#1e293b",
        },
        brand: {
          50: "#effaf3",
          100: "#d6f2e0",
          200: "#b0e5c4",
          300: "#7fd3a1",
          400: "#44ac34",
          500: "#147846",
          600: "#0f6138",
          700: "#0d4e2d",
          800: "#0c3f25",
          900: "#0b3420",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
