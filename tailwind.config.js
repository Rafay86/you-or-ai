/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B132B',
          800: '#152244',
          700: '#1F3260',
        },
        charcoal: {
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
        },
        warmwhite: {
          DEFAULT: '#F8FAFC',
          50: '#FFFFFF',
          100: '#F8FAFC',
          200: '#F1F5F9',
        },
        slate: {
          DEFAULT: '#64748B',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        gold: {
          DEFAULT: '#C8A96B',
          400: '#D4B87E',
          500: '#C8A96B',
          600: '#B2914F',
          700: '#917336',
        },
        status: {
          green: '#10B981',
          greenBg: '#ECFDF5',
          greenText: '#047857',
          amber: '#F59E0B',
          amberBg: '#FFFBEB',
          amberText: '#B45309',
          red: '#EF4444',
          redBg: '#FEF2F2',
          redText: '#B91C1C',
          blue: '#3B82F6',
          blueBg: '#EFF6FF',
          blueText: '#1D4ED8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
