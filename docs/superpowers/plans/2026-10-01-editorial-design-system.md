# Editorial Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Finance Fundamentals an editorial identity (paper/ink/rust, serif reading, real motion), a reusable component kit, redesigned pages, and a better diagram engine for all 28 chapters.

**Architecture:** Colour/type/motion tokens live in `src/styles/tokens.css` and are mapped into Tailwind. A small kit in `src/components/ui/` and `src/components/mdx/` consumes them. Pure logic (contrast, diagram graph, pan/zoom math, glossary, contents, ticker, filter) lives in `src/lib/` with Vitest tests; DOM/React code stays thin. Pages migrate one at a time, each commit building and deployable.

**Tech Stack:** Astro 5, React 19 islands, MDX, Tailwind 3.4, Framer Motion 13, Mermaid 11, Vitest (new), `@fontsource-variable/fraunces` + `@fontsource-variable/plus-jakarta-sans` (new). Node 22, npm 11.

**Spec:** `docs/superpowers/specs/2026-10-01-editorial-design-system-design.md`

**Deviation from spec:** the glossary lives at `src/data/glossary.json`, not `src/content/glossary.json`, because Astro treats everything under `src/content/` as content-collection territory. Task 5 updates the spec to match.

## Global Constraints

- Branch is `redesign/editorial`. Push to it after every task. **Never push to `main`.**
- `npm run build` must pass at every commit.
- Existing `note.mdx`, `diagram.mmd`, `quiz.json`, `flashcards.json`, `payoff-chart.json` files and the Zod schemas in `src/content/config.ts` are not changed, except one opt-in demo edit to a single note in Task 10.
- No new runtime dependencies except the two `@fontsource-variable/*` packages. Only new dev dependency: `vitest`. Pan/zoom is self-implemented.
- Fonts are self-hosted (no Google Fonts requests).
- All token foreground/background pairs meet WCAG AA (4.5:1) in both light and dark themes, enforced by test.
- Reduced-motion is honoured globally: no animation, content fully visible.
- With JavaScript disabled, all reading content (including `<Hl>` highlights) is visible.
- Touch targets stay at least 44px (`min-h-[44px]`), matching existing convention.
- Commit messages end with: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`

## Review Focus

1. A note with fewer than two `##`/`###` headings must not render an empty "In this note" box (contents rail shows only the practice links). Pinned by Task 10 `contents.test.ts`.
2. A flowchart with a single node, no edges, or edges that only touch subgraphs must still produce a sane walk order (document order) and hide walk controls when fewer than two nodes. Pinned by Task 7 `diagram-graph.test.ts`.
3. `<Term term="typo">` with an unknown glossary key must fail the build loudly, listing known keys. Pinned by Task 5 `glossary.test.ts`.
4. With JS disabled or reduced-motion, highlights, diagram and ticker are visible and static. CSS defaults show the final state; verified manually in Task 13.
5. Toggling dark mode while a diagram is on screen re-themes it without a reload and without replaying the reveal. Verified manually in Task 8 (Step 6); implementation only reacts to a real change of the `dark` class, not any class change.

---

## File Structure

**Create**
- `src/styles/tokens.css` — colour, font, motion CSS variables (light + `.dark`)
- `src/lib/contrast.ts` — WCAG contrast math + tokens.css parser
- `src/lib/glossary.ts` — `lookupTerm`
- `src/lib/diagram-graph.ts` — Mermaid DOM id/class parsing + `computeWalkOrder`
- `src/lib/diagram-theme.ts` — token → Mermaid `themeVariables`
- `src/lib/pan-zoom.ts` — `zoomAt`, `clampTransform`
- `src/lib/contents.ts` — `buildContents`
- `src/lib/ticker.ts` — `buildTickerItems`
- `src/lib/filter.ts` — `matchesFilter`
- `src/data/glossary.json`
- `src/scripts/reveal.ts` — highlighter IntersectionObserver
- `src/components/ui/{Section,Card,Badge,DifficultyBadge,Button}.astro`
- `src/components/ui/{InkProgress,Stamp}.tsx`
- `src/components/mdx/{Hl,Note,Term}.astro`, `src/components/mdx/index.ts`
- `src/components/diagram/{Diagram.tsx,DiagramToolbar.tsx,dom.ts,usePanZoom.ts}`
- `src/components/topic/{ContentsRail,TopicCard}.astro`
- `src/components/home/{Ticker,HeroPayoff,ContinueCard}.astro`
- `src/components/TopicFilter.astro`
- `vitest.config.ts`, `tests/*.test.ts`

**Modify**
`tailwind.config.mjs`, `package.json`, `src/styles/global.css`, `src/lib/motion.ts`, `src/layouts/BaseLayout.astro`, `src/components/ThemeToggle.tsx`, `src/components/Quiz.tsx`, `src/components/Flashcards.tsx`, `src/components/PayoffChart.tsx`, `src/pages/topics/[slug].astro`, `src/pages/index.astro`, `src/pages/topics/index.astro`, `src/pages/categories/index.astro`, `src/pages/categories/[category].astro`, `src/pages/404.astro`, `README.md`

**Delete**
`src/components/ReadingProgress.tsx`, `src/components/MermaidDiagram.tsx`, `src/components/HeroLayeredComposition.tsx`, `src/components/InteractiveFlashcardsPreview.tsx`

---

### Task 1: Tokens, fonts, motion, Tailwind mapping, contrast gate

**Files:**
- Create: `vitest.config.ts`, `src/styles/tokens.css`, `src/lib/contrast.ts`, `tests/contrast.test.ts`, `tests/motion-tokens.test.ts`
- Modify: `package.json`, `tailwind.config.mjs`, `src/lib/motion.ts`

**Interfaces:**
- Produces: CSS variables `--paper --paper-raised --ink --ink-muted --rule --rust --gold --success --danger --on-accent --code-bg --code-fg` (space-separated RGB triplets), `--font-serif --font-sans --font-mono`, `--ease-out --dur-fast --dur-base --dur-slow --dur-ink --dur-stamp`. Tailwind colours `paper, paper-raised, ink, ink-muted, rule, rust, gold, success, danger, on-accent` (all alpha-capable, e.g. `bg-rust/10`). `src/lib/contrast.ts`: `parseTriplet`, `luminance`, `contrastRatio`, `parseTokenBlock`. `src/lib/motion.ts` additions: `DURATION_INK`, `INK_DRAW`, `STAGGER_IN`, `STAMP`.

- [ ] **Step 1: Install dependencies and confirm the baseline builds**

```bash
cd /Users/TonyStark/Desktop/web/finance-fundamentals-learning-site
git checkout redesign/editorial
npm install
npm run build 2>&1 | tail -15
```
Expected: build completes (`Complete!`). If it fails before any change, stop and report; the baseline must be green.

- [ ] **Step 2: Add Vitest and fonts**

```bash
npm install -D vitest
npm install @fontsource-variable/fraunces @fontsource-variable/plus-jakarta-sans
```
Add to `package.json` scripts: `"test": "vitest run"`.

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 3: Write the failing contrast test**

`tests/contrast.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { contrastRatio, parseTokenBlock, parseTriplet } from '../src/lib/contrast';

describe('contrast math', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 1);
  });
  it('identical colours are 1:1', () => {
    expect(contrastRatio([120, 40, 60], [120, 40, 60])).toBeCloseTo(1, 5);
  });
  it('is symmetric', () => {
    const a = contrastRatio([10, 20, 30], [240, 230, 220]);
    const b = contrastRatio([240, 230, 220], [10, 20, 30]);
    expect(a).toBeCloseTo(b, 10);
  });
  it('rejects malformed triplets', () => {
    expect(() => parseTriplet('12 34')).toThrow(/Invalid RGB triplet/);
    expect(() => parseTriplet('12 34 999')).toThrow(/Invalid RGB triplet/);
    expect(() => parseTriplet('a b c')).toThrow(/Invalid RGB triplet/);
  });
});

const css = readFileSync('src/styles/tokens.css', 'utf-8');

const PAIRS: Array<[fg: string, bg: string]> = [
  ['ink', 'paper'],
  ['ink', 'paper-raised'],
  ['ink-muted', 'paper'],
  ['ink-muted', 'paper-raised'],
  ['rust', 'paper'],
  ['rust', 'paper-raised'],
  ['success', 'paper'],
  ['danger', 'paper'],
  ['ink', 'gold'],
  ['on-accent', 'rust'],
  ['on-accent', 'ink'],
  ['code-fg', 'code-bg'],
];

for (const [theme, selector] of [
  ['light', ':root'],
  ['dark', '.dark'],
] as const) {
  describe(`${theme} theme tokens meet WCAG AA`, () => {
    const tokens = parseTokenBlock(css, selector);
    for (const [fg, bg] of PAIRS) {
      it(`${fg} on ${bg} is at least 4.5:1`, () => {
        expect(tokens[fg], `missing token --${fg}`).toBeDefined();
        expect(tokens[bg], `missing token --${bg}`).toBeDefined();
        expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
      });
    }
  });
}
```

`tests/motion-tokens.test.ts` (keeps the JS and CSS motion values in sync):
```ts
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { DURATION_FAST, DURATION_BASE, DURATION_SLOW, DURATION_INK } from '../src/lib/motion';

const css = readFileSync('src/styles/tokens.css', 'utf-8');
const ms = (name: string): number => {
  const m = css.match(new RegExp(`--${name}:\\s*(\\d+)ms`));
  if (!m) throw new Error(`--${name} not found in tokens.css`);
  return Number(m[1]);
};

describe('motion tokens stay in sync between CSS and JS', () => {
  it('fast', () => expect(ms('dur-fast')).toBe(DURATION_FAST * 1000));
  it('base', () => expect(ms('dur-base')).toBe(DURATION_BASE * 1000));
  it('slow', () => expect(ms('dur-slow')).toBe(DURATION_SLOW * 1000));
  it('ink', () => expect(ms('dur-ink')).toBe(DURATION_INK * 1000));
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `../src/lib/contrast` / `src/styles/tokens.css` not found.

- [ ] **Step 5: Implement `src/lib/contrast.ts`**

```ts
export type RGB = [number, number, number];

export function parseTriplet(value: string): RGB {
  const parts = value.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    throw new Error(`Invalid RGB triplet: "${value}"`);
  }
  return parts as RGB;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance([r, g, b]: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Extracts `--name: R G B;` declarations from the top-level rule with the given selector
 * (selector must start a line; indented rules inside @media are ignored).
 */
export function parseTokenBlock(css: string, selector: string): Record<string, RGB> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  if (!block) throw new Error(`Selector not found in tokens.css: ${selector}`);
  const tokens: Record<string, RGB> = {};
  for (const m of block[1].matchAll(/--([a-z-]+):\s*(\d+\s+\d+\s+\d+)\s*;/g)) {
    tokens[m[1]] = parseTriplet(m[2]);
  }
  return tokens;
}
```

- [ ] **Step 6: Create `src/styles/tokens.css`**

```css
/* Design tokens. Colours are space-separated RGB triplets so Tailwind can apply
   alpha (e.g. bg-rust/10). Keep the top-level :root and .dark rules at column 0:
   tests/contrast.test.ts parses them. */

:root {
  --paper: 250 246 239;
  --paper-raised: 255 253 248;
  --ink: 26 23 20;
  --ink-muted: 94 85 75;
  --rule: 227 217 201;
  --rust: 180 71 47;
  --gold: 242 198 107;
  --success: 47 125 79;
  --danger: 180 35 24;
  --on-accent: 255 253 248;
  --code-bg: 31 27 23;
  --code-fg: 241 235 224;

  --font-serif: 'Fraunces Variable', Georgia, 'Times New Roman', serif;
  --font-sans: 'Plus Jakarta Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 150ms;
  --dur-base: 250ms;
  --dur-slow: 450ms;
  --dur-ink: 1400ms;
  --dur-stamp: 380ms;
}

