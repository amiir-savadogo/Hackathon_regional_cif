/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },
        cif: {
          gold: '#D4AF37',
          navy: '#0F172A',
          card: '#1E293B'
        }
      }
    },
  },
  plugins: [],
}

