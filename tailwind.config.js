/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          primary: '#FF5A14',
          button: '#FF7A45',
          hover: '#F56B2F',
          sidebar: '#4A4A4A',
          bgLight: '#FFFFFF',
          bgInput: '#FFF7F2',
          borderLight: '#D8D8D8',
          borderOrange: '#FF8A55',
          textPrimary: '#666666',
          textSecondary: '#888888',
          placeholder: '#B0B0B0',
          white: '#FFFFFF',
        },
        brand: {
          orange: '#FF5A14',
          button: '#FF7A45',
          hover: '#F56B2F',
        },
        sidebar: {
          DEFAULT: '#4A4A4A',
          dark: '#3A3A3A',
          hover: '#5A5A5A',
        }
      },
    },
  },
  plugins: [],
}
