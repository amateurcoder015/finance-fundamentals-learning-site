import typographyPlugin from '@tailwindcss/typography';
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        preparooNavy: '#0B172A',
        preparooDark: '#060B14',
        preparooCard: '#0F1E36',
        bgLight: '#FFFFFF',
        bgDark: '#080E1A',
        surfaceLight: '#FFFFFF',
        surfaceDark: '#0F1E36',
        borderLight: '#E2E8F0',
        borderDark: '#1E293B',
        textPrimaryLight: '#0F172A',
        textPrimaryDark: '#F8FAFC',
        textMutedLight: '#64748B',
        textMutedDark: '#94A3B8',
        accent: {
          DEFAULT: '#0F172A',
          blue: '#2563EB',
          light: '#F1F5F9',
        },
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      maxWidth: {
        'prose': '72ch',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: '72ch',
            color: '#1E293B',
            lineHeight: '1.8',
            fontSize: '1.125rem',
            h1: {
              color: '#0F172A',
              fontWeight: '900',
              fontSize: '2.5rem',
              marginTop: '2.25rem',
              marginBottom: '1rem',
              letterSpacing: '-0.03em',
            },
            h2: {
              color: '#0F172A',
              fontWeight: '800',
              fontSize: '1.75rem',
              marginTop: '2.5rem',
              marginBottom: '1.25rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #E2E8F0',
              letterSpacing: '-0.02em',
            },
            h3: {
              color: '#1E293B',
              fontWeight: '700',
              fontSize: '1.25rem',
              marginTop: '1.75rem',
              marginBottom: '0.75rem',
            },
            a: {
              color: '#2563EB',
              textDecoration: 'none',
              fontWeight: '600',
              '&:hover': {
                color: '#1D4ED8',
                textDecoration: 'underline',
              },
            },
            code: {
              color: '#0F172A',
              backgroundColor: '#F1F5F9',
              padding: '0.25em 0.5em',
              borderRadius: '0.375rem',
              fontWeight: '500',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            blockquote: {
              borderLeftColor: '#0F172A',
              color: '#475569',
              fontStyle: 'italic',
            },
            hr: {
              borderColor: '#E2E8F0',
              marginTop: '2.5rem',
              marginBottom: '2.5rem',
            },
          },
        },
        dark: {
          css: {
            color: '#CBD5E1',
            h1: { color: '#F8FAFC' },
            h2: {
              color: '#F8FAFC',
              borderBottomColor: '#1E293B',
            },
            h3: { color: '#F1F5F9' },
            a: { color: '#60A5FA' },
            code: {
              color: '#F8FAFC',
              backgroundColor: '#1E293B',
            },
            blockquote: {
              borderLeftColor: '#38BDF8',
              color: '#94A3B8',
            },
            hr: { borderColor: '#1E293B' },
          },
        },
      }),
    },
  },
  plugins: [typographyPlugin],
};
