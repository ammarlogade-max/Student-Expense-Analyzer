/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — matches CSS variables
        lime:  "#c8ff00",
        teal:  "#00e5c3",
        rose:  "#ff4d6d",
        amber: "#ffb930",
        // Surfaces
        bg:      "#080c12",
        surface: "#0e1420",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body:    ["DM Sans", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "fade-up":   "fadeUp 0.45s cubic-bezier(.22,1,.36,1) both",
        "fade-in":   "fadeIn 0.35s ease both",
        "scale-in":  "scaleIn 0.35s cubic-bezier(.22,1,.36,1) both",
        "float":     "float 3s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-8px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};