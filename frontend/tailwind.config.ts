import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0B2A4A', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#082544', foreground: '#FFFFFF' },
        accent: { DEFAULT: '#1469D4', light: '#1677E8', foreground: '#FFFFFF' },
        background: '#F5F9FD',
        'background-light': '#EAF4FF',
        foreground: '#163B63',
        muted: { DEFAULT: '#64748B', foreground: '#64748B' },
        border: '#D9E6F2',
        success: '#16A765',
        warning: '#F59E0B',
      },
      borderRadius: { lg: '0.75rem', md: '0.5rem', sm: '0.375rem' },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'Poppins', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