.dark {
  --paper: 18 16 13;
  --paper-raised: 28 24 20;
  --ink: 241 235 224;
  --ink-muted: 181 169 152;
  --rule: 52 46 39;
  --rust: 229 137 111;
  --gold: 110 86 24;
  --success: 95 191 138;
  --danger: 240 121 107;
  --on-accent: 24 20 15;
  --code-bg: 31 27 23;
  --code-fg: 241 235 224;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0s !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: contrast tests PASS. If any pair fails, adjust the failing token value (darken/lighten) until it passes — the test is the source of truth. Motion tests fail until Step 8.

- [ ] **Step 8: Extend `src/lib/motion.ts`**

Append (keep everything already in the file):
```ts
// Named moves. CSS mirrors live in styles/tokens.css (--dur-*, --ease-out);
// tests/motion-tokens.test.ts keeps them in sync.
export const DURATION_INK = 1.4;
export const INK_DRAW = { duration: DURATION_INK, ease: EASE_OUT };
export const STAGGER_IN = { staggerChildren: STAGGER_BASE, delayChildren: 0.05 };
export const STAMP = { type: 'spring' as const, duration: 0.38, bounce: 0.35 };
```

- [ ] **Step 9: Replace `tailwind.config.mjs`**

```js
import typographyPlugin from '@tailwindcss/typography';
import defaultTheme from 'tailwindcss/defaultTheme';

const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', ...defaultTheme.fontFamily.serif],
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        paper: token('paper'),
        'paper-raised': token('paper-raised'),
        ink: token('ink'),
        'ink-muted': token('ink-muted'),
        rule: token('rule'),
        rust: token('rust'),
        gold: token('gold'),
        success: token('success'),
        danger: token('danger'),
        'on-accent': token('on-accent'),
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      typography: () => ({
        DEFAULT: {
          css: {
            maxWidth: '64ch',
            '--tw-prose-body': 'rgb(var(--ink))',
            '--tw-prose-headings': 'rgb(var(--ink))',
            '--tw-prose-lead': 'rgb(var(--ink-muted))',
            '--tw-prose-links': 'rgb(var(--rust))',
            '--tw-prose-bold': 'rgb(var(--ink))',
            '--tw-prose-counters': 'rgb(var(--ink-muted))',
            '--tw-prose-bullets': 'rgb(var(--rust))',
            '--tw-prose-hr': 'rgb(var(--rule))',
            '--tw-prose-quotes': 'rgb(var(--ink))',
            '--tw-prose-quote-borders': 'rgb(var(--rust))',
            '--tw-prose-captions': 'rgb(var(--ink-muted))',
            '--tw-prose-code': 'rgb(var(--ink))',
            '--tw-prose-pre-code': 'rgb(var(--code-fg))',
            '--tw-prose-pre-bg': 'rgb(var(--code-bg))',
            '--tw-prose-th-borders': 'rgb(var(--rule))',
            '--tw-prose-td-borders': 'rgb(var(--rule))',
          },
        },
      }),
    },
  },
  plugins: [typographyPlugin],
};
```

- [ ] **Step 10: Verify build and commit**

```bash
npm test && npm run build 2>&1 | tail -5
git add -A
git commit -m "feat(design): add colour/type/motion tokens, tailwind mapping and contrast gate

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -u origin redesign/editorial
```
Expected: tests pass, build completes, push succeeds.

---

### Task 2: Site shell on tokens (BaseLayout, ThemeToggle)

**Files:**
- Modify: `src/layouts/BaseLayout.astro`, `src/components/ThemeToggle.tsx`, `src/styles/global.css`

**Interfaces:**
- Consumes: Task 1 tokens and Tailwind colours.
- Produces: `BaseLayout` with the same props (`title`, `description`, `image`, `article`); every page now gets paper background, tokens, self-hosted fonts.

- [ ] **Step 1: Replace the base layer of `src/styles/global.css`**

Replace everything from the top of the file through the `.perspective-1000` and `@font-face` blocks (i.e. everything above the `MAGAZINE-GRADE PROSE` comment) with:
```css
@import 'katex/dist/katex.min.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    @apply bg-paper text-ink antialiased font-sans;
  }

  :focus-visible {
    @apply outline-none ring-2 ring-rust ring-offset-2 ring-offset-paper;
  }

  ::selection {
    background: rgb(var(--gold) / 0.6);
  }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.katex-display {
  @apply my-8 overflow-x-auto p-6 bg-paper-raised rounded-xl border border-rule text-center;
}

.katex {
  font-size: 1.1em;
}

.perspective-1000 {
  perspective: 1000px;
}
```
Leave the prose section below untouched for now (Task 4 replaces it).

- [ ] **Step 2: Rewrite `src/layouts/BaseLayout.astro`**

```astro
---
import '@fontsource-variable/fraunces';
import '@fontsource-variable/plus-jakarta-sans';
import '../styles/tokens.css';
import '../styles/global.css';
import ThemeToggle from '../components/ThemeToggle';
import { ClientRouter } from 'astro:transitions';

interface Props {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
}

const {
  title = "Personal Finance Fundamentals",
  description = "Simple explanations. Structured practice. Only what matters.",
  image = "/og-image.png",
  article = false
} = Astro.props;

const pathname = Astro.url.pathname;
const siteUrl = "https://finance-fundamentals-learning-site.vercel.app";
const canonicalUrl = new URL(pathname, siteUrl).href;
const fullImageUrl = new URL(image, siteUrl).href;

const navLinks = [
  { href: '/', label: 'Home', active: pathname === '/' },
  { href: '/topics', label: 'Notes', active: pathname.startsWith('/topics') },
  { href: '/categories', label: 'Categories', active: pathname.startsWith('/categories') },
];
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | Finance Fundamentals</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />

    <meta property="og:type" content={article ? "article" : "website"} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:title" content={`${title} | Finance Fundamentals`} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={fullImageUrl} />
    <meta property="og:site_name" content="Finance Fundamentals" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content={canonicalUrl} />
    <meta name="twitter:title" content={`${title} | Finance Fundamentals`} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={fullImageUrl} />

    <ClientRouter />

    <script is:inline>
      (function () {
        function apply() {
          var theme = null;
          try { theme = localStorage.getItem('theme'); } catch (e) {}
          var dark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
          document.documentElement.classList.toggle('dark', dark);
        }
        apply();
        document.addEventListener('astro:after-swap', apply);
      })();
    </script>
  </head>
  <body class="min-h-screen flex flex-col">

    <header id="site-header" class="sticky top-0 z-50 border-b border-rule bg-paper/95 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">

        <a href="/" class="group flex items-center gap-3 min-h-[44px]" aria-label="Finance Fundamentals Home">
          <span class="flex h-9 w-9 items-center justify-center rounded-md bg-rust font-serif text-xl font-semibold text-on-accent" aria-hidden="true">F</span>
          <span class="font-serif text-xl font-semibold tracking-tight text-ink">Finance <span class="font-normal text-ink-muted">Fundamentals</span></span>
        </a>

        <nav class="hidden md:flex items-center gap-7 font-sans text-sm font-semibold" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              href={link.href}
              aria-current={link.active ? 'page' : undefined}
              class:list={[
                'inline-flex min-h-[44px] items-center border-b-2 transition-colors',
                link.active ? 'border-rust text-ink' : 'border-transparent text-ink-muted hover:text-ink',
              ]}
            >{link.label}</a>
          ))}
        </nav>

        <div class="flex items-center gap-3">
          <ThemeToggle client:load />
          <a
            href="/topics"
            class="hidden sm:inline-flex min-h-[44px] items-center rounded-full bg-ink px-5 font-sans text-xs font-bold text-on-accent transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >Start learning</a>
          <button
            id="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded="false"
            aria-controls="mobile-nav-menu"
            class="md:hidden flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-rule bg-paper-raised text-ink"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div id="mobile-nav-menu" class="hidden md:hidden border-t border-rule bg-paper px-4 py-4">
        <nav class="flex flex-col gap-1 font-sans text-base font-semibold" aria-label="Mobile Navigation">
          {navLinks.map((link) => (
            <a href={link.href} class="flex min-h-[44px] items-center rounded-lg px-3 text-ink hover:bg-paper-raised">{link.label}</a>
          ))}
        </nav>
      </div>
    </header>

    <main id="main" class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 md:py-12">
      <slot />
    </main>

    <footer class="mt-16 border-t border-rule bg-paper-raised py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p class="font-serif text-lg font-semibold text-ink">Finance Fundamentals</p>
          <p class="font-sans text-sm text-ink-muted">Simple explanations. Structured practice. Only what matters.</p>
        </div>
        <nav class="flex gap-6 font-sans text-sm font-semibold text-ink-muted" aria-label="Footer">
          {navLinks.map((link) => (
            <a href={link.href} class="flex min-h-[44px] items-center hover:text-ink">{link.label}</a>
          ))}
        </nav>
      </div>
    </footer>

    <script is:inline>
      var btn = document.getElementById('mobile-menu-toggle');
      var menu = document.getElementById('mobile-nav-menu');
      if (btn && menu) {
        btn.addEventListener('click', function () {
          var expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!expanded));
          menu.classList.toggle('hidden');
        });
      }
    </script>
  </body>
</html>
```
Note: `BaseLayout` owns the single `<main>` landmark. The existing `[slug].astro` also renders a `<main>`; Task 10's rewrite removes it (a page must have only one).

- [ ] **Step 3: Restyle `ThemeToggle.tsx`**

Change three class strings (logic untouched):
- Button `className` (line 35) → `"min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full border border-rule bg-paper-raised text-ink hover:border-ink/40 transition-colors flex items-center justify-center gap-2 font-sans text-xs font-bold"`
- Sun svg `text-amber-400` → `text-rust`
- Moon svg `text-slate-700` → `text-ink`

- [ ] **Step 4: Verify**

```bash
npm test && npm run build 2>&1 | tail -5
npm run dev
```
Open `http://localhost:4321/`, `/topics`, `/topics/time-value-of-money`. Expected: warm paper background, serif wordmark, rust "F" badge, working nav (current page underlined in rust), theme toggle switches to the dark ink palette and back, mobile menu opens at narrow width. Inner pages still have their old blue cards (migrated later) — that is expected. Toggle the theme, navigate to another page via a link, and confirm the theme does not reset (`astro:after-swap` handler).

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat(design): move site shell and theme toggle onto tokens

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 3: UI primitives

**Files:**
- Create: `src/components/ui/{Section,Card,Badge,DifficultyBadge,Button}.astro`

**Interfaces:**
- Produces:
  - `Section` props `{ id?, eyebrow?, title?, class? }` + default slot
  - `Card` props `{ href?, class?, ...rest attrs }` + slot (renders `<a>` if `href`, else `<div>`; forwards extra attributes such as `data-*`)
  - `Badge` props `{ tone?: 'neutral'|'rust'|'success'|'danger'|'gold' }` + slot
  - `DifficultyBadge` props `{ difficulty: string }`
  - `Button` props `{ href?, variant?: 'primary'|'accent'|'ghost', class?, ...rest }` + slot

- [ ] **Step 1: `Section.astro`**

```astro
---
interface Props {
  id?: string;
  eyebrow?: string;
  title?: string;
  class?: string;
}
const { id, eyebrow, title, class: className = '' } = Astro.props;
---
<section id={id} class:list={['relative scroll-mt-28', className]}>
  {(eyebrow || title) && (
    <header class="mb-6">
      {eyebrow && <p class="font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">{eyebrow}</p>}
      {title && <h2 class="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h2>}
    </header>
  )}
  <slot />
</section>
```

- [ ] **Step 2: `Card.astro`**

```astro
---
interface Props {
  href?: string;
  class?: string;
  [attr: string]: unknown;
}
const { href, class: className = '', ...rest } = Astro.props;
const Tag = href ? 'a' : 'div';
---
<Tag
  href={href}
  {...rest}
  class:list={[
    'block rounded-2xl border border-rule bg-paper-raised p-6 transition-[transform,box-shadow,border-color] duration-200',
    href && 'hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-[0_14px_32px_-20px_rgb(var(--ink)/0.5)]',
    className,
  ]}
>
  <slot />
</Tag>
```

- [ ] **Step 3: `Badge.astro` and `DifficultyBadge.astro`**

`Badge.astro`:
```astro
---
interface Props { tone?: 'neutral' | 'rust' | 'success' | 'danger' | 'gold'; class?: string }
const { tone = 'neutral', class: className = '' } = Astro.props;
const tones = {
  neutral: 'border-rule text-ink-muted',
  rust: 'border-rust/40 text-rust',
  success: 'border-success/40 text-success',
  danger: 'border-danger/40 text-danger',
  gold: 'border-transparent bg-gold text-ink',
};
---
<span class:list={['inline-flex items-center rounded-full border px-3 py-0.5 font-sans text-xs font-bold capitalize', tones[tone], className]}>
  <slot />
</span>
```

`DifficultyBadge.astro`:
```astro
---
import Badge from './Badge.astro';
interface Props { difficulty: string }
const { difficulty } = Astro.props;
const tone = difficulty === 'beginner' ? 'success' : difficulty === 'intermediate' ? 'gold' : difficulty === 'advanced' ? 'danger' : 'neutral';
---
<Badge tone={tone}>{difficulty}</Badge>
```

- [ ] **Step 4: `Button.astro`**

```astro
---
interface Props {
  href?: string;
  variant?: 'primary' | 'accent' | 'ghost';
  class?: string;
  [attr: string]: unknown;
}
const { href, variant = 'primary', class: className = '', ...rest } = Astro.props;
const Tag = href ? 'a' : 'button';
const variants = {
  primary: 'bg-ink text-on-accent border-transparent',
  accent: 'bg-rust text-on-accent border-transparent',
  ghost: 'bg-transparent text-ink border-rule hover:border-ink/40',
};
---
<Tag
  href={href}
  {...rest}
  class:list={[
    'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-6 font-sans text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]',
    variants[variant],
    className,
  ]}
>
  <slot />
</Tag>
```

- [ ] **Step 5: Verify and commit**

```bash
npm run build 2>&1 | tail -5
git add -A
git commit -m "feat(ui): add Section, Card, Badge, DifficultyBadge, Button primitives

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```
Expected: build passes (primitives are exercised by later tasks).

---

### Task 4: Prose theme, drop cap, InkProgress

**Files:**
- Modify: `src/styles/global.css` (replace the prose section)
- Create: `src/components/ui/InkProgress.tsx`
- Delete: `src/components/ReadingProgress.tsx`
- Modify: `src/pages/topics/[slug].astro` (swap the progress import only)

**Interfaces:**
- Produces: `InkProgress` (named export, no props). `.prose` styling reading tokens, drop cap on the first paragraph (automatic for all notes).

- [ ] **Step 1: Replace the prose section of `global.css`**

Delete everything from the `MAGAZINE-GRADE PROSE & MDX TYPOGRAPHY STYLING` comment to the end of the file and append:
```css
/* ==========================================================================
   EDITORIAL PROSE — all colours come from tokens, so dark mode is automatic
   ========================================================================== */

.prose {
  font-family: var(--font-serif);
  color: rgb(var(--ink));
}

.prose p {
  @apply my-5 text-lg leading-[1.75];
}

/* Drop cap. Skipped when the paragraph opens with maths. */
.prose > p:first-of-type:not(:has(.katex))::first-letter {
  float: left;
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 4.2em;
  line-height: 0.82;
  padding: 0.06em 0.12em 0 0;
  color: rgb(var(--rust));
}

.prose h2 {
  @apply mt-14 mb-5 border-b border-rule pb-2 text-3xl font-semibold tracking-tight;
  font-family: var(--font-serif);
}

.prose h3 {
  @apply mt-9 mb-3 text-2xl font-semibold tracking-tight;
  font-family: var(--font-serif);
}

.prose strong,
.prose b {
  @apply font-semibold text-ink;
}

.prose a {
  @apply text-rust underline underline-offset-4 decoration-rust/40 hover:decoration-rust;
}

.prose ul,
.prose ol {
  @apply my-6 space-y-2 text-lg leading-[1.7];
}

.prose li::marker {
  color: rgb(var(--rust));
}

.prose blockquote {
  @apply my-8 border-l-[3px] border-rust bg-paper-raised py-4 pl-6 pr-5 not-italic;
  font-style: italic;
}

.prose blockquote p {
  @apply my-0;
}

.prose pre {
  @apply my-8 overflow-x-auto rounded-xl p-6 font-mono text-sm leading-relaxed;
  background: rgb(var(--code-bg));
  color: rgb(var(--code-fg));
}

.prose pre code {
  @apply bg-transparent p-0 font-mono text-sm;
  color: inherit;
  border: 0;
}

.prose :not(pre) > code {
  @apply rounded border border-rule bg-paper-raised px-1.5 py-0.5 font-mono text-[0.85em] font-medium;
}

.prose table {
  @apply my-8 w-full border-collapse text-base;
  font-family: var(--font-sans);
}

.prose th {
  @apply border-b-2 border-ink bg-paper-raised px-3 py-2 text-left font-bold;
}

.prose td {
  @apply border-b border-rule px-3 py-2;
}
```

- [ ] **Step 2: Create `src/components/ui/InkProgress.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { getReducedMotion } from '../../lib/motion';

export const InkProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  const [reduced, setReduced] = useState(false);

  useEffect(() => setReduced(getReducedMotion()), []);

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left bg-rust"
      style={{ scaleX }}
    />
  );
};

export default InkProgress;
```

- [ ] **Step 3: Swap it into the topic page and delete the old component**

In `src/pages/topics/[slug].astro`: replace `import ReadingProgress from '../../components/ReadingProgress';` with `import { InkProgress } from '../../components/ui/InkProgress';` and `<ReadingProgress client:load />` with `<InkProgress client:load />`. Also remove `dark:prose-invert` from the `<div class="prose dark:prose-invert max-w-none">` (tokens handle dark mode; `prose-invert` would override them).
```bash
git rm src/components/ReadingProgress.tsx
```

- [ ] **Step 4: Verify**

```bash
npm test && npm run build 2>&1 | tail -5
npm run dev
```
Open `/topics/time-value-of-money` and `/topics/options-basics-moneyness` in light and dark. Expected: serif body text, rust drop cap on the first paragraph, gold text-selection, rust progress line at the top while scrolling, tables/code blocks styled, nothing unreadable in dark. Eyeball the first paragraph of 3 other notes (`hedge-funds`, `natural-resources`, `futures-payoff-charts`) to confirm the drop cap looks right (skipped automatically if the paragraph opens with maths).

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat(design): editorial prose theme, automatic drop cap, InkProgress

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 5: Glossary and MDX components (`Hl`, `Note`, `Term`)

**Files:**
- Create: `src/data/glossary.json`, `src/lib/glossary.ts`, `tests/glossary.test.ts`, `src/components/mdx/{Hl,Note,Term}.astro`, `src/components/mdx/index.ts`, `src/scripts/reveal.ts`
- Modify: `src/styles/global.css` (append component CSS), `docs/superpowers/specs/2026-10-01-editorial-design-system-design.md` (glossary path)

**Interfaces:**
- Produces: `lookupTerm(glossary: Glossary, key: string): GlossaryEntry` (throws on unknown key); `type Glossary = Record<string, GlossaryEntry>`; `mdxComponents = { Hl, Note, Term }`; `initHighlights(root?: ParentNode): void` in `src/scripts/reveal.ts`.

- [ ] **Step 1: Write the failing glossary test**

`tests/glossary.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { lookupTerm, type Glossary } from '../src/lib/glossary';

const glossary: Glossary = {
  delta: { term: 'Delta', definition: 'Change in option price per unit change in the underlying.' },
  theta: { term: 'Theta', definition: 'Time decay of an option.' },
};

describe('lookupTerm', () => {
  it('returns the entry for a known key', () => {
    expect(lookupTerm(glossary, 'delta').term).toBe('Delta');
  });

  it('throws a loud, helpful error for an unknown key', () => {
    expect(() => lookupTerm(glossary, 'deltaa')).toThrow(/Unknown glossary term "deltaa"/);
    expect(() => lookupTerm(glossary, 'deltaa')).toThrow(/delta, theta/);
  });

  it('does not treat inherited object properties as terms', () => {
    expect(() => lookupTerm(glossary, 'constructor')).toThrow(/Unknown glossary term/);
  });
});
```
Run: `npm test` → Expected FAIL (module missing).

- [ ] **Step 2: Implement `src/lib/glossary.ts`**

```ts
export interface GlossaryEntry {
  term: string;
  definition: string;
}

export type Glossary = Record<string, GlossaryEntry>;

export function lookupTerm(glossary: Glossary, key: string): GlossaryEntry {
  const entry = Object.prototype.hasOwnProperty.call(glossary, key) ? glossary[key] : undefined;
  if (!entry) {
    const known = Object.keys(glossary).sort().join(', ');
    throw new Error(`[Content Validation Error] Unknown glossary term "${key}". Known terms: ${known}`);
  }
  return entry;
}
```
Run: `npm test` → glossary tests PASS.

- [ ] **Step 3: Seed `src/data/glossary.json`**

```json
{
  "delta": { "term": "Delta", "definition": "How much an option's price changes for a one-unit move in the underlying. Roughly 0 to 1 for calls, -1 to 0 for puts." },
  "gamma": { "term": "Gamma", "definition": "How fast delta itself changes as the underlying moves. Highest for at-the-money options near expiry." },
  "theta": { "term": "Theta", "definition": "The daily loss in an option's value from the passage of time, all else equal." },
  "vega": { "term": "Vega", "definition": "How much an option's price changes for a one-point change in implied volatility." },
  "moneyness": { "term": "Moneyness", "definition": "Whether an option is in, at, or out of the money: the relationship between spot price and strike price." },
  "mark-to-market": { "term": "Mark-to-market", "definition": "Daily revaluation of a futures position to the settlement price, with gains and losses settled in cash." },
  "open-interest": { "term": "Open interest", "definition": "The total number of outstanding derivative contracts that have not yet been closed or settled." },
  "basis": { "term": "Basis", "definition": "The difference between the spot price of an asset and the price of its futures contract." },
  "margin": { "term": "Margin", "definition": "Collateral a trader posts to cover potential losses on a derivatives position." },
  "hedging": { "term": "Hedging", "definition": "Taking an offsetting position to reduce exposure to adverse price moves." }
}
```

- [ ] **Step 4: Create the MDX components**

`src/components/mdx/Hl.astro`:
```astro
---
---
<mark class="hl"><slot /></mark>
```

`src/components/mdx/Note.astro`:
```astro
---
---
<aside class="note" role="note"><slot /></aside>
```

`src/components/mdx/Term.astro`:
```astro
---
import glossary from '../../data/glossary.json';
import { lookupTerm, type Glossary } from '../../lib/glossary';

interface Props { term: string }
const { term } = Astro.props;
const entry = lookupTerm(glossary as Glossary, term);
const tipId = `tip-${term}-${Math.random().toString(36).slice(2, 8)}`;
---
<span class="term" tabindex="0" aria-describedby={tipId}><slot /><span id={tipId} role="tooltip" class="term-tip"><strong>{entry.term}.</strong> {entry.definition}</span></span>
```

`src/components/mdx/index.ts`:
```ts
import Hl from './Hl.astro';
import Note from './Note.astro';
import Term from './Term.astro';

export const mdxComponents = { Hl, Note, Term };
```

- [ ] **Step 5: Highlighter reveal script**

`src/scripts/reveal.ts`:
```ts
/**
 * Arms `.hl` highlights so they sweep in as they scroll into view.
 * Default CSS shows them fully highlighted; this only adds the animation, so
 * no-JS and reduced-motion users see the final state.
 */
export function initHighlights(root: ParentNode = document): void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('.hl'));
  if (els.length === 0) return;
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('hl-armed');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-on');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => observer.observe(el));
}
```

- [ ] **Step 6: Append component CSS to `global.css`**

```css
/* ---- MDX components ---- */
.hl {
  color: inherit;
  padding: 0 0.1em;
  background: linear-gradient(rgb(var(--gold)), rgb(var(--gold))) no-repeat 0 88% / 100% 40%;
  transition: background-size var(--dur-slow) var(--ease-out);
}
.hl-armed .hl:not(.is-on) {
  background-size: 0% 40%;
}

.term {
  position: relative;
  cursor: help;
  border-bottom: 1px dotted rgb(var(--rust));
}
.term-tip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 20;
  width: max-content;
  max-width: min(16rem, 80vw);
  transform: translateX(-50%) translateY(4px);
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  background: rgb(var(--ink));
  color: rgb(var(--paper));
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  line-height: 1.45;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--dur-fast), transform var(--dur-fast);
}
.term:hover .term-tip,
.term:focus .term-tip,
.term:focus-within .term-tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.note {
  margin: 1.5rem 0;
  border-left: 2px solid rgb(var(--rust));
  background: rgb(var(--paper-raised));
  padding: 0.75rem 1rem;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  line-height: 1.55;
  color: rgb(var(--ink-muted));
}
@media (min-width: 1280px) {
  .note {
    float: right;
    clear: right;
    width: 13rem;
    margin: 0 -15rem 1rem 1.5rem;
    background: transparent;
    padding: 0 0 0 0.75rem;
    font-size: 0.8125rem;
  }
}
```

- [ ] **Step 7: Update the spec's glossary path**

In the spec, change `src/content/glossary.json` to `src/data/glossary.json` (both mentions: the `<Term>` bullet in section 2) and add one line: "Stored under `src/data/` because Astro reserves `src/content/` for collections."

- [ ] **Step 8: Verify and commit**

```bash
npm test && npm run build 2>&1 | tail -5
git add -A
git commit -m "feat(mdx): glossary, Hl, Note and Term components with opt-in registration

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```
Visual verification of these components happens in Task 10 (they are wired into the topic page there).

---

### Task 6: Stamp, paper Flashcards, restyled Quiz

**Files:**
- Create: `src/components/ui/Stamp.tsx`
- Modify (full rewrite, same props and logic): `src/components/Flashcards.tsx`, `src/components/Quiz.tsx`

**Interfaces:**
- Produces: `Stamp` props `{ variant: 'correct'|'incorrect'|'complete'; label?: string; className?: string }`. `Flashcards` props `{ cards: FlashcardItem[] }` and `Quiz` props `{ questions: QuizItem[] }` unchanged. Behaviour fix: flashcard keyboard shortcuts now only fire while the deck has focus (previously Space was hijacked page-wide).

- [ ] **Step 1: `Stamp.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { STAMP, getReducedMotion } from '../../lib/motion';

export type StampVariant = 'correct' | 'incorrect' | 'complete';

const LABEL: Record<StampVariant, string> = { correct: 'Correct', incorrect: 'Review', complete: 'Complete' };
const TONE: Record<StampVariant, string> = {
  correct: 'border-success text-success',
  incorrect: 'border-danger text-danger',
  complete: 'border-rust text-rust',
};

interface StampProps {
  variant: StampVariant;
  label?: string;
  className?: string;
}

export const Stamp: React.FC<StampProps> = ({ variant, label, className = '' }) => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(getReducedMotion()), []);

  return (
    <motion.span
      role="status"
      initial={reduced ? false : { opacity: 0, scale: 2.2, rotate: -14 }}
      animate={{ opacity: 1, scale: 1, rotate: -6 }}
      transition={STAMP}
      className={`inline-block select-none rounded border-[3px] px-2.5 py-0.5 font-sans text-sm font-extrabold uppercase tracking-[0.14em] ${TONE[variant]} ${className}`}
    >
      {label ?? LABEL[variant]}
    </motion.span>
  );
};

export default Stamp;
```

- [ ] **Step 2: Rewrite `Flashcards.tsx`**

```tsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlashcardItem } from '../content/config';
import { EASE_OUT, DURATION_BASE, DURATION_FAST, SPRING_FLIP, getReducedMotion } from '../lib/motion';
import { Stamp } from './ui/Stamp';

interface FlashcardsProps {
  cards: FlashcardItem[];
}

export const Flashcards: React.FC<FlashcardsProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasCompletedDeck, setHasCompletedDeck] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);
  const isReduced = getReducedMotion();

  if (!cards || cards.length === 0) {
    return <div className="p-4 text-ink-muted">No flashcards available for this topic.</div>;
  }

  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  const go = (next: number) => {
    setIsFlipped(false);
    setCurrentIndex(next);
  };
  const handlePrev = () => go(currentIndex > 0 ? currentIndex - 1 : cards.length - 1);
  const handleNext = () => go(currentIndex < cards.length - 1 ? currentIndex + 1 : 0);
  const handleFlip = () => {
    const next = !isFlipped;
    setIsFlipped(next);
    if (next && currentIndex === cards.length - 1) setHasCompletedDeck(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      handleFlip();
    } else if (e.code === 'ArrowRight') {
      handleNext();
    } else if (e.code === 'ArrowLeft') {
      handlePrev();
    }
  };

  return (
    <div
      ref={deckRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label="Flashcard deck. Press space to flip, left and right arrows to move."
      className="mx-auto max-w-2xl rounded-2xl border border-rule bg-paper p-5 outline-none focus-visible:ring-2 focus-visible:ring-rust md:p-8"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
          Space to flip · ← → to move
        </span>
        <span className="font-mono text-xs font-semibold text-ink">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      <div className="mb-8 h-[3px] w-full overflow-hidden rounded-full bg-rule">
        <motion.div
          className="h-full bg-rust"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
        />
      </div>

      {/* Paper stack */}
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-0 translate-y-2.5 -rotate-2 rounded-xl border border-rule bg-paper-raised" />
        <div aria-hidden="true" className="absolute inset-0 translate-y-1 rotate-1 rounded-xl border border-rule bg-paper-raised" />

        <div className="perspective-1000 relative min-h-[260px] cursor-pointer" onClick={handleFlip}>
          <motion.div
            className="relative min-h-[260px] w-full select-none"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            whileTap={!isReduced ? { scale: 0.985 } : undefined}
            transition={isReduced ? { duration: 0.05, ease: EASE_OUT } : SPRING_FLIP}
          >
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-rule bg-paper-raised p-8 text-center shadow-sm md:p-12"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">Question</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={currentIndex}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
                  className="font-serif text-2xl font-medium leading-snug text-ink"
                >
                  {currentCard.front}
                </motion.p>
              </AnimatePresence>
              <span className="mt-5 font-sans text-xs text-ink-muted">Tap to reveal the answer</span>
            </div>

            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-rust/50 bg-paper p-8 text-center shadow-sm md:p-12"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <span className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">Answer</span>
              <p className="font-serif text-xl leading-relaxed text-ink md:text-2xl">{currentCard.back}</p>
              <span className="mt-5 font-sans text-xs text-ink-muted">Tap to see the question</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <motion.button
          onClick={handlePrev}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: DURATION_FAST }}
          className="min-h-[44px] rounded-full border border-rule bg-paper-raised px-5 font-sans text-sm font-bold text-ink hover:border-ink/40"
        >
          ← Previous
        </motion.button>
        <motion.button
          onClick={handleFlip}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: DURATION_FAST }}
          className="min-h-[44px] rounded-full bg-rust px-6 font-sans text-sm font-bold text-on-accent"
        >
          {isFlipped ? 'Show question' : 'Reveal answer'}
        </motion.button>
        <motion.button
          onClick={handleNext}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: DURATION_FAST }}
          className="min-h-[44px] rounded-full border border-rule bg-paper-raised px-5 font-sans text-sm font-bold text-ink hover:border-ink/40"
        >
          Next →
        </motion.button>
      </div>

      {hasCompletedDeck && (
        <div className="mt-6 flex justify-center">
          <Stamp variant="complete" label="Deck complete" />
        </div>
      )}
    </div>
  );
};

export default Flashcards;
```

- [ ] **Step 3: Rewrite `Quiz.tsx`** (logic identical to the current file; only markup/classes change, plus `Stamp`)

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizItem } from '../content/config';
import { EASE_OUT, DURATION_BASE, DURATION_FAST, getReducedMotion } from '../lib/motion';
import { Stamp } from './ui/Stamp';

