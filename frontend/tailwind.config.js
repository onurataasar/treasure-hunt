/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "ottoman-red": "#E81F3D",
        turquoise: "#00A5A8",
        gold: "#FFB300",
        navy: "#1A237E",
        ivory: "#FFFFF0",
      },
      fontFamily: {
        sans: ["Inter var", "sans-serif"],
      },
    },
  },
  plugins: [],
};
