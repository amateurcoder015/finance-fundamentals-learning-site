import typographyPlugin from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bgLight: '#FAFAF9',
        bgDark: '#0B1120',
        surfaceLight: '#FFFFFF',
        surfaceDark: '#131B2E',
        borderLight: '#E5E7EB',
        borderDark: '#1F2937',
        textPrimaryLight: '#111827',
        textPrimaryDark: '#F3F4F6',
        textMutedLight: '#6B7280',
        textMutedDark: '#9CA3AF',
        accent: {
          DEFAULT: '#1D4ED8',
          hover: '#1E40AF',
          light: 'rgba(29, 78, 216, 0.1)',
          dark: '#3B82F6',
        },
        success: '#16A34A',
        error: '#DC2626',
      },
      maxWidth: {
        'prose': '70ch',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: '70ch',
            color: '#1F2937',
            lineHeight: '1.75',
            fontSize: '1.125rem',
            h1: {
              color: '#111827',
              fontWeight: '800',
              fontSize: '2.25rem',
              marginTop: '2rem',
              marginBottom: '1rem',
              letterSpacing: '-0.025em',
            },
            h2: {
              color: '#111827',
              fontWeight: '700',
              fontSize: '1.5rem',
              marginTop: '2.5rem',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #E5E7EB',
              letterSpacing: '-0.015em',
            },
            h3: {
              color: '#1F2937',
              fontWeight: '600',
              fontSize: '1.125rem',
              marginTop: '1.75rem',
              marginBottom: '0.75rem',
            },
            a: {
              color: '#1D4ED8',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(29, 78, 216, 0.4)',
              fontWeight: '500',
              '&:hover': {
                color: '#1E40AF',
                borderBottomColor: '#1E40AF',
              },
            },
            code: {
              color: '#1E293B',
              backgroundColor: '#F1F5F9',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            blockquote: {
              borderLeftColor: '#1D4ED8',
              color: '#4B5563',
              fontStyle: 'italic',
            },
            hr: {
              borderColor: '#E5E7EB',
              marginTop: '2.5rem',
              marginBottom: '2.5rem',
            },
          },
        },
        dark: {
          css: {
            color: '#D1D5DB',
            h1: { color: '#F9FAFB' },
            h2: {
              color: '#F9FAFB',
              borderBottomColor: '#1F2937',
            },
            h3: { color: '#F3F4F6' },
            a: {
              color: '#60A5FA',
              borderBottomColor: 'rgba(96, 165, 250, 0.4)',
              '&:hover': {
                color: '#93C5FD',
                borderBottomColor: '#93C5FD',
              },
            },
            code: {
              color: '#E2E8F0',
              backgroundColor: '#1E293B',
            },
            blockquote: {
              borderLeftColor: '#3B82F6',
              color: '#9CA3AF',
            },
            hr: { borderColor: '#1F2937' },
          },
        },
      }),
    },
  },
  plugins: [typographyPlugin],
};
