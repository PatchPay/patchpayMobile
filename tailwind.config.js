/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
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
