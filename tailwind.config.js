/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {

      // ── Brand color palette ──────────────────────────────────
      colors: {
        green: {
          50:  '#F0F5F0',
          100: '#D6E8D8',
          200: '#ADD1B1',
          300: '#84BA8A',
          400: '#5BA363',
          500: '#355E3B',  // Hunter Green — primary brand
          600: '#2B4C30',
          700: '#213A25',
          800: '#16281A',
          900: '#0B160E',
        },
        blue: {
          50:  '#EEF2FD',
          100: '#D0DAFB',
          200: '#A1B5F7',
          300: '#7290F3',
          400: '#576BEF',
          500: '#4169E1',  // Royal Blue — primary brand
          600: '#3454B4',
          700: '#273F87',
          800: '#1A2A5A',
          900: '#0D152D',
        },
        purple: {
          50:  '#F3E8FF',
          100: '#E4CCFF',
          200: '#C999FF',
          300: '#AE66FF',
          400: '#8D52C8',
          500: '#6B3FA0',  // Purple — gradient endpoint
          600: '#563280',
          700: '#402660',
          800: '#2B1940',
          900: '#150D20',
        },
        cream: {
          50:  '#FFFFFF',
          100: '#F8FAF9',  // Off-White — primary background
          200: '#F0F5F0',  // Surface
          300: '#E2E8E2',  // Border
          400: '#C4CEC4',
          500: '#8A9A8A',
          600: '#4B5563',  // Text secondary
          700: '#374137',
          800: '#1A2E1A',  // Text primary
          900: '#0D160D',
        },
      },

      // ── Brand gradients ──────────────────────────────────────
      // Usage: className="bg-brand-gradient"
      backgroundImage: {
        // Royal Blue → Purple (primary brand gradient)
        'brand-gradient':      'linear-gradient(135deg, #4169E1 0%, #6B3FA0 100%)',
        'brand-gradient-r':    'linear-gradient(270deg, #4169E1 0%, #6B3FA0 100%)',
        'brand-gradient-v':    'linear-gradient(180deg, #4169E1 0%, #6B3FA0 100%)',

        // Subtle tinted fills for cards / panels
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(65,105,225,0.12) 0%, rgba(107,63,160,0.12) 100%)',

        // Clinical — green-tinted neutral for dashboard surfaces
        'clinical-surface':    'linear-gradient(180deg, #F0F5F0 0%, #FFFFFF 100%)',

        // Adventure — deeper immersive gradient for scene backgrounds
        'adventure-deep':      'linear-gradient(180deg, #1A2A5A 0%, #402660 100%)',
        'adventure-dawn':      'linear-gradient(180deg, #4169E1 0%, #F8FAF9 100%)',
      },

      // ── Typography ───────────────────────────────────────────
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // ── Spacing & radii ──────────────────────────────────────
      borderRadius: {
        sm:   '8px',
        md:   '12px',
        lg:   '16px',
        xl:   '20px',
        pill: '999px',
      },

      // ── Shadows (tinted with Hunter Green) ───────────────────
      boxShadow: {
        sm:      '0 2px 8px rgba(53, 94, 59, 0.06)',
        md:      '0 4px 16px rgba(53, 94, 59, 0.10)',
        lg:      '0 8px 32px rgba(53, 94, 59, 0.14)',
        // Glow for adventure / badge elements
        'glow-blue':   '0 0 24px rgba(65, 105, 225, 0.35)',
        'glow-purple': '0 0 24px rgba(107, 63, 160, 0.35)',
      },

    },
  },

  plugins: [],
};
