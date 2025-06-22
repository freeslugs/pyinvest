const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // App Router directory
    './components/**/*.{js,ts,jsx,tsx}' // Components directory
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Adelle Sans', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'privy-navy': '#160B45',
        'privy-light-blue': '#EFF1FD',
        'privy-blueish': '#D4D9FC',
        'privy-pink': '#FF8271',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
