/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9ecff',
          200: '#bcdfff',
          300: '#8ecbff',
          400: '#59adff',
          500: '#338cff',
          600: '#1b6df5',
          700: '#1557e1',
          800: '#1847b6',
          900: '#1a408f',
          950: '#142857',
        },
        surface: '#f7f8fa',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgb(15 23 42 / 0.08), 0 1px 2px rgb(15 23 42 / 0.04)',
      },
      borderRadius: { xl: '0.875rem' },
    },
  },
  plugins: [],
};
