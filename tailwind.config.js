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
        // "navy" keeps its name so existing views inherit the new palette: it is now ink-indigo.
        navy: {
          50: '#F3F2FB',
          100: '#E6E4F6',
          600: '#4A4584',
          700: '#37336A',
          800: '#26234B',
          900: '#1B1934',
        },
        charcoal: { 900: '#1B1934', 800: '#26234B', 700: '#3A3760' },
        warmwhite: {
          DEFAULT: '#F7F6FB',
          50: '#FFFFFF',
          100: '#F7F6FB',
          200: '#EFEDF6',
        },
        // "gold" is now marigold — the colour of YOU (the person in the loop).
        gold: {
          50: '#FEF8E6',
          100: '#FCEFC8',
          200: '#FADF9A',
          300: '#F8D272',
          400: '#F6C34E',
          500: '#F2B233',
          600: '#94600A',
          700: '#7A4E06',
          800: '#5E3B04',
          900: '#3F2802',
          950: '#2A1A01',
          DEFAULT: '#F2B233',
        },
        // The three voices of the product.
        you: { DEFAULT: '#F2B233', soft: '#FCEFC8', ink: '#7A4E06' },
        ai: { DEFAULT: '#4353E8', soft: '#E4E7FC', ink: '#2B37B8' },
        both: { DEFAULT: '#149C83', soft: '#D6F2EB', ink: '#0B6B59' },
        status: {
          green: '#149C83',
          greenBg: '#E6F6F1',
          greenText: '#0B6B59',
          amber: '#F2B233',
          amberBg: '#FEF8E6',
          amberText: '#7A4E06',
          red: '#E5484D',
          redBg: '#FDECEC',
          redText: '#B42328',
          blue: '#4353E8',
          blueBg: '#E4E7FC',
          blueText: '#2B37B8',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '0.875rem',
        xl: '1.25rem',
        '2xl': '1.75rem',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(27,25,52,0.05)',
        sm: '0 1px 3px rgba(27,25,52,0.07), 0 1px 2px rgba(27,25,52,0.04)',
        md: '0 6px 18px -6px rgba(27,25,52,0.14)',
        lg: '0 14px 34px -12px rgba(27,25,52,0.2)',
        xl: '0 24px 60px -20px rgba(27,25,52,0.28)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%,100%': { transform: 'translate(0,0)' },
          '50%': { transform: 'translate(10px,-8px)' },
        },
      },
      animation: {
        rise: 'rise 0.6s cubic-bezier(0.2,0.7,0.2,1) both',
        drift: 'drift 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
