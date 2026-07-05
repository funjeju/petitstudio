import type { Config } from 'tailwindcss';

/**
 * DESIGN.md(시안 3 · PAWFOLIO) 토큰을 CSS 변수로 참조.
 * 실제 색상값은 src/app/globals.css 의 :root / .dark 에 정의.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        'on-accent': 'var(--on-accent)',
        point: 'var(--point)',
        'point-soft': 'var(--point-soft)',
      },
      borderRadius: {
        card: '12px',
        control: '8px',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
