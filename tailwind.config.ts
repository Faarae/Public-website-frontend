import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1B3022",
        "primary-hover": "#132318",
        "primary-container": "#1B3022",
        "on-primary": "#FFFFFF",
        
        secondary: "#1A1A1A",
        "secondary-container": "#EAE8E6",
        "on-secondary": "#FFFFFF",
        
        tertiary: "#C89B3C",
        "tertiary-hover": "#B38932",
        "tertiary-container": "#3A2800",
        "on-tertiary": "#FFFFFF",
        "on-tertiary-container": "#C89B3C",
        
        neutral: "#7D7D7D",
        "on-surface-variant": "#4A504B",
        
        background: "#FAF9F9",
        surface: "#FAF9F9",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F5F3F3",
        "surface-container": "#EFEDED",
        "surface-container-high": "#E9E8E7",
        "surface-variant": "#E3E2E2",
        
        outline: "#737973",
        "outline-variant": "#C3C8C1",
        
        error: "#BA1A1A",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      spacing: {
        "margin-desktop": "80px",
        "section-gap-desktop": "120px",
        "section-gap-mobile": "64px",
        "container-max-width": "1440px",
        gutter: "32px",
        "margin-mobile": "20px",
      },
      fontFamily: {
        headline: ["'Playfair Display'", "serif"],
        display: ["'Playfair Display'", "serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
