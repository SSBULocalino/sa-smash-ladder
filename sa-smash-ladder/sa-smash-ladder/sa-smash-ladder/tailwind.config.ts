import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { ink: '#101426', panel: '#1A2040', line: '#2E376B', sun: '#FFC83D', sky: '#4FB3FF', danger: '#FF5A5F' },
    fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
  } },
  plugins: [],
} satisfies Config;
