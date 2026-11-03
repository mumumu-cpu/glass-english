/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', '"Hiragino Sans"', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px -8px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
        'glass-lg': '0 24px 60px -16px rgba(15, 23, 42, 0.22), inset 0 1px 0 rgba(255,255,255,0.95)',
      },
    },
  },
  plugins: [],
}
