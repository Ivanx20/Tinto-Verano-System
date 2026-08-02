import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#eef4ff',
          100: '#dbe7ff',
          500: '#1f4d8f',
          600: '#183f77',
          700: '#12315f',
          800: '#0d2447',
          900: '#081a34'
        },
        gold: {
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6'
        },
        cream: '#f3f7ff'
      },
      boxShadow: {
        premium: '0 16px 40px rgba(8,26,52,.16)'
      }
    }
  },
  plugins: []
} satisfies Config;
