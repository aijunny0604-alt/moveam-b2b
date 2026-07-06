/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#c2410c', // 주황(레이싱 톤) — 도매가 강조색
          dark: '#9a3412',
        },
      },
    },
  },
  plugins: [],
}
