/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'highlight': 'highlight 1s ease-in-out',
        'highlight-up': 'highlightUp 1.2s ease-out',
        'highlight-down': 'highlightDown 1.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        highlight: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: '#fde68a' },
        },
        highlightUp: {
          '0%': { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
          '100%': { backgroundColor: 'transparent' },
        },
        highlightDown: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
          '100%': { backgroundColor: 'transparent' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}