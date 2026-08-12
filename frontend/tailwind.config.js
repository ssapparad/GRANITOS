/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F4F1',
        ink: {
          DEFAULT: '#1B1D1B',
          muted: '#6B6A64',
          faint: '#9C9A93'
        },
        line: {
          DEFAULT: '#E3E1DA',
          soft: '#EDEBE5'
        },
        emerald: {
          50: '#E9F3EE',
          100: '#CDE6DA',
          500: '#0E6E4E',
          600: '#0B5C41',
          700: '#094A34'
        },
        gold: {
          50: '#F8F0E1',
          100: '#EFDDB6',
          500: '#B8863E',
          600: '#9C7133'
        }
      },
      fontFamily: {
        display: ['Petrona', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(27, 29, 27, 0.04), 0 1px 3px 0 rgba(27, 29, 27, 0.06)'
      }
    }
  },
  plugins: []
}
