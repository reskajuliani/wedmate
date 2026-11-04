import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        champagne: {
          DEFAULT: "#C8A46A",
          50: "#FAF6EE",
          100: "#F5EDDC",
          200: "#EBDAB9",
          300: "#E0C696",
          400: "#D4B57E",
          500: "#C8A46A",
          600: "#B38C4F",
          700: "#8D6E3E",
          800: "#67512D",
          900: "#41331D",
        },
        ivory: {
          DEFAULT: "#F8F5EF",
          light: "#FFFFFF",
          warm: "#F5F0E6",
          dark: "#EEE7D9",
        },
        softbeige: {
          DEFAULT: "#E8DED0",
          50: "#FAF8F5",
          100: "#F5F1EB",
          200: "#ECE2D5",
          300: "#E8DED0",
          400: "#D9C9B4",
          500: "#C7B39B",
          600: "#A8947C",
        },
        charcoal: {
          DEFAULT: "#333333",
          50: "#F6F6F6",
          100: "#E7E7E7",
          200: "#D1D1D1",
          300: "#A8A8A8",
          400: "#707070",
          500: "#4D4D4D",
          600: "#333333",
          700: "#2B2B2B",
          800: "#1F1F1F",
          900: "#141414",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "'Playfair Display'", "Georgia", "serif"],
        sans: ["var(--font-sans)", "'Plus Jakarta Sans'", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        'wedding': '0 10px 30px -10px rgba(200, 164, 106, 0.2)',
        'wedding-lg': '0 20px 40px -15px rgba(200, 164, 106, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
