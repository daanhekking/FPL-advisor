/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        fpl: {
          purple: '#37003c',
          pink: '#ff2882',
          green: '#00ff87',
        }
      }
    },
  },
  plugins: [],
}

