import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './sidebar.html'],
  theme: {
    extend: {
      colors: {
        base: '#0a0a0f',
        surface: '#111118',
        card: '#17171f',
        'card-hover': '#1c1c26',
        border: 'rgba(255,255,255,0.07)',
        'border-active': 'rgba(255,255,255,0.15)',
        accent: {
          DEFAULT: '#6366f1',
          hover: '#5558e0',
          muted: 'rgba(99,102,241,0.15)',
          glow: 'rgba(99,102,241,0.35)',
        },
        success: { DEFAULT: '#10b981', muted: 'rgba(16,185,129,0.15)' },
        warning: { DEFAULT: '#f59e0b', muted: 'rgba(245,158,11,0.15)' },
        danger: { DEFAULT: '#ef4444', muted: 'rgba(239,68,68,0.15)' },
        purple: { DEFAULT: '#8b5cf6', muted: 'rgba(139,92,246,0.15)' },
        sky: { DEFAULT: '#0ea5e9', muted: 'rgba(14,165,233,0.15)' },
        text: {
          primary: '#f4f4f5',
          secondary: '#a1a1aa',
          muted: '#52525b',
          accent: '#818cf8',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        accent: '0 0 20px rgba(99,102,241,0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
