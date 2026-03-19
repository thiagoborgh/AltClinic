/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  // Não usar preflight para não conflitar com MUI
  corePlugins: {
    preflight: false,
  },
};
