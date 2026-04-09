/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0F172A",
          gold: "#D97706",
          sky: "#0EA5E9",
          mint: "#10B981",
          paper: "#F8FAFC"
        }
      },
      boxShadow: {
        panel: "0 20px 45px -28px rgba(15, 23, 42, 0.45)"
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        floatUp: "floatUp 0.45s ease-out forwards"
      }
    }
  },
  plugins: []
};