interface QuizProps {
  questions: QuizItem[];
}

export const Quiz: React.FC<QuizProps> = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(
    new Array(questions ? questions.length : 0).fill(null),
  );
  const [isComplete, setIsComplete] = useState(false);
  const isReduced = getReducedMotion();

  if (!questions || questions.length === 0) {
    return <div className="p-4 text-ink-muted">No quiz questions available for this topic.</div>;
  }

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    setIsAnswered(true);
    const updated = [...userAnswers];
    updated[currentIndex] = selectedOption;
    setUserAnswers(updated);
    if (selectedOption === currentQ.correctIndex) setScore((prev) => prev + 1);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setUserAnswers(new Array(questions.length).fill(null));
    setIsComplete(false);
  };

  const shell = 'mx-auto max-w-2xl overflow-hidden rounded-2xl border border-rule bg-paper-raised p-6 md:p-10';

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className={shell}>
        <div className="mb-2 flex items-center justify-between gap-4">
          <h3 className="font-serif text-3xl font-semibold text-ink">Quiz summary</h3>
          {percentage >= 70 && <Stamp variant="complete" label="Well done" />}
        </div>
        <p className="mb-8 font-sans text-lg text-ink-muted">
          Final score: <span className="font-bold text-rust">{score}</span> / {questions.length} ({percentage}%)
        </p>

        <div className="mb-8 space-y-4">
          {questions.map((q, idx) => {
            const userAnswer = userAnswers[idx];
            const isCorrect = userAnswer === q.correctIndex;
            return (
              <div
                key={idx}
                className={`rounded-xl border p-5 ${isCorrect ? 'border-success/50 bg-success/10' : 'border-danger/50 bg-danger/10'}`}
              >
                <p className="mb-1 font-serif text-lg font-semibold text-ink">
                  Q{idx + 1}: {q.question}
                </p>
                <p className="font-sans text-sm text-ink">
                  Your choice:{' '}
                  <span className={`font-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
                    {userAnswer !== null ? q.options[userAnswer] : 'None'}
                  </span>
                </p>
                {!isCorrect && (
                  <p className="font-sans text-sm text-ink">
                    Correct: <span className="font-bold text-success">{q.options[q.correctIndex]}</span>
                  </p>
                )}
                <p className="mt-2 border-t border-rule pt-2 font-sans text-sm italic text-ink-muted">{q.explanation}</p>
              </div>
            );
          })}
        </div>

        <motion.button
          onClick={handleRestart}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: DURATION_FAST }}
          className="min-h-[44px] rounded-full bg-rust px-6 font-sans text-sm font-bold text-on-accent"
        >
          Restart question bank
        </motion.button>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="font-mono text-xs font-semibold text-rust">Score: {score}</span>
      </div>

      <div className="mb-8 h-[3px] w-full overflow-hidden rounded-full bg-rule">
        <motion.div
          className="h-full bg-rust"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={isReduced ? { opacity: 0 } : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={isReduced ? { opacity: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
        >
          <h3 className="mb-6 font-serif text-2xl font-semibold leading-snug text-ink">{currentQ.question}</h3>

          <div className="mb-8 space-y-3">
            {currentQ.options.map((option, idx) => {
              let state: string;
              if (!isAnswered) {
                state =
                  selectedOption === idx
                    ? 'border-ink bg-paper ring-2 ring-rust/40 font-semibold'
                    : 'border-rule bg-paper hover:border-ink/40';
              } else if (idx === currentQ.correctIndex) {
                state = 'border-success bg-success/10 font-semibold';
              } else if (selectedOption === idx) {
                state = 'border-danger bg-danger/10 font-semibold';
              } else {
                state = 'border-rule bg-paper opacity-50';
              }
              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  whileTap={!isAnswered && !isReduced ? { scale: 0.99 } : undefined}
                  transition={{ duration: DURATION_FAST }}
                  className={`flex min-h-[44px] w-full items-baseline rounded-xl border p-4 text-left font-sans text-base text-ink transition-colors ${state}`}
                >
                  <span className="mr-3 inline-block w-6 font-bold text-ink-muted">{String.fromCharCode(65 + idx)}.</span>
                  <span>{option}</span>
                </motion.button>
              );
            })}
          </div>

          {!isAnswered ? (
            <motion.button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              whileTap={selectedOption !== null && !isReduced ? { scale: 0.98 } : undefined}
              transition={{ duration: DURATION_FAST }}
              className={`min-h-[44px] rounded-full px-7 font-sans text-sm font-bold ${
                selectedOption !== null ? 'bg-rust text-on-accent' : 'cursor-not-allowed bg-rule text-ink-muted'
              }`}
            >
              Submit answer
            </motion.button>
          ) : (
            <div className="space-y-5">
              <motion.div
                initial={isReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
                className={`rounded-xl border p-5 ${
                  selectedOption === currentQ.correctIndex ? 'border-success/50 bg-success/10' : 'border-danger/50 bg-danger/10'
                }`}
              >
                <div className="mb-2">
                  <Stamp variant={selectedOption === currentQ.correctIndex ? 'correct' : 'incorrect'} />
                </div>
                <p className="font-sans text-sm leading-relaxed text-ink">{currentQ.explanation}</p>
              </motion.div>

              <motion.button
                onClick={handleNextQuestion}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: DURATION_FAST }}
                className="min-h-[44px] rounded-full bg-rust px-7 font-sans text-sm font-bold text-on-accent"
              >
                {currentIndex < questions.length - 1 ? 'Next question →' : 'View score →'}
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
```

- [ ] **Step 4: Verify**

```bash
npm test && npm run build 2>&1 | tail -5
npm run dev
```
On `/topics/time-value-of-money`: flashcards look like a stack of paper cards and flip; focusing the deck (Tab or click) enables Space/arrows, while pressing Space elsewhere on the page scrolls normally; reaching the last card and flipping shows the "Deck complete" stamp. In the quiz, answering correctly stamps "Correct", wrong stamps "Review", finishing with ≥70% stamps "Well done". Check light and dark.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat(practice): paper flashcards, stamped quiz feedback, scoped keyboard shortcuts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 7: Diagram graph logic (pure, tested)

**Files:**
- Create: `src/lib/diagram-graph.ts`, `src/lib/diagram-theme.ts`, `tests/diagram-graph.test.ts`, `tests/diagram-theme.test.ts`

**Interfaces:**
- Produces:
  - `type GraphEdge = { from: string; to: string }`
  - `parseNodeId(domId: string): string | null` — `'flowchart-T0-0'` → `'T0'`
  - `parseEdgeClasses(classNames: string[]): GraphEdge | null` — reads `LS-<from>` / `LE-<to>`
  - `computeWalkOrder(nodeIds: string[], edges: GraphEdge[]): string[]` — every node exactly once, BFS from sources, cycles/leftovers in document order
  - `tripletToHex(triplet: string): string`; `type ThemeTokens`; `THEME_TOKEN_NAMES`; `buildThemeVariables(t: ThemeTokens): Record<string, string>`

- [ ] **Step 1: Write the failing tests**

`tests/diagram-graph.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseNodeId, parseEdgeClasses, computeWalkOrder } from '../src/lib/diagram-graph';

describe('parseNodeId', () => {
  it('extracts the Mermaid node id', () => {
    expect(parseNodeId('flowchart-T0-0')).toBe('T0');
    expect(parseNodeId('flowchart-My-Node-3')).toBe('My-Node');
  });
  it('returns null for non-node ids', () => {
    expect(parseNodeId('cluster-x')).toBeNull();
    expect(parseNodeId('')).toBeNull();
  });
});

describe('parseEdgeClasses', () => {
  it('reads LS- and LE- classes', () => {
    expect(parseEdgeClasses(['flowchart-link', 'LS-A', 'LE-B'])).toEqual({ from: 'A', to: 'B' });
  });
  it('returns null when either end is missing', () => {
    expect(parseEdgeClasses(['flowchart-link', 'LS-A'])).toBeNull();
    expect(parseEdgeClasses([])).toBeNull();
  });
});

describe('computeWalkOrder', () => {
  it('walks a linear chain in order', () => {
    expect(computeWalkOrder(['A', 'B', 'C'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }])).toEqual(['A', 'B', 'C']);
  });
  it('walks branches breadth-first', () => {
    const edges = [
      { from: 'A', to: 'B' }, { from: 'A', to: 'C' },
      { from: 'B', to: 'D' }, { from: 'C', to: 'D' },
    ];
    expect(computeWalkOrder(['A', 'B', 'C', 'D'], edges)).toEqual(['A', 'B', 'C', 'D']);
  });
  it('visits every node exactly once in a cycle', () => {
    const order = computeWalkOrder(['A', 'B'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'A' }]);
    expect(order).toEqual(['A', 'B']);
  });
  it('handles a loop back to an earlier node (margin-call style)', () => {
    const edges = [
      { from: 'Open', to: 'Close' }, { from: 'Close', to: 'Check' },
      { from: 'Check', to: 'Safe' }, { from: 'Safe', to: 'Close' },
    ];
    expect(computeWalkOrder(['Open', 'Close', 'Check', 'Safe'], edges)).toEqual(['Open', 'Close', 'Check', 'Safe']);
  });
  it('returns document order when there are no edges', () => {
    expect(computeWalkOrder(['X', 'Y', 'Z'], [])).toEqual(['X', 'Y', 'Z']);
  });
  it('handles a single node', () => {
    expect(computeWalkOrder(['Only'], [])).toEqual(['Only']);
  });
  it('handles an empty graph', () => {
    expect(computeWalkOrder([], [])).toEqual([]);
  });
  it('ignores edges to unknown nodes (subgraph clusters) and self-loops', () => {
    const order = computeWalkOrder(['A', 'B'], [{ from: 'Cluster', to: 'A' }, { from: 'A', to: 'A' }, { from: 'A', to: 'B' }]);
    expect(order).toEqual(['A', 'B']);
  });
  it('starts each disconnected component from its own source', () => {
    const edges = [{ from: 'A', to: 'B' }, { from: 'C', to: 'D' }];
    expect(computeWalkOrder(['A', 'B', 'C', 'D'], edges)).toEqual(['A', 'B', 'C', 'D']);
  });
});
```

`tests/diagram-theme.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { tripletToHex, buildThemeVariables, type ThemeTokens } from '../src/lib/diagram-theme';

const tokens: ThemeTokens = {
  paper: '250 246 239',
  'paper-raised': '255 253 248',
  ink: '26 23 20',
  'ink-muted': '94 85 75',
  rule: '227 217 201',
  rust: '180 71 47',
  gold: '242 198 107',
};

describe('tripletToHex', () => {
  it('converts an RGB triplet, tolerating surrounding whitespace', () => {
    expect(tripletToHex(' 26 23 20 ')).toBe('#1a1714');
    expect(tripletToHex('255 255 255')).toBe('#ffffff');
    expect(tripletToHex('0 0 0')).toBe('#000000');
  });
});

describe('buildThemeVariables', () => {
  it('maps tokens onto Mermaid theme variables', () => {
    const v = buildThemeVariables(tokens);
    expect(v.primaryTextColor).toBe('#1a1714');
    expect(v.lineColor).toBe('#5e554b');
    expect(v.titleColor).toBe('#b4472f');
    expect(v.background).toBe('#faf6ef');
    expect(v.fontFamily).toContain('Fraunces');
  });
});
```
Run: `npm test` → Expected FAIL (modules missing).

- [ ] **Step 2: Implement `src/lib/diagram-graph.ts`**

```ts
export interface GraphEdge {
  from: string;
  to: string;
}

/** Mermaid flowchart node DOM ids look like `flowchart-<id>-<n>`. */
export function parseNodeId(domId: string): string | null {
  const m = domId.match(/^flowchart-(.+)-\d+$/);
  return m ? m[1] : null;
}

/** Mermaid edge paths carry `LS-<from>` and `LE-<to>` classes. */
export function parseEdgeClasses(classNames: string[]): GraphEdge | null {
  const from = classNames.find((c) => c.startsWith('LS-'))?.slice(3);
  const to = classNames.find((c) => c.startsWith('LE-'))?.slice(3);
  return from && to ? { from, to } : null;
}

/**
 * Orders nodes for a step-through: breadth-first from nodes with no incoming edges,
 * then from any node not yet reached (cycles, leftovers) in document order.
 * Every node appears exactly once. Edges touching unknown ids or self-loops are ignored.
 */
export function computeWalkOrder(nodeIds: string[], edges: GraphEdge[]): string[] {
  const known = new Set(nodeIds);
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, number>();
  for (const id of nodeIds) {
    outgoing.set(id, []);
    incoming.set(id, 0);
  }
  for (const { from, to } of edges) {
    if (!known.has(from) || !known.has(to) || from === to) continue;
    outgoing.get(from)!.push(to);
    incoming.set(to, (incoming.get(to) ?? 0) + 1);
  }

  const visited = new Set<string>();
  const order: string[] = [];
  const bfs = (start: string) => {
    const queue = [start];
    visited.add(start);
    while (queue.length > 0) {
      const id = queue.shift()!;
      order.push(id);
      for (const next of outgoing.get(id) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
  };

  for (const id of nodeIds) if (incoming.get(id) === 0 && !visited.has(id)) bfs(id);
  for (const id of nodeIds) if (!visited.has(id)) bfs(id);
  return order;
}
```

- [ ] **Step 3: Implement `src/lib/diagram-theme.ts`**

```ts
export const THEME_TOKEN_NAMES = ['paper', 'paper-raised', 'ink', 'ink-muted', 'rule', 'rust', 'gold'] as const;
export type ThemeTokens = Record<(typeof THEME_TOKEN_NAMES)[number], string>;

export function tripletToHex(triplet: string): string {
  const [r, g, b] = triplet.trim().split(/\s+/).map(Number);
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

export function buildThemeVariables(t: ThemeTokens): Record<string, string> {
  const h = tripletToHex;
  return {
    background: h(t.paper),
    primaryColor: h(t['paper-raised']),
    primaryTextColor: h(t.ink),
    primaryBorderColor: h(t.ink),
    secondaryColor: h(t.gold),
    secondaryTextColor: h(t.ink),
    tertiaryColor: h(t.paper),
    mainBkg: h(t['paper-raised']),
    nodeBorder: h(t.ink),
    clusterBkg: h(t.paper),
    clusterBorder: h(t.rule),
    lineColor: h(t['ink-muted']),
    titleColor: h(t.rust),
    edgeLabelBackground: h(t.paper),
    fontFamily: "'Fraunces Variable', Georgia, serif",
    fontSize: '15px',
  };
}
```

- [ ] **Step 4: Run tests and commit**

```bash
npm test
git add -A
git commit -m "feat(diagram): pure graph-walk and Mermaid theme logic with tests

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```
Expected: all tests PASS.

---

### Task 8: Diagram component (themed render, reveal, fallback, a11y)

**Files:**
- Create: `src/components/diagram/dom.ts`, `src/components/diagram/Diagram.tsx`
- Modify: `src/styles/global.css` (append diagram CSS), `src/pages/topics/[slug].astro` (swap the component)
- Delete: `src/components/MermaidDiagram.tsx`

**Interfaces:**
- Consumes: `parseNodeId`, `parseEdgeClasses`, `computeWalkOrder`, `GraphEdge` (Task 7); `buildThemeVariables`, `THEME_TOKEN_NAMES`, `ThemeTokens` (Task 7); `getReducedMotion` (motion.ts).
- Produces: `Diagram` props `{ code: string; title: string }` (default + named export). `dom.ts` exports `DiagramGraph { nodeIds: string[]; order: string[]; labels: Record<string,string>; nodeEls: Map<string, SVGGElement>; edgeEls: SVGPathElement[] }`, `extractGraph(svg: SVGSVGElement): DiagramGraph`, `armReveal(graph: DiagramGraph): void`, `readThemeTokens(): ThemeTokens`.

- [ ] **Step 1: `src/components/diagram/dom.ts`**

```ts
import { parseNodeId, parseEdgeClasses, computeWalkOrder, type GraphEdge } from '../../lib/diagram-graph';
import { THEME_TOKEN_NAMES, type ThemeTokens } from '../../lib/diagram-theme';

export interface DiagramGraph {
  nodeIds: string[];
  order: string[];
  labels: Record<string, string>;
  nodeEls: Map<string, SVGGElement>;
  edgeEls: SVGPathElement[];
}

export function readThemeTokens(): ThemeTokens {
  const style = getComputedStyle(document.documentElement);
  const out = {} as ThemeTokens;
  for (const name of THEME_TOKEN_NAMES) out[name] = style.getPropertyValue(`--${name}`);
  return out;
}

export function extractGraph(svg: SVGSVGElement): DiagramGraph {
  const nodeEls = new Map<string, SVGGElement>();
  const labels: Record<string, string> = {};
  const nodeIds: string[] = [];
  svg.querySelectorAll<SVGGElement>('g.node').forEach((el) => {
    const id = parseNodeId(el.id);
    if (!id || nodeEls.has(id)) return;
    nodeEls.set(id, el);
    nodeIds.push(id);
    labels[id] = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  });

  const edges: GraphEdge[] = [];
  const edgeEls: SVGPathElement[] = [];
  svg.querySelectorAll<SVGPathElement>('path.flowchart-link').forEach((el) => {
    edgeEls.push(el);
    const edge = parseEdgeClasses(Array.from(el.classList));
    if (edge) edges.push(edge);
  });

  return { nodeIds, order: computeWalkOrder(nodeIds, edges), labels, nodeEls, edgeEls };
}

/** Prepares nodes/edges for the staggered reveal (styled by .dg-reveal in global.css). */
export function armReveal(graph: DiagramGraph): void {
  graph.order.forEach((id, i) => {
    const el = graph.nodeEls.get(id);
    if (!el) return;
    el.classList.add('dg-node');
    el.style.setProperty('--i', String(i));
  });
  graph.edgeEls.forEach((el) => {
    el.classList.add('dg-edge');
    el.style.setProperty('--len', String(Math.ceil(el.getTotalLength())));
  });
}
```

- [ ] **Step 2: `src/components/diagram/Diagram.tsx`** (first version: render, theme, reveal, fallback, a11y)

```tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { buildThemeVariables } from '../../lib/diagram-theme';
import { getReducedMotion } from '../../lib/motion';
import { extractGraph, armReveal, readThemeTokens, type DiagramGraph } from './dom';

export interface DiagramProps {
  code: string;
  title: string;
}

let renderCounter = 0;

/** True when the <html> element currently has the `dark` class. Only reports real changes. */
function useIsDark(): boolean {
  const read = () => document.documentElement.classList.contains('dark');
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(read());
    const observer = new MutationObserver(() => setDark(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export const Diagram: React.FC<DiagramProps> = ({ code, title }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasRevealed = useRef(false);
  const dark = useIsDark();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [graph, setGraph] = useState<DiagramGraph | null>(null);

  // Render (and re-render when the theme flips).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: buildThemeVariables(readThemeTokens()),
          securityLevel: 'loose',
          flowchart: { curve: 'basis', htmlLabels: true },
        });
        const { svg: rendered } = await mermaid.render(`dg-${++renderCounter}`, code);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, dark]);

  // After each new SVG lands: extract the graph, and play the reveal once.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const svgEl = root?.querySelector('svg');
    if (!root || !svgEl) return;
    svgEl.removeAttribute('height');
    svgEl.style.maxWidth = 'none';

    const g = extractGraph(svgEl as SVGSVGElement);
    setGraph(g);

    const alreadyRevealed = hasRevealed.current;
    hasRevealed.current = true;
    if (alreadyRevealed || g.nodeIds.length === 0 || getReducedMotion()) return;

    armReveal(g);
    root.classList.add('dg-reveal');
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('dg-in')));
  }, [svg]);

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-rule bg-paper-raised p-5">
        <p className="mb-2 font-sans text-sm font-semibold text-ink">This diagram could not be drawn. Here is its source:</p>
        <pre className="overflow-x-auto rounded-lg bg-[rgb(var(--code-bg))] p-4 font-mono text-xs text-[rgb(var(--code-fg))]">{code}</pre>
      </div>
    );
  }

  return (
    <figure className="relative">
      <div
        ref={rootRef}
        className="dg-root overflow-x-auto"
        role="img"
        aria-label={title}
        dangerouslySetInnerHTML={{ __html: svg ?? '' }}
      />
      {svg === null && <p className="font-sans text-sm text-ink-muted">Drawing diagram…</p>}
      {graph && graph.order.length > 0 && (
        <ol className="sr-only" aria-label={`${title}: outline of steps`}>
          {graph.order.map((id) => (
            <li key={id}>{graph.labels[id]}</li>
          ))}
        </ol>
      )}
    </figure>
  );
};

export default Diagram;
```

- [ ] **Step 3: Append diagram CSS to `global.css`**

```css
/* ---- Diagram engine ---- */
.dg-root svg {
  width: 100%;
  height: auto;
  font-family: var(--font-serif);
}

/* Reveal: nodes fade in along the flow; edges draw themselves in ink. Opacity only on
   nodes, because Mermaid positions them with a transform attribute. */
.dg-reveal .dg-node {
  opacity: 0;
  transition: opacity var(--dur-slow) var(--ease-out) calc(var(--i, 0) * 70ms);
}
.dg-reveal .dg-edge {
  stroke-dasharray: var(--len);
  stroke-dashoffset: var(--len);
  transition: stroke-dashoffset var(--dur-ink) var(--ease-out) 200ms;
}
.dg-reveal.dg-in .dg-node {
  opacity: 1;
}
.dg-reveal.dg-in .dg-edge {
  stroke-dashoffset: 0;
}
```

- [ ] **Step 4: Swap it into the topic page and delete the old component**

In `src/pages/topics/[slug].astro`: replace `import MermaidDiagram from '../../components/MermaidDiagram';` with `import Diagram from '../../components/diagram/Diagram';` and replace `<MermaidDiagram client:load code={auxiliary.diagram} />` with `<Diagram client:visible code={auxiliary.diagram} title={`${topic.data.title}: concept diagram`} />`.
```bash
git rm src/components/MermaidDiagram.tsx
```

- [ ] **Step 5: Verify the graph extraction against real Mermaid output**

```bash
npm test && npm run build 2>&1 | tail -5
npm run dev
```
Temporarily add `console.log(g.nodeIds, g.order, g.edgeEls.length)` inside the layout effect, open `/topics/time-value-of-money` and `/topics/margining-mark-to-market-span` with the browser console open. Expected: TVM logs 4 node ids (`T0,T1,T2,T3`), order `T0,T1,T2,T3`, 4 edge elements; the margin diagram logs ~15 node ids starting with `OpenPos`. If `nodeIds` is empty, Mermaid's DOM ids differ from `flowchart-<id>-<n>`: inspect a node in devtools, adjust the regex in `parseNodeId` (and its test), re-run. Remove the `console.log` afterwards.

- [ ] **Step 6: Verify visuals, theme toggle and fallbacks**

On `/topics/time-value-of-money` scroll to the diagram. Expected: paper-coloured nodes with ink borders and serif labels; nodes fade in along the flow and arrows draw in ink once. **Toggle dark mode while the diagram is visible:** it re-renders in the dark palette without a page reload and without replaying the reveal. Reload in dark mode: diagram renders dark. In devtools enable "Emulate CSS prefers-reduced-motion: reduce" and reload: diagram appears fully drawn, static. Temporarily break a `diagram.mmd` line (e.g. add `???`) for one topic, confirm the source-code fallback appears instead of an error box, then revert.

- [ ] **Step 7: Commit and push**

```bash
git add -A
git commit -m "feat(diagram): themed, lazy-loaded Diagram with ink reveal and graceful fallback

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 9: Diagram interactions (zoom, pan, fullscreen, walk the flow)

**Files:**
- Create: `src/lib/pan-zoom.ts`, `tests/pan-zoom.test.ts`, `src/components/diagram/usePanZoom.ts`, `src/components/diagram/DiagramToolbar.tsx`
- Modify (full replacement): `src/components/diagram/Diagram.tsx`; `src/styles/global.css` (append walk CSS)

**Interfaces:**
- Consumes: `DiagramGraph` and helpers from Task 8.
- Produces: `Transform { x: number; y: number; k: number }`; `zoomAt(t, cx, cy, factor, min, max): Transform` (keeps the point under `(cx, cy)` fixed, clamps scale); `clampTransform(t, w, h): Transform` (keeps content covering the viewport; `k = 1` forces `x = y = 0`); `usePanZoom(minK?, maxK?)` returns `{ t, viewportRef, zoomIn, zoomOut, fit, bind }`.

- [ ] **Step 1: Write the failing test**

`tests/pan-zoom.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { zoomAt, clampTransform } from '../src/lib/pan-zoom';

const screenOf = (world: number, t: { x: number; k: number }) => world * t.k + t.x;

describe('zoomAt', () => {
  it('keeps the point under the cursor fixed', () => {
    const t = { x: -40, y: -10, k: 1.5 };
    const cx = 200;
    const worldX = (cx - t.x) / t.k;
    const next = zoomAt(t, cx, 120, 1.4, 1, 4);
    expect(screenOf(worldX, next)).toBeCloseTo(cx, 6);
  });
  it('clamps to the maximum scale', () => {
    expect(zoomAt({ x: 0, y: 0, k: 3.9 }, 0, 0, 2, 1, 4).k).toBe(4);
  });
  it('clamps to the minimum scale', () => {
    expect(zoomAt({ x: 0, y: 0, k: 1.1 }, 0, 0, 0.1, 1, 4).k).toBe(1);
  });
});

describe('clampTransform', () => {
  it('forces zero offset at scale 1', () => {
    expect(clampTransform({ x: 50, y: -30, k: 1 }, 400, 300)).toEqual({ x: 0, y: 0, k: 1 });
  });
  it('keeps the content covering the viewport when zoomed', () => {
    const out = clampTransform({ x: 100, y: -9999, k: 2 }, 400, 300);
    expect(out.x).toBe(0);
    expect(out.y).toBe(300 - 300 * 2);
  });
});
```
Run `npm test` → FAIL (module missing).

- [ ] **Step 2: Implement `src/lib/pan-zoom.ts`**

```ts
export interface Transform {
  x: number;
  y: number;
  k: number;
}

export function zoomAt(t: Transform, cx: number, cy: number, factor: number, min: number, max: number): Transform {
  const k = Math.min(max, Math.max(min, t.k * factor));
  const ratio = k / t.k;
  return { k, x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio };
}

export function clampTransform(t: Transform, w: number, h: number): Transform {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return { k: t.k, x: clamp(t.x, w - w * t.k, 0), y: clamp(t.y, h - h * t.k, 0) };
}
```
Run `npm test` → PASS.

- [ ] **Step 3: `src/components/diagram/usePanZoom.ts`**

```ts
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { clampTransform, zoomAt, type Transform } from '../../lib/pan-zoom';

const IDENTITY: Transform = { x: 0, y: 0, k: 1 };

export function usePanZoom(minK = 1, maxK = 4) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<Transform>(IDENTITY);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const size = () => {
    const r = viewportRef.current?.getBoundingClientRect();
    return { w: r?.width ?? 0, h: r?.height ?? 0, left: r?.left ?? 0, top: r?.top ?? 0 };
  };

  const applyZoom = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const { w, h } = size();
      setT((prev) => clampTransform(zoomAt(prev, cx ?? w / 2, cy ?? h / 2, factor, minK, maxK), w, h));
    },
    [minK, maxK],
  );

  // Pinch-zoom on trackpads arrives as ctrl+wheel; plain wheel keeps scrolling the page.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const { left, top } = size();
      applyZoom(Math.exp(-e.deltaY * 0.01), e.clientX - left, e.clientY - top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    const { w, h, left, top } = size();
    if (pointers.current.size === 2) {
      const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)![1];
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      if (before > 0) applyZoom(after / before, (next.x + other.x) / 2 - left, (next.y + other.y) / 2 - top);
    } else {
      setT((cur) =>
        cur.k > 1 ? clampTransform({ ...cur, x: cur.x + next.x - prev.x, y: cur.y + next.y - prev.y }, w, h) : cur,
      );
    }
    pointers.current.set(e.pointerId, next);
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
  };

  const fit = useCallback(() => setT(IDENTITY), []);

  return {
    t,
    viewportRef,
    zoomIn: () => applyZoom(1.4),
    zoomOut: () => applyZoom(1 / 1.4),
    fit,
    bind: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd },
  };
}
```

- [ ] **Step 4: `src/components/diagram/DiagramToolbar.tsx`**

```tsx
import React from 'react';

