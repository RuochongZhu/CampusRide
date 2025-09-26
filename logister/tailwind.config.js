/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C24D45',
        secondary: '#63B5B7',
        background: '#EDEEE8'
      }
    },
  },
  plugins: [],
}
