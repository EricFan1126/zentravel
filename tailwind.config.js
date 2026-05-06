/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ZenTravel 禪風配色 — 詳見 CLAUDE.md
        'cloud-white':   '#F9FAFB',
        'graphite':      '#1F2937',
        'graphite-soft': '#4B5563',
        'morandi-blue':  '#8FA3B5',
        'sage-green':    '#A4B5A0',
        'divider':       '#E5E7EB',
      },
      fontFamily: {
        sans: [
          'Inter',
          '"Noto Sans TC"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      boxShadow: {
        zen: '0 1px 3px rgba(31, 41, 55, 0.04), 0 1px 2px rgba(31, 41, 55, 0.03)',
        'zen-lg': '0 4px 12px rgba(31, 41, 55, 0.06)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 400ms ease-out both',
        'fade-in': 'fade-in 300ms ease-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