interface DiagramToolbarProps {
  canWalk: boolean;
  walking: boolean;
  onToggleWalk: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

const btn =
  'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-rule bg-paper-raised px-4 font-sans text-sm font-bold text-ink hover:border-ink/40';

export const DiagramToolbar: React.FC<DiagramToolbarProps> = (p) => (
  <div className="mb-3 flex flex-wrap items-center gap-2" role="toolbar" aria-label="Diagram controls">
    {p.canWalk && (
      <button type="button" className={`${btn} ${p.walking ? 'bg-ink text-on-accent' : ''}`} onClick={p.onToggleWalk} aria-pressed={p.walking}>
        {p.walking ? 'Stop walk' : 'Walk the flow'}
      </button>
    )}
    <span className="ml-auto flex gap-2">
      <button type="button" className={btn} onClick={p.onZoomOut} aria-label="Zoom out">−</button>
      <button type="button" className={btn} onClick={p.onZoomIn} aria-label="Zoom in">+</button>
      <button type="button" className={btn} onClick={p.onFit} aria-label="Fit to view">Fit</button>
      <button type="button" className={btn} onClick={p.onToggleFullscreen} aria-label={p.fullscreen ? 'Exit full screen' : 'Full screen'}>
        {p.fullscreen ? 'Close' : '⤢'}
      </button>
    </span>
  </div>
);

export default DiagramToolbar;
```

- [ ] **Step 2b: Append walk CSS to `global.css`**

```css
/* Walk the flow: dim everything but the current step */
.dg-root.dg-walking g.node {
  opacity: 0.22;
  transition: opacity var(--dur-base) var(--ease-out);
}
.dg-root.dg-walking path.flowchart-link {
  opacity: 0.2;
}
.dg-root.dg-walking g.node.dg-current {
  opacity: 1;
}
.dg-root.dg-walking g.node.dg-current :is(rect, polygon, circle, ellipse, path) {
  stroke: rgb(var(--rust));
  stroke-width: 2.5px;
}
```

- [ ] **Step 5: Replace `Diagram.tsx` with the full interactive version**

```tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { buildThemeVariables } from '../../lib/diagram-theme';
import { getReducedMotion } from '../../lib/motion';
import { extractGraph, armReveal, readThemeTokens, type DiagramGraph } from './dom';
import { usePanZoom } from './usePanZoom';
import { DiagramToolbar } from './DiagramToolbar';

export interface DiagramProps {
  code: string;
  title: string;
}

let renderCounter = 0;

function useIsDark(): boolean {
  const read = () => document.documentElement.classList.contains('dark');
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(read());
    const observer = new MutationObserver(() => setDark(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export const Diagram: React.FC<DiagramProps> = ({ code, title }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasRevealed = useRef(false);
  const dark = useIsDark();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [graph, setGraph] = useState<DiagramGraph | null>(null);
  const [walkIndex, setWalkIndex] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const { t, viewportRef, zoomIn, zoomOut, fit, bind } = usePanZoom();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: buildThemeVariables(readThemeTokens()),
          securityLevel: 'loose',
          flowchart: { curve: 'basis', htmlLabels: true },
        });
        const { svg: rendered } = await mermaid.render(`dg-${++renderCounter}`, code);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, dark]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const svgEl = root?.querySelector('svg');
    if (!root || !svgEl) return;
    svgEl.removeAttribute('height');
    svgEl.style.maxWidth = 'none';

    const g = extractGraph(svgEl as SVGSVGElement);
    setGraph(g);

    const alreadyRevealed = hasRevealed.current;
    hasRevealed.current = true;
    if (alreadyRevealed || g.nodeIds.length === 0 || getReducedMotion()) return;

    armReveal(g);
    root.classList.add('dg-reveal');
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('dg-in')));
  }, [svg]);

  // Walk-the-flow highlighting.
  useEffect(() => {
    if (!graph) return;
    rootRef.current?.classList.toggle('dg-walking', walkIndex !== null);
    const currentId = walkIndex !== null ? graph.order[walkIndex] : null;
    graph.nodeEls.forEach((el, id) => el.classList.toggle('dg-current', id === currentId));
  }, [walkIndex, graph]);

  // Fullscreen: lock page scroll, close on Escape, re-fit the view.
  useEffect(() => {
    fit();
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen, fit]);

  const total = graph?.order.length ?? 0;
  const canWalk = total >= 2;
  const walking = walkIndex !== null;

  const step = (delta: number) => {
    if (walkIndex === null || total === 0) return;
    setWalkIndex((walkIndex + delta + total) % total);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!walking) return;
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  };

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-rule bg-paper-raised p-5">
        <p className="mb-2 font-sans text-sm font-semibold text-ink">This diagram could not be drawn. Here is its source:</p>
        <pre className="overflow-x-auto rounded-lg bg-[rgb(var(--code-bg))] p-4 font-mono text-xs text-[rgb(var(--code-fg))]">{code}</pre>
      </div>
    );
  }

  return (
    <figure
      onKeyDown={onKeyDown}
      className={fullscreen ? 'fixed inset-0 z-[70] flex flex-col bg-paper p-4' : 'relative'}
    >
      <DiagramToolbar
        canWalk={canWalk}
        walking={walking}
        onToggleWalk={() => setWalkIndex(walking ? null : 0)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={fit}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((f) => !f)}
      />

      <div
        ref={viewportRef}
        {...bind}
        className={`relative overflow-hidden rounded-xl border border-rule bg-paper ${fullscreen ? 'flex-1' : ''}`}
        style={{ touchAction: t.k > 1 ? 'none' : 'pan-y' }}
      >
        <div
          ref={rootRef}
          className="dg-root"
          role="img"
          aria-label={title}
          style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})`, transformOrigin: '0 0' }}
          dangerouslySetInnerHTML={{ __html: svg ?? '' }}
        />
        {svg === null && <p className="p-4 font-sans text-sm text-ink-muted">Drawing diagram…</p>}
      </div>

      {walking && graph && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-rule bg-paper-raised p-3">
          <button type="button" onClick={() => step(-1)} className="min-h-[44px] min-w-[44px] rounded-full border border-rule px-4 font-sans text-sm font-bold text-ink" aria-label="Previous step">←</button>
          <p aria-live="polite" className="flex-1 font-serif text-base text-ink">
            <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">
              Step {walkIndex! + 1} of {total}
            </span>
            <br />
            {graph.labels[graph.order[walkIndex!]]}
          </p>
          <button type="button" onClick={() => step(1)} className="min-h-[44px] min-w-[44px] rounded-full bg-rust px-4 font-sans text-sm font-bold text-on-accent" aria-label="Next step">→</button>
        </div>
      )}

      {graph && graph.order.length > 0 && (
        <ol className="sr-only" aria-label={`${title}: outline of steps`}>
          {graph.order.map((id) => (
            <li key={id}>{graph.labels[id]}</li>
          ))}
        </ol>
      )}
    </figure>
  );
};

export default Diagram;
```

