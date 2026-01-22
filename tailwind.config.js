/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#ea2a33",
        "ink": "#181111",
        "paper": {
          "creme": "#f8f6f4",
          "white": "#fdfdfd",
        }
      },
      fontFamily: {
        "sans": ["Public Sans", "system-ui", "sans-serif"]
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "zen": "0 10px 40px -10px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
        "zen-lg": "0 20px 50px -12px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
      }
    },
  },
  plugins: [],
}
