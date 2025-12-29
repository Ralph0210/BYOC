/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Apple-like color palette (mirrored from web)
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
      borderRadius: {
        xl: 12,
        "2xl": 16,
        "3xl": 24,
      },
    },
  },
  plugins: [],
}