- [ ] **Step 6: Verify**

```bash
npm test && npm run build 2>&1 | tail -5
npm run dev
```
On `/topics/margining-mark-to-market-span` (a 15-node diagram with loops): "Walk the flow" appears; stepping with the buttons and ←/→ highlights one node in rust and dims the rest, caption shows "Step n of N" plus the node label; the walk visits each node once starting from `OpenPos`. Zoom +/−/Fit work; when zoomed, dragging pans and cannot drag the diagram off-screen; Ctrl/⌘ + scroll zooms while plain scroll still scrolls the page; on a touch device (or devtools touch emulation) pinch zooms. Full screen fills the viewport, Escape closes it, page scroll is locked meanwhile and restored after. On `/topics/supply-demand-fundamentals` (15-line diagram) confirm the controls still work. For any diagram with fewer than 2 nodes the "Walk the flow" button is hidden (covered by unit test for order; check none of the 28 breaks: open 3–4 more topics).

- [ ] **Step 7: Commit and push**

```bash
git add -A
git commit -m "feat(diagram): zoom, pan, fullscreen and walk-the-flow step-through

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 10: Topic page (layout, contents rail, marginalia, PayoffChart tokens)

**Files:**
- Create: `src/lib/contents.ts`, `tests/contents.test.ts`, `src/components/topic/ContentsRail.astro`
- Modify (full rewrite): `src/pages/topics/[slug].astro`
- Modify: `src/components/PayoffChart.tsx` (token pass), `src/content/topics/option-greeks-pricing-models-implied-volatility/note.mdx` (demo of opt-in components)

**Interfaces:**
- Consumes: `mdxComponents` (Task 5), `initHighlights` (Task 5), `Diagram` (Task 8), `Section/Badge/DifficultyBadge/Button` (Task 3), `InkProgress` (Task 4).
- Produces: `buildContents(headings: Heading[]): { items: Heading[]; show: boolean }` where `Heading = { depth: number; slug: string; text: string }`; `ContentsRail` props `{ items: Heading[]; show: boolean; extras: { href: string; label: string }[] }`.

- [ ] **Step 1: Write the failing test**

`tests/contents.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildContents } from '../src/lib/contents';

