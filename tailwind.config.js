const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        'adelle': ['Adelle Sans', 'serif'],
      },
      colors: {
        'privy-navy': '#160B45',
        'privy-light-blue': '#EFF1FD',
        'privy-blueish': '#D4D9FC',
        'privy-pink': '#FF8271',
        'green-600': '#0B8A4E',
        'green-700': '#0B8A4E',
        'blue-50': '#EEF2FF',
        'blue-600': '#0171DF',
        'blue-700': '#0157B8',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
