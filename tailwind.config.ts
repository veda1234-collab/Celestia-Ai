import type { Config } from 'tailwindcss';

/**
 * Vedastra design system.
 * Semantic color tokens are defined as HSL CSS variables in globals.css so that
 * the premium dark and light themes can swap without touching component code.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'hsl(var(--gold) / <alpha-value>)',
          foreground: 'hsl(var(--gold-foreground) / <alpha-value>)',
        },
        // PLATE surfaces + split-gold + semantic pigments
        plate: 'hsl(var(--plate) / <alpha-value>)',
        inset: 'hsl(var(--inset) / <alpha-value>)',
        well: 'hsl(var(--well) / <alpha-value>)',
        champagne: 'hsl(var(--champagne) / <alpha-value>)',
        'gold-deep': 'hsl(var(--gold-deep) / <alpha-value>)',
        'ink-2': 'hsl(var(--ink-2) / <alpha-value>)',
        good: 'hsl(var(--good) / <alpha-value>)',
        info: 'hsl(var(--info) / <alpha-value>)',
        caution: 'hsl(var(--caution) / <alpha-value>)',
        care: 'hsl(var(--care) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        xl: 'calc(var(--radius) + 6px)',
        '2xl': 'calc(var(--radius) + 14px)',
        plate: 'var(--radius-plate)',
        field: 'var(--radius-field)',
        control: 'var(--radius-control)',
        chip: 'var(--radius-chip)',
      },
      letterSpacing: {
        kicker: '0.18em',
      },
      fontSize: {
        kicker: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.18em' }],
        dateline: ['0.75rem', { lineHeight: '1.4' }],
      },
      transitionTimingFunction: {
        ink: 'cubic-bezier(0.16, 1, 0.3, 1)',
        inkout: 'cubic-bezier(0.65, 0, 0.35, 1)',
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      boxShadow: {
        // Whisper glow — CTA + medallion only (was a 40px bloom).
        glow: '0 0 0 1px hsl(var(--gold) / 0.22), 0 0 26px -14px hsl(var(--gold) / 0.5)',
        'glow-gold': '0 0 26px -14px hsl(var(--gold) / 0.5)',
        card: '0 20px 60px -22px rgba(0,0,0,0.55)',
        plate: 'inset 0 1px 0 hsl(0 0% 100% / 0.04), 0 10px 30px -22px rgba(0,0,0,0.6)',
        tooltip: '0 16px 40px -20px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        // Kept for the landing/loader backdrop only.
        'aurora': 'radial-gradient(circle at 20% 20%, hsl(var(--primary)/0.35), transparent 45%), radial-gradient(circle at 80% 30%, hsl(var(--accent)/0.30), transparent 45%), radial-gradient(circle at 50% 80%, hsl(var(--gold)/0.22), transparent 45%)',
        // Demoted static near-black vignette for working surfaces.
        'aurora-faint': 'radial-gradient(120% 100% at 50% -12%, hsl(230 50% 9% / 0.9), transparent 70%)',
        // The recurring engraved separator.
        'rule-gold': 'linear-gradient(90deg, transparent, hsl(var(--gold-deep) / 0.34) 12%, hsl(var(--gold-deep) / 0.34) 88%, transparent)',
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.15', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-18px) translateX(6px)' },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'spin-reverse': { to: { transform: 'rotate(-360deg)' } },
        aurora: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.8' },
          '50%': { transform: 'translate3d(3%, -4%, 0) scale(1.08)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 24px -8px hsl(var(--primary)/0.5)' },
          '50%': { boxShadow: '0 0 48px -6px hsl(var(--primary)/0.85)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        // PLATE — "ink settling" motions.
        'rule-draw': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        'ink-rise': { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'tick-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        twinkle: 'twinkle 4s ease-in-out infinite',
        float: 'float 8s ease-in-out infinite',
        'spin-slow': 'spin-slow 60s linear infinite',
        'spin-reverse': 'spin-reverse 90s linear infinite',
        aurora: 'aurora 16s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        gradient: 'gradient 8s ease infinite',
        'rule-draw': 'rule-draw 0.64s cubic-bezier(0.16,1,0.3,1) both',
        'ink-rise': 'ink-rise 0.56s cubic-bezier(0.16,1,0.3,1) both',
        'tick-in': 'tick-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