const h = (depth: number, text: string) => ({ depth, slug: text.toLowerCase().replace(/\s+/g, '-'), text });

describe('buildContents', () => {
  it('keeps only h2 and h3', () => {
    const { items } = buildContents([h(1, 'Title'), h(2, 'A'), h(3, 'B'), h(4, 'C')]);
    expect(items.map((i) => i.text)).toEqual(['A', 'B']);
  });
  it('shows the rail when there are at least two entries', () => {
    expect(buildContents([h(2, 'A'), h(2, 'B')]).show).toBe(true);
  });
  it('hides the heading list for notes with fewer than two sections', () => {
    expect(buildContents([h(1, 'Title'), h(2, 'Only one')]).show).toBe(false);
    expect(buildContents([h(1, 'Title')]).show).toBe(false);
    expect(buildContents([]).show).toBe(false);
  });
});
```
Run `npm test` → FAIL.

- [ ] **Step 2: Implement `src/lib/contents.ts`**

```ts
export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export function buildContents(headings: Heading[]): { items: Heading[]; show: boolean } {
  const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
  return { items, show: items.length >= 2 };
}
```
Run `npm test` → PASS.

- [ ] **Step 3: `src/components/topic/ContentsRail.astro`**

```astro
---
import type { Heading } from '../../lib/contents';

interface Props {
  items: Heading[];
  show: boolean;
  extras: { href: string; label: string }[];
}
const { items, show, extras } = Astro.props;
const linkClass = 'flex min-h-[32px] items-center border-l-2 border-transparent py-1 pl-3 font-sans text-sm text-ink-muted transition-colors hover:text-ink aria-[current=true]:border-rust aria-[current=true]:font-semibold aria-[current=true]:text-ink';
---
<nav aria-label="Contents" class="space-y-6">
  {show && (
    <div>
      <p class="mb-2 font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">In this note</p>
      <ul class="border-l border-rule">
        {items.map((item) => (
          <li>
            <a data-toc-link href={`#${item.slug}`} class:list={[linkClass, item.depth === 3 && 'pl-6']}>{item.text}</a>
          </li>
        ))}
      </ul>
    </div>
  )}
  <div>
    <p class="mb-2 font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">Practise</p>
    <ul class="border-l border-rule">
      {extras.map((item) => (
        <li><a data-toc-link href={item.href} class={linkClass}>{item.label}</a></li>
      ))}
    </ul>
  </div>
</nav>

<script>
  function initContents() {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'));
    const targets = links
      .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0 || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          links.forEach((link) =>
            link.setAttribute('aria-current', String(link.hash === `#${entry.target.id}`)),
          );
        }
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    targets.forEach((el) => observer.observe(el));
  }
  document.addEventListener('astro:page-load', initContents);
</script>
```

- [ ] **Step 4: Rewrite `src/pages/topics/[slug].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import { loadTopicAuxiliaryData, getTopicSlug } from '../../utils/topic-loader';
import Diagram from '../../components/diagram/Diagram';
import PayoffChart from '../../components/PayoffChart';
import Quiz from '../../components/Quiz';
import Flashcards from '../../components/Flashcards';
import { InkProgress } from '../../components/ui/InkProgress';
import { HeroMotion, HeroItem } from '../../components/HeroMotion';
import { ScrollReveal } from '../../components/ScrollReveal';
import Section from '../../components/ui/Section.astro';
import Button from '../../components/ui/Button.astro';
import DifficultyBadge from '../../components/ui/DifficultyBadge.astro';
import ContentsRail from '../../components/topic/ContentsRail.astro';
import { mdxComponents } from '../../components/mdx';
import { buildContents } from '../../lib/contents';

export async function getStaticPaths() {
  const topics = await getCollection('topics');
  return topics.map((indexTopic, index) => {
    const slug = getTopicSlug(indexTopic);
    const nextTopic = topics[(index + 1) % topics.length];
    return {
      params: { slug },
      props: { topic: indexTopic, slug, nextTopic },
    };
  });
}

const { topic, slug, nextTopic } = Astro.props;
const { Content, headings } = await topic.render();
const auxiliary = loadTopicAuxiliaryData(slug);
const contents = buildContents(headings);

const formattedDate = new Date(topic.data.dateAdded).toLocaleDateString('en-GB', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
const estReadTime = Math.max(4, Math.ceil(topic.body.split(/\s+/).length / 200));
const categorySlug = topic.data.category.toLowerCase().replace(/\s+/g, '-');

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LearningResource',
  name: topic.data.title,
  description: topic.data.description,
  educationalLevel: topic.data.difficulty,
  learningResourceType: 'Study Note & Practice Quiz',
  datePublished: topic.data.dateAdded,
  author: { '@type': 'Organization', name: 'Finance Fundamentals' },
};

const extras = [
  { href: '#visual-model', label: 'The picture' },
  { href: '#flashcards-deck', label: `Flashcards (${auxiliary.flashcards.length})` },
  { href: '#quiz-section', label: `Quiz (${auxiliary.quiz.length})` },
];
---

<BaseLayout title={topic.data.title} description={topic.data.description} article={true}>
  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
  <InkProgress client:load />

  <nav class="mb-6 flex items-center gap-2 overflow-x-auto font-sans text-xs font-semibold text-ink-muted no-scrollbar" aria-label="Breadcrumb">
    <a href="/" class="hover:text-ink">Home</a>
    <span aria-hidden="true">/</span>
    <a href={`/categories/${categorySlug}`} class="hover:text-ink">{topic.data.category}</a>
    <span aria-hidden="true">/</span>
    <span class="truncate font-bold text-ink">{topic.data.title}</span>
  </nav>

  <header class="mb-12 border-t-4 border-ink pt-1">
    <div class="border-t border-ink pt-8">
      <HeroMotion client:load>
        <HeroItem>
          <p class="mb-3 font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">
            <a href={`/categories/${categorySlug}`}>{topic.data.category}</a>
          </p>
        </HeroItem>
        <HeroItem>
          <h1 class="max-w-4xl font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl">
            {topic.data.title}
          </h1>
        </HeroItem>
        <HeroItem>
          <p class="mt-5 max-w-3xl font-serif text-xl italic leading-relaxed text-ink-muted">{topic.data.description}</p>
        </HeroItem>
        <HeroItem>
          <div class="mt-6 flex flex-wrap items-center gap-3 font-sans text-sm text-ink-muted">
            <DifficultyBadge difficulty={topic.data.difficulty} />
            <span>{estReadTime} min read</span>
            <span aria-hidden="true">·</span>
            <span>Added {formattedDate}</span>
          </div>
        </HeroItem>
      </HeroMotion>
    </div>
  </header>

  <div class="grid items-start gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
    <aside class="hidden lg:sticky lg:top-24 lg:block">
      <ContentsRail items={contents.items} show={contents.show} extras={extras} />
    </aside>

    <div class="min-w-0 space-y-20">
      <article id="notes-content" class="xl:pr-[15.5rem]">
        <div class="prose max-w-none">
          <Content components={mdxComponents} />
        </div>
      </article>

      <Section id="visual-model" eyebrow="The picture" title={auxiliary.payoffChart ? 'Payoff profile' : 'Concept diagram'}>
        <div class="rounded-2xl border border-rule bg-paper-raised p-4 sm:p-8">
          {auxiliary.payoffChart ? (
            <PayoffChart
              client:visible
              positions={auxiliary.payoffChart.positions}
              priceRange={auxiliary.payoffChart.priceRange}
              title={auxiliary.payoffChart.title}
              description={auxiliary.payoffChart.description}
            />
          ) : (
            <Diagram client:visible code={auxiliary.diagram} title={`${topic.data.title}: concept diagram`} />
          )}
        </div>
      </Section>

      <Section id="flashcards-deck" eyebrow="Practise" title="Flashcards">
        <ScrollReveal client:visible>
          <Flashcards client:visible cards={auxiliary.flashcards} />
        </ScrollReveal>
      </Section>

      <Section id="quiz-section" eyebrow="Practise" title="Question bank">
        <ScrollReveal client:visible>
          <Quiz client:visible questions={auxiliary.quiz} />
        </ScrollReveal>
      </Section>

      <div class="flex flex-col items-center justify-between gap-4 border-t border-rule pt-8 sm:flex-row">
        <Button href="/topics" variant="ghost">← All topics</Button>
        {nextTopic && (
          <Button href={`/topics/${getTopicSlug(nextTopic)}`} variant="primary">
            Next: {nextTopic.data.title} →
          </Button>
        )}
      </div>
    </div>
  </div>
</BaseLayout>

<script>
  import { initHighlights } from '../../scripts/reveal';
  document.addEventListener('astro:page-load', () => initHighlights());
