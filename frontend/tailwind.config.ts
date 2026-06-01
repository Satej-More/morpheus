import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E17',
        'bg-card': '#0d1520',
        'bg-raised': '#111827',
        border: '#1e2d3d',
        primary: '#00D4FF',
        success: '#00FF88',
        danger: '#FF3B3B',
        warning: '#FFB800',
        text: '#E8EDF5',
        muted: '#8892a4',
        subtle: '#2a3a4d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'ping-slow': 'ping-slow 2.5s ease-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0,212,255,0.25), 0 0 40px rgba(0,212,255,0.1)',
        'glow-red': '0 0 20px rgba(255,59,59,0.3), 0 0 40px rgba(255,59,59,0.15)',
        'glow-green': '0 0 20px rgba(0,255,136,0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
