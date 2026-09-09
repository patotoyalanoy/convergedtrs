/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F97316', // Orange-500
          light: '#FB923C', // Orange-400
          dark: '#EA580C', // Orange-600
        },
        secondary: {
          DEFAULT: '#0EA5E9', // Sky-500
          light: '#38BDF8', // Sky-400
          dark: '#0284C7', // Sky-600
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        navy: {
          DEFAULT: '#0B192C',
          50: '#F4F7FA',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
          500: '#334155',
          600: '#1E293B',
          700: '#0F172A',
          800: '#0D1E36',
          900: '#0B192C',
          950: '#06101E',
        }
      },
      fontFamily: {
        sans: ['"Century Gothic"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
