import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0F1B2D', soft: '#1B2B45', muted: '#5B6B7F', line: '#DDE3EA' },
        paper: '#F3F5F8',
        brand: { DEFAULT: '#1F3FBF', dark: '#172F94', tint: '#E8ECFA' },
        marigold: { DEFAULT: '#C77700', tint: '#FFF3DC' },
        ok: { DEFAULT: '#17803D', tint: '#E3F4E9' },
        bad: { DEFAULT: '#C62F2F', tint: '#FBE9E9' },
      },
    },
  },
  plugins: [],
} satisfies Config;
