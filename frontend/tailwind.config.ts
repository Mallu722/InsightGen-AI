import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#e0e9fe",
          200: "#bad0fe",
          300: "#7da8fc",
          400: "#3974f8",
          500: "#144ff0",
          600: "#0b37cd",
          700: "#0b2ca5",
          800: "#0e2786",
          900: "#10246f",
          950: "#091444",
        },
      },
    },
  },
  plugins: [],
};
export default config;
