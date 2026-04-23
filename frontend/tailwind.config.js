/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: {
          900: "#0D0D0D",
          800: "#1A1A1A",
          700: "#2C2C2C",
          600: "#404040",
          400: "#737373",
          200: "#C2C2C2",
          100: "#E8E8E8",
          50:  "#F5F5F5",
        },
        amber: {
          400: "#FFBF40",
          500: "#FFA500",
          600: "#E08800",
        },
        emerald: {
          400: "#34D399",
          500: "#10B981",
        },
        rose: {
          400: "#FB7185",
          500: "#F43F5E",
        },
        sky: {
          400: "#38BDF8",
          500: "#0EA5E9",
        },
      },
      boxShadow: {
        "card": "0 2px 12px 0 rgba(0,0,0,0.08)",
        "card-hover": "0 8px 32px 0 rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};
