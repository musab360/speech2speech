/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // ✅ add this
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 10s linear infinite',
        'spin-reverse-slower': 'spin 20s linear infinite reverse',
      },
    },
  },
  plugins: [],
}
