/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dow-janes': {
          purple: '#C8BAEE',
          teal: '#00483D',
          rose: '#E9DEE2',
          gray: '#D4D6D8'
        }
      }
    },
  },
  plugins: [],
}
