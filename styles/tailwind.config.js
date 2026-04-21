/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'hunter-green': '#355E3B',
        'royal-blue':   '#4169E1',
        'purple':       '#6B3FA0',
        'off-white':    '#F8FAF9',
        'surface':      '#F0F5F0',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm':   '8px',
        'md':   '12px',
        'lg':   '16px',
        'xl':   '20px',
        'pill': '999px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(53,94,59,0.06)',
        'md': '0 4px 16px rgba(53,94,59,0.10)',
        'lg': '0 8px 32px rgba(53,94,59,0.14)',
      },
    },
  },
  plugins: [],
};
