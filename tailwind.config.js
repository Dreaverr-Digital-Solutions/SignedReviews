/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './dist/**/*.html',
    './privacy/index.html',
    './terms/index.html',
    './refund-policy/index.html',
    './subprocessors/index.html',
    './dpa/index.html',
    './dmca/index.html',
    './pricing/index.html',
    './about/index.html',
    './contact/index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        navy: {
          50:  '#eef1f8', 100: '#d5dcee', 200: '#aab9dc', 300: '#87a2c4',
          400: '#5d7aaa', 500: '#2b3b60', 600: '#243252', 700: '#1c2840',
          800: '#141e30', 900: '#0c1320',
        },
        gold: {
          50:  '#faf8ee', 100: '#f2edcc', 200: '#e5db99', 300: '#d4c466',
          400: '#c4ae4e', 500: '#b39d45', 600: '#967f36', 700: '#786329',
          800: '#5a491e', 900: '#3c3013',
        },
        steel: {
          50:  '#f0f4f9', 100: '#dce6f0', 200: '#b9cedf', 300: '#87a2c4',
          400: '#6488b0', 500: '#4a6e98', 600: '#3c5a7e', 700: '#2e4664',
        },
      },
    },
  },
};
