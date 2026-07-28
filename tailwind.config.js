/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0B1F3A", light: "#1D4ED8", accent: "#3B82F6" },
        surface: { DEFAULT: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0" },
        ink: { DEFAULT: "#0F172A", muted: "#64748B" },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      borderRadius: { sm: "10px", md: "16px", lg: "24px" },
      boxShadow: {
        card: "0 6px 16px rgba(15, 23, 42, 0.08)",
        floating: "0 12px 28px rgba(15, 23, 42, 0.12)",
      },
      fontFamily: {
        poppins: "regular", // reference to your Expo-loaded name
        bold: "bold",
        medium: "medium",
        light: "light",
        semibold: "semiBold",
        extrabold: "extraBold",
        spacemono: "spaceMono",
      },
    },
  },
  plugins: [],
};