</script>
```

- [ ] **Step 5: Token pass on `PayoffChart.tsx`**

Find-and-replace these exact strings in `src/components/PayoffChart.tsx` (keep the dark tooltip card `bg-slate-900/95 …` and its emerald/rose text as-is):

| Find | Replace |
|---|---|
| `text-[#0F172A] dark:text-white` | `text-ink` |
| `text-slate-400 dark:text-slate-400` | `text-ink-muted` |
| `text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white` | `text-ink-muted hover:text-ink` |
| `text-slate-500 dark:text-slate-400` | `text-ink-muted` |
| `text-slate-600 dark:text-slate-300` | `text-ink` |
| `bg-slate-100 dark:bg-slate-800/80` | `bg-paper` |
| `border-slate-200 dark:border-slate-700/60` | `border-rule` |
| `bg-white dark:bg-[#0F1E36] text-[#0F172A] dark:text-white shadow-sm` | `bg-paper-raised text-ink shadow-sm` |
| `bg-slate-50/50 dark:bg-[#0B1528]` | `bg-paper` |
| `border-slate-200 dark:border-slate-800` | `border-rule` |
| `stroke-slate-200 dark:stroke-slate-800/60` | `stroke-rule` |
| `stroke-slate-400 dark:stroke-slate-400` | `stroke-ink-muted` |
| `fill-slate-400 dark:fill-slate-400` | `fill-ink-muted` |
| `fill-slate-600 dark:fill-slate-300` | `fill-ink` |
| `stroke-blue-600 dark:stroke-blue-400` | `stroke-ink` |
| `fill-blue-600 dark:fill-blue-400 stroke-white dark:stroke-[#0F1E36]` | `fill-ink stroke-paper` |
| `stroke-emerald-500/80 dark:stroke-emerald-400/80` | `stroke-success/80` |
| `stroke-amber-500/80 dark:stroke-amber-400/80` | `stroke-rust/80` |
| `fill-emerald-500/10 dark:fill-emerald-400/20 stroke-emerald-500/30 dark:stroke-emerald-400/40` | `fill-success/10 stroke-success/40` |
| `fill-amber-500/10 dark:fill-amber-400/20 stroke-amber-500/30 dark:stroke-amber-400/40` | `fill-rust/10 stroke-rust/40` |
| `fill-emerald-700 dark:fill-emerald-300 font-extrabold text-[10px]` | `fill-success font-extrabold text-[10px]` |
| `fill-amber-700 dark:fill-amber-300 font-extrabold text-[10px]` | `fill-rust font-extrabold text-[10px]` |

Then the colour attributes that cannot take classes:
- Gradient stops: replace `<stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />` with `<stop offset="0%" style={{ stopColor: 'rgb(var(--success))', stopOpacity: 0.35 }} />` and likewise for the other three stops (`#10B981` → `--success` at `0.05`; `#EF4444` → `--danger` at `0.05` and `0.35`).
- Leg lines: change `getLegColor` to return a class (`'stroke-success'` for `long*`, `'stroke-danger'` for `short*`, else `'stroke-rust'`), and on the leg `<path>` replace `stroke={strokeColor}` with `className={strokeClass}` (rename the local variable).
- Rename the legend dots `bg-emerald-500`/`bg-rose-500`/`bg-blue-600 dark:bg-blue-400` to `bg-success`/`bg-danger`/`bg-ink`.

Check with: `grep -n "slate\|blue-\|emerald\|amber\|#10B981\|#EF4444" src/components/PayoffChart.tsx`. Expected: only the tooltip card block remains.

- [ ] **Step 6: Add a demo of the opt-in components to one note**

```bash
grep -n "Delta\|Theta\|Vega" src/content/topics/option-greeks-pricing-models-implied-volatility/note.mdx | head
```
In that note, wrap the first prose mention of each Greek with `<Term term="delta">Delta</Term>` (likewise `gamma`, `theta`, `vega`), wrap one key definition phrase in `<Hl>…</Hl>`, and add one `<Note>Delta is also read as the hedge ratio: how many units of the underlying offset one option.</Note>` on its own line after a paragraph. Do not change anything else. (A typo in a `term` key fails the build by design.)

- [ ] **Step 7: Verify**

```bash
npm test && npm run build 2>&1 | tail -8
npm run dev
```
Check in light and dark at widths 1440, 1100 and 390:
- `/topics/option-greeks-pricing-models-implied-volatility`: contents rail sticky on the left and highlighting the current section; at ≥1280 the `<Note>` sits in the right margin beside its paragraph, below that it is an inline callout; hovering/focusing/tapping a `<Term>` shows the definition; the `<Hl>` sweeps in as it scrolls into view.
- A chapter with a payoff chart (`/topics/futures-payoff-charts`): chart uses paper/ink/rust colours, hover tooltip still works.
- A short note (`/topics/supply-demand-fundamentals` or `/topics/time-value-of-money`): if it has fewer than two `##` headings, the rail shows only the "Practise" group.
- Mobile: rail hidden, everything else stacks; no horizontal scroll.

- [ ] **Step 8: Commit and push**

```bash
git add -A
git commit -m "feat(topic): editorial topic page with contents rail, marginalia and token-styled charts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 11: Home page (masthead, ticker, continue card, sections)

**Files:**
- Create: `src/lib/ticker.ts`, `tests/ticker.test.ts`, `src/components/home/{Ticker,HeroPayoff,ContinueCard}.astro`, `src/components/topic/TopicCard.astro`
- Modify (full rewrite): `src/pages/index.astro`
- Delete: `src/components/HeroLayeredComposition.tsx`, `src/components/InteractiveFlashcardsPreview.tsx`

**Interfaces:**
- Produces:
  - `buildTickerItems(topics: { title: string }[], glossary: Glossary, max?: number): string[]` — interleaves `Term — short definition` and topic titles, de-duplicated, capped at `max` (default 24), definitions truncated to 56 chars with `…`
  - `TopicCard` props `{ slug, title, description, category, difficulty, dateAdded }`; renders `data-topic-card data-category data-difficulty` attributes (used by Task 12)
  - `ContinueCard` props `{ slug, title, description, category, progress?: number }` (progress 0–1, optional; sub-project 3 will supply it)
  - `Ticker` props `{ items: string[] }`

- [ ] **Step 1: Write the failing ticker test**

`tests/ticker.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildTickerItems } from '../src/lib/ticker';

const glossary = {
  delta: { term: 'Delta', definition: 'How much an option price changes per unit move in the underlying asset.' },
  theta: { term: 'Theta', definition: 'Time decay.' },
};

describe('buildTickerItems', () => {
  it('interleaves glossary terms and topic titles', () => {
    const items = buildTickerItems([{ title: 'Hedge Funds' }, { title: 'Clearing' }], glossary);
    expect(items[0]).toMatch(/^Delta — /);
    expect(items[1]).toBe('Hedge Funds');
    expect(items[2]).toMatch(/^Theta — /);
    expect(items[3]).toBe('Clearing');
  });
  it('truncates long definitions with an ellipsis', () => {
    const [first] = buildTickerItems([], glossary);
    expect(first.endsWith('…')).toBe(true);
    expect(first.length).toBeLessThanOrEqual('Delta — '.length + 57);
  });
  it('does not truncate short definitions', () => {
    const items = buildTickerItems([], glossary);
    expect(items[1]).toBe('Theta — Time decay.');
  });
  it('de-duplicates and respects the cap', () => {
    const topics = Array.from({ length: 40 }, (_, i) => ({ title: `Topic ${i % 5}` }));
    const items = buildTickerItems(topics, glossary, 6);
    expect(items.length).toBeLessThanOrEqual(6);
    expect(new Set(items).size).toBe(items.length);
  });
  it('returns an empty list for empty inputs', () => {
    expect(buildTickerItems([], {})).toEqual([]);
  });
});
```
Run `npm test` → FAIL.

- [ ] **Step 2: Implement `src/lib/ticker.ts`**

```ts
import type { Glossary } from './glossary';

const MAX_DEFINITION = 56;

function shorten(text: string): string {
  return text.length <= MAX_DEFINITION ? text : text.slice(0, MAX_DEFINITION).trimEnd() + '…';
}

export function buildTickerItems(topics: { title: string }[], glossary: Glossary, max = 24): string[] {
  const terms = Object.values(glossary).map((e) => `${e.term} — ${shorten(e.definition)}`);
  const titles = topics.map((t) => t.title);
  const merged: string[] = [];
  for (let i = 0; i < Math.max(terms.length, titles.length); i++) {
    if (i < terms.length) merged.push(terms[i]);
    if (i < titles.length) merged.push(titles[i]);
  }
  return Array.from(new Set(merged)).slice(0, max);
}
```
Run `npm test` → PASS.

- [ ] **Step 3: `Ticker.astro`**

```astro
---
interface Props { items: string[] }
const { items } = Astro.props;
---
{items.length > 0 && (
  <div class="ticker overflow-hidden border-y border-ink py-2" aria-hidden="true">
    <div class="ticker-track font-mono text-sm text-ink">
      {[...items, ...items].map((item) => (
        <span class="whitespace-nowrap">{item}<span class="mx-6 text-rust">◆</span></span>
      ))}
    </div>
  </div>
)}

