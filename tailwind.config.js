/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Apple-like color palette
        primary: {
          DEFAULT: "#007AFF",
          50: "#E5F2FF",
          100: "#CCE5FF",
          200: "#99CBFF",
          300: "#66B0FF",
          400: "#3396FF",
          500: "#007AFF",
          600: "#0062CC",
          700: "#004999",
          800: "#003166",
          900: "#001833",
        },
        surface: {
          light: "#F2F2F7",
          dark: "#1C1C1E",
        },
        // Task colors
        task: {
          blue: "#007AFF",
          green: "#34C759",
          orange: "#FF9500",
          red: "#FF3B30",
          purple: "#AF52DE",
          pink: "#FF2D55",
          teal: "#5AC8FA",
          indigo: "#5856D6",
          yellow: "#FFCC00",
          mint: "#00C7BE",
          brown: "#A2845E",
          gray: "#8E8E93",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.12)",
        modal: "0 8px 32px rgba(0, 0, 0, 0.16)",
      },
      animation: {
        "scale-in": "scaleIn 0.15s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
