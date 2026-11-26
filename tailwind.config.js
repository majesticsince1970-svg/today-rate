/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cinzel"', '"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        malayalam: ['"Noto Sans Malayalam"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        gold: {
          50: '#FDFBF2',
          100: '#F9F1D4',
          200: '#F2DE9E',
          300: '#E8C563',
          400: '#DFAD36',
          500: '#C99220',
          600: '#A67217',
          700: '#845515',
          800: '#6D4417',
          900: '#5A3817',
        },
        obsidian: {
          950: '#09090B',
          900: '#111114',
          800: '#19191F',
          700: '#25252E',
        },
      },
      boxShadow: {
        gold: '0 0 25px rgba(212, 175, 55, 0.18)',
      },
    },
  },
  plugins: [],
};