<style>
  .ticker-track {
    display: inline-flex;
    animation: ticker 70s linear infinite;
  }
  .ticker:hover .ticker-track {
    animation-play-state: paused;
  }
  @keyframes ticker {
    to { transform: translateX(-50%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .ticker { overflow-x: auto; }
    .ticker-track { animation: none !important; }
  }
</style>
```
(The track holds the list twice so `-50%` loops seamlessly. It is decorative, hence `aria-hidden`; the same topics are reachable below.)

- [ ] **Step 4: `HeroPayoff.astro`** (CSS-only living diagram: long call, strike 500, premium 25, lot 50; profit at 600 = 50 × (100 − 25) = 3,750)

```astro
---
---
<figure class="hero-payoff" aria-label="Animated payoff diagram of a long call option">
  <figcaption class="font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">Live payoff</figcaption>
  <p class="mt-1 font-serif text-2xl text-ink">Long call · strike 500 · premium 25</p>
  <svg viewBox="0 0 220 100" class="mt-4 w-full" role="img" aria-label="Payoff line: flat loss up to the strike, then rising with the underlying price">
    <line x1="0" y1="66" x2="220" y2="66" class="stroke-rule" stroke-dasharray="3" />
    <polyline class="hp-line stroke-ink" points="0,82 90,82 220,8" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="1" />
    <g class="hp-marker">
      <line x1="118" y1="10" x2="118" y2="92" class="stroke-rust" stroke-dasharray="3" />
      <circle cx="118" cy="66" r="5" class="fill-rust" />
    </g>
  </svg>
  <p class="mt-2 font-sans text-sm text-ink-muted">Break-even at ₹525 · profit at ₹600 (lot 50): <span class="hp-count font-semibold text-ink"></span></p>
</figure>

<style>
  .hp-line {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: hp-draw 1.8s var(--ease-out) 0.3s forwards;
  }
  .hp-marker {
    opacity: 0;
    animation: hp-drop 0.6s var(--ease-out) 1.4s forwards;
  }
  .hp-count::after {
    content: '₹0';
    animation: hp-count 2.2s steps(1) 0.3s forwards;
  }
  @keyframes hp-draw { to { stroke-dashoffset: 0; } }
  @keyframes hp-drop {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes hp-count {
    0% { content: '₹0'; }
    25% { content: '₹900'; }
    50% { content: '₹1,900'; }
    75% { content: '₹2,900'; }
    100% { content: '₹3,750'; }
  }
</style>
```
(With reduced motion, the global rule collapses animation durations to ~0 and `forwards` fill lands on the final state: fully drawn line, marker visible, `₹3,750`.)

- [ ] **Step 5: `TopicCard.astro`**

```astro
---
import Card from '../ui/Card.astro';
import DifficultyBadge from '../ui/DifficultyBadge.astro';

interface Props {
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  dateAdded: string | Date;
}
const { slug, title, description, category, difficulty, dateAdded } = Astro.props;
const added = new Date(dateAdded).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
---
<Card
  href={`/topics/${slug}`}
  class="group flex h-full flex-col justify-between"
  data-topic-card
  data-category={category}
  data-difficulty={difficulty}
>
  <div>
    <div class="mb-4 flex items-center justify-between gap-2">
      <span class="font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">{category}</span>
      <DifficultyBadge difficulty={difficulty} />
    </div>
    <h3 class="mb-3 font-serif text-2xl font-semibold leading-snug tracking-tight text-ink">{title}</h3>
    <p class="mb-6 line-clamp-3 font-serif text-base leading-relaxed text-ink-muted">{description}</p>
  </div>
  <div class="flex items-center justify-between border-t border-rule pt-4 font-sans text-xs text-ink-muted">
    <span>Added {added}</span>
    <span class="font-bold text-ink transition-transform group-hover:translate-x-0.5">Read →</span>
  </div>
</Card>
```

- [ ] **Step 6: `ContinueCard.astro`**

```astro
---
import Card from '../ui/Card.astro';

interface Props {
  slug: string;
  title: string;
  description: string;
  category: string;
  progress?: number;
}
const { slug, title, description, category, progress } = Astro.props;
const hasProgress = typeof progress === 'number';
const percent = hasProgress ? Math.round(Math.min(1, Math.max(0, progress!)) * 100) : 0;
---
<Card href={`/topics/${slug}`} class="group">
  <p class="font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">
    {hasProgress ? 'Continue reading' : 'Start here'}
  </p>
  <h3 class="mt-2 font-serif text-3xl font-semibold leading-tight text-ink">{title}</h3>
  <p class="mt-2 line-clamp-2 font-serif text-base text-ink-muted">{description}</p>
  <div class="mt-5 flex items-center gap-4">
    {hasProgress && (
      <div class="h-[3px] flex-1 overflow-hidden rounded-full bg-rule" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" aria-label="Progress">
        <div class="h-full bg-rust" style={`width:${percent}%`}></div>
      </div>
    )}
    <span class="font-sans text-sm font-bold text-ink">{category} · Open →</span>
  </div>
</Card>
```

- [ ] **Step 7: Rewrite `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import { CATEGORIES } from '../content/config';
import { getTopicSlug } from '../utils/topic-loader';
import glossary from '../data/glossary.json';
import type { Glossary } from '../lib/glossary';
import { buildTickerItems } from '../lib/ticker';
import Section from '../components/ui/Section.astro';
import Button from '../components/ui/Button.astro';
import TopicCard from '../components/topic/TopicCard.astro';
import Ticker from '../components/home/Ticker.astro';
import HeroPayoff from '../components/home/HeroPayoff.astro';
import ContinueCard from '../components/home/ContinueCard.astro';

const allTopics = await getCollection('topics');
const byNewest = [...allTopics].sort((a, b) => new Date(b.data.dateAdded).getTime() - new Date(a.data.dateAdded).getTime());
const featured = byNewest[0];

const groups = CATEGORIES.map((category, index) => {
  const topics = allTopics
    .filter((t) => t.data.category === category)
    .sort((a, b) => new Date(a.data.dateAdded).getTime() - new Date(b.data.dateAdded).getTime());
  return { category, index, total: topics.length, topics: topics.slice(0, 3) };
}).filter((g) => g.total > 0);

const tickerItems = buildTickerItems(
  allTopics.map((t) => ({ title: t.data.title })),
  glossary as Glossary,
);
---

<BaseLayout title="Make Finance Feel Simple — Finance Fundamentals">
  <section class="border-t-4 border-ink pt-1">
    <div class="grid items-center gap-12 border-t border-ink pb-12 pt-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div>
        <p class="mb-4 font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">Finance, explained properly</p>
        <h1 class="font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl md:text-7xl">
          Make finance feel simple.
        </h1>
        <p class="mt-6 max-w-xl font-serif text-xl leading-relaxed text-ink-muted">
          Clear notes, live diagrams and honest practice for the parts of finance that are actually tested. No textbook fog.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <Button href={`/topics/${getTopicSlug(featured)}`} variant="accent">Start with {featured.data.title}</Button>
          <Button href="/topics" variant="ghost">Browse all notes</Button>
        </div>
      </div>
      <div class="rounded-2xl border border-rule bg-paper-raised p-6 sm:p-8">
        <HeroPayoff />
      </div>
    </div>
  </section>

  <Ticker items={tickerItems} />

  <div class="mt-16">
    <ContinueCard
      slug={getTopicSlug(featured)}
      title={featured.data.title}
      description={featured.data.description}
      category={featured.data.category}
    />
  </div>

  <div class="mt-24 space-y-24">
    {groups.map((group) => (
      <Section
        eyebrow={`${String(group.index + 1).padStart(2, '0')} · ${group.total} ${group.total === 1 ? 'note' : 'notes'}`}
        title={group.category}
      >
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {group.topics.map((topic) => (
            <TopicCard
              slug={getTopicSlug(topic)}
              title={topic.data.title}
              description={topic.data.description}
              category={topic.data.category}
              difficulty={topic.data.difficulty}
              dateAdded={topic.data.dateAdded}
            />
          ))}
        </div>
        <p class="mt-6">
          <a
            href={`/categories/${group.category.toLowerCase().replace(/\s+/g, '-')}`}
            class="inline-flex min-h-[44px] items-center font-sans text-sm font-bold text-ink underline decoration-rust decoration-2 underline-offset-4"
          >All {group.category} notes →</a>
        </p>
      </Section>
    ))}
  </div>
</BaseLayout>
```

- [ ] **Step 8: Delete the old hero components**

```bash
git rm src/components/HeroLayeredComposition.tsx src/components/InteractiveFlashcardsPreview.tsx
grep -rn "HeroLayeredComposition\|InteractiveFlashcardsPreview" src || echo "no references left"
```

- [ ] **Step 9: Verify and commit**

```bash
npm test && npm run build 2>&1 | tail -5
npm run dev
```
Open `/` at 1440 and 390, light and dark. Expected: double-rule masthead, large serif headline, the payoff line draws itself, the marker drops and the profit counter counts up to ₹3,750; the ticker scrolls and pauses on hover; the "Start here" card points at the newest note; category sections numbered 01, 02, … with cards; no horizontal scroll on mobile. With `prefers-reduced-motion` emulated: hero diagram fully drawn, ticker static and scrollable.
```bash
git add -A
git commit -m "feat(home): editorial masthead, living hero diagram, ticker and numbered sections

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 12: Topics index, categories, filter, 404

**Files:**
- Create: `src/lib/filter.ts`, `tests/filter.test.ts`, `src/components/TopicFilter.astro`
- Modify (full rewrite): `src/pages/topics/index.astro`, `src/pages/categories/index.astro`, `src/pages/categories/[category].astro`, `src/pages/404.astro` (read it first; keep its intent)

**Interfaces:**
- Produces: `matchesFilter(card: { category: string; difficulty: string }, state: { category: string; difficulty: string }): boolean` where `'all'` matches anything. `TopicFilter` props `{ categories: readonly string[]; total: number }`; it toggles the Tailwind `hidden` class on every `[data-topic-card]` in the page and updates a live result count.

- [ ] **Step 1: Write the failing test**

`tests/filter.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { matchesFilter } from '../src/lib/filter';

const card = { category: 'Derivatives', difficulty: 'advanced' };

describe('matchesFilter', () => {
  it('matches everything when both filters are "all"', () => {
    expect(matchesFilter(card, { category: 'all', difficulty: 'all' })).toBe(true);
  });
  it('filters by category', () => {
    expect(matchesFilter(card, { category: 'Derivatives', difficulty: 'all' })).toBe(true);
    expect(matchesFilter(card, { category: 'Equities', difficulty: 'all' })).toBe(false);
  });
  it('filters by difficulty', () => {
    expect(matchesFilter(card, { category: 'all', difficulty: 'advanced' })).toBe(true);
    expect(matchesFilter(card, { category: 'all', difficulty: 'beginner' })).toBe(false);
  });
  it('requires both to match', () => {
    expect(matchesFilter(card, { category: 'Derivatives', difficulty: 'beginner' })).toBe(false);
  });
});
```
Run `npm test` → FAIL.

- [ ] **Step 2: Implement `src/lib/filter.ts`**

```ts
export interface FilterState {
  category: string;
  difficulty: string;
}

export function matchesFilter(card: { category: string; difficulty: string }, state: FilterState): boolean {
  const categoryOk = state.category === 'all' || card.category === state.category;
  const difficultyOk = state.difficulty === 'all' || card.difficulty === state.difficulty;
  return categoryOk && difficultyOk;
}
```
Run `npm test` → PASS.

- [ ] **Step 3: `src/components/TopicFilter.astro`** (progressive enhancement: with JS disabled the chips do nothing and every card stays visible)

```astro
---
interface Props {
  categories: readonly string[];
  total: number;
}
const { categories, total } = Astro.props;
const difficulties = ['beginner', 'intermediate', 'advanced'];
const chip = 'min-h-[44px] rounded-full border border-rule px-4 font-sans text-sm font-semibold text-ink-muted transition-colors hover:border-ink/40 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-on-accent';
---
<div id="topic-filter" class="mb-8 space-y-4" data-total={total}>
  <div role="group" aria-label="Filter by category" class="flex flex-wrap gap-2" data-group="category">
    <button type="button" class={chip} data-value="all" aria-pressed="true">All categories</button>
    {categories.map((c) => <button type="button" class={chip} data-value={c} aria-pressed="false">{c}</button>)}
  </div>
  <div role="group" aria-label="Filter by difficulty" class="flex flex-wrap gap-2" data-group="difficulty">
    <button type="button" class={chip} data-value="all" aria-pressed="true">Any level</button>
    {difficulties.map((d) => <button type="button" class={`${chip} capitalize`} data-value={d} aria-pressed="false">{d}</button>)}
  </div>
  <p id="topic-filter-count" class="font-sans text-sm text-ink-muted" aria-live="polite"></p>
  <p id="topic-filter-empty" class="hidden rounded-xl border border-rule bg-paper-raised p-6 text-center font-serif text-ink-muted">
    No notes match those filters yet.
  </p>
</div>

<script>
  import { matchesFilter, type FilterState } from '../lib/filter';

  function init() {
    const root = document.getElementById('topic-filter');
    if (!root) return;
    const state: FilterState = { category: 'all', difficulty: 'all' };
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-topic-card]'));
    const count = document.getElementById('topic-filter-count')!;
    const empty = document.getElementById('topic-filter-empty')!;
    const total = Number(root.dataset.total ?? cards.length);

    const apply = () => {
      let shown = 0;
      for (const card of cards) {
        const ok = matchesFilter(
          { category: card.dataset.category ?? '', difficulty: card.dataset.difficulty ?? '' },
          state,
        );
        card.classList.toggle('hidden', !ok);
        if (ok) shown++;
      }
      count.textContent = `Showing ${shown} of ${total} notes`;
      empty.classList.toggle('hidden', shown !== 0);
    };

    root.querySelectorAll<HTMLElement>('[data-group]').forEach((group) => {
      const key = group.dataset.group as keyof FilterState;
      group.addEventListener('click', (e) => {
        const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-value]');
        if (!button) return;
        state[key] = button.dataset.value ?? 'all';
        group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        apply();
      });
    });
    apply();
  }
  document.addEventListener('astro:page-load', init);
</script>
```

- [ ] **Step 4: Rewrite `src/pages/topics/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import { CATEGORIES } from '../../content/config';
import { getTopicSlug } from '../../utils/topic-loader';
import TopicCard from '../../components/topic/TopicCard.astro';
import TopicFilter from '../../components/TopicFilter.astro';

const allTopics = await getCollection('topics');
allTopics.sort((a, b) => new Date(b.data.dateAdded).getTime() - new Date(a.data.dateAdded).getTime());
---

<BaseLayout title="All Topics — Finance Fundamentals">
  <header class="mb-10 border-t-4 border-ink pt-1">
    <div class="border-t border-ink pt-8">
      <p class="mb-3 font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">The library</p>
      <h1 class="font-serif text-5xl font-semibold tracking-tight text-ink md:text-6xl">All notes</h1>
      <p class="mt-4 max-w-2xl font-serif text-xl text-ink-muted">
        Every finance concept on the site, newest first. {allTopics.length} notes and counting.
      </p>
    </div>
  </header>

  <TopicFilter categories={CATEGORIES} total={allTopics.length} />

  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {allTopics.map((topic) => (
      <TopicCard
        slug={getTopicSlug(topic)}
        title={topic.data.title}
        description={topic.data.description}
        category={topic.data.category}
        difficulty={topic.data.difficulty}
        dateAdded={topic.data.dateAdded}
      />
    ))}
  </div>
</BaseLayout>
```

- [ ] **Step 5: Rewrite `src/pages/categories/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import { CATEGORIES } from '../../content/config';
import Card from '../../components/ui/Card.astro';

const allTopics = await getCollection('topics');
const categories = CATEGORIES.map((category, index) => ({
  category,
  numeral: String(index + 1).padStart(2, '0'),
  slug: category.toLowerCase().replace(/\s+/g, '-'),
  count: allTopics.filter((t) => t.data.category === category).length,
}));
---

<BaseLayout title="Categories — Finance Fundamentals">
  <header class="mb-10 border-t-4 border-ink pt-1">
    <div class="border-t border-ink pt-8">
      <p class="mb-3 font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">Sections</p>
      <h1 class="font-serif text-5xl font-semibold tracking-tight text-ink md:text-6xl">Finance categories</h1>
      <p class="mt-4 max-w-2xl font-serif text-xl text-ink-muted">Explore notes grouped by core financial domain.</p>
    </div>
  </header>

  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {categories.map((c) => (
      <Card href={`/categories/${c.slug}`} class="group">
        <p class="font-serif text-5xl font-light text-rust">{c.numeral}</p>
        <h2 class="mt-3 font-serif text-2xl font-semibold text-ink">{c.category}</h2>
        <p class="mt-1 font-sans text-sm text-ink-muted">
          {c.count === 0 ? 'Coming soon' : `${c.count} ${c.count === 1 ? 'note' : 'notes'}`}
        </p>
      </Card>
    ))}
  </div>
</BaseLayout>
```

- [ ] **Step 6: Rewrite `src/pages/categories/[category].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import { CATEGORIES } from '../../content/config';
import { getTopicSlug } from '../../utils/topic-loader';
import TopicCard from '../../components/topic/TopicCard.astro';

export async function getStaticPaths() {
  const allTopics = await getCollection('topics');
  return CATEGORIES.map((category) => ({
    params: { category: category.toLowerCase().replace(/\s+/g, '-') },
    props: { categoryName: category, topics: allTopics.filter((t) => t.data.category === category) },
  }));
}

const { categoryName, topics } = Astro.props;
---

<BaseLayout title={`${categoryName} — Finance Fundamentals`}>
  <header class="mb-10 border-t-4 border-ink pt-1">
    <div class="border-t border-ink pt-8">
      <a href="/categories" class="font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust hover:underline">← All categories</a>
      <h1 class="mt-3 font-serif text-5xl font-semibold tracking-tight text-ink md:text-6xl">{categoryName}</h1>
      <p class="mt-4 max-w-2xl font-serif text-xl text-ink-muted">
        {topics.length} {topics.length === 1 ? 'note' : 'notes'} in {categoryName}.
      </p>
    </div>
  </header>

  {topics.length === 0 ? (
    <div class="rounded-2xl border border-rule bg-paper-raised p-12 text-center">
      <p class="mb-4 font-serif text-xl text-ink-muted">No notes in {categoryName} yet.</p>
      <p class="font-mono text-sm text-ink-muted">Run `npm run new-topic` to add one.</p>
    </div>
  ) : (
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => (
        <TopicCard
          slug={getTopicSlug(topic)}
          title={topic.data.title}
          description={topic.data.description}
          category={topic.data.category}
          difficulty={topic.data.difficulty}
          dateAdded={topic.data.dateAdded}
        />
      ))}
    </div>
  )}
</BaseLayout>
```

- [ ] **Step 7: Restyle `404.astro`**

Read the file, keep its message and links, and rebuild it with the new primitives:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Button from '../components/ui/Button.astro';
---
<BaseLayout title="Page not found">
  <div class="mx-auto max-w-xl py-24 text-center">
    <p class="font-serif text-8xl font-light text-rust">404</p>
    <h1 class="mt-4 font-serif text-4xl font-semibold text-ink">That page has gone out of print.</h1>
    <p class="mt-4 font-serif text-lg text-ink-muted">The link may be old, or the note may have moved.</p>
    <div class="mt-8 flex justify-center gap-3">
      <Button href="/" variant="accent">Back home</Button>
      <Button href="/topics" variant="ghost">Browse notes</Button>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 8: Verify and commit**

```bash
npm test && npm run build 2>&1 | tail -5
npm run dev
```
Open `/topics`: chips filter the grid instantly, the count text reads "Showing N of 28 notes", selecting a category/level combination with no notes shows the empty message, each chip group keeps exactly one pressed. Open `/categories`, a populated category, an empty one (if any), and `/nonexistent` (404). Check light, dark, and 390px width.
```bash
git add -A
git commit -m "feat(browse): editorial topics index with filter, categories and 404

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 13: Polish, cleanup, verification

**Files:**
- Modify: `README.md`; any leftover legacy-styled files found by the sweep

- [ ] **Step 1: Sweep for leftover legacy styling**

```bash
grep -rnE "bg-slate-|text-slate-|border-slate-|from-blue|to-blue|text-blue-|bg-blue-|dark:bg-\[#|dark:text-white|stone-" src --include=*.astro --include=*.tsx --include=*.css | grep -v "PayoffChart.tsx" | head -40
```
Expected leftovers to migrate: `HeroMotion.tsx`/`ScrollReveal.tsx` should have none (they only animate). Fix any hit in pages/components by switching to token classes (`bg-paper`, `bg-paper-raised`, `text-ink`, `text-ink-muted`, `border-rule`, `text-rust`). Re-run until the only remaining matches are the intentional dark tooltip in `PayoffChart.tsx`.

- [ ] **Step 2: Reduced-motion and no-JS pass**

With devtools "Emulate prefers-reduced-motion: reduce": home, a topic page, and the quiz/flashcards show no animation; `<Hl>` highlights fully visible; the diagram fully drawn; ticker static. With JavaScript disabled (devtools → Disable JavaScript) on `/topics/option-greeks-pricing-models-implied-volatility`: all prose visible, `<Hl>` highlighted, `<Term>` definitions appear on hover. Fix anything that hides content without JS.

- [ ] **Step 3: Accessibility and performance audit**

```bash
npm run build && npm run preview &
sleep 3
npx --yes lighthouse http://localhost:4321/ --only-categories=accessibility,performance,best-practices --chrome-flags="--headless" --output=json --output-path=/tmp/lh-home.json --quiet
npx --yes lighthouse http://localhost:4321/topics/time-value-of-money --only-categories=accessibility,performance,best-practices --chrome-flags="--headless" --output=json --output-path=/tmp/lh-topic.json --quiet
node -e "for (const f of ['home','topic']) { const r = require('/tmp/lh-'+f+'.json'); console.log(f, Object.fromEntries(Object.entries(r.categories).map(([k,v])=>[k,Math.round(v.score*100)]))); }"
npx --yes @axe-core/cli http://localhost:4321/ http://localhost:4321/topics/time-value-of-money --exit
kill %1
```
Targets: accessibility ≥ 95 and no axe violations on both pages; performance ≥ 85 (mobile default). If a score misses, fix the specific failing audit (common ones: missing alt/aria names, contrast, unused JS) and re-run; record final numbers for the PR description.

- [ ] **Step 4: Update `README.md`**

Add a "Design system" section covering: where tokens live (`src/styles/tokens.css`), how to retheme, the UI kit locations, the opt-in MDX components (`<Hl>`, `<Note>`, `<Term term="…">` with `src/data/glossary.json`), and `npm test`. Keep existing README content.

- [ ] **Step 5: Final verification**

```bash
npm test && npm run build 2>&1 | tail -8
git status --short
```
Expected: all tests pass, build completes, working tree only contains the intended changes.

- [ ] **Step 6: Commit, push, and hand off**

```bash
git add -A
git commit -m "chore(design): polish pass, legacy style cleanup and docs

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```
Then share the branch URL and the Vercel preview URL for the owner's review: `https://github.com/amateurcoder015/finance-fundamentals-learning-site/tree/redesign/editorial`. Merging to `main` is the owner's decision.
