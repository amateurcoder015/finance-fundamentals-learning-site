# Interactive Explainers and Better Diagram Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four interactive, tested explainers (time value of money, futures pricing, options suite, margin ledger) that appear on eight chapters, and convert five chapters' diagrams to better-fitting Mermaid types.

**Architecture:** Pure maths lives in `src/explainers/<name>/model.ts` (unit-tested against the chapters' worked examples). Thin React UIs sit on a shared kit in `src/components/explainer/kit/`. Chapters opt in with an `explainers:` frontmatter line; `Explainers.astro` renders each as a `client:visible` island whose server render already shows the chapter example (so no-JS readers see real numbers). Diagram changes extend the existing `Diagram` engine's theme variables and add optional extra diagram files per chapter.

**Tech Stack:** Astro 5, React 19 islands, Tailwind 3.4 (token colours), KaTeX (already a dependency), Mermaid 11.17.2 (pinned), Vitest 5, hand-built SVG charts. Node 22.

**Spec:** `docs/superpowers/specs/2026-10-01-interactive-explainers-design.md`

**Deviations from the spec, decided while planning (spec to be updated in Task 1):**
1. The frontmatter schema field is defined inside `src/content/config.ts` with Astro's `z` (not imported from a lib), to avoid mixing zod instances; only the resolver and types live in `src/lib/explainer-refs.ts`.
2. Because each explainer's **default state is the chapter's worked example** and the island is server-rendered, the "static no-JS summary" is the server-rendered explainer itself (no separate summary module). A runtime error boundary shows a short message instead.
3. The `view` prop only selects the **initially active tab** of the options suite; all three tabs stay available.
4. Margining and position-limits each get an optional second diagram file (`diagram-2.mmd`) so no content is lost when the first diagram becomes a state diagram. The topic loader gains `extraDiagrams`.

## Global Constraints

- Work on branch `explainers`. Push to it after every task. **Never push to `main` or `redesign/editorial`.**
- `npm run build` and `npm test` must pass at every commit.
- No new runtime dependencies (KaTeX, React, zod are already installed). No chart library: charts are hand-built SVG. Only existing dev dependency Vitest is used for tests.
- Colours come only from the design tokens (Tailwind `paper`, `paper-raised`, `ink`, `ink-muted`, `rule`, `rust`, `gold`, `success`, `danger`, `on-accent`); no hardcoded hex in new UI.
- Default currency symbol is `$` (the chapters' worked examples use `$`); every explainer takes a `currency` prop.
- Chapter edits are limited to **one added `explainers:` line in each of the eight chapters' frontmatter**, and diagram files for the five converted chapters. No note body is edited.
- Touch targets are at least 44px (`min-h-[44px]`). Reduced motion is honoured (no explainer animation). Dark mode must work.
- Models are pure TypeScript with no DOM or React imports, and never return `NaN` for any slider-reachable input (degenerate inputs give finite documented values).
- Explainers are lazy islands (`client:visible`); a chapter without one loads no extra JavaScript. Each explainer's own chunk stays under 40 KB gzipped excluding KaTeX.
- Commit messages end with: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`
- Visual/behaviour checks use headless Chrome `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` driven by puppeteer-core installed in the scratchpad folder `/private/tmp/claude-502/-Users-TonyStark-Desktop-web/9307dea8-7f4a-48d9-b69e-d93b0a2dc22b/scratchpad/pp` (install there if missing; throwaway scripts stay out of the repo).

## Review Focus

1. Slider extremes and degenerate inputs (rate 0, years 0, T 0, σ at minimum, empty/partial number-field text) must never show `NaN`/`Infinity`/crash; formatters guard and models return finite values. Pinned by model tests (Tasks 4, 6, 9, 11) and format tests (Task 2); partial typing is checked in the browser (Task 5).
2. Server render and client first render must match (no random ids, no `Date`, deterministic formatting) so there are no hydration warnings. Verified in headless Chrome console in Tasks 5, 7, 10, 12.
3. An unknown explainer name or view in frontmatter must fail the build with the valid options listed. Pinned by `explainer-refs.test.ts` (Task 1) and a manual build check.
4. Dark mode and reduced motion: charts and controls use token classes only; no explainer animation. Verified in the browser per explainer.
5. Non-flowchart diagrams must degrade gracefully: no walk controls, no broken reveal, themed in both modes, zoom/pan/fullscreen still work. Verified in Task 13.

---

## File Structure

**Create**
- `src/lib/explainer-refs.ts` — `ExplainerRef` types and `resolveExplainerRefs`
- `src/lib/explainer-format.ts` — money/percent/number formatters, TeX helpers
- `src/lib/chart-scales.ts` — `extent`, `linearScale`, `niceTicks`, `linePath`
- `src/lib/payoff.ts` — `positionPnL`, `netPnL`, `summarisePayoff` (shared with `PayoffChart`)
- `src/utils/extra-diagrams.ts` — `parseDiagramTitle`, `readExtraDiagrams`
- `src/explainers/types.ts`, `src/explainers/registry.ts`
- `src/explainers/time-value-of-money/{model.ts,index.tsx}`
- `src/explainers/futures-pricing/{model.ts,index.tsx}`
- `src/explainers/options-suite/{model.ts,index.tsx,PayoffView.tsx,GreeksView.tsx,ParityView.tsx}`
- `src/explainers/margin-ledger/{model.ts,index.tsx}`
- `src/components/explainer/kit/{Slider,Readout,FormulaBlock,ChartFrame,ExampleBar,Tabs,ExplainerFrame}.tsx`
- `src/components/explainer/Explainers.astro`
- `src/content/topics/{margining-mark-to-market-span,position-limits-risk-management}/diagram-2.mmd`
- `tests/{explainer-refs,explainer-format,chart-scales,kit,tvm,futures-pricing,payoff,options-model,margin-ledger,extra-diagrams}.test.ts(x)`

**Modify**
`vitest.config.ts`, `src/content/config.ts`, `src/components/PayoffChart.tsx`, `src/lib/diagram-theme.ts` (+ `tests/diagram-theme.test.ts`), `src/utils/topic-loader.ts`, `src/pages/topics/[slug].astro`, `README.md`, the specification document, eight chapters' frontmatter, and five chapters' `diagram.mmd`.

---

### Task 1: Explainer infrastructure (schema, resolver, registry, section, page wiring)

**Files:**
- Create: `src/lib/explainer-refs.ts`, `tests/explainer-refs.test.ts`, `src/explainers/types.ts`, `src/explainers/registry.ts`, `src/components/explainer/Explainers.astro`
- Modify: `src/content/config.ts`, `src/pages/topics/[slug].astro`, `docs/superpowers/specs/2026-10-01-interactive-explainers-design.md`

**Interfaces:**
- Produces: `type ExplainerRef = string | { name: string; view?: string }`; `interface ResolvedExplainerRef { name: string; view?: string }`; `resolveExplainerRefs(refs: ExplainerRef[], registry: Record<string, { views?: readonly string[] }>, topic?: string): ResolvedExplainerRef[]` (throws on unknown name/view). `ExplainerProps { view?: string; currency?: string }`, `ExplainerMeta { title: string; views?: readonly string[] }`, `registry: Record<string, ExplainerMeta>` (empty for now). Frontmatter field `explainers` (default `[]`). `Explainers.astro` props `{ refs: ResolvedExplainerRef[]; currency?: string }` with a `components` map that later tasks extend. A "Try it yourself" section with `id="explainers"` and a contents-rail entry when refs exist.

- [ ] **Step 1: Switch branch and confirm baseline**

```bash
cd /Users/TonyStark/Desktop/web/finance-fundamentals-learning-site
git checkout explainers
npm install
npm test 2>&1 | tail -5
npm run build 2>&1 | tail -3
```
Expected: 80 tests pass, build completes. If either fails before any change, stop and report.

- [ ] **Step 2: Write the failing resolver tests**

`tests/explainer-refs.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { resolveExplainerRefs } from '../src/lib/explainer-refs';

const registry = {
  'time-value-of-money': {},
  'options-suite': { views: ['payoff', 'greeks', 'parity'] as const },
};

describe('resolveExplainerRefs', () => {
  it('accepts a bare name', () => {
    expect(resolveExplainerRefs(['time-value-of-money'], registry)).toEqual([
      { name: 'time-value-of-money', view: undefined },
    ]);
  });

  it('accepts an object with a valid view', () => {
    expect(resolveExplainerRefs([{ name: 'options-suite', view: 'greeks' }], registry)).toEqual([
      { name: 'options-suite', view: 'greeks' },
    ]);
  });

  it('keeps order and allows several explainers', () => {
    const out = resolveExplainerRefs(['time-value-of-money', { name: 'options-suite' }], registry);
    expect(out.map((r) => r.name)).toEqual(['time-value-of-money', 'options-suite']);
  });

  it('fails loudly for an unknown name, listing valid ones and the topic', () => {
    expect(() => resolveExplainerRefs(['nope'], registry, 'my-topic')).toThrow(/Unknown explainer "nope" in topic 'my-topic'/);
    expect(() => resolveExplainerRefs(['nope'], registry)).toThrow(/options-suite, time-value-of-money/);
  });

  it('fails for an unknown view, listing valid views', () => {
    expect(() => resolveExplainerRefs([{ name: 'options-suite', view: 'delta' }], registry)).toThrow(
      /Unknown view "delta" for explainer "options-suite".*payoff, greeks, parity/,
    );
  });

  it('fails when a view is given for an explainer that has none', () => {
    expect(() => resolveExplainerRefs([{ name: 'time-value-of-money', view: 'x' }], registry)).toThrow(
      /this explainer has no views/,
    );
  });

  it('does not treat inherited object properties as explainers', () => {
    expect(() => resolveExplainerRefs(['constructor'], registry)).toThrow(/Unknown explainer/);
  });

  it('returns an empty list for no refs', () => {
    expect(resolveExplainerRefs([], registry)).toEqual([]);
  });
});
```
Run: `npm test -- explainer-refs` → Expected FAIL (module missing).

- [ ] **Step 3: Implement `src/lib/explainer-refs.ts`**

```ts
export type ExplainerRef = string | { name: string; view?: string };

export interface ResolvedExplainerRef {
  name: string;
  view?: string;
}

export interface RegistryEntryLike {
  views?: readonly string[];
}

/**
 * Validates frontmatter explainer references against the registry.
 * Unknown names or views throw with the valid options listed, so a typo fails the build.
 */
export function resolveExplainerRefs(
  refs: ExplainerRef[],
  registry: Record<string, RegistryEntryLike>,
  topic = 'unknown',
): ResolvedExplainerRef[] {
  const names = Object.keys(registry).sort();
  return refs.map((ref) => {
    const name = typeof ref === 'string' ? ref : ref.name;
    const view = typeof ref === 'string' ? undefined : ref.view;
    if (!Object.prototype.hasOwnProperty.call(registry, name)) {
      throw new Error(
        `[Content Validation Error] Unknown explainer "${name}" in topic '${topic}'. Valid explainers: ${
          names.join(', ') || '(none registered)'
        }`,
      );
    }
    if (view !== undefined) {
      const views = registry[name].views ?? [];
      if (!views.includes(view)) {
        throw new Error(
          `[Content Validation Error] Unknown view "${view}" for explainer "${name}" in topic '${topic}'. Valid views: ${
            views.join(', ') || '(this explainer has no views)'
          }`,
        );
      }
    }
    return { name, view };
  });
}
```
Run: `npm test -- explainer-refs` → Expected PASS.

- [ ] **Step 4: Types, empty registry, schema field**

`src/explainers/types.ts`:
```ts
export interface ExplainerProps {
  view?: string;
  currency?: string;
}

export interface ExplainerMeta {
  title: string;
  views?: readonly string[];
}

/** A line on a chart, produced by pure models and drawn by the chart kit. */
export interface ModelSeries {
  id: string;
  label: string;
  points: Array<[number, number]>;
  tone?: 'ink' | 'rust' | 'success' | 'danger' | 'muted';
  dashed?: boolean;
}
```

`src/explainers/registry.ts`:
```ts
import type { ExplainerMeta } from './types';

/** Explainer name -> metadata. Each explainer task adds its entry here. */
export const registry: Record<string, ExplainerMeta> = {};
```

In `src/content/config.ts`, add to `topicFrontmatterSchema` (after `tags`):
```ts
  explainers: z
    .array(
      z.union([
        z.string().min(1),
        z.object({ name: z.string().min(1), view: z.string().min(1).optional() }),
      ]),
    )
    .default([]),
```

- [ ] **Step 5: `Explainers.astro`**

```astro
---
import type { ResolvedExplainerRef } from '../../lib/explainer-refs';
import Section from '../ui/Section.astro';

interface Props {
  refs: ResolvedExplainerRef[];
  currency?: string;
}
const { refs, currency = '$' } = Astro.props;

// Explainer components are added here as they are built (name -> component).
const components: Record<string, any> = {};
---
{refs.length > 0 && (
  <Section id="explainers" eyebrow="Try it yourself" title="Explore the numbers">
    <div class="space-y-10">
      {refs.map((ref) => {
        const Component = components[ref.name];
        if (!Component) {
          throw new Error(`[Content Validation Error] Explainer "${ref.name}" is registered but has no component in Explainers.astro`);
        }
        return <Component client:visible view={ref.view} currency={currency} />;
      })}
    </div>
  </Section>
)}
```

- [ ] **Step 6: Wire into the topic page**

In `src/pages/topics/[slug].astro` frontmatter add imports and logic:
```ts
import Explainers from '../../components/explainer/Explainers.astro';
import { registry } from '../../explainers/registry';
import { resolveExplainerRefs } from '../../lib/explainer-refs';
```
After `const contents = ...`:
```ts
const explainerRefs = resolveExplainerRefs(topic.data.explainers, registry, slug);
```
Change `extras` so the explainers entry comes first when present:
```ts
const extras = [
  ...(explainerRefs.length > 0 ? [{ href: '#explainers', label: 'Try it yourself' }] : []),
  { href: '#visual-model', label: 'The picture' },
  { href: '#flashcards-deck', label: `Flashcards (${auxiliary.flashcards.length})` },
  { href: '#quiz-section', label: `Quiz (${auxiliary.quiz.length})` },
];
```
Insert between the `</article>` and `<Section id="visual-model" …>`:
```astro
      <Explainers refs={explainerRefs} />
```

- [ ] **Step 7: Update the spec**

In `docs/superpowers/specs/2026-10-01-interactive-explainers-design.md` add a short "Decisions made while planning" section listing the four deviations from this plan's header.

- [ ] **Step 8: Verify, including the loud-failure check**

```bash
npm test && npm run build 2>&1 | tail -3
```
Expected: all tests pass; build completes (no chapter has `explainers` yet, so nothing renders). Then temporarily add `explainers: ["nope"]` to the frontmatter of `src/content/topics/time-value-of-money/note.mdx`, run `npm run build`, and confirm it FAILS with `Unknown explainer "nope" in topic 'time-value-of-money'. Valid explainers: (none registered)`. Revert the frontmatter change (`git checkout -- src/content/topics/time-value-of-money/note.mdx`) and confirm the build passes again.

- [ ] **Step 9: Commit and push**

```bash
git add -A
git commit -m "feat(explainers): schema field, resolver, registry and topic-page section

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 2: Formatting and chart-scale helpers (pure, tested)

**Files:**
- Create: `src/lib/explainer-format.ts`, `src/lib/chart-scales.ts`, `tests/explainer-format.test.ts`, `tests/chart-scales.test.ts`

**Interfaces:**
- Produces:
  - `formatNumber(value: number, digits?: number): string` (en-US grouping; non-finite → `'—'`)
  - `formatMoney(value: number, currency?: string, digits?: number): string` (`-$1,234.50`; never `-$0.00`; non-finite → `'—'`)
  - `formatPercent(value: number, digits?: number): string` (`0.08` → `'8.00%'`)
  - `texNumber(value: number, digits?: number): string` (thousands as `{,}`), `texMoney(value, currency?, digits?)`, `texPlain(value: number, digits?: number): string` (trailing zeros trimmed)
  - `extent(values: number[]): [number, number]`, `linearScale(domain, range): (x: number) => number`, `niceTicks(min, max, count?): number[]`, `linePath(points): string`

- [ ] **Step 1: Write the failing tests**

`tests/explainer-format.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatMoney, formatNumber, formatPercent, texMoney, texNumber, texPlain } from '../src/lib/explainer-format';

describe('formatNumber', () => {
  it('groups thousands and fixes digits', () => {
    expect(formatNumber(14693.28)).toBe('14,693.28');
    expect(formatNumber(2, 0)).toBe('2');
  });
  it('shows a dash for non-finite values', () => {
    expect(formatNumber(NaN)).toBe('—');
    expect(formatNumber(Infinity)).toBe('—');
    expect(formatNumber(-Infinity)).toBe('—');
  });
});

describe('formatMoney', () => {
  it('formats with the currency symbol', () => {
    expect(formatMoney(14693.28)).toBe('$14,693.28');
    expect(formatMoney(1250, '₹')).toBe('₹1,250.00');
  });
  it('puts the minus before the symbol', () => {
    expect(formatMoney(-500)).toBe('-$500.00');
  });
  it('never shows a negative zero', () => {
    expect(formatMoney(-0.001)).toBe('$0.00');
    expect(formatMoney(-0)).toBe('$0.00');
  });
  it('guards non-finite values', () => {
    expect(formatMoney(NaN)).toBe('—');
    expect(formatMoney(Infinity)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('formats a fraction as a percentage', () => {
    expect(formatPercent(0.08)).toBe('8.00%');
    expect(formatPercent(0.0525, 1)).toBe('5.3%');
    expect(formatPercent(NaN)).toBe('—');
  });
});

describe('TeX helpers', () => {
  it('escapes the dollar sign and uses TeX thousands separators', () => {
    expect(texMoney(10000)).toBe('\\$10{,}000.00');
    expect(texMoney(-500)).toBe('-\\$500.00');
    expect(texNumber(1234567.891, 1)).toBe('1{,}234{,}567.9');
  });
  it('trims trailing zeros for plain numbers', () => {
    expect(texPlain(0.08)).toBe('0.08');
    expect(texPlain(5, 4)).toBe('5');
    expect(texPlain(0.123456, 4)).toBe('0.1235');
  });
});
```

`tests/chart-scales.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { extent, linePath, linearScale, niceTicks } from '../src/lib/chart-scales';

describe('extent', () => {
  it('returns min and max', () => expect(extent([3, 1, 2])).toEqual([1, 3]));
  it('widens a constant series so it can be drawn', () => {
    const [lo, hi] = extent([5, 5, 5]);
    expect(lo).toBeLessThan(5);
    expect(hi).toBeGreaterThan(5);
  });
  it('widens an all-zero series', () => {
    const [lo, hi] = extent([0, 0]);
    expect(hi).toBeGreaterThan(lo);
  });
  it('ignores non-finite values and handles empty input', () => {
    expect(extent([1, NaN, 3])).toEqual([1, 3]);
    expect(extent([])).toEqual([0, 1]);
  });
});

describe('linearScale', () => {
  it('maps the domain ends to the range ends', () => {
    const s = linearScale([0, 10], [100, 200]);
    expect(s(0)).toBe(100);
    expect(s(10)).toBe(200);
    expect(s(5)).toBe(150);
  });
  it('supports an inverted range (SVG y axis)', () => {
    const s = linearScale([0, 1], [300, 0]);
    expect(s(0)).toBe(300);
    expect(s(1)).toBe(0);
  });
  it('returns the range midpoint for a zero-width domain', () => {
    expect(linearScale([2, 2], [0, 10])(2)).toBe(5);
  });
});

describe('niceTicks', () => {
  it('chooses round steps', () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });
  it('handles negative ranges', () => {
    const t = niceTicks(-50, 50, 5);
    expect(t).toContain(0);
    expect(t.every((v) => v >= -50 && v <= 50)).toBe(true);
  });
  it('returns a single tick for an empty range', () => {
    expect(niceTicks(3, 3)).toEqual([3]);
  });
});

describe('linePath', () => {
  it('builds an SVG path', () => {
    expect(linePath([[0, 1], [2.5, 3]])).toBe('M 0.00 1.00 L 2.50 3.00');
  });
  it('is empty for no points', () => {
    expect(linePath([])).toBe('');
  });
});
```
Run `npm test -- explainer-format chart-scales` → Expected FAIL.

- [ ] **Step 2: Implement `src/lib/explainer-format.ts`**

```ts
const nf = (digits: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return nf(digits).format(value);
}

export function formatMoney(value: number, currency = '$', digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = formatNumber(Math.abs(value), digits);
  const isZero = Number(magnitude.replace(/,/g, '')) === 0;
  return `${value < 0 && !isZero ? '-' : ''}${currency}${magnitude}`;
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return `${formatNumber(value * 100, digits)}%`;
}

export function texNumber(value: number, digits = 2): string {
  return formatNumber(value, digits).replace(/,/g, '{,}');
}

export function texMoney(value: number, currency = '$', digits = 2): string {
  if (!Number.isFinite(value)) return '\\text{n/a}';
  const symbol = currency === '$' ? '\\$' : currency;
  const magnitude = texNumber(Math.abs(value), digits);
  const isZero = Number(formatNumber(Math.abs(value), digits).replace(/,/g, '')) === 0;
  return `${value < 0 && !isZero ? '-' : ''}${symbol}${magnitude}`;
}

export function texPlain(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '\\text{n/a}';
  return String(Number(value.toFixed(digits)));
}
```

- [ ] **Step 3: Implement `src/lib/chart-scales.ts`**

```ts
export function extent(values: number[]): [number, number] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [0, 1];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    return [min - pad, max + pad];
  }
  return [min, max];
}

export function linearScale(domain: [number, number], range: [number, number]): (x: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (d0 === d1) return () => (r0 + r1) / 2;
  return (x) => r0 + ((x - d0) / (d1 - d0)) * (r1 - r0);
}

export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min];
  const raw = (max - min) / Math.max(1, count);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalised = raw / magnitude;
  const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude;
  const start = Math.ceil(min / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-9; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
}

export function linePath(points: Array<[number, number]>): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
}
```
Run `npm test -- explainer-format chart-scales` → Expected PASS.

- [ ] **Step 4: Verify and commit**

```bash
npm test && npm run build 2>&1 | tail -3
git add -A
git commit -m "feat(explainers): pure formatting and chart-scale helpers with tests

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 3: Explainer UI kit

**Files:**
- Create: `src/components/explainer/kit/{Slider,Readout,FormulaBlock,ChartFrame,ExampleBar,Tabs,ExplainerFrame}.tsx`, `tests/kit.test.tsx`
- Modify: `vitest.config.ts`

**Interfaces:**
- Produces (all named exports, React function components):
  - `Slider({ label, value, min, max, step, onChange, format?, suffix?, hint? })` — range + number input; number field keeps its own text while typing; clamps to `[min, max]`.
  - `Readout({ items: ReadoutItem[], label? })`, `ReadoutItem { label: string; value: string; tone?: 'default'|'positive'|'negative'|'accent'; hint?: string }`.
  - `FormulaBlock({ tex, label? })` — KaTeX display block.
  - `ChartFrame({ series: ChartSeries[], xLabel, yLabel, summary, formatX?, formatY?, markers?, height?, includeZeroY?, tableRows? })` with `ChartSeries = ModelSeries` shape and `ChartMarker { x: number; label: string; tone? }`; renders `<figure>` with `role="img"` SVG, a visible summary caption, a hover/tap readout line, and a `<details>` data table.
  - `ExampleBar({ examples: { label: string; apply: () => void }[] })` — buttons for each example plus "Reset" (re-applies the first).
  - `Tabs({ tabs: {id,label}[], active, onChange, children })` — accessible tablist/tabpanel with arrow-key navigation.
  - `ExplainerFrame({ title, description?, children })` — card with `<h3>` and an error boundary.

- [ ] **Step 1: Make Vitest able to render components**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: Write the failing render tests**

`tests/kit.test.tsx`:
```tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Slider } from '../src/components/explainer/kit/Slider';
import { Readout } from '../src/components/explainer/kit/Readout';
import { FormulaBlock } from '../src/components/explainer/kit/FormulaBlock';
import { ChartFrame } from '../src/components/explainer/kit/ChartFrame';
import { ExampleBar } from '../src/components/explainer/kit/ExampleBar';
import { Tabs } from '../src/components/explainer/kit/Tabs';
import { ExplainerFrame } from '../src/components/explainer/kit/ExplainerFrame';

const noop = () => {};

describe('Slider', () => {
  it('renders a labelled range and a number field', () => {
    const html = renderToStaticMarkup(<Slider label="Rate" value={8} min={0} max={30} step={0.1} onChange={noop} suffix="%" />);
    expect(html).toContain('Rate');
    expect(html).toContain('type="range"');
    expect(html).toContain('type="number"');
    expect(html).toContain('aria-valuetext="8%"');
  });
  it('uses the supplied formatter for the readable value', () => {
    const html = renderToStaticMarkup(<Slider label="Years" value={5} min={0} max={40} step={1} onChange={noop} format={(v) => `${v} yr`} />);
    expect(html).toContain('5 yr');
  });
});

describe('Readout', () => {
  it('renders every item as a term/definition pair', () => {
    const html = renderToStaticMarkup(<Readout items={[{ label: 'Future value', value: '$14,693.28' }, { label: 'Interest', value: '$4,693.28', tone: 'positive' }]} />);
    expect(html).toContain('<dl');
    expect(html).toContain('Future value');
    expect(html).toContain('$14,693.28');
    expect(html).toContain('$4,693.28');
  });
});

describe('FormulaBlock', () => {
  it('renders KaTeX markup', () => {
    const html = renderToStaticMarkup(<FormulaBlock tex="x^2 + 1" />);
    expect(html).toContain('katex');
  });
  it('does not throw on invalid TeX', () => {
    expect(() => renderToStaticMarkup(<FormulaBlock tex="\\frac{" />)).not.toThrow();
  });
});

describe('ChartFrame', () => {
  const series = [
    { id: 'a', label: 'Balance', points: [[0, 100], [1, 120], [2, 150]] as Array<[number, number]>, tone: 'rust' as const },
    { id: 'b', label: 'Invested', points: [[0, 100], [2, 100]] as Array<[number, number]>, tone: 'muted' as const, dashed: true },
  ];
  it('renders paths, the summary caption and a data table', () => {
    const html = renderToStaticMarkup(<ChartFrame series={series} xLabel="Years" yLabel="Value" summary="Balance grows from 100 to 150." />);
    expect(html).toContain('<path');
    expect(html).toContain('Balance grows from 100 to 150.');
    expect(html).toContain('<details');
    expect(html).toContain('<table');
    expect(html).toContain('role="img"');
  });
  it('renders without crashing for a single constant point', () => {
    const html = renderToStaticMarkup(<ChartFrame series={[{ id: 'a', label: 'A', points: [[1, 5]] }]} xLabel="x" yLabel="y" summary="One point." />);
    expect(html).not.toContain('NaN');
  });
  it('renders markers', () => {
    const html = renderToStaticMarkup(<ChartFrame series={series} xLabel="x" yLabel="y" summary="s" markers={[{ x: 1, label: 'Today' }]} />);
    expect(html).toContain('Today');
  });
});

describe('ExampleBar', () => {
  it('renders each example and a Reset button', () => {
    const html = renderToStaticMarkup(<ExampleBar examples={[{ label: 'Chapter example', apply: noop }, { label: 'With dividends', apply: noop }]} />);
    expect(html).toContain('Chapter example');
    expect(html).toContain('With dividends');
    expect(html).toContain('Reset');
  });
});

describe('Tabs', () => {
  it('renders a tablist with the active tab selected', () => {
    const html = renderToStaticMarkup(
      <Tabs tabs={[{ id: 'a', label: 'One' }, { id: 'b', label: 'Two' }]} active="b" onChange={noop}>
        <p>Panel content</p>
      </Tabs>,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toMatch(/aria-selected="true"[^>]*>Two|>Two<[^]*aria-selected="true"/);
    expect(html).toContain('Panel content');
  });
});

describe('ExplainerFrame', () => {
  it('renders the title as a heading and its children', () => {
    const html = renderToStaticMarkup(<ExplainerFrame title="Time value of money"><p>Body</p></ExplainerFrame>);
    expect(html).toContain('<h3');
    expect(html).toContain('Time value of money');
    expect(html).toContain('Body');
  });
});
```
Run `npm test -- kit` → Expected FAIL (modules missing).

- [ ] **Step 3: `Slider.tsx`**

```tsx
import React, { useEffect, useId, useState } from 'react';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  suffix?: string;
  hint?: string;
}

const trim = (v: number) => String(Number(v.toFixed(6)));

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange, format, suffix = '', hint }) => {
  const id = useId();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const [text, setText] = useState(trim(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setText(trim(value));
  }, [value, editing]);

  const display = `${format ? format(value) : trim(value)}${suffix}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`${id}-range`} className="font-sans text-sm font-semibold text-ink">{label}</label>
        <span className="font-mono text-sm font-semibold text-rust" aria-hidden="true">{display}</span>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-valuetext={display}
        className="h-11 w-full cursor-pointer accent-[rgb(var(--rust))]"
      />
      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-num`} className="sr-only">{label} (exact value)</label>
        <input
          id={`${id}-num`}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={text}
          onFocus={() => setEditing(true)}
          onBlur={() => {
            setEditing(false);
            setText(trim(value));
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value);
            if (e.target.value.trim() !== '' && Number.isFinite(n)) onChange(clamp(n));
          }}
          className="min-h-[44px] w-32 rounded-lg border border-rule bg-paper px-3 font-mono text-sm text-ink"
        />
        {hint && <span className="font-sans text-xs text-ink-muted">{hint}</span>}
      </div>
    </div>
  );
};

export default Slider;
```

- [ ] **Step 4: `Readout.tsx` and `ExampleBar.tsx`**

`Readout.tsx`:
```tsx
import React from 'react';

export interface ReadoutItem {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative' | 'accent';
  hint?: string;
}

const TONE: Record<NonNullable<ReadoutItem['tone']>, string> = {
  default: 'text-ink',
  positive: 'text-success',
  negative: 'text-danger',
  accent: 'text-rust',
};

export const Readout: React.FC<{ items: ReadoutItem[]; label?: string }> = ({ items, label = 'Results' }) => (
  <dl aria-label={label} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {items.map((item) => (
      <div key={item.label} className="rounded-xl border border-rule bg-paper p-3">
        <dt className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">{item.label}</dt>
        <dd className={`mt-1 font-mono text-lg font-semibold ${TONE[item.tone ?? 'default']}`}>{item.value}</dd>
        {item.hint && <dd className="mt-0.5 font-sans text-xs text-ink-muted">{item.hint}</dd>}
      </div>
    ))}
  </dl>
);

export default Readout;
```

`ExampleBar.tsx`:
```tsx
import React from 'react';

export interface ExampleOption {
  label: string;
  apply: () => void;
}

const btn =
  'inline-flex min-h-[44px] items-center rounded-full border border-rule bg-paper px-4 font-sans text-sm font-semibold text-ink hover:border-ink/40';

export const ExampleBar: React.FC<{ examples: ExampleOption[] }> = ({ examples }) => (
  <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Examples">
    {examples.map((example) => (
      <button key={example.label} type="button" onClick={example.apply} className={btn}>
        {example.label}
      </button>
    ))}
    {examples.length > 0 && (
      <button type="button" onClick={examples[0].apply} className={`${btn} text-ink-muted`}>
        Reset
      </button>
    )}
  </div>
);

export default ExampleBar;
```

- [ ] **Step 5: `FormulaBlock.tsx`**

```tsx
import React, { useMemo } from 'react';
import katex from 'katex';

export const FormulaBlock: React.FC<{ tex: string; label?: string }> = ({ tex, label }) => {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: true, throwOnError: false, output: 'htmlAndMathml', trust: false }),
    [tex],
  );
  return (
    <div
      role="group"
      aria-label={label ?? 'Formula with your current values'}
      className="overflow-x-auto rounded-xl border border-rule bg-paper p-4 [&_.katex-display]:m-0 [&_.katex-display]:border-0 [&_.katex-display]:bg-transparent [&_.katex-display]:p-0 [&_.katex-display]:shadow-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default FormulaBlock;
```

- [ ] **Step 6: `ChartFrame.tsx`**

```tsx
import React, { useId, useState } from 'react';
import { extent, linePath, linearScale, niceTicks } from '../../../lib/chart-scales';

export type ChartTone = 'ink' | 'rust' | 'success' | 'danger' | 'muted';

export interface ChartSeries {
  id: string;
  label: string;
  points: Array<[number, number]>;
  tone?: ChartTone;
  dashed?: boolean;
}

export interface ChartMarker {
  x: number;
  label: string;
  tone?: ChartTone;
}

export interface ChartFrameProps {
  series: ChartSeries[];
  xLabel: string;
  yLabel: string;
  summary: string;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  markers?: ChartMarker[];
  height?: number;
  includeZeroY?: boolean;
  tableRows?: number;
}

const STROKE: Record<ChartTone, string> = {
  ink: 'stroke-ink',
  rust: 'stroke-rust',
  success: 'stroke-success',
  danger: 'stroke-danger',
  muted: 'stroke-ink-muted',
};
const FILL: Record<ChartTone, string> = {
  ink: 'fill-ink',
  rust: 'fill-rust',
  success: 'fill-success',
  danger: 'fill-danger',
  muted: 'fill-ink-muted',
};
const SWATCH: Record<ChartTone, string> = {
  ink: 'bg-ink',
  rust: 'bg-rust',
  success: 'bg-success',
  danger: 'bg-danger',
  muted: 'bg-ink-muted',
};

const W = 640;
const M = { l: 68, r: 20, t: 16, b: 52 };
const defaultFormat = (v: number) => String(Number(v.toFixed(2)));

function nearest(points: Array<[number, number]>, x: number): [number, number] | null {
  if (points.length === 0) return null;
  let best = points[0];
  for (const p of points) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
  return best;
}

export const ChartFrame: React.FC<ChartFrameProps> = ({
  series,
  xLabel,
  yLabel,
  summary,
  formatX = defaultFormat,
  formatY = defaultFormat,
  markers = [],
  height = 340,
  includeZeroY = false,
  tableRows = 10,
}) => {
  const uid = useId();
  const [hoverX, setHoverX] = useState<number | null>(null);

  const all = series.flatMap((s) => s.points);
  const [x0, x1] = extent(all.map((p) => p[0]));
  let [y0, y1] = extent(all.map((p) => p[1]));
  if (includeZeroY) {
    y0 = Math.min(y0, 0);
    y1 = Math.max(y1, 0);
  }
  const sx = linearScale([x0, x1], [M.l, W - M.r]);
  const sy = linearScale([y0, y1], [height - M.b, M.t]);
  const xTicks = niceTicks(x0, x1, 6);
  const yTicks = niceTicks(y0, y1, 5);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const x = x0 + ((px - M.l) / (W - M.l - M.r)) * (x1 - x0);
    setHoverX(Math.min(x1, Math.max(x0, x)));
  };

  const primary = series[0]?.points ?? [];
  const step = Math.max(1, Math.floor(primary.length / tableRows));
  const tableXs = primary.filter((_, i) => i % step === 0 || i === primary.length - 1).map((p) => p[0]);

  const hoverText =
    hoverX === null
      ? 'Hover or tap the chart to read exact values.'
      : `${xLabel} ${formatX(nearest(primary, hoverX)?.[0] ?? hoverX)}: ` +
        series
          .map((s) => {
            const p = nearest(s.points, hoverX);
            return `${s.label} ${p ? formatY(p[1]) : '—'}`;
          })
          .join(' · ');

  return (
    <figure className="space-y-3">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={summary}
        className="w-full touch-pan-y select-none text-[11px]"
        onPointerMove={onMove}
        onPointerLeave={() => setHoverX(null)}
      >
        {yTicks.map((t) => (
          <g key={`y-${uid}-${t}`}>
            <line x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} className="stroke-rule" strokeWidth={1} />
            <text x={M.l - 8} y={sy(t) + 4} textAnchor="end" className="fill-ink-muted font-mono">{formatY(t)}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={`x-${uid}-${t}`}>
            <line x1={sx(t)} x2={sx(t)} y1={M.t} y2={height - M.b} className="stroke-rule" strokeWidth={1} />
            <text x={sx(t)} y={height - M.b + 18} textAnchor="middle" className="fill-ink-muted font-mono">{formatX(t)}</text>
          </g>
        ))}
        <text x={(M.l + W - M.r) / 2} y={height - 8} textAnchor="middle" className="fill-ink font-sans text-xs font-semibold">{xLabel}</text>
        <text transform={`translate(14 ${(M.t + height - M.b) / 2}) rotate(-90)`} textAnchor="middle" className="fill-ink font-sans text-xs font-semibold">{yLabel}</text>

        {markers.map((m) => (
          <g key={`m-${uid}-${m.label}-${m.x}`}>
            <line x1={sx(m.x)} x2={sx(m.x)} y1={M.t} y2={height - M.b} className={STROKE[m.tone ?? 'ink']} strokeWidth={1.5} strokeDasharray="4 4" />
            <text x={sx(m.x)} y={M.t + 10} textAnchor="middle" className={`${FILL[m.tone ?? 'ink']} font-sans text-[10px] font-bold`}>{m.label}</text>
          </g>
        ))}

        {series.map((s) => (
          <path
            key={s.id}
            d={linePath(s.points.map(([x, y]) => [sx(x), sy(y)] as [number, number]))}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? '6 5' : undefined}
            className={STROKE[s.tone ?? 'ink']}
          />
        ))}

        {hoverX !== null && (
          <g>
            <line x1={sx(hoverX)} x2={sx(hoverX)} y1={M.t} y2={height - M.b} className="stroke-ink-muted" strokeWidth={1} />
            {series.map((s) => {
              const p = nearest(s.points, hoverX);
              return p ? <circle key={s.id} cx={sx(p[0])} cy={sy(p[1])} r={4} className={`${FILL[s.tone ?? 'ink']} stroke-paper`} strokeWidth={2} /> : null;
            })}
          </g>
        )}
      </svg>

      <p className="min-h-[1.25rem] font-mono text-xs text-ink-muted">{hoverText}</p>

      <ul className="flex flex-wrap gap-x-5 gap-y-1 font-sans text-xs text-ink-muted">
        {series.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <span className={`inline-block h-[3px] w-5 ${SWATCH[s.tone ?? 'ink']}`} aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ul>

      <figcaption className="font-serif text-sm italic text-ink-muted">{summary}</figcaption>

      <details className="font-sans text-sm text-ink">
        <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-semibold text-rust">Show data table</summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full border-collapse text-left font-mono text-xs">
            <thead>
              <tr>
                <th className="border-b-2 border-ink px-2 py-1">{xLabel}</th>
                {series.map((s) => (
                  <th key={s.id} className="border-b-2 border-ink px-2 py-1">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableXs.map((x) => (
                <tr key={x}>
                  <td className="border-b border-rule px-2 py-1">{formatX(x)}</td>
                  {series.map((s) => {
                    const p = nearest(s.points, x);
                    return <td key={s.id} className="border-b border-rule px-2 py-1">{p ? formatY(p[1]) : '—'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
};

export default ChartFrame;
```

- [ ] **Step 7: `Tabs.tsx` and `ExplainerFrame.tsx`**

`Tabs.tsx`:
```tsx
import React, { useId } from 'react';

export interface TabItem {
  id: string;
  label: string;
}

export const Tabs: React.FC<{
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  children: React.ReactNode;
}> = ({ tabs, active, onChange, children }) => {
  const base = useId();
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === active);
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[next].id);
    document.getElementById(`${base}-tab-${tabs[next].id}`)?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Views" onKeyDown={onKeyDown} className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`${base}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={`inline-flex min-h-[44px] items-center rounded-full border px-5 font-sans text-sm font-bold ${
                selected ? 'border-ink bg-ink text-on-accent' : 'border-rule bg-paper text-ink hover:border-ink/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`}>
        {children}
      </div>
    </div>
  );
};

export default Tabs;
```

`ExplainerFrame.tsx`:
```tsx
import React from 'react';

class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Explainer error:', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert" className="rounded-xl border border-rule bg-paper p-4 font-sans text-sm text-ink">
          This interactive could not load. The worked example is described in the note above.
        </div>
      );
    }
    return this.props.children;
  }
}

export const ExplainerFrame: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <section aria-label={title} className="rounded-2xl border border-rule bg-paper-raised p-5 sm:p-8">
    <h3 className="font-serif text-2xl font-semibold tracking-tight text-ink">{title}</h3>
    {description && <p className="mb-6 mt-1 font-serif text-base text-ink-muted">{description}</p>}
    <Boundary>{children}</Boundary>
  </section>
);

export default ExplainerFrame;
```
Run `npm test -- kit` → Expected PASS. If the Tabs `aria-selected` regex assertion proves brittle because of attribute order, replace it with two separate `toContain('aria-selected="true"')` / `toContain('aria-selected="false"')` assertions.

- [ ] **Step 8: Verify and commit**

```bash
npm test && npm run build 2>&1 | tail -3
git add -A
git commit -m "feat(explainers): shared UI kit (slider, readout, formula, chart, tabs, frame) with render tests

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 4: Time value of money model (pure, tested)

**Files:**
- Create: `src/explainers/time-value-of-money/model.ts`, `tests/tvm.test.ts`

**Interfaces:**
- Consumes: `texMoney`, `texPlain` from `src/lib/explainer-format.ts`; `ModelSeries` from `src/explainers/types.ts`.
- Produces: `type TvmMode = 'lump-fv'|'lump-pv'|'ordinary-annuity'|'annuity-due'|'perpetuity'`; `interface TvmInputs { mode: TvmMode; amount: number; rate: number; years: number; compounding: number }` (rate is a fraction, e.g. `0.08`); `TVM_DEFAULTS` (chapter example: `lump-fv`, 10000, 0.08, 5, 1); `futureValue(pv, rate, years, m?)`, `presentValue(fv, rate, years, m?)`, `annuityPV(pmt, rate, n, timing?)`, `annuityFV(pmt, rate, n, timing?)`, `perpetuityPV(pmt, rate)`; `interface TvmRow { label: string; value: number; kind: 'money'|'percent' }`; `evaluateTvm(i): { primary: TvmRow; rows: TvmRow[] }`; `tvmChart(i): { title: string; xLabel: string; yLabel: string; series: ModelSeries[]; marker?: { x: number; label: string }; xKind: 'years'|'percent' }`; `tvmFormulaTex(i, currency?): string`.

- [ ] **Step 1: Write the failing tests**

`tests/tvm.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  TVM_DEFAULTS,
  annuityFV,
  annuityPV,
  evaluateTvm,
  futureValue,
  perpetuityPV,
  presentValue,
  tvmChart,
  tvmFormulaTex,
  type TvmInputs,
} from '../src/explainers/time-value-of-money/model';

describe('lump sum (chapter worked example)', () => {
  it('$10,000 at 8% for 5 years compounded annually is $14,693.28', () => {
    expect(futureValue(10000, 0.08, 5)).toBeCloseTo(14693.28, 2);
  });
  it('discounting reverses compounding', () => {
    expect(presentValue(14693.280768, 0.08, 5)).toBeCloseTo(10000, 4);
  });
  it('more frequent compounding gives more: $1,000 at 12% quarterly for 1 year', () => {
    expect(futureValue(1000, 0.12, 1, 4)).toBeCloseTo(1125.5088, 4);
  });
  it('zero years or zero rate leaves the amount unchanged', () => {
    expect(futureValue(500, 0.08, 0)).toBe(500);
    expect(futureValue(500, 0, 10)).toBe(500);
  });
});

describe('annuities', () => {
  it('ordinary annuity PV and FV (formula check: $1,000, 5%, 3 periods)', () => {
    expect(annuityPV(1000, 0.05, 3)).toBeCloseTo(2723.2480, 3);
    expect(annuityFV(1000, 0.05, 3)).toBeCloseTo(3152.5, 3);
  });
  it('annuity due is the ordinary value times (1 + r)', () => {
    expect(annuityPV(1000, 0.05, 3, 'due')).toBeCloseTo(2723.248 * 1.05, 3);
    expect(annuityFV(1000, 0.05, 3, 'due')).toBeCloseTo(3152.5 * 1.05, 3);
  });
  it('at a zero rate annuity formulas fall back to payment times periods', () => {
    expect(annuityPV(1000, 0, 4)).toBe(4000);
    expect(annuityFV(1000, 0, 4)).toBe(4000);
    expect(Number.isFinite(annuityPV(1000, 0, 4, 'due'))).toBe(true);
  });
  it('zero periods is worth nothing', () => {
    expect(annuityPV(1000, 0.05, 0)).toBe(0);
    expect(annuityFV(1000, 0.05, 0)).toBe(0);
  });
});

describe('perpetuity', () => {
  it('is payment divided by rate', () => {
    expect(perpetuityPV(1000, 0.05)).toBeCloseTo(20000, 6);
  });
  it('is infinite (not NaN) at a zero rate', () => {
    expect(perpetuityPV(1000, 0)).toBe(Infinity);
  });
});

describe('evaluateTvm', () => {
  it('lump-fv reproduces the chapter numbers', () => {
    const r = evaluateTvm(TVM_DEFAULTS);
    expect(r.primary.label).toBe('Future value');
    expect(r.primary.value).toBeCloseTo(14693.28, 2);
    const interest = r.rows.find((x) => x.label === 'Interest earned');
    expect(interest?.value).toBeCloseTo(4693.28, 2);
  });
  it('lump-pv returns the present value of a target amount', () => {
    const r = evaluateTvm({ ...TVM_DEFAULTS, mode: 'lump-pv', amount: 14693.28 });
    expect(r.primary.label).toBe('Present value');
    expect(r.primary.value).toBeCloseTo(10000, 1);
  });
  it('annuity rows include total payments and the interest component', () => {
    const r = evaluateTvm({ mode: 'ordinary-annuity', amount: 1000, rate: 0.05, years: 3, compounding: 1 });
    expect(r.rows.find((x) => x.label === 'Total paid in')?.value).toBe(3000);
    expect(r.rows.find((x) => x.label === 'Interest component')?.value).toBeCloseTo(152.5, 3);
  });
  it('never returns NaN for slider extremes', () => {
    const modes = ['lump-fv', 'lump-pv', 'ordinary-annuity', 'annuity-due', 'perpetuity'] as const;
    for (const mode of modes) {
      for (const rate of [0, 0.001, 0.3]) {
        for (const years of [0, 1, 40]) {
          for (const compounding of [1, 365]) {
            const r = evaluateTvm({ mode, amount: 10000, rate, years, compounding } as TvmInputs);
            for (const row of [r.primary, ...r.rows]) expect(Number.isNaN(row.value)).toBe(false);
          }
        }
      }
    }
  });
});

describe('tvmChart', () => {
  it('lump-fv starts at the deposit and ends at the future value', () => {
    const c = tvmChart(TVM_DEFAULTS);
    const balance = c.series.find((s) => s.id === 'balance')!;
    expect(balance.points[0]).toEqual([0, 10000]);
    const last = balance.points[balance.points.length - 1];
    expect(last[0]).toBeCloseTo(5, 6);
    expect(last[1]).toBeCloseTo(14693.28, 2);
    expect(c.xKind).toBe('years');
  });
  it('annuity chart has one point per period plus the start', () => {
    const c = tvmChart({ mode: 'ordinary-annuity', amount: 1000, rate: 0.05, years: 3, compounding: 1 });
    expect(c.series[0].points).toHaveLength(4);
  });
  it('perpetuity chart plots present value against rate and marks the current rate', () => {
    const c = tvmChart({ mode: 'perpetuity', amount: 1000, rate: 0.05, years: 0, compounding: 1 });
    expect(c.xKind).toBe('percent');
    expect(c.marker?.x).toBeCloseTo(5, 6);
  });
  it('contains no NaN or infinite y values at extremes', () => {
    for (const mode of ['lump-fv', 'lump-pv', 'ordinary-annuity', 'annuity-due', 'perpetuity'] as const) {
      const c = tvmChart({ mode, amount: 10000, rate: 0, years: 0, compounding: 365 });
      for (const s of c.series) for (const [x, y] of s.points) {
        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(y)).toBe(true);
      }
    }
  });
});

describe('tvmFormulaTex', () => {
  it('substitutes the learner numbers into the lump-sum formula', () => {
    const tex = tvmFormulaTex(TVM_DEFAULTS);
    expect(tex).toContain('10{,}000.00');
    expect(tex).toContain('14{,}693.28');
    expect(tex).toContain('0.08');
  });
  it('handles a zero-rate annuity and perpetuity without dividing by zero', () => {
    expect(tvmFormulaTex({ mode: 'ordinary-annuity', amount: 1000, rate: 0, years: 4, compounding: 1 })).not.toContain('NaN');
    expect(tvmFormulaTex({ mode: 'perpetuity', amount: 1000, rate: 0, years: 0, compounding: 1 })).toContain('\\infty');
  });
});
```
Run `npm test -- tvm` → Expected FAIL.

- [ ] **Step 2: Implement `src/explainers/time-value-of-money/model.ts`**

```ts
import { texMoney, texPlain } from '../../lib/explainer-format';
import type { ModelSeries } from '../types';

export type TvmMode = 'lump-fv' | 'lump-pv' | 'ordinary-annuity' | 'annuity-due' | 'perpetuity';
export type AnnuityTiming = 'ordinary' | 'due';

export interface TvmInputs {
  mode: TvmMode;
  amount: number;
  /** Annual rate as a fraction (0.08 = 8%). */
  rate: number;
  years: number;
  /** Compounding periods per year (lump-sum modes only). */
  compounding: number;
}

/** The chapter's worked example: $10,000 at 8% for 5 years, compounded annually. */
export const TVM_DEFAULTS: TvmInputs = { mode: 'lump-fv', amount: 10000, rate: 0.08, years: 5, compounding: 1 };

export function futureValue(pv: number, rate: number, years: number, m = 1): number {
  return pv * Math.pow(1 + rate / m, years * m);
}

export function presentValue(fv: number, rate: number, years: number, m = 1): number {
  return fv / Math.pow(1 + rate / m, years * m);
}

export function annuityPV(pmt: number, rate: number, n: number, timing: AnnuityTiming = 'ordinary'): number {
  const ordinary = rate === 0 ? pmt * n : (pmt * (1 - Math.pow(1 + rate, -n))) / rate;
  return timing === 'due' ? ordinary * (1 + rate) : ordinary;
}

export function annuityFV(pmt: number, rate: number, n: number, timing: AnnuityTiming = 'ordinary'): number {
  const ordinary = rate === 0 ? pmt * n : (pmt * (Math.pow(1 + rate, n) - 1)) / rate;
  return timing === 'due' ? ordinary * (1 + rate) : ordinary;
}

export function perpetuityPV(pmt: number, rate: number): number {
  return rate > 0 ? pmt / rate : Infinity;
}

export interface TvmRow {
  label: string;
  value: number;
  kind: 'money' | 'percent';
}

const periods = (years: number) => Math.max(0, Math.round(years));
const timingOf = (mode: TvmMode): AnnuityTiming => (mode === 'annuity-due' ? 'due' : 'ordinary');

export function evaluateTvm(i: TvmInputs): { primary: TvmRow; rows: TvmRow[] } {
  const years = Math.max(0, i.years);
  switch (i.mode) {
    case 'lump-fv': {
      const fv = futureValue(i.amount, i.rate, years, i.compounding);
      return {
        primary: { label: 'Future value', value: fv, kind: 'money' },
        rows: [
          { label: 'Interest earned', value: fv - i.amount, kind: 'money' },
          { label: 'Effective annual rate', value: Math.pow(1 + i.rate / i.compounding, i.compounding) - 1, kind: 'percent' },
        ],
      };
    }
    case 'lump-pv': {
      const pv = presentValue(i.amount, i.rate, years, i.compounding);
      return {
        primary: { label: 'Present value', value: pv, kind: 'money' },
        rows: [{ label: 'Discount applied', value: i.amount - pv, kind: 'money' }],
      };
    }
    case 'ordinary-annuity':
    case 'annuity-due': {
      const n = periods(years);
      const timing = timingOf(i.mode);
      const pv = annuityPV(i.amount, i.rate, n, timing);
      const fv = annuityFV(i.amount, i.rate, n, timing);
      const paid = i.amount * n;
      return {
        primary: { label: 'Present value of payments', value: pv, kind: 'money' },
        rows: [
          { label: 'Future value of payments', value: fv, kind: 'money' },
          { label: 'Total paid in', value: paid, kind: 'money' },
          { label: 'Interest component', value: fv - paid, kind: 'money' },
        ],
      };
    }
    case 'perpetuity': {
      return {
        primary: { label: 'Present value', value: perpetuityPV(i.amount, i.rate), kind: 'money' },
        rows: [{ label: 'Payment each year', value: i.amount, kind: 'money' }],
      };
    }
  }
}

export interface TvmChart {
  title: string;
  xLabel: string;
  yLabel: string;
  xKind: 'years' | 'percent';
  series: ModelSeries[];
  marker?: { x: number; label: string };
}

const STEPS = 60;
const grid = (end: number) => Array.from({ length: STEPS + 1 }, (_, k) => (end * k) / STEPS);
const finite = (v: number) => (Number.isFinite(v) ? v : 0);

export function tvmChart(i: TvmInputs): TvmChart {
  const years = Math.max(0, i.years);
  switch (i.mode) {
    case 'lump-fv':
      return {
        title: 'Growth of your deposit',
        xLabel: 'Years',
        yLabel: 'Balance',
        xKind: 'years',
        series: [
          { id: 'balance', label: 'Balance', tone: 'rust', points: grid(years).map((t) => [t, finite(futureValue(i.amount, i.rate, t, i.compounding))]) },
          { id: 'principal', label: 'Amount deposited', tone: 'muted', dashed: true, points: [[0, i.amount], [years, i.amount]] },
        ],
      };
    case 'lump-pv':
      return {
        title: 'Value of the target amount over time',
        xLabel: 'Years from today',
        yLabel: 'Value',
        xKind: 'years',
        series: [
          { id: 'value', label: 'Value today and onward', tone: 'rust', points: grid(years).map((t) => [t, finite(presentValue(i.amount, i.rate, Math.max(0, years - t), i.compounding))]) },
          { id: 'target', label: 'Target amount', tone: 'muted', dashed: true, points: [[0, i.amount], [years, i.amount]] },
        ],
      };
    case 'ordinary-annuity':
    case 'annuity-due': {
      const n = periods(years);
      const timing = timingOf(i.mode);
      return {
        title: 'Account balance as payments are made',
        xLabel: 'Payments made',
        yLabel: 'Balance',
        xKind: 'years',
        series: [
          { id: 'balance', label: 'Account balance', tone: 'rust', points: Array.from({ length: n + 1 }, (_, k) => [k, finite(annuityFV(i.amount, i.rate, k, timing))] as [number, number]) },
          { id: 'paid', label: 'Total paid in', tone: 'muted', dashed: true, points: Array.from({ length: n + 1 }, (_, k) => [k, i.amount * k] as [number, number]) },
        ],
      };
    }
    case 'perpetuity': {
      const rates = Array.from({ length: 40 }, (_, k) => 0.005 * (k + 1));
      return {
        title: 'Present value of a perpetuity at different discount rates',
        xLabel: 'Discount rate (%)',
        yLabel: 'Present value',
        xKind: 'percent',
        series: [{ id: 'pv', label: 'Present value', tone: 'rust', points: rates.map((r) => [r * 100, perpetuityPV(i.amount, r)] as [number, number]) }],
        marker: { x: i.rate * 100, label: 'Your rate' },
      };
    }
  }
}

export function tvmFormulaTex(i: TvmInputs, currency = '$'): string {
  const money = (v: number) => texMoney(v, currency);
  const r = texPlain(i.rate, 4);
  const years = Math.max(0, i.years);
  const n = periods(years);
  switch (i.mode) {
    case 'lump-fv': {
      const m = i.compounding;
      const fv = futureValue(i.amount, i.rate, years, m);
      return `FV = PV\\left(1+\\frac{r}{m}\\right)^{nm} = ${money(i.amount)}\\left(1+\\frac{${r}}{${m}}\\right)^{${texPlain(years)}\\times ${m}} = ${money(fv)}`;
    }
    case 'lump-pv': {
      const m = i.compounding;
      const pv = presentValue(i.amount, i.rate, years, m);
      return `PV = \\frac{FV}{\\left(1+\\frac{r}{m}\\right)^{nm}} = \\frac{${money(i.amount)}}{\\left(1+\\frac{${r}}{${m}}\\right)^{${texPlain(years)}\\times ${m}}} = ${money(pv)}`;
    }
    case 'ordinary-annuity': {
      const pv = annuityPV(i.amount, i.rate, n);
      if (i.rate === 0) return `PV = PMT \\times n = ${money(i.amount)} \\times ${n} = ${money(pv)}`;
      return `PV = PMT\\left[\\frac{1-(1+r)^{-n}}{r}\\right] = ${money(i.amount)}\\left[\\frac{1-(1+${r})^{-${n}}}{${r}}\\right] = ${money(pv)}`;
    }
    case 'annuity-due': {
      const ordinary = annuityPV(i.amount, i.rate, n);
      const due = annuityPV(i.amount, i.rate, n, 'due');
      return `PV_{\\text{due}} = PV_{\\text{ordinary}}(1+r) = ${money(ordinary)} \\times (1+${r}) = ${money(due)}`;
    }
    case 'perpetuity': {
      if (i.rate <= 0) return `PV = \\frac{PMT}{r} \\to \\infty \\quad (r = 0)`;
      return `PV = \\frac{PMT}{r} = \\frac{${money(i.amount)}}{${r}} = ${money(perpetuityPV(i.amount, i.rate))}`;
    }
  }
}
```
Run `npm test -- tvm` → Expected PASS. If a numeric expectation is off in the 4th decimal because of how it was derived (the annuity vectors are formula checks, not chapter numbers), recompute it independently (e.g. in Node) and correct the test value, not the model.

- [ ] **Step 3: Verify and commit**

```bash
npm test && npm run build 2>&1 | tail -3
git add -A
git commit -m "feat(explainers): time value of money model with chapter-pinned tests

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 5: Time value of money explainer UI and chapter wiring

**Files:**
- Create: `src/explainers/time-value-of-money/index.tsx`
- Modify: `src/explainers/registry.ts`, `src/components/explainer/Explainers.astro`, `src/content/topics/time-value-of-money/note.mdx` (frontmatter line only)

**Interfaces:**
- Consumes: Task 3 kit, Task 4 model, `ExplainerProps`.
- Produces: default export `TimeValueOfMoney(props: ExplainerProps)`; registry entry `'time-value-of-money'`; the chapter shows "Try it yourself".

- [ ] **Step 1: Write `index.tsx`**

```tsx
import React, { useState } from 'react';
import { ExplainerFrame } from '../../components/explainer/kit/ExplainerFrame';
import { Slider } from '../../components/explainer/kit/Slider';
import { Readout, type ReadoutItem } from '../../components/explainer/kit/Readout';
import { FormulaBlock } from '../../components/explainer/kit/FormulaBlock';
import { ChartFrame } from '../../components/explainer/kit/ChartFrame';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { formatMoney, formatNumber, formatPercent } from '../../lib/explainer-format';
import type { ExplainerProps } from '../types';
import { TVM_DEFAULTS, evaluateTvm, tvmChart, tvmFormulaTex, type TvmInputs, type TvmMode, type TvmRow } from './model';

const MODES: Array<{ id: TvmMode; label: string }> = [
  { id: 'lump-fv', label: 'Future value of a deposit' },
  { id: 'lump-pv', label: 'Present value of a target' },
  { id: 'ordinary-annuity', label: 'Annuity (end of year)' },
  { id: 'annuity-due', label: 'Annuity due (start of year)' },
  { id: 'perpetuity', label: 'Perpetuity' },
];

const COMPOUNDING = [
  { value: 1, label: 'Annually' },
  { value: 2, label: 'Semi-annually' },
  { value: 4, label: 'Quarterly' },
  { value: 12, label: 'Monthly' },
  { value: 365, label: 'Daily' },
];

const AMOUNT_LABEL: Record<TvmMode, string> = {
  'lump-fv': 'Amount deposited today (PV)',
  'lump-pv': 'Target amount (FV)',
  'ordinary-annuity': 'Payment each year',
  'annuity-due': 'Payment each year',
  perpetuity: 'Payment each year',
};

function Inner({ currency }: { currency: string }) {
  const [inputs, setInputs] = useState<TvmInputs>(TVM_DEFAULTS);
  const set = (patch: Partial<TvmInputs>) => setInputs((p) => ({ ...p, ...patch }));
  const result = evaluateTvm(inputs);
  const chart = tvmChart(inputs);
  const isLump = inputs.mode === 'lump-fv' || inputs.mode === 'lump-pv';
  const isPerpetuity = inputs.mode === 'perpetuity';

  const fmt = (row: TvmRow) => (row.kind === 'percent' ? formatPercent(row.value) : formatMoney(row.value, currency));
  const items: ReadoutItem[] = [
    { label: result.primary.label, value: fmt(result.primary), tone: 'accent' },
    ...result.rows.map((row) => ({ label: row.label, value: fmt(row) })),
  ];

  const first = chart.series[0].points[0];
  const lastPoints = chart.series[0].points;
  const last = lastPoints[lastPoints.length - 1];
  const summary = `${chart.title}. Starts at ${formatMoney(first[1], currency)} and ends at ${formatMoney(last[1], currency)}.`;
  const xFormat = chart.xKind === 'percent' ? (v: number) => `${formatNumber(v, 1)}%` : (v: number) => formatNumber(v, v % 1 === 0 ? 0 : 1);

  return (
    <div className="space-y-6">
      <ExampleBar examples={[{ label: 'Chapter example: $10,000 at 8% for 5 years', apply: () => setInputs(TVM_DEFAULTS) }]} />

      <div role="radiogroup" aria-label="What do you want to find?" className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={inputs.mode === m.id}
            onClick={() => set({ mode: m.id })}
            className={`inline-flex min-h-[44px] items-center rounded-full border px-4 font-sans text-sm font-semibold ${
              inputs.mode === m.id ? 'border-ink bg-ink text-on-accent' : 'border-rule bg-paper text-ink hover:border-ink/40'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Slider label={AMOUNT_LABEL[inputs.mode]} value={inputs.amount} min={0} max={100000} step={100} onChange={(amount) => set({ amount })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Annual interest rate" value={Number((inputs.rate * 100).toFixed(4))} min={0} max={30} step={0.1} onChange={(v) => set({ rate: v / 100 })} format={(v) => v.toFixed(1)} suffix="%" />
          {!isPerpetuity && (
            <Slider label={isLump ? 'Years' : 'Number of yearly payments'} value={inputs.years} min={0} max={40} step={1} onChange={(years) => set({ years })} />
          )}
          {isLump && (
            <div className="space-y-1.5">
              <label htmlFor="tvm-compounding" className="font-sans text-sm font-semibold text-ink">Compounding</label>
              <select
                id="tvm-compounding"
                value={inputs.compounding}
                onChange={(e) => set({ compounding: Number(e.target.value) })}
                className="min-h-[44px] w-full rounded-lg border border-rule bg-paper px-3 font-sans text-sm text-ink"
              >
                {COMPOUNDING.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <ChartFrame
          series={chart.series}
          xLabel={chart.xLabel}
          yLabel={chart.yLabel}
          summary={summary}
          formatX={xFormat}
          formatY={(v) => formatMoney(v, currency, 0)}
          markers={chart.marker ? [{ x: chart.marker.x, label: chart.marker.label, tone: 'rust' }] : []}
          includeZeroY
        />
      </div>

      <Readout items={items} />
      <FormulaBlock tex={tvmFormulaTex(inputs, currency)} />
    </div>
  );
}

export default function TimeValueOfMoney({ currency = '$' }: ExplainerProps) {
  return (
    <ExplainerFrame title="Time value of money" description="Change the amount, rate and time and watch the value move. It opens on the chapter's worked example.">
      <Inner currency={currency} />
    </ExplainerFrame>
  );
}
```

- [ ] **Step 2: Register and wire**

`src/explainers/registry.ts`:
```ts
export const registry: Record<string, ExplainerMeta> = {
  'time-value-of-money': { title: 'Time value of money' },
};
```
`src/components/explainer/Explainers.astro` — add `import TimeValueOfMoney from '../../explainers/time-value-of-money/index';` and set `const components: Record<string, any> = { 'time-value-of-money': TimeValueOfMoney };`.

In `src/content/topics/time-value-of-money/note.mdx`, add one line to the frontmatter directly after the `tags:` line: `explainers: ["time-value-of-money"]`.

- [ ] **Step 3: Verify build and tests**

```bash
npm test && npm run build 2>&1 | tail -4
```
Expected: pass. Check the built HTML contains the server-rendered chapter numbers: `grep -c "14,693.28" dist/topics/time-value-of-money/index.html` → at least 1.

- [ ] **Step 4: Verify in headless Chrome (dev server on port 4321)**

On `/topics/time-value-of-money`: (a) the "Try it yourself" section exists, the contents rail has a "Try it yourself" link, and the readout shows `$14,693.28` and `$4,693.28` on load; (b) no console errors or hydration warnings (ignore the dev favicon 404) — scroll the section into view so the island hydrates; (c) setting the rate slider to 0, years to 0, and each mode in turn never shows `NaN` or `Infinity` anywhere in the section text (`!/NaN|Infinity/.test(sectionText)`); perpetuity at rate 0 shows `—`; (d) typing into the exact-value number field: clear it, type `-`, then `12.` then `12.5` — the field never crashes or snaps back mid-typing, and the slider ends at 12.5; (e) clicking "Reset" restores the chapter example; (f) the data-table `<details>` opens and lists rows; (g) dark mode: toggle the theme, confirm chart lines and text use token colours (screenshot both themes and view them); (h) reduced motion emulation shows no animation (there is none); (i) with JavaScript disabled the section still shows the chapter numbers and formula (server render); (j) axe has no violations on the page in light and dark. Fix anything that fails.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat(explainers): time value of money explainer on the TVM chapter

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 6: Futures pricing model (pure, tested)

**Files:**
- Create: `src/explainers/futures-pricing/model.ts`, `tests/futures-pricing.test.ts`

**Interfaces:**
- Consumes: `texMoney`, `texPlain`; `ModelSeries`.
- Produces: `futuresPrice(spot, rate, carryYield, years): number` (`F = S·e^{(r−q)T}`); `basisSpotMinusFutures(spot, futures): number` (the chapter defines basis as `S − F`); `type MarketStructure = 'contango'|'backwardation'|'flat'`; `marketStructure(spot, futures, tolerance?): MarketStructure`; `curveByExpiry(spot, rate, carryYield, maxYears, steps?): Array<[number, number]>` (points `[T, F(T)]`); `convergenceSeries(spot, rate, carryYield, years, steps?): Array<[number, number]>` (points `[elapsed, F]`, ending at spot); `futuresFormulaTex(spot, rate, carryYield, years, currency?): string`; `FUTURES_EXAMPLES` with the chapter's two examples.

- [ ] **Step 1: Write the failing tests**

`tests/futures-pricing.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  FUTURES_EXAMPLES,
  basisSpotMinusFutures,
  convergenceSeries,
  curveByExpiry,
  futuresFormulaTex,
  futuresPrice,
  marketStructure,
} from '../src/explainers/futures-pricing/model';

describe('futuresPrice (chapter worked examples)', () => {
  it('S=100, r=5%, T=0.5 gives $102.53', () => {
    expect(futuresPrice(100, 0.05, 0, 0.5)).toBeCloseTo(102.5315, 3);
    expect(futuresPrice(100, 0.05, 0, 0.5).toFixed(2)).toBe('102.53');
  });
  it('with a 2% dividend yield gives $101.51', () => {
    expect(futuresPrice(100, 0.05, 0.02, 0.5)).toBeCloseTo(101.5113, 3);
    expect(futuresPrice(100, 0.05, 0.02, 0.5).toFixed(2)).toBe('101.51');
  });
  it('equals spot at expiry (T = 0), the convergence limit', () => {
    expect(futuresPrice(100, 0.05, 0.02, 0)).toBe(100);
  });
  it('equals spot when r equals q', () => {
    expect(futuresPrice(100, 0.03, 0.03, 2)).toBeCloseTo(100, 10);
  });
});

describe('basis and market structure', () => {
  it('basis is spot minus futures (negative in contango)', () => {
    expect(basisSpotMinusFutures(100, 102.53)).toBeCloseTo(-2.53, 6);
  });
  it('detects contango, backwardation and flat', () => {
    expect(marketStructure(100, futuresPrice(100, 0.05, 0.02, 1))).toBe('contango');
    expect(marketStructure(100, futuresPrice(100, 0.02, 0.05, 1))).toBe('backwardation');
    expect(marketStructure(100, futuresPrice(100, 0.03, 0.03, 1))).toBe('flat');
  });
});

describe('series', () => {
  it('curveByExpiry runs from spot at T=0 to the long-dated price', () => {
    const c = curveByExpiry(100, 0.05, 0, 2, 20);
    expect(c).toHaveLength(21);
    expect(c[0]).toEqual([0, 100]);
    expect(c[20][0]).toBeCloseTo(2, 10);
    expect(c[20][1]).toBeCloseTo(100 * Math.exp(0.1), 6);
  });
  it('convergenceSeries starts at the futures price and ends exactly at spot', () => {
    const s = convergenceSeries(100, 0.05, 0, 0.5, 10);
    expect(s).toHaveLength(11);
    expect(s[0][0]).toBe(0);
    expect(s[0][1]).toBeCloseTo(102.5315, 3);
    expect(s[10][0]).toBeCloseTo(0.5, 10);
    expect(s[10][1]).toBeCloseTo(100, 10);
  });
  it('convergence is monotone toward spot in contango', () => {
    const s = convergenceSeries(100, 0.05, 0, 1, 12);
    for (let k = 1; k < s.length; k++) expect(s[k][1]).toBeLessThanOrEqual(s[k - 1][1] + 1e-12);
  });
  it('zero time to expiry yields a flat, finite series', () => {
    const s = convergenceSeries(100, 0.05, 0, 0, 5);
    for (const [x, y] of s) {
      expect(Number.isFinite(x)).toBe(true);
      expect(y).toBeCloseTo(100, 10);
    }
  });
});

describe('examples and formula text', () => {
  it('ships the chapter examples', () => {
    expect(FUTURES_EXAMPLES[0]).toMatchObject({ spot: 100, rate: 0.05, carryYield: 0, years: 0.5 });
    expect(FUTURES_EXAMPLES[1]).toMatchObject({ spot: 100, rate: 0.05, carryYield: 0.02, years: 0.5 });
  });
  it('substitutes numbers into the formula', () => {
    const tex = futuresFormulaTex(100, 0.05, 0.02, 0.5);
    expect(tex).toContain('101.51');
    expect(tex).toContain('0.05');
    expect(tex).not.toContain('NaN');
  });
});
```
Run `npm test -- futures-pricing` → FAIL.

- [ ] **Step 2: Implement `src/explainers/futures-pricing/model.ts`**

```ts
import { texMoney, texPlain } from '../../lib/explainer-format';

export type MarketStructure = 'contango' | 'backwardation' | 'flat';

export interface FuturesExample {
  label: string;
  spot: number;
  rate: number;
  carryYield: number;
  years: number;
}

/** The two worked examples in the chapter ($102.53 without dividends, $101.51 with a 2% yield). */
export const FUTURES_EXAMPLES: FuturesExample[] = [
  { label: 'Chapter example: no dividends', spot: 100, rate: 0.05, carryYield: 0, years: 0.5 },
  { label: 'Chapter example: 2% dividend yield', spot: 100, rate: 0.05, carryYield: 0.02, years: 0.5 },
];

/** Continuous-compounding cost of carry: F = S * e^((r - q) T). */
export function futuresPrice(spot: number, rate: number, carryYield: number, years: number): number {
  return spot * Math.exp((rate - carryYield) * Math.max(0, years));
}

/** The chapter defines basis as spot minus futures. */
export function basisSpotMinusFutures(spot: number, futures: number): number {
  return spot - futures;
}

export function marketStructure(spot: number, futures: number, tolerance = 1e-9): MarketStructure {
  if (futures - spot > tolerance) return 'contango';
  if (spot - futures > tolerance) return 'backwardation';
  return 'flat';
}

/** Futures price against time to expiry T (0 .. maxYears). */
export function curveByExpiry(spot: number, rate: number, carryYield: number, maxYears: number, steps = 60): Array<[number, number]> {
  const end = Math.max(0, maxYears);
  return Array.from({ length: steps + 1 }, (_, k) => {
    const t = (end * k) / steps;
    return [t, futuresPrice(spot, rate, carryYield, t)] as [number, number];
  });
}

/** Stylised convergence with spot held constant: futures price as time elapses toward expiry. */
export function convergenceSeries(spot: number, rate: number, carryYield: number, years: number, steps = 60): Array<[number, number]> {
  const total = Math.max(0, years);
  return Array.from({ length: steps + 1 }, (_, k) => {
    const elapsed = (total * k) / steps;
    return [elapsed, futuresPrice(spot, rate, carryYield, total - elapsed)] as [number, number];
  });
}

export function futuresFormulaTex(spot: number, rate: number, carryYield: number, years: number, currency = '$'): string {
  const f = futuresPrice(spot, rate, carryYield, years);
  return `F = S\\,e^{(r-q)T} = ${texMoney(spot, currency)}\\,e^{(${texPlain(rate)}-${texPlain(carryYield)})\\times ${texPlain(years)}} = ${texMoney(f, currency)}`;
}
```
Run `npm test -- futures-pricing` → PASS.

- [ ] **Step 3: Verify and commit**

```bash
npm test && npm run build 2>&1 | tail -3
git add -A
git commit -m "feat(explainers): futures pricing model with chapter-pinned tests

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 7: Futures pricing explainer UI and chapter wiring

**Files:**
- Create: `src/explainers/futures-pricing/index.tsx`
- Modify: `src/explainers/registry.ts`, `src/components/explainer/Explainers.astro`, `src/content/topics/futures-pricing-cash-futures-convergence/note.mdx` (frontmatter line only)

**Interfaces:**
- Consumes: Task 3 kit, Task 6 model.
- Produces: default export `FuturesPricing(props: ExplainerProps)`; registry key `'futures-pricing'`.

- [ ] **Step 1: Write `index.tsx`**

```tsx
import React, { useState } from 'react';
import { ExplainerFrame } from '../../components/explainer/kit/ExplainerFrame';
import { Slider } from '../../components/explainer/kit/Slider';
import { Readout } from '../../components/explainer/kit/Readout';
import { FormulaBlock } from '../../components/explainer/kit/FormulaBlock';
import { ChartFrame } from '../../components/explainer/kit/ChartFrame';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { Tabs } from '../../components/explainer/kit/Tabs';
import { formatMoney, formatNumber } from '../../lib/explainer-format';
import type { ExplainerProps } from '../types';
import {
  FUTURES_EXAMPLES,
  basisSpotMinusFutures,
  convergenceSeries,
  curveByExpiry,
  futuresFormulaTex,
  futuresPrice,
  marketStructure,
} from './model';

interface State {
  spot: number;
  rate: number;
  carryYield: number;
  years: number;
}

const toState = (e: (typeof FUTURES_EXAMPLES)[number]): State => ({ spot: e.spot, rate: e.rate, carryYield: e.carryYield, years: e.years });
const STRUCTURE_TEXT = { contango: 'Contango (F > S)', backwardation: 'Backwardation (F < S)', flat: 'Flat (F = S)' } as const;

function Inner({ currency }: { currency: string }) {
  const [s, setS] = useState<State>(toState(FUTURES_EXAMPLES[0]));
  const [view, setView] = useState<'curve' | 'convergence'>('convergence');
  const set = (patch: Partial<State>) => setS((p) => ({ ...p, ...patch }));

  const f = futuresPrice(s.spot, s.rate, s.carryYield, s.years);
  const basis = basisSpotMinusFutures(s.spot, f);
  const structure = marketStructure(s.spot, f);

  const curve = curveByExpiry(s.spot, s.rate, s.carryYield, Math.max(s.years, 0.5, 2));
  const conv = convergenceSeries(s.spot, s.rate, s.carryYield, s.years);

  return (
    <div className="space-y-6">
      <ExampleBar examples={FUTURES_EXAMPLES.map((e) => ({ label: e.label, apply: () => setS(toState(e)) }))} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Slider label="Spot price (S)" value={s.spot} min={1} max={500} step={1} onChange={(spot) => set({ spot })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Risk-free rate (r)" value={Number((s.rate * 100).toFixed(4))} min={0} max={15} step={0.1} onChange={(v) => set({ rate: v / 100 })} format={(v) => v.toFixed(1)} suffix="%" />
          <Slider label="Dividend or carry yield (q)" value={Number((s.carryYield * 100).toFixed(4))} min={0} max={15} step={0.1} onChange={(v) => set({ carryYield: v / 100 })} format={(v) => v.toFixed(1)} suffix="%" />
          <Slider label="Time to expiry (T)" value={Number((s.years * 12).toFixed(4))} min={0} max={24} step={1} onChange={(v) => set({ years: v / 12 })} suffix=" months" />
        </div>

        <Tabs
          tabs={[
            { id: 'convergence', label: 'Convergence to spot' },
            { id: 'curve', label: 'Price by expiry' },
          ]}
          active={view}
          onChange={(id) => setView(id as 'curve' | 'convergence')}
        >
          {view === 'convergence' ? (
            <ChartFrame
              series={[
                { id: 'futures', label: 'Futures price', tone: 'rust', points: conv },
                { id: 'spot', label: 'Spot price', tone: 'muted', dashed: true, points: [[0, s.spot], [Math.max(s.years, 0), s.spot]] },
              ]}
              xLabel="Years elapsed"
              yLabel="Price"
              formatX={(v) => formatNumber(v, 2)}
              formatY={(v) => formatMoney(v, currency)}
              summary={`With spot held at ${formatMoney(s.spot, currency)}, the futures price moves from ${formatMoney(f, currency)} to ${formatMoney(s.spot, currency)} at expiry: the basis shrinks to zero.`}
            />
          ) : (
            <ChartFrame
              series={[
                { id: 'futures', label: 'Futures price', tone: 'rust', points: curve },
                { id: 'spot', label: 'Spot price', tone: 'muted', dashed: true, points: [[0, s.spot], [curve[curve.length - 1][0], s.spot]] },
              ]}
              xLabel="Time to expiry (years)"
              yLabel="Price"
              markers={s.years > 0 ? [{ x: s.years, label: 'Your expiry', tone: 'ink' }] : []}
              formatX={(v) => formatNumber(v, 2)}
              formatY={(v) => formatMoney(v, currency)}
              summary={`Futures prices ${s.rate >= s.carryYield ? 'rise' : 'fall'} with time to expiry because the net cost of carry (r minus q) is ${formatNumber((s.rate - s.carryYield) * 100, 1)}% a year.`}
            />
          )}
        </Tabs>
      </div>

      <Readout
        items={[
          { label: 'Futures price (F)', value: formatMoney(f, currency), tone: 'accent' },
          { label: 'Basis (S − F)', value: formatMoney(basis, currency), tone: basis < 0 ? 'negative' : 'positive' },
          { label: 'Market structure', value: STRUCTURE_TEXT[structure] },
        ]}
      />
      <FormulaBlock tex={futuresFormulaTex(s.spot, s.rate, s.carryYield, s.years, currency)} />
    </div>
  );
}

export default function FuturesPricing({ currency = '$' }: ExplainerProps) {
  return (
    <ExplainerFrame title="Futures pricing and convergence" description="See how the cost of carry sets the futures price, and how it converges to spot at expiry.">
      <Inner currency={currency} />
    </ExplainerFrame>
  );
}
```

- [ ] **Step 2: Register and wire**

Add to `registry`: `'futures-pricing': { title: 'Futures pricing and convergence' },`. In `Explainers.astro` import `FuturesPricing from '../../explainers/futures-pricing/index'` and add `'futures-pricing': FuturesPricing` to `components`. In `src/content/topics/futures-pricing-cash-futures-convergence/note.mdx` add after its `tags:` line: `explainers: ["futures-pricing"]`.

- [ ] **Step 3: Verify**

`npm test && npm run build`. Then headless Chrome on `/topics/futures-pricing-cash-futures-convergence`: the section is present with the rail entry; on load the readout shows futures price `$102.53`, basis `-$2.53`, `Contango (F > S)`; clicking the "2% dividend yield" example shows `$101.51`; Reset restores the first example; at `T = 0 months` the futures price equals spot with `Flat (F = S)` and no `NaN`; setting `q` above `r` shows `Backwardation (F < S)`; the tab switch works with arrow keys; slider extremes never show `NaN`/`Infinity`; no console or hydration warnings; both themes look right (view screenshots); no-JS shows the numbers; axe clean in both themes.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "feat(explainers): futures pricing explainer on the futures pricing chapter

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 8: Shared payoff maths (also used by `PayoffChart`)

**Files:**
- Create: `src/lib/payoff.ts`, `tests/payoff.test.ts`
- Modify: `src/components/PayoffChart.tsx`

**Interfaces:**
- Consumes: `type Position` (type-only import from `src/content/config`).
- Produces: `positionPnL(pos: Position, spotAtExpiry: number): number`; `netPnL(positions: Position[], spotAtExpiry: number): number`; `interface PayoffSummary { maxProfit: number | null; maxLoss: number | null; breakEvens: number[]; unboundedProfit: boolean; unboundedLoss: boolean }`; `summarisePayoff(positions: Position[], range: [number, number]): PayoffSummary` (`null` means unlimited in that direction). Price is assumed to stay at or above 0.

- [ ] **Step 1: Write the failing tests**

`tests/payoff.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { netPnL, positionPnL, summarisePayoff } from '../src/lib/payoff';
import type { Position } from '../src/content/config';

const longCall = (strike: number, premium: number, lotSize = 1): Position => ({ type: 'long-call', strike, premium, lotSize });
const shortCall = (strike: number, premium: number, lotSize = 1): Position => ({ type: 'short-call', strike, premium, lotSize });
const longPut = (strike: number, premium: number, lotSize = 1): Position => ({ type: 'long-put', strike, premium, lotSize });

describe('positionPnL', () => {
  it('long futures gains when price rises, scaled by lot size', () => {
    expect(positionPnL({ type: 'long-futures', contractPrice: 500, lotSize: 100 }, 520)).toBe(2000);
    expect(positionPnL({ type: 'short-futures', contractPrice: 500, lotSize: 100 }, 520)).toBe(-2000);
  });
  it('long call loses the premium out of the money and gains above breakeven', () => {
    expect(positionPnL(longCall(100, 5), 90)).toBe(-5);
    expect(positionPnL(longCall(100, 5), 110)).toBe(5);
  });
  it('short put keeps the premium out of the money', () => {
    expect(positionPnL({ type: 'short-put', strike: 100, premium: 4, lotSize: 1 }, 120)).toBe(4);
  });
});

describe('netPnL', () => {
  it('sums legs (bull call spread)', () => {
    const legs = [longCall(100, 6), shortCall(110, 2)];
    expect(netPnL(legs, 90)).toBe(-4);
    expect(netPnL(legs, 120)).toBe(6);
  });
});

describe('summarisePayoff', () => {
  const range: [number, number] = [50, 150];

  it('long call: max loss is the premium, profit unlimited, break-even strike plus premium', () => {
    const s = summarisePayoff([longCall(100, 5)], range);
    expect(s.maxLoss).toBe(-5);
    expect(s.maxProfit).toBeNull();
    expect(s.unboundedProfit).toBe(true);
    expect(s.unboundedLoss).toBe(false);
    expect(s.breakEvens).toHaveLength(1);
    expect(s.breakEvens[0]).toBeCloseTo(105, 6);
  });

  it('short call: profit capped at the premium, loss unlimited', () => {
    const s = summarisePayoff([shortCall(100, 5)], range);
    expect(s.maxProfit).toBe(5);
    expect(s.maxLoss).toBeNull();
    expect(s.unboundedLoss).toBe(true);
    expect(s.breakEvens[0]).toBeCloseTo(105, 6);
  });

  it('long put: loss is the premium and profit is bounded because price cannot go below zero', () => {
    const s = summarisePayoff([longPut(100, 4)], range);
    expect(s.maxLoss).toBe(-4);
    expect(s.maxProfit).toBeCloseTo(96, 6);
    expect(s.unboundedProfit).toBe(false);
    expect(s.breakEvens[0]).toBeCloseTo(96, 6);
  });

  it('bull call spread: bounded both ways, break-even 104', () => {
    const s = summarisePayoff([longCall(100, 6), shortCall(110, 2)], range);
    expect(s.maxLoss).toBeCloseTo(-4, 6);
    expect(s.maxProfit).toBeCloseTo(6, 6);
    expect(s.breakEvens).toHaveLength(1);
    expect(s.breakEvens[0]).toBeCloseTo(104, 6);
  });

  it('long straddle: two break-evens, unlimited profit, loss is the total premium', () => {
    const s = summarisePayoff([longCall(100, 5), longPut(100, 4)], range);
    expect(s.maxLoss).toBeCloseTo(-9, 6);
    expect(s.unboundedProfit).toBe(true);
    expect(s.breakEvens.map((b) => Math.round(b))).toEqual([91, 109]);
  });

  it('scales by lot size', () => {
    const s = summarisePayoff([longCall(100, 5, 50)], range);
    expect(s.maxLoss).toBe(-250);
  });

  it('long futures: break-even at the contract price, loss bounded at price zero', () => {
    const s = summarisePayoff([{ type: 'long-futures', contractPrice: 500, lotSize: 100 }], [350, 650]);
    expect(s.breakEvens[0]).toBeCloseTo(500, 6);
    expect(s.maxLoss).toBe(-50000);
    expect(s.unboundedProfit).toBe(true);
  });

  it('break-even beyond the visible range is still found', () => {
    const s = summarisePayoff([longCall(100, 5)], [50, 102]);
    expect(s.breakEvens[0]).toBeCloseTo(105, 6);
  });

  it('empty legs give an empty summary without NaN', () => {
    const s = summarisePayoff([], range);
    expect(s.breakEvens).toEqual([]);
    expect(s.maxProfit === null || Number.isFinite(s.maxProfit)).toBe(true);
  });
});
```
Run `npm test -- payoff` → FAIL.

- [ ] **Step 2: Implement `src/lib/payoff.ts`**

```ts
import type { Position } from '../content/config';

/** Profit or loss of one leg at expiry. Matches the logic previously inside PayoffChart. */
export function positionPnL(pos: Position, st: number): number {
  const lotSize = pos.lotSize ?? 1;
  const basePrice = pos.contractPrice ?? pos.strike ?? 0;
  const premium = pos.premium ?? 0;

  switch (pos.type) {
    case 'long-futures':
      return (st - basePrice) * lotSize;
    case 'short-futures':
      return (basePrice - st) * lotSize;
    case 'long-call':
      return (Math.max(0, st - basePrice) - premium) * lotSize;
    case 'short-call':
      return (premium - Math.max(0, st - basePrice)) * lotSize;
    case 'long-put':
      return (Math.max(0, basePrice - st) - premium) * lotSize;
    case 'short-put':
      return (premium - Math.max(0, basePrice - st)) * lotSize;
    default:
      return 0;
  }
}

export function netPnL(positions: Position[], st: number): number {
  return positions.reduce((sum, pos) => sum + positionPnL(pos, st), 0);
}

export interface PayoffSummary {
  /** Maximum profit, or null when unlimited. */
  maxProfit: number | null;
  /** Maximum loss (a negative number), or null when unlimited. */
  maxLoss: number | null;
  breakEvens: number[];
  unboundedProfit: boolean;
  unboundedLoss: boolean;
}

const EPS = 1e-9;

/**
 * The payoff is piecewise linear with kinks at the strikes, so evaluating it at the kinks (plus price 0
 * and the right edge) gives exact extremes and break-evens. Price is assumed to stay at or above 0.
 */
export function summarisePayoff(positions: Position[], range: [number, number]): PayoffSummary {
  if (positions.length === 0) {
    return { maxProfit: 0, maxLoss: 0, breakEvens: [], unboundedProfit: false, unboundedLoss: false };
  }
  const kinks = positions
    .map((p) => p.contractPrice ?? p.strike)
    .filter((k): k is number => typeof k === 'number' && Number.isFinite(k) && k > 0);
  const hi = Math.max(range[1], ...kinks, 1) * 1.5;
  const xs = Array.from(new Set([0, ...kinks, hi])).sort((a, b) => a - b);
  const ys = xs.map((x) => netPnL(positions, x));

  const lastSlope = xs.length >= 2 ? (ys[ys.length - 1] - ys[ys.length - 2]) / (xs[xs.length - 1] - xs[xs.length - 2]) : 0;
  const unboundedProfit = lastSlope > EPS;
  const unboundedLoss = lastSlope < -EPS;

  const breakEvens: number[] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const [xa, xb, ya, yb] = [xs[i], xs[i + 1], ys[i], ys[i + 1]];
    if (Math.abs(ya) < EPS) {
      breakEvens.push(xa);
    } else if (ya * yb < 0) {
      breakEvens.push(xa + (-ya * (xb - xa)) / (yb - ya));
    }
  }
  const lastY = ys[ys.length - 1];
  if (Math.abs(lastY) < EPS) breakEvens.push(xs[xs.length - 1]);
  else if (lastY < 0 && unboundedProfit) breakEvens.push(hi - lastY / lastSlope);
  else if (lastY > 0 && unboundedLoss) breakEvens.push(hi - lastY / lastSlope);

  const uniqueBreakEvens = Array.from(new Set(breakEvens.map((b) => Number(b.toFixed(9))))).sort((a, b) => a - b);

  return {
    maxProfit: unboundedProfit ? null : Math.max(...ys),
    maxLoss: unboundedLoss ? null : Math.min(...ys),
    breakEvens: uniqueBreakEvens,
    unboundedProfit,
    unboundedLoss,
  };
}
```
Run `npm test -- payoff` → PASS. If the straddle test's rounded break-evens or another vector is off because of an implementation edge case (e.g. a break-even exactly on a kink counted twice), fix `summarisePayoff`, not the test.

- [ ] **Step 3: Make `PayoffChart` use the shared function**

In `src/components/PayoffChart.tsx`: add `import { positionPnL as getPnL } from '../lib/payoff';` and delete the local `const getPnL = (pos: Position, st: number): number => { ... };` definition. Everything else is unchanged (the call sites keep using `getPnL`). Remove now-unused imports only if they become unused.

- [ ] **Step 4: Verify and commit**

```bash
npm test && npm run build 2>&1 | tail -3
```
Then headless Chrome check that `/topics/futures-payoff-charts` still renders its payoff chart and hover tooltip with the same numbers as before (long futures at $500, lot 100: hovering at 520 shows `+$2,000`).
```bash
git add -A
git commit -m "refactor(explainers): shared payoff maths used by PayoffChart, with summary and tests

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 9: Options model — Black-Scholes, Greeks, put-call parity (pure, tested)

**Files:**
- Create: `src/explainers/options-suite/model.ts`, `tests/options-model.test.ts`

**Interfaces:**
- Consumes: `texMoney`, `texPlain`.
- Produces: `type OptionType = 'call'|'put'`; `interface BsInputs { spot; strike; rate; vol; time }` (rate and vol as fractions, time in years); `interface Greeks { delta; gamma; theta; vega; rho }` (theta per year, vega per 1.00 of volatility, rho per 1.00 of rate — the UI scales them); `normPdf(x)`, `normCdf(x)`; `bsPrice(i, type)`; `bsGreeks(i, type)`; `bsFormulaTex(i, type, currency?)`; `interface ParityInputs { spot; strike; rate; time; call; put }`; `interface ParityResult { callSide: number; putSide: number; deviation: number; status: 'aligned'|'call-side-rich'|'put-side-rich'; action: string }`; `parityCheck(i, tolerance?)`; `impliedPut(call, spot, strike, rate, time)`; `impliedCall(put, spot, strike, rate, time)`; `OPTION_EXAMPLE` (the chapter parity example inputs).

- [ ] **Step 1: Write the failing tests**

`tests/options-model.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  OPTION_EXAMPLE,
  bsFormulaTex,
  bsGreeks,
  bsPrice,
  impliedCall,
  impliedPut,
  normCdf,
  normPdf,
  parityCheck,
  type BsInputs,
} from '../src/explainers/options-suite/model';

const REF: BsInputs = { spot: 100, strike: 100, rate: 0.05, vol: 0.2, time: 1 };

describe('normal distribution', () => {
  it('matches reference values for the CDF', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 12);
    expect(normCdf(1)).toBeCloseTo(0.8413447460685429, 10);
    expect(normCdf(-1)).toBeCloseTo(0.15865525393145707, 10);
    expect(normCdf(1.96)).toBeCloseTo(0.9750021048517795, 10);
    expect(normCdf(0.5)).toBeCloseTo(0.6914624612740131, 10);
    expect(normCdf(2)).toBeCloseTo(0.9772498680518208, 10);
    expect(normCdf(-3)).toBeCloseTo(0.0013498980316301035, 10);
  });
  it('is symmetric and bounded', () => {
    for (const x of [0.1, 0.7, 1.3, 2.9, 5, 8]) expect(normCdf(x) + normCdf(-x)).toBeCloseTo(1, 12);
    expect(normCdf(40)).toBe(1);
    expect(normCdf(-40)).toBe(0);
  });
  it('pdf peaks at zero', () => {
    expect(normPdf(0)).toBeCloseTo(0.3989422804014327, 12);
  });
});

describe('Black-Scholes reference vector (S=100, K=100, r=5%, sigma=20%, T=1)', () => {
  it('prices the call and put', () => {
    expect(bsPrice(REF, 'call')).toBeCloseTo(10.4506, 3);
    expect(bsPrice(REF, 'put')).toBeCloseTo(5.5735, 3);
  });
  it('computes the call Greeks', () => {
    const g = bsGreeks(REF, 'call');
    expect(g.delta).toBeCloseTo(0.6368, 3);
    expect(g.gamma).toBeCloseTo(0.018762, 5);
    expect(g.vega).toBeCloseTo(37.524, 2);
    expect(g.theta).toBeCloseTo(-6.414, 2);
    expect(g.rho).toBeCloseTo(53.2325, 2);
  });
  it('computes the put Greeks', () => {
    const g = bsGreeks(REF, 'put');
    expect(g.delta).toBeCloseTo(-0.3632, 3);
    expect(g.theta).toBeCloseTo(-1.658, 2);
    expect(g.rho).toBeCloseTo(-41.8904, 2);
  });
});

describe('Black-Scholes properties', () => {
  const grid: BsInputs[] = [];
  for (const spot of [60, 100, 140]) for (const strike of [80, 100, 120]) for (const vol of [0.05, 0.2, 0.6]) for (const time of [0.1, 1, 2]) grid.push({ spot, strike, rate: 0.05, vol, time });

  it('put-call parity holds for the computed prices', () => {
    for (const i of grid) {
      const lhs = bsPrice(i, 'call') - bsPrice(i, 'put');
      const rhs = i.spot - i.strike * Math.exp(-i.rate * i.time);
      expect(lhs).toBeCloseTo(rhs, 8);
    }
  });
  it('deltas stay in their ranges and differ by exactly one', () => {
    for (const i of grid) {
      const c = bsGreeks(i, 'call').delta;
      const p = bsGreeks(i, 'put').delta;
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
      expect(p).toBeGreaterThanOrEqual(-1);
      expect(p).toBeLessThanOrEqual(0);
      expect(c - p).toBeCloseTo(1, 10);
    }
  });
  it('gamma and vega are identical for calls and puts and non-negative', () => {
    for (const i of grid) {
      const c = bsGreeks(i, 'call');
      const p = bsGreeks(i, 'put');
      expect(c.gamma).toBeCloseTo(p.gamma, 12);
      expect(c.vega).toBeCloseTo(p.vega, 10);
      expect(c.gamma).toBeGreaterThanOrEqual(0);
      expect(c.vega).toBeGreaterThanOrEqual(0);
    }
  });
  it('price tends to intrinsic value as time to expiry goes to zero', () => {
    expect(bsPrice({ spot: 110, strike: 100, rate: 0, vol: 0.2, time: 1e-9 }, 'call')).toBeCloseTo(10, 6);
    expect(bsPrice({ spot: 90, strike: 100, rate: 0, vol: 0.2, time: 1e-9 }, 'call')).toBeCloseTo(0, 6);
  });
  it('degenerate inputs give finite numbers, never NaN', () => {
    const cases: BsInputs[] = [
      { spot: 100, strike: 100, rate: 0.05, vol: 0.2, time: 0 },
      { spot: 100, strike: 100, rate: 0.05, vol: 0, time: 1 },
      { spot: 100, strike: 100, rate: 0, vol: 0, time: 0 },
      { spot: 1, strike: 500, rate: 0.15, vol: 0.01, time: 0.01 },
      { spot: 500, strike: 1, rate: 0, vol: 0.8, time: 2 },
    ];
    for (const i of cases) {
      for (const type of ['call', 'put'] as const) {
        expect(Number.isFinite(bsPrice(i, type))).toBe(true);
        const g = bsGreeks(i, type);
        for (const v of Object.values(g)) expect(Number.isFinite(v)).toBe(true);
      }
    }
  });
  it('at time zero the price is intrinsic value', () => {
    expect(bsPrice({ spot: 110, strike: 100, rate: 0.05, vol: 0.2, time: 0 }, 'call')).toBe(10);
    expect(bsPrice({ spot: 110, strike: 100, rate: 0.05, vol: 0.2, time: 0 }, 'put')).toBe(0);
  });
});

describe('put-call parity (chapter worked example)', () => {
  it('S=100, K=100, r=5%, T=1 and call premium $8.00 imply a put of $3.12', () => {
    expect(impliedPut(8, 100, 100, 0.05, 1)).toBeCloseTo(3.12, 2);
  });
  it('implied call is the inverse', () => {
    expect(impliedCall(3.1229, 100, 100, 0.05, 1)).toBeCloseTo(8, 3);
  });
  it('the chapter example is aligned', () => {
    const r = parityCheck({ ...OPTION_EXAMPLE, put: 3.12 });
    expect(r.status).toBe('aligned');
    expect(r.callSide).toBeCloseTo(103.1229, 3);
    expect(r.putSide).toBeCloseTo(103.12, 6);
  });
  it('a dear put shows a put-side-rich dislocation and an action', () => {
    const r = parityCheck({ ...OPTION_EXAMPLE, put: 4 });
    expect(r.status).toBe('put-side-rich');
    expect(r.deviation).toBeCloseTo(-0.8771, 3);
    expect(r.action).toMatch(/sell the put/i);
  });
  it('a dear call shows a call-side-rich dislocation', () => {
    const r = parityCheck({ ...OPTION_EXAMPLE, put: 2 });
    expect(r.status).toBe('call-side-rich');
    expect(r.action).toMatch(/sell the call/i);
  });
  it('is finite at a zero rate or zero time', () => {
    const r = parityCheck({ spot: 100, strike: 100, rate: 0, time: 0, call: 5, put: 5 });
    expect(Number.isFinite(r.deviation)).toBe(true);
  });
});

describe('bsFormulaTex', () => {
  it('shows d1, d2 and the price for the reference inputs', () => {
    const tex = bsFormulaTex(REF, 'call');
    expect(tex).toContain('d_1');
    expect(tex).toContain('10.45');
    expect(tex).not.toContain('NaN');
  });
  it('does not crash on degenerate inputs', () => {
    expect(() => bsFormulaTex({ ...REF, time: 0 }, 'put')).not.toThrow();
  });
});
```
Run `npm test -- options-model` → FAIL.

- [ ] **Step 2: Implement `src/explainers/options-suite/model.ts`**

```ts
import { texMoney, texPlain } from '../../lib/explainer-format';

export type OptionType = 'call' | 'put';

export interface BsInputs {
  spot: number;
  strike: number;
  /** Continuously compounded risk-free rate as a fraction. */
  rate: number;
  /** Volatility as a fraction (0.2 = 20%). */
  vol: number;
  /** Time to expiry in years. */
  time: number;
}

/** theta is per year, vega per 1.00 of volatility, rho per 1.00 of rate (the UI rescales for display). */
export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Standard normal CDF (Hart's double-precision algorithm as published by West, 2005).
 * Verified against reference values to 1e-10 in tests; if a coefficient is wrong the tests fail.
 */
export function normCdf(x: number): number {
  const abs = Math.abs(x);
  let cnd: number;
  if (abs > 37) {
    cnd = 0;
  } else {
    const exponential = Math.exp((-abs * abs) / 2);
    if (abs < 7.07106781186547) {
      let build = 3.52624965998911e-2 * abs + 0.700383064443688;
      build = build * abs + 6.37396220353165;
      build = build * abs + 33.912866078383;
      build = build * abs + 112.079291497871;
      build = build * abs + 221.213596169931;
      build = build * abs + 220.206867912376;
      cnd = exponential * build;
      build = 8.83883476483184e-2 * abs + 1.75566716318264;
      build = build * abs + 16.064177579207;
      build = build * abs + 86.7807322029461;
      build = build * abs + 296.564248779674;
      build = build * abs + 637.333633378831;
      build = build * abs + 793.826512519948;
      build = build * abs + 440.413735824752;
      cnd = cnd / build;
    } else {
      let build = abs + 0.65;
      build = abs + 4 / build;
      build = abs + 3 / build;
      build = abs + 2 / build;
      build = abs + 1 / build;
      cnd = exponential / build / 2.506628274631;
    }
  }
  return x > 0 ? 1 - cnd : cnd;
}

const isDegenerate = (i: BsInputs) => i.time <= 0 || i.vol <= 0 || i.spot <= 0 || i.strike <= 0;

function d1d2(i: BsInputs): { d1: number; d2: number } {
  const sqrtT = Math.sqrt(i.time);
  const d1 = (Math.log(i.spot / i.strike) + (i.rate + (i.vol * i.vol) / 2) * i.time) / (i.vol * sqrtT);
  return { d1, d2: d1 - i.vol * sqrtT };
}

export function bsPrice(i: BsInputs, type: OptionType): number {
  const disc = Math.exp(-i.rate * Math.max(0, i.time));
  if (isDegenerate(i)) {
    // At expiry the option is worth intrinsic value; with zero volatility it is worth the discounted forward payoff.
    const forward = i.time <= 0 ? i.spot - i.strike : i.spot - i.strike * disc;
    const call = Math.max(0, forward);
    const put = Math.max(0, -forward);
    return type === 'call' ? call : put;
  }
  const { d1, d2 } = d1d2(i);
  return type === 'call'
    ? i.spot * normCdf(d1) - i.strike * disc * normCdf(d2)
    : i.strike * disc * normCdf(-d2) - i.spot * normCdf(-d1);
}

export function bsGreeks(i: BsInputs, type: OptionType): Greeks {
  if (isDegenerate(i)) {
    const itm = type === 'call' ? i.spot > i.strike : i.spot < i.strike;
    const disc = Math.exp(-i.rate * Math.max(0, i.time));
    const delta = itm ? (type === 'call' ? 1 : -1) : 0;
    const carry = itm && i.time > 0 ? i.rate * i.strike * disc : 0;
    const rho = itm ? (type === 'call' ? 1 : -1) * i.strike * Math.max(0, i.time) * disc : 0;
    return { delta, gamma: 0, theta: type === 'call' ? -carry : carry, vega: 0, rho };
  }
  const { d1, d2 } = d1d2(i);
  const sqrtT = Math.sqrt(i.time);
  const disc = Math.exp(-i.rate * i.time);
  const pdf = normPdf(d1);
  const gamma = pdf / (i.spot * i.vol * sqrtT);
  const vega = i.spot * pdf * sqrtT;
  const decay = -(i.spot * pdf * i.vol) / (2 * sqrtT);
  if (type === 'call') {
    return {
      delta: normCdf(d1),
      gamma,
      theta: decay - i.rate * i.strike * disc * normCdf(d2),
      vega,
      rho: i.strike * i.time * disc * normCdf(d2),
    };
  }
  return {
    delta: normCdf(d1) - 1,
    gamma,
    theta: decay + i.rate * i.strike * disc * normCdf(-d2),
    vega,
    rho: -i.strike * i.time * disc * normCdf(-d2),
  };
}

export function bsFormulaTex(i: BsInputs, type: OptionType, currency = '$'): string {
  const price = bsPrice(i, type);
  if (isDegenerate(i)) {
    return `V = ${texMoney(price, currency)} \\quad \\text{(at expiry or with no volatility the option is worth its intrinsic value)}`;
  }
  const { d1, d2 } = d1d2(i);
  const head = `d_1 = \\frac{\\ln(S/K)+(r+\\sigma^2/2)T}{\\sigma\\sqrt{T}} = ${texPlain(d1, 4)},\\quad d_2 = d_1-\\sigma\\sqrt{T} = ${texPlain(d2, 4)}`;
  const body =
    type === 'call'
      ? `C = S\\,N(d_1) - K e^{-rT} N(d_2) = ${texMoney(price, currency)}`
      : `P = K e^{-rT} N(-d_2) - S\\,N(-d_1) = ${texMoney(price, currency)}`;
  return `\\begin{aligned}${head}\\\\ ${body}\\end{aligned}`;
}

export interface ParityInputs {
  spot: number;
  strike: number;
  rate: number;
  time: number;
  call: number;
  put: number;
}

export type ParityStatus = 'aligned' | 'call-side-rich' | 'put-side-rich';

export interface ParityResult {
  /** C + K e^{-rT} */
  callSide: number;
  /** P + S */
  putSide: number;
  deviation: number;
  status: ParityStatus;
  action: string;
}

/** The chapter's worked example: S = K = 100, r = 5%, T = 1 year, call premium $8.00 (fair put $3.12). */
export const OPTION_EXAMPLE: ParityInputs = { spot: 100, strike: 100, rate: 0.05, time: 1, call: 8, put: 3.12 };

const presentValueOfStrike = (strike: number, rate: number, time: number) => strike * Math.exp(-rate * Math.max(0, time));

export function impliedPut(call: number, spot: number, strike: number, rate: number, time: number): number {
  return call + presentValueOfStrike(strike, rate, time) - spot;
}

export function impliedCall(put: number, spot: number, strike: number, rate: number, time: number): number {
  return put + spot - presentValueOfStrike(strike, rate, time);
}

export function parityCheck(i: ParityInputs, tolerance = 0.005): ParityResult {
  const callSide = i.call + presentValueOfStrike(i.strike, i.rate, i.time);
  const putSide = i.put + i.spot;
  const deviation = callSide - putSide;
  if (Math.abs(deviation) <= tolerance) {
    return { callSide, putSide, deviation, status: 'aligned', action: 'No arbitrage: both sides cost the same.' };
  }
  if (deviation > 0) {
    return {
      callSide,
      putSide,
      deviation,
      status: 'call-side-rich',
      action: 'Sell the call and borrow the present value of the strike; buy the put and the stock.',
    };
  }
  return {
    callSide,
    putSide,
    deviation,
    status: 'put-side-rich',
    action: 'Sell the put and the stock; buy the call and lend the present value of the strike.',
  };
}
```
Run `npm test -- options-model` → PASS. **If `normCdf` fails its reference tests** (a coefficient may have been mis-copied), do not weaken the tests: replace the body with another double-precision implementation (for example a Cody erfc or a series/continued-fraction `erfc`) until all `normCdf` tests pass to 1e-10. The tests are the authority.

- [ ] **Step 3: Verify and commit**

```bash
npm test && npm run build 2>&1 | tail -3
git add -A
git commit -m "feat(explainers): Black-Scholes, Greeks and put-call parity model with reference tests

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 10: Options suite explainer UI (payoff builder, Greeks, parity) and chapter wiring

**Files:**
- Create: `src/explainers/options-suite/{index.tsx,PayoffView.tsx,GreeksView.tsx,ParityView.tsx}`
- Modify: `src/explainers/registry.ts`, `src/components/explainer/Explainers.astro`, frontmatter of five chapters

**Interfaces:**
- Consumes: kit, `summarisePayoff`/`netPnL` (Task 8), options model (Task 9), existing `PayoffChart` default export (props `positions`, `priceRange?`, `title?`, `description?`), `Position` type.
- Produces: default export `OptionsSuite(props: ExplainerProps)` with tabs `payoff`, `greeks`, `parity`; `view` selects the initially active tab (default `payoff`). Registry entry `'options-suite'` with `views: ['payoff','greeks','parity']`.

- [ ] **Step 1: `PayoffView.tsx`**

```tsx
import React, { useState } from 'react';
import PayoffChart from '../../components/PayoffChart';
import { Readout } from '../../components/explainer/kit/Readout';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { formatMoney, formatNumber } from '../../lib/explainer-format';
import { summarisePayoff } from '../../lib/payoff';
import type { Position } from '../../content/config';

type LegType = Position['type'];
interface Leg {
  id: number;
  type: LegType;
  strike: number;
  premium: number;
  lot: number;
}

const TYPES: Array<{ id: LegType; label: string }> = [
  { id: 'long-call', label: 'Long call' },
  { id: 'short-call', label: 'Short call' },
  { id: 'long-put', label: 'Long put' },
  { id: 'short-put', label: 'Short put' },
  { id: 'long-futures', label: 'Long underlying / futures' },
  { id: 'short-futures', label: 'Short underlying / futures' },
];

const isFuture = (t: LegType) => t === 'long-futures' || t === 'short-futures';

let nextId = 100;
const leg = (type: LegType, strike: number, premium = 0): Leg => ({ id: nextId++, type, strike, premium, lot: 1 });

const PRESETS: Array<{ label: string; build: () => Leg[] }> = [
  { label: 'Long call', build: () => [leg('long-call', 100, 5)] },
  { label: 'Long put', build: () => [leg('long-put', 100, 4)] },
  { label: 'Bull call spread', build: () => [leg('long-call', 100, 6), leg('short-call', 110, 2)] },
  { label: 'Long straddle', build: () => [leg('long-call', 100, 5), leg('long-put', 100, 4)] },
  { label: 'Covered call', build: () => [leg('long-futures', 100), leg('short-call', 105, 3)] },
  { label: 'Protective put', build: () => [leg('long-futures', 100), leg('long-put', 95, 2)] },
];

const num = 'min-h-[44px] w-full rounded-lg border border-rule bg-paper px-3 font-mono text-sm text-ink';

export function PayoffView({ currency }: { currency: string }) {
  const [legs, setLegs] = useState<Leg[]>(() => PRESETS[0].build());
  const update = (id: number, patch: Partial<Leg>) => setLegs((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const positions: Position[] = legs.map((l) => ({
    type: l.type,
    lotSize: Math.max(1, l.lot),
    ...(isFuture(l.type) ? { contractPrice: l.strike } : { strike: l.strike, premium: l.premium }),
  }));
  const strikes = legs.map((l) => l.strike).filter((s) => s > 0);
  const lo = Math.max(0, Math.floor((Math.min(...strikes, 100) * 0.6) / 10) * 10);
  const hi = Math.ceil((Math.max(...strikes, 100) * 1.4) / 10) * 10;
  const range: [number, number] = [lo, hi > lo ? hi : lo + 10];
  const summary = summarisePayoff(positions, range);

  return (
    <div className="space-y-6">
      <ExampleBar examples={PRESETS.map((p) => ({ label: p.label, apply: () => setLegs(p.build()) }))} />

      <div className="space-y-3">
        {legs.map((l, idx) => (
          <fieldset key={l.id} className="grid gap-3 rounded-xl border border-rule bg-paper p-3 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] sm:items-end">
            <legend className="sr-only">Leg {idx + 1}</legend>
            <label className="space-y-1 font-sans text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
              Position
              <select value={l.type} onChange={(e) => update(l.id, { type: e.target.value as LegType })} className={`${num} font-sans`}>
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 font-sans text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
              {isFuture(l.type) ? 'Entry price' : 'Strike'}
              <input type="number" min={1} step={1} value={l.strike} onChange={(e) => update(l.id, { strike: Math.max(1, Number(e.target.value) || 1) })} className={num} />
            </label>
            {!isFuture(l.type) ? (
              <label className="space-y-1 font-sans text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
                Premium
                <input type="number" min={0} step={0.5} value={l.premium} onChange={(e) => update(l.id, { premium: Math.max(0, Number(e.target.value) || 0) })} className={num} />
              </label>
            ) : (
              <div aria-hidden="true" />
            )}
            <label className="space-y-1 font-sans text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
              Lot size
              <input type="number" min={1} step={1} value={l.lot} onChange={(e) => update(l.id, { lot: Math.max(1, Math.round(Number(e.target.value) || 1)) })} className={num} />
            </label>
            <button
              type="button"
              disabled={legs.length === 1}
              onClick={() => setLegs((ls) => ls.filter((x) => x.id !== l.id))}
              aria-label={`Remove leg ${idx + 1}`}
              className="min-h-[44px] rounded-lg border border-rule px-3 font-sans text-sm font-semibold text-ink hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Remove
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          disabled={legs.length >= 4}
          onClick={() => setLegs((ls) => [...ls, leg('long-call', 100, 5)])}
          className="min-h-[44px] rounded-full border border-rule bg-paper px-5 font-sans text-sm font-bold text-ink hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add a leg
        </button>
      </div>

      <PayoffChart positions={positions} priceRange={range} title="Profit and loss at expiry" description="Per the legs above; the dashed lines are the individual legs." />

      <Readout
        items={[
          { label: 'Maximum profit', value: summary.maxProfit === null ? 'Unlimited' : formatMoney(summary.maxProfit, currency), tone: 'positive' },
          { label: 'Maximum loss', value: summary.maxLoss === null ? 'Unlimited' : formatMoney(summary.maxLoss, currency), tone: 'negative' },
          { label: 'Break-even', value: summary.breakEvens.length ? summary.breakEvens.map((b) => formatNumber(b, 2)).join(' and ') : 'None' },
        ]}
      />
    </div>
  );
}
```

- [ ] **Step 2: `GreeksView.tsx`**

```tsx
import React, { useState } from 'react';
import { Slider } from '../../components/explainer/kit/Slider';
import { Readout } from '../../components/explainer/kit/Readout';
import { FormulaBlock } from '../../components/explainer/kit/FormulaBlock';
import { ChartFrame } from '../../components/explainer/kit/ChartFrame';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { formatMoney, formatNumber } from '../../lib/explainer-format';
import { bsFormulaTex, bsGreeks, bsPrice, type BsInputs, type OptionType } from './model';

const REFERENCE: BsInputs = { spot: 100, strike: 100, rate: 0.05, vol: 0.2, time: 1 };
type ChartKind = 'price' | 'delta' | 'gamma';

export function GreeksView({ currency }: { currency: string }) {
  const [i, setI] = useState<BsInputs>(REFERENCE);
  const [type, setType] = useState<OptionType>('call');
  const [chart, setChart] = useState<ChartKind>('price');
  const set = (patch: Partial<BsInputs>) => setI((p) => ({ ...p, ...patch }));

  const price = bsPrice(i, type);
  const g = bsGreeks(i, type);

  const spots = Array.from({ length: 61 }, (_, k) => i.strike * 0.5 + (i.strike * k) / 60);
  const at = (s: number) => ({ ...i, spot: s });
  const priceSeries = spots.map((s) => [s, bsPrice(at(s), type)] as [number, number]);
  const intrinsic = spots.map((s) => [s, type === 'call' ? Math.max(0, s - i.strike) : Math.max(0, i.strike - s)] as [number, number]);
  const deltaSeries = spots.map((s) => [s, bsGreeks(at(s), type).delta] as [number, number]);
  const gammaSeries = spots.map((s) => [s, bsGreeks(at(s), type).gamma] as [number, number]);

  const kinds: Array<{ id: ChartKind; label: string }> = [
    { id: 'price', label: 'Price' },
    { id: 'delta', label: 'Delta' },
    { id: 'gamma', label: 'Gamma' },
  ];

  return (
    <div className="space-y-6">
      <ExampleBar examples={[{ label: 'Textbook example: at the money, 20% volatility, 1 year', apply: () => setI(REFERENCE) }]} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div role="radiogroup" aria-label="Option type" className="flex gap-2">
            {(['call', 'put'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                onClick={() => setType(t)}
                className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border px-4 font-sans text-sm font-bold capitalize ${
                  type === t ? 'border-ink bg-ink text-on-accent' : 'border-rule bg-paper text-ink hover:border-ink/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Slider label="Spot price (S)" value={i.spot} min={1} max={300} step={1} onChange={(spot) => set({ spot })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Strike price (K)" value={i.strike} min={1} max={300} step={1} onChange={(strike) => set({ strike })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Risk-free rate (r)" value={Number((i.rate * 100).toFixed(4))} min={0} max={15} step={0.1} onChange={(v) => set({ rate: v / 100 })} format={(v) => v.toFixed(1)} suffix="%" />
          <Slider label="Volatility (σ)" value={Number((i.vol * 100).toFixed(4))} min={1} max={80} step={1} onChange={(v) => set({ vol: v / 100 })} suffix="%" />
          <Slider label="Time to expiry (T)" value={i.time} min={0.01} max={2} step={0.01} onChange={(time) => set({ time })} format={(v) => v.toFixed(2)} suffix=" yr" />
        </div>

        <div className="space-y-4">
          <div role="radiogroup" aria-label="Chart" className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button
                key={k.id}
                type="button"
                role="radio"
                aria-checked={chart === k.id}
                onClick={() => setChart(k.id)}
                className={`inline-flex min-h-[44px] items-center rounded-full border px-4 font-sans text-sm font-semibold ${
                  chart === k.id ? 'border-ink bg-ink text-on-accent' : 'border-rule bg-paper text-ink hover:border-ink/40'
                }`}
              >
                {k.label} against spot
              </button>
            ))}
          </div>
          {chart === 'price' && (
            <ChartFrame
              series={[
                { id: 'price', label: `${type} price`, tone: 'rust', points: priceSeries },
                { id: 'intrinsic', label: 'Intrinsic value', tone: 'muted', dashed: true, points: intrinsic },
              ]}
              xLabel="Spot price"
              yLabel="Option price"
              formatX={(v) => formatNumber(v, 0)}
              formatY={(v) => formatMoney(v, currency)}
              markers={[{ x: i.spot, label: 'Spot', tone: 'ink' }]}
              includeZeroY
              summary={`The ${type} is worth ${formatMoney(price, currency)} at a spot of ${formatMoney(i.spot, currency, 0)}; the curve sits above intrinsic value by the time value.`}
            />
          )}
          {chart === 'delta' && (
            <ChartFrame
              series={[{ id: 'delta', label: `${type} delta`, tone: 'rust', points: deltaSeries }]}
              xLabel="Spot price"
              yLabel="Delta"
              formatX={(v) => formatNumber(v, 0)}
              formatY={(v) => formatNumber(v, 2)}
              markers={[{ x: i.spot, label: 'Spot', tone: 'ink' }]}
              includeZeroY
              summary={`Delta is ${formatNumber(g.delta, 3)} at the current spot and rises toward ${type === 'call' ? '1' : '0'} as the option moves further in the money.`}
            />
          )}
          {chart === 'gamma' && (
            <ChartFrame
              series={[{ id: 'gamma', label: 'Gamma', tone: 'rust', points: gammaSeries }]}
              xLabel="Spot price"
              yLabel="Gamma"
              formatX={(v) => formatNumber(v, 0)}
              formatY={(v) => formatNumber(v, 3)}
              markers={[{ x: i.spot, label: 'Spot', tone: 'ink' }]}
              includeZeroY
              summary={`Gamma is ${formatNumber(g.gamma, 4)} at the current spot and is highest near the strike.`}
            />
          )}
        </div>
      </div>

      <Readout
        items={[
          { label: `${type === 'call' ? 'Call' : 'Put'} price`, value: formatMoney(price, currency), tone: 'accent' },
          { label: 'Delta', value: formatNumber(g.delta, 4) },
          { label: 'Gamma', value: formatNumber(g.gamma, 5) },
          { label: 'Theta (per day)', value: formatMoney(g.theta / 365, currency, 4), hint: 'Time decay each calendar day' },
          { label: 'Vega (per 1 vol point)', value: formatMoney(g.vega / 100, currency, 4) },
          { label: 'Rho (per 1% rate)', value: formatMoney(g.rho / 100, currency, 4) },
        ]}
      />
      <FormulaBlock tex={bsFormulaTex(i, type, currency)} />
    </div>
  );
}
```

- [ ] **Step 3: `ParityView.tsx`**

```tsx
import React, { useState } from 'react';
import { Slider } from '../../components/explainer/kit/Slider';
import { Readout } from '../../components/explainer/kit/Readout';
import { FormulaBlock } from '../../components/explainer/kit/FormulaBlock';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { formatMoney, texMoney } from '../../lib/explainer-format';
import { OPTION_EXAMPLE, impliedPut, parityCheck, type ParityInputs } from './model';

export function ParityView({ currency }: { currency: string }) {
  const [i, setI] = useState<ParityInputs>(OPTION_EXAMPLE);
  const set = (patch: Partial<ParityInputs>) => setI((p) => ({ ...p, ...patch }));
  const result = parityCheck(i);
  const fairPut = impliedPut(i.call, i.spot, i.strike, i.rate, i.time);

  const tex = `C + K e^{-rT} = P + S \\;\\Rightarrow\\; ${texMoney(i.call, currency)} + ${texMoney(i.strike * Math.exp(-i.rate * i.time), currency)} \\;\\text{vs}\\; ${texMoney(i.put, currency)} + ${texMoney(i.spot, currency)}`;

  return (
    <div className="space-y-6">
      <ExampleBar
        examples={[
          { label: 'Chapter example: call $8.00, fair put $3.12', apply: () => setI(OPTION_EXAMPLE) },
          { label: 'Dislocated market: put at $4.00', apply: () => setI({ ...OPTION_EXAMPLE, put: 4 }) },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <Slider label="Spot price (S)" value={i.spot} min={1} max={300} step={1} onChange={(spot) => set({ spot })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Strike price (K)" value={i.strike} min={1} max={300} step={1} onChange={(strike) => set({ strike })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Risk-free rate (r)" value={Number((i.rate * 100).toFixed(4))} min={0} max={15} step={0.1} onChange={(v) => set({ rate: v / 100 })} format={(v) => v.toFixed(1)} suffix="%" />
          <Slider label="Time to expiry (T)" value={i.time} min={0} max={3} step={0.05} onChange={(time) => set({ time })} format={(v) => v.toFixed(2)} suffix=" yr" />
        </div>
        <div className="space-y-5">
          <Slider label="Call premium (C)" value={i.call} min={0} max={100} step={0.05} onChange={(call) => set({ call })} format={(v) => formatMoney(v, currency)} />
          <Slider label="Put premium (P)" value={i.put} min={0} max={100} step={0.05} onChange={(put) => set({ put })} format={(v) => formatMoney(v, currency)} />
          <p className="font-sans text-sm text-ink-muted">
            For these inputs the fair put is {formatMoney(fairPut, currency)}.
          </p>
        </div>
      </div>

      <Readout
        items={[
          { label: 'Call + PV(K)', value: formatMoney(result.callSide, currency) },
          { label: 'Put + stock', value: formatMoney(result.putSide, currency) },
          { label: 'Difference', value: formatMoney(result.deviation, currency), tone: result.status === 'aligned' ? 'positive' : 'negative' },
        ]}
      />
      <p role="status" className="rounded-xl border border-rule bg-paper p-4 font-serif text-base text-ink">
        <span className="mr-2 font-sans text-xs font-bold uppercase tracking-[0.12em] text-rust">
          {result.status === 'aligned' ? 'Aligned' : 'Arbitrage'}
        </span>
        {result.action}
      </p>
      <FormulaBlock tex={tex} />
    </div>
  );
}
```
- [ ] **Step 4: `index.tsx`**

```tsx
import React, { useState } from 'react';
import { ExplainerFrame } from '../../components/explainer/kit/ExplainerFrame';
import { Tabs } from '../../components/explainer/kit/Tabs';
import type { ExplainerProps } from '../types';
import { PayoffView } from './PayoffView';
import { GreeksView } from './GreeksView';
import { ParityView } from './ParityView';

const TABS = [
  { id: 'payoff', label: 'Strategy payoff' },
  { id: 'greeks', label: 'Price and Greeks' },
  { id: 'parity', label: 'Put-call parity' },
];

function Inner({ view, currency }: { view?: string; currency: string }) {
  const [active, setActive] = useState(TABS.some((t) => t.id === view) ? (view as string) : 'payoff');
  return (
    <Tabs tabs={TABS} active={active} onChange={setActive}>
      {active === 'payoff' && <PayoffView currency={currency} />}
      {active === 'greeks' && <GreeksView currency={currency} />}
      {active === 'parity' && <ParityView currency={currency} />}
    </Tabs>
  );
}

export default function OptionsSuite({ view, currency = '$' }: ExplainerProps) {
  return (
    <ExplainerFrame title="Options explorer" description="Build a strategy, price an option and see its Greeks, and check put-call parity.">
      <Inner view={view} currency={currency} />
    </ExplainerFrame>
  );
}
```

- [ ] **Step 5: Register and wire**

Registry: `'options-suite': { title: 'Options explorer', views: ['payoff', 'greeks', 'parity'] as const },`. `Explainers.astro`: import `OptionsSuite from '../../explainers/options-suite/index'` and add `'options-suite': OptionsSuite`. Add this one frontmatter line (right after each chapter's `tags:` line):

| Chapter folder | Line |
|---|---|
| `options-basics-moneyness` | `explainers: [{ name: "options-suite", view: "payoff" }]` |
| `intrinsic-value-time-value-options-payoff-charts` | `explainers: [{ name: "options-suite", view: "payoff" }]` |
| `options-trading-hedging-strategies` | `explainers: [{ name: "options-suite", view: "payoff" }]` |
| `option-greeks-pricing-models-implied-volatility` | `explainers: [{ name: "options-suite", view: "greeks" }]` |
| `put-call-parity-delta-hedging` | `explainers: [{ name: "options-suite", view: "parity" }]` |

- [ ] **Step 6: Verify**

`npm test && npm run build`. Then headless Chrome (dev server) on `/topics/options-basics-moneyness` (payoff), `/topics/option-greeks-pricing-models-implied-volatility` (greeks tab active on load), `/topics/put-call-parity-delta-hedging` (parity tab active): (a) the active tab matches the frontmatter `view`, and all three tabs are switchable by click and arrow keys; (b) payoff: presets load (e.g. Bull call spread shows max profit `$6.00`, max loss `-$4.00`, break-even `104.00`; Long straddle shows `91.00 and 109.00`), add/remove leg works (Remove disabled at one leg, Add disabled at four), the embedded PayoffChart updates and its hover tooltip works; (c) greeks: the textbook example shows call price `$10.45`, delta `0.6368`, gamma `0.01876`, theta per day about `-$0.0176`, vega per point about `$0.3752`, rho per percent about `$0.5323`; switching to put gives `$5.57` and delta `-0.3632`; slider extremes (σ 1%, T 0.01 yr, S 1 vs K 300) show no `NaN`/`Infinity`; the three chart choices render; (d) parity: the chapter example shows `Aligned` with fair put `$3.12`; the dislocated example shows an arbitrage action; (e) no console errors or hydration warnings; (f) both themes (view screenshots), reduced motion, no-JS shows the default tab content; (g) axe clean in light and dark on all three pages; (h) the existing payoff chart on `/topics/futures-payoff-charts` is unchanged.

- [ ] **Step 7: Commit and push**

```bash
git add -A
git commit -m "feat(explainers): options explorer (payoff builder, Greeks, parity) on five chapters

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 11: Margin ledger model (pure, tested)

**Files:**
- Create: `src/explainers/margin-ledger/model.ts`, `tests/margin-ledger.test.ts`

**Interfaces:**
- Produces: `type Side = 'long'|'short'`; `interface LedgerInputs { entryPrice: number; prices: number[]; lotSize: number; side: Side; initialMargin: number; maintenanceMargin: number; meetCalls: boolean }`; `interface LedgerRow { day: number; price: number; change: number; mtm: number; deposit: number; endBalance: number; marginCall: number; status: 'opened'|'open'|'call'|'liquidated'; note: string }`; `buildLedger(i): LedgerRow[]` (row 0 is the entry); `MARGIN_EXAMPLE` (the chapter's: entry 50, prices `[52, 47, 49]`, lot 100, long, initial 500, maintenance 350, `meetCalls: true`); `ledgerFormulaTex(row, i, currency?): string` is NOT needed — keep to `buildLedger`.

Semantics (match the chapter's table): each day the previous day's margin call is deposited at the start of the day (if `meetCalls`; otherwise the position is liquidated at the start of that day and the ledger stops with a `liquidated` row); then `mtm = sign × (price − previousPrice) × lotSize`; `endBalance = previousEndBalance + deposit + mtm`; `marginCall = initialMargin − endBalance` when `endBalance < maintenanceMargin` (strictly below), else 0.

- [ ] **Step 1: Write the failing tests**

`tests/margin-ledger.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { MARGIN_EXAMPLE, buildLedger, type LedgerInputs } from '../src/explainers/margin-ledger/model';

describe('chapter worked example', () => {
  const rows = buildLedger(MARGIN_EXAMPLE);

  it('has the entry row plus one row per settlement price', () => {
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ day: 0, price: 50, endBalance: 500, status: 'opened' });
  });
  it('Day 1: price +2 gives +$200 and a $700 balance', () => {
    expect(rows[1]).toMatchObject({ day: 1, price: 52, change: 2, mtm: 200, deposit: 0, endBalance: 700, marginCall: 0, status: 'open' });
  });
  it('Day 2: price -5 gives -$500, balance $200, breaching maintenance with a $300 call', () => {
    expect(rows[2]).toMatchObject({ day: 2, price: 47, change: -5, mtm: -500, endBalance: 200, marginCall: 300, status: 'call' });
  });
  it('Day 3: the $300 variation margin is deposited, then +$200 gives $700', () => {
    expect(rows[3]).toMatchObject({ day: 3, price: 49, change: 2, mtm: 200, deposit: 300, endBalance: 700, marginCall: 0, status: 'open' });
  });
});

describe('edge cases', () => {
  const base: LedgerInputs = { entryPrice: 50, prices: [], lotSize: 100, side: 'long', initialMargin: 500, maintenanceMargin: 350, meetCalls: true };

  it('no price path gives just the entry row', () => {
    expect(buildLedger(base)).toHaveLength(1);
  });
  it('no price change means no cash flow and no call', () => {
    const r = buildLedger({ ...base, prices: [50] });
    expect(r[1]).toMatchObject({ mtm: 0, endBalance: 500, marginCall: 0, status: 'open' });
  });
  it('a call can occur on the first day', () => {
    const r = buildLedger({ ...base, prices: [46] });
    expect(r[1]).toMatchObject({ mtm: -400, endBalance: 100, marginCall: 400, status: 'call' });
  });
  it('a balance exactly at maintenance does not trigger a call', () => {
    const r = buildLedger({ ...base, prices: [48.5] });
    expect(r[1].endBalance).toBe(350);
    expect(r[1].marginCall).toBe(0);
  });
  it('a short position gains when the price falls', () => {
    const r = buildLedger({ ...base, side: 'short', prices: [48] });
    expect(r[1]).toMatchObject({ mtm: 200, endBalance: 700 });
  });
  it('a short position faces a call when the price rises', () => {
    const r = buildLedger({ ...base, side: 'short', prices: [55] });
    expect(r[1]).toMatchObject({ mtm: -500, endBalance: 0, marginCall: 500, status: 'call' });
  });
  it('the balance can go negative when losses exceed the margin', () => {
    const r = buildLedger({ ...base, prices: [40] });
    expect(r[1].endBalance).toBe(-500);
    expect(r[1].marginCall).toBe(1000);
  });
  it('an unmet call liquidates the position the next day and stops the ledger', () => {
    const r = buildLedger({ ...base, prices: [47, 49, 52], meetCalls: false });
    expect(r).toHaveLength(3);
    expect(r[1].status).toBe('call');
    expect(r[2].status).toBe('liquidated');
    expect(r[2].mtm).toBe(0);
    expect(r[2].endBalance).toBe(r[1].endBalance);
  });
  it('never produces NaN even with a zero lot size or zero margins', () => {
    const r = buildLedger({ ...base, lotSize: 0, initialMargin: 0, maintenanceMargin: 0, prices: [60, 40] });
    for (const row of r) for (const v of [row.price, row.change, row.mtm, row.deposit, row.endBalance, row.marginCall]) expect(Number.isNaN(v)).toBe(false);
  });
});
```
Run `npm test -- margin-ledger` → FAIL.

- [ ] **Step 2: Implement `src/explainers/margin-ledger/model.ts`**

```ts
export type Side = 'long' | 'short';
export type LedgerStatus = 'opened' | 'open' | 'call' | 'liquidated';

export interface LedgerInputs {
  entryPrice: number;
  /** Daily settlement prices for Day 1, Day 2, ... */
  prices: number[];
  lotSize: number;
  side: Side;
  initialMargin: number;
  maintenanceMargin: number;
  /** When false, an unmet margin call leads to liquidation at the start of the next day. */
  meetCalls: boolean;
}

export interface LedgerRow {
  day: number;
  price: number;
  change: number;
  mtm: number;
  /** Variation margin deposited at the start of the day (to meet the previous day's call). */
  deposit: number;
  endBalance: number;
  /** Amount demanded at the end of this day (balance below maintenance), else 0. */
  marginCall: number;
  status: LedgerStatus;
  note: string;
}

/** The chapter's worked example: long 1 contract, lot 100, entry $50, initial $500, maintenance $350. */
export const MARGIN_EXAMPLE: LedgerInputs = {
  entryPrice: 50,
  prices: [52, 47, 49],
  lotSize: 100,
  side: 'long',
  initialMargin: 500,
  maintenanceMargin: 350,
  meetCalls: true,
};

export function buildLedger(i: LedgerInputs): LedgerRow[] {
  const sign = i.side === 'long' ? 1 : -1;
  const rows: LedgerRow[] = [
    { day: 0, price: i.entryPrice, change: 0, mtm: 0, deposit: 0, endBalance: i.initialMargin, marginCall: 0, status: 'opened', note: 'Position opened, initial margin posted' },
  ];
  let balance = i.initialMargin;
  let prevPrice = i.entryPrice;
  let pendingCall = 0;

  for (let d = 0; d < i.prices.length; d++) {
    const day = d + 1;
    const price = i.prices[d];

    if (pendingCall > 0 && !i.meetCalls) {
      rows.push({ day, price: prevPrice, change: 0, mtm: 0, deposit: 0, endBalance: balance, marginCall: 0, status: 'liquidated', note: 'Margin call not met: position liquidated' });
      break;
    }

    const deposit = pendingCall;
    const change = price - prevPrice;
    const mtm = sign * change * i.lotSize;
    balance = balance + deposit + mtm;
    const marginCall = balance < i.maintenanceMargin ? i.initialMargin - balance : 0;
    const note =
      marginCall > 0
        ? `Below maintenance: margin call for ${marginCall}`
        : mtm > 0
          ? 'Profit credited to the account'
          : mtm < 0
            ? 'Loss debited from the account'
            : 'No change';

    rows.push({ day, price, change, mtm, deposit, endBalance: balance, marginCall, status: marginCall > 0 ? 'call' : 'open', note });
    pendingCall = marginCall;
    prevPrice = price;
  }
  return rows;
}
```
Run `npm test -- margin-ledger` → PASS. (The zero-margins NaN case passes because no division occurs; if a test expectation is wrong for a reason you can justify from the chapter table, fix the model or the test deliberately and note it in the report.)

- [ ] **Step 3: Verify and commit**

```bash
npm test && npm run build 2>&1 | tail -3
git add -A
git commit -m "feat(explainers): margin ledger model pinned to the chapter's four-day table

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 12: Margin ledger explainer UI and chapter wiring

**Files:**
- Create: `src/explainers/margin-ledger/index.tsx`
- Modify: `src/explainers/registry.ts`, `src/components/explainer/Explainers.astro`, `src/content/topics/margining-mark-to-market-span/note.mdx` (frontmatter line only)

**Interfaces:**
- Consumes: kit, Task 11 model.
- Produces: default export `MarginLedger(props: ExplainerProps)`; registry key `'margin-ledger'`.

- [ ] **Step 1: Write `index.tsx`**

```tsx
import React, { useState } from 'react';
import { ExplainerFrame } from '../../components/explainer/kit/ExplainerFrame';
import { Slider } from '../../components/explainer/kit/Slider';
import { Readout } from '../../components/explainer/kit/Readout';
import { ChartFrame } from '../../components/explainer/kit/ChartFrame';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { formatMoney, formatNumber } from '../../lib/explainer-format';
import type { ExplainerProps } from '../types';
import { MARGIN_EXAMPLE, buildLedger, type LedgerInputs, type LedgerRow } from './model';

const num = 'min-h-[44px] w-full rounded-lg border border-rule bg-paper px-3 font-mono text-sm text-ink';

function statusLabel(row: LedgerRow, currency: string): string {
  switch (row.status) {
    case 'opened':
      return 'Position opened';
    case 'call':
      return `Margin call: deposit ${formatMoney(row.marginCall, currency)}`;
    case 'liquidated':
      return 'Position liquidated';
    default:
      return row.mtm > 0 ? 'Profit credited' : row.mtm < 0 ? 'Loss debited' : 'No change';
  }
}

function Inner({ currency }: { currency: string }) {
  const [i, setI] = useState<LedgerInputs>(MARGIN_EXAMPLE);
  const set = (patch: Partial<LedgerInputs>) => setI((p) => ({ ...p, ...patch }));
  const rows = buildLedger(i);
  const last = rows[rows.length - 1];
  const calls = rows.filter((r) => r.status === 'call').length;
  const liquidated = rows.some((r) => r.status === 'liquidated');

  const setPrice = (idx: number, value: number) => set({ prices: i.prices.map((p, k) => (k === idx ? value : p)) });

  const balanceSeries = rows.map((r) => [r.day, r.endBalance] as [number, number]);
  const spanX: [number, number] = [0, Math.max(1, rows.length - 1)];

  return (
    <div className="space-y-6">
      <ExampleBar examples={[{ label: 'Chapter example: long 1 contract at $50', apply: () => setI(MARGIN_EXAMPLE) }]} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div role="radiogroup" aria-label="Position side" className="flex gap-2">
            {(['long', 'short'] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={i.side === s}
                onClick={() => set({ side: s })}
                className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border px-4 font-sans text-sm font-bold capitalize ${
                  i.side === s ? 'border-ink bg-ink text-on-accent' : 'border-rule bg-paper text-ink hover:border-ink/40'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Slider label="Entry price" value={i.entryPrice} min={1} max={200} step={0.5} onChange={(entryPrice) => set({ entryPrice })} format={(v) => formatMoney(v, currency)} />
          <Slider label="Lot size (units per contract)" value={i.lotSize} min={1} max={1000} step={1} onChange={(lotSize) => set({ lotSize })} />
          <Slider label="Initial margin" value={i.initialMargin} min={0} max={5000} step={50} onChange={(initialMargin) => set({ initialMargin })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Maintenance margin" value={i.maintenanceMargin} min={0} max={5000} step={50} onChange={(maintenanceMargin) => set({ maintenanceMargin })} format={(v) => formatMoney(v, currency, 0)} />
          <label className="flex min-h-[44px] items-center gap-3 font-sans text-sm font-semibold text-ink">
            <input type="checkbox" checked={i.meetCalls} onChange={(e) => set({ meetCalls: e.target.checked })} className="h-5 w-5 accent-[rgb(var(--rust))]" />
            Trader meets every margin call
          </label>

          <fieldset className="space-y-2">
            <legend className="font-sans text-sm font-semibold text-ink">Daily settlement prices</legend>
            {i.prices.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <label htmlFor={`ml-day-${idx}`} className="w-14 font-sans text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">Day {idx + 1}</label>
                <input id={`ml-day-${idx}`} type="number" step={0.5} value={p} onChange={(e) => setPrice(idx, Number(e.target.value) || 0)} className={num} />
                <button
                  type="button"
                  aria-label={`Remove day ${idx + 1}`}
                  onClick={() => set({ prices: i.prices.filter((_, k) => k !== idx) })}
                  className="min-h-[44px] rounded-lg border border-rule px-3 font-sans text-sm font-semibold text-ink hover:border-ink/40"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={i.prices.length >= 20}
              onClick={() => set({ prices: [...i.prices, i.prices[i.prices.length - 1] ?? i.entryPrice] })}
              className="min-h-[44px] rounded-full border border-rule bg-paper px-5 font-sans text-sm font-bold text-ink hover:border-ink/40 disabled:opacity-40"
            >
              Add a day
            </button>
          </fieldset>
        </div>

        <ChartFrame
          series={[
            { id: 'balance', label: 'Account balance', tone: 'rust', points: balanceSeries },
            { id: 'maintenance', label: 'Maintenance margin', tone: 'danger', dashed: true, points: [[spanX[0], i.maintenanceMargin], [spanX[1], i.maintenanceMargin]] },
            { id: 'initial', label: 'Initial margin', tone: 'muted', dashed: true, points: [[spanX[0], i.initialMargin], [spanX[1], i.initialMargin]] },
          ]}
          xLabel="Trading day"
          yLabel="Balance"
          formatX={(v) => formatNumber(v, 0)}
          formatY={(v) => formatMoney(v, currency, 0)}
          markers={rows.filter((r) => r.status === 'call').map((r) => ({ x: r.day, label: 'Call', tone: 'danger' as const }))}
          includeZeroY
          summary={`The balance starts at ${formatMoney(rows[0].endBalance, currency, 0)} and ends at ${formatMoney(last.endBalance, currency, 0)} after ${rows.length - 1} days with ${calls} margin call${calls === 1 ? '' : 's'}${liquidated ? ' and a forced liquidation' : ''}.`}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left font-mono text-sm">
          <caption className="mb-2 text-left font-sans text-sm font-semibold text-ink">Daily mark-to-market ledger</caption>
          <thead>
            <tr className="font-sans text-xs uppercase tracking-[0.1em] text-ink-muted">
              {['Day', 'Settlement', 'Change', 'MTM cash flow', 'Deposit', 'End balance', 'Status'].map((h) => (
                <th key={h} scope="col" className="border-b-2 border-ink px-2 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.day} className={r.status === 'call' || r.status === 'liquidated' ? 'bg-danger/10' : ''}>
                <th scope="row" className="border-b border-rule px-2 py-2 font-semibold">{r.day}</th>
                <td className="border-b border-rule px-2 py-2">{formatMoney(r.price, currency)}</td>
                <td className="border-b border-rule px-2 py-2">{r.day === 0 ? '—' : formatMoney(r.change, currency)}</td>
                <td className="border-b border-rule px-2 py-2">{r.day === 0 ? '—' : formatMoney(r.mtm, currency)}</td>
                <td className="border-b border-rule px-2 py-2">{r.deposit > 0 ? formatMoney(r.deposit, currency) : '—'}</td>
                <td className="border-b border-rule px-2 py-2 font-semibold">{formatMoney(r.endBalance, currency)}</td>
                <td className="border-b border-rule px-2 py-2 font-sans">{statusLabel(r, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Readout
        items={[
          { label: 'Final balance', value: formatMoney(last.endBalance, currency), tone: last.endBalance < i.maintenanceMargin ? 'negative' : 'accent' },
          { label: 'Margin calls', value: String(calls), tone: calls > 0 ? 'negative' : 'default' },
          { label: 'Total variation margin paid', value: formatMoney(rows.reduce((s, r) => s + r.deposit, 0), currency) },
        ]}
      />
    </div>
  );
}

export default function MarginLedger({ currency = '$' }: ExplainerProps) {
  return (
    <ExplainerFrame title="Margin and mark-to-market ledger" description="Change the price path and see daily settlement, margin calls and variation margin. It opens on the chapter's four-day example.">
      <Inner currency={currency} />
    </ExplainerFrame>
  );
}
```

- [ ] **Step 2: Register and wire**

Registry: `'margin-ledger': { title: 'Margin and mark-to-market ledger' },`. `Explainers.astro`: import `MarginLedger from '../../explainers/margin-ledger/index'` and add `'margin-ledger': MarginLedger`. In `src/content/topics/margining-mark-to-market-span/note.mdx` add after the `tags:` line: `explainers: ["margin-ledger"]`.

- [ ] **Step 3: Verify**

`npm test && npm run build`. Headless Chrome on `/topics/margining-mark-to-market-span`: (a) on load the ledger table matches the chapter: Day 1 `$700.00`, Day 2 `$200.00` with `Margin call: deposit $300.00`, Day 3 deposit `$300.00` and balance `$700.00`; (b) unticking "Trader meets every margin call" ends the table with a `Position liquidated` row; (c) switching to Short, editing a price, adding/removing days, Reset — all work with no `NaN`; lot size 1 and margins 0 show no `NaN`; (d) the chart's balance line and the dashed margin lines are visible in both themes (view screenshots); (e) the table scrolls horizontally on a 390px viewport without page overflow; (f) no console/hydration warnings, no-JS shows the table; (g) axe clean in both themes.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "feat(explainers): margin and mark-to-market ledger on the margining chapter

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 13: Better diagram forms (five chapters) and the engine changes they need

**Files:**
- Create: `src/utils/extra-diagrams.ts`, `tests/extra-diagrams.test.ts`, `src/content/topics/margining-mark-to-market-span/diagram-2.mmd`, `src/content/topics/position-limits-risk-management/diagram-2.mmd`
- Modify: `src/lib/diagram-theme.ts`, `tests/diagram-theme.test.ts`, `src/utils/topic-loader.ts`, `src/pages/topics/[slug].astro`; rewrite `diagram.mmd` in `clearing-settlement-mechanism`, `derivatives-trading-mechanism`, `margining-mark-to-market-span`, `time-value-of-money`, `position-limits-risk-management`

**Interfaces:**
- Produces: `parseDiagramTitle(source: string): { title: string | null; code: string }` (strips a first line `%% title: …`); `readExtraDiagrams(topicDir: string): Array<{ title: string | null; code: string }>` (reads `diagram-2.mmd`, `diagram-3.mmd`, … stopping at the first missing number); `TopicAuxiliaryData.extraDiagrams`; `buildThemeVariables` additionally returns the sequence-, state- and timeline-diagram variables.

- [ ] **Step 1: Failing tests for the extra-diagram reader**

`tests/extra-diagrams.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseDiagramTitle, readExtraDiagrams } from '../src/utils/extra-diagrams';

describe('parseDiagramTitle', () => {
  it('strips a leading title comment and trims the code', () => {
    expect(parseDiagramTitle('%% title: Portfolio margining\n\ngraph TD\n  A-->B\n')).toEqual({
      title: 'Portfolio margining',
      code: 'graph TD\n  A-->B',
    });
  });
  it('returns a null title when there is none', () => {
    expect(parseDiagramTitle('graph TD\n  A-->B')).toEqual({ title: null, code: 'graph TD\n  A-->B' });
  });
  it('does not treat other comments as titles', () => {
    expect(parseDiagramTitle('%% a comment\ngraph TD').title).toBeNull();
  });
});

describe('readExtraDiagrams', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'extra-diagrams-'));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns nothing when there are no extra files', () => {
    fs.writeFileSync(path.join(dir, 'diagram.mmd'), 'graph TD');
    expect(readExtraDiagrams(dir)).toEqual([]);
  });
  it('reads diagram-2, diagram-3 in order', () => {
    fs.writeFileSync(path.join(dir, 'diagram-2.mmd'), '%% title: Second\ngraph TD\n  A-->B');
    fs.writeFileSync(path.join(dir, 'diagram-3.mmd'), 'graph LR\n  C-->D');
    const out = readExtraDiagrams(dir);
    expect(out).toHaveLength(2);
    expect(out[0].title).toBe('Second');
    expect(out[1]).toEqual({ title: null, code: 'graph LR\n  C-->D' });
  });
  it('stops at the first missing number', () => {
    fs.writeFileSync(path.join(dir, 'diagram-3.mmd'), 'graph TD');
    expect(readExtraDiagrams(dir)).toEqual([]);
  });
  it('fails loudly for an empty extra file', () => {
    fs.writeFileSync(path.join(dir, 'diagram-2.mmd'), '   \n');
    expect(() => readExtraDiagrams(dir)).toThrow(/diagram-2\.mmd is empty/);
  });
});
```
Run `npm test -- extra-diagrams` → FAIL.

- [ ] **Step 2: Implement `src/utils/extra-diagrams.ts`**

```ts
import fs from 'node:fs';
import path from 'node:path';

export interface ExtraDiagram {
  title: string | null;
  code: string;
}

export function parseDiagramTitle(source: string): ExtraDiagram {
  const trimmed = source.trim();
  const match = trimmed.match(/^%%\s*title:\s*(.+?)\s*(?:\r?\n|$)/);
  if (!match) return { title: null, code: trimmed };
  return { title: match[1], code: trimmed.slice(match[0].length).trim() };
}

/** Reads optional extra diagrams `diagram-2.mmd`, `diagram-3.mmd`, ... (stops at the first missing number). */
export function readExtraDiagrams(topicDir: string): ExtraDiagram[] {
  const out: ExtraDiagram[] = [];
  for (let n = 2; ; n++) {
    const file = path.join(topicDir, `diagram-${n}.mmd`);
    if (!fs.existsSync(file)) break;
    const raw = fs.readFileSync(file, 'utf-8');
    if (raw.trim() === '') {
      throw new Error(`[Content Validation Error] diagram-${n}.mmd is empty in ${topicDir}`);
    }
    out.push(parseDiagramTitle(raw));
  }
  return out;
}
```
Run `npm test -- extra-diagrams` → PASS.

- [ ] **Step 3: Loader and page**

In `src/utils/topic-loader.ts`: `import { readExtraDiagrams, type ExtraDiagram } from './extra-diagrams';`, add `extraDiagrams: ExtraDiagram[];` to `TopicAuxiliaryData`, and in the returned object add `extraDiagrams: readExtraDiagrams(topicDir),`.

In `src/pages/topics/[slug].astro`, inside the `Section id="visual-model"` card, after the existing `Diagram`/`noscript` (the non-payoff branch), render the extras. Replace the existing else-branch fragment with:
```astro
            <Diagram client:visible code={auxiliary.diagram} title={`${topic.data.title}: concept diagram`} />
            <noscript>
              <style is:inline>.dg-loading{display:none}</style>
              <p class="mb-2 font-sans text-sm font-semibold text-ink">The diagram needs JavaScript. Its source:</p>
              <pre class="overflow-x-auto rounded-lg bg-[rgb(var(--code-bg))] p-4 font-mono text-xs text-[rgb(var(--code-fg))]">{auxiliary.diagram}</pre>
            </noscript>
            {auxiliary.extraDiagrams.map((extra) => (
              <div class="mt-10 border-t border-rule pt-8">
                {extra.title && <h3 class="mb-4 font-serif text-xl font-semibold text-ink">{extra.title}</h3>}
                <Diagram client:visible code={extra.code} title={`${topic.data.title}: ${extra.title ?? 'additional diagram'}`} />
                <noscript>
                  <p class="mb-2 font-sans text-sm font-semibold text-ink">The diagram needs JavaScript. Its source:</p>
                  <pre class="overflow-x-auto rounded-lg bg-[rgb(var(--code-bg))] p-4 font-mono text-xs text-[rgb(var(--code-fg))]">{extra.code}</pre>
                </noscript>
              </div>
            ))}
```

- [ ] **Step 4: Theme variables for sequence, state and timeline diagrams (test first)**

Add to `tests/diagram-theme.test.ts`:
```ts
describe('buildThemeVariables covers non-flowchart diagram types', () => {
  const v = buildThemeVariables(tokens);
  it('sets sequence-diagram variables from the tokens', () => {
    expect(v.actorBkg).toBe('#fffdf8');
    expect(v.actorTextColor).toBe('#1a1714');
    expect(v.signalColor).toBe('#1a1714');
    expect(v.noteBkgColor).toBe('#f2c66b');
    expect(v.sequenceNumberColor).toBeDefined();
  });
  it('sets state-diagram variables', () => {
    expect(v.transitionColor).toBe('#5e554b');
    expect(v.stateLabelColor).toBe('#1a1714');
    expect(v.compositeBackground).toBeDefined();
  });
  it('sets timeline colour scale variables', () => {
    expect(v.cScale0).toBeDefined();
    expect(v.cScaleLabel0).toBe('#1a1714');
  });
});
```
(The `tokens` constant in that file already holds the light-theme triplets: paper-raised `255 253 248` → `#fffdf8`, ink `26 23 20` → `#1a1714`, ink-muted `94 85 75` → `#5e554b`, gold `242 198 107` → `#f2c66b`.) Run → FAIL.

Extend `buildThemeVariables` in `src/lib/diagram-theme.ts` (add to the returned object):
```ts
    // Sequence diagrams
    actorBkg: h(t['paper-raised']),
    actorBorder: h(t.ink),
    actorTextColor: h(t.ink),
    actorLineColor: h(t['ink-muted']),
    signalColor: h(t.ink),
    signalTextColor: h(t.ink),
    labelBoxBkgColor: h(t['paper-raised']),
    labelBoxBorderColor: h(t.rule),
    labelTextColor: h(t.ink),
    loopTextColor: h(t.ink),
    noteBkgColor: h(t.gold),
    noteBorderColor: h(t.rule),
    noteTextColor: h(t.ink),
    activationBkgColor: h(t.paper),
    activationBorderColor: h(t['ink-muted']),
    sequenceNumberColor: h(t.paper),
    // State diagrams
    transitionColor: h(t['ink-muted']),
    transitionLabelColor: h(t.ink),
    stateLabelColor: h(t.ink),
    stateBkg: h(t['paper-raised']),
    labelBackgroundColor: h(t.paper),
    compositeBackground: h(t.paper),
    compositeBorder: h(t.rule),
    compositeTitleBackground: h(t['paper-raised']),
    altBackground: h(t.paper),
    specialStateColor: h(t.ink),
    // Timeline
    cScale0: h(t['paper-raised']),
    cScale1: h(t.gold),
    cScale2: h(t['paper-raised']),
    cScale3: h(t.gold),
    cScaleLabel0: h(t.ink),
    cScaleLabel1: h(t.ink),
    cScaleLabel2: h(t.ink),
    cScaleLabel3: h(t.ink),
```
Before relying on any name, check it exists for Mermaid 11.17.2 (`grep -rn "actorBkg\|transitionColor\|cScaleLabel0\|compositeBackground\|sequenceNumberColor" node_modules/mermaid/dist/*.mjs | head`); **remove any variable Mermaid does not read** (an unknown key is harmless but should not be shipped), and adjust the test expectations accordingly. Run `npm test` → PASS.

- [ ] **Step 5: Write the five diagrams**

`src/content/topics/clearing-settlement-mechanism/diagram.mmd`:
```
sequenceDiagram
    autonumber
    participant B as Buyer (long)
    participant X as Exchange
    participant S as Seller (short)
    participant CC as Clearing Corporation
    B->>X: Buy order
    S->>X: Sell order
    X->>X: Match the trade
    X->>CC: Report trade for clearing
    Note over CC: Novation: the clearing corporation steps between buyer and seller
    CC-->>B: Becomes seller to the buyer
    CC-->>S: Becomes buyer to the seller
    loop Every trading day until expiry
        CC->>B: Daily mark-to-market cash gain or loss
        CC->>S: Daily mark-to-market cash gain or loss
    end
    alt Index or rates contract
        CC->>B: Cash settlement of net profit and loss
        CC->>S: Cash settlement of net profit and loss
    else Single stock or commodity
        S->>CC: Deliver the underlying asset
        CC->>B: Deliver the underlying asset
    end
    Note over B,S: Contract extinguished
```

`src/content/topics/derivatives-trading-mechanism/diagram.mmd`:
```
sequenceDiagram
    autonumber
    actor I as Investor
    participant Br as Broker (trading member)
    participant Ex as Exchange gateway
    participant OB as Central limit order book
    participant ME as Matching engine
    participant CH as Clearing and settlement
    I->>Br: Submit an order (market, limit or stop-loss)
    Br->>Br: Risk and margin verification
    Br->>Ex: Route the order
    Ex->>OB: Place the order in the book
    alt Stop-loss order
        OB->>OB: Stay passive until the trigger price is reached
    end
    OB->>ME: Orders at the best bid and ask
    ME->>ME: 1. Price priority (best price first)
    ME->>ME: 2. Time priority (first in, first out)
    ME-->>Br: Matched trade generated
    ME->>CH: Send the matched trade
    CH-->>I: Confirmed long or short position
```

`src/content/topics/margining-mark-to-market-span/diagram.mmd`:
```
stateDiagram-v2
    [*] --> Open: Initial margin posted
    state "Position open (balance above maintenance)" as Open
    Open --> Open: Daily mark-to-market keeps the balance above maintenance
    Open --> MarginCall: Balance falls below maintenance
    state "Margin call issued (variation margin requested)" as MarginCall
    MarginCall --> Restored: Trader deposits variation margin
    state "Balance restored to initial margin" as Restored
    Restored --> Open: Next session
    MarginCall --> Liquidated: Trader fails to deposit
    state "Broker forcibly liquidates the position" as Liquidated
    Liquidated --> [*]
```

`src/content/topics/margining-mark-to-market-span/diagram-2.mmd`:
```
%% title: Portfolio-based margining (scenario analysis)
graph TD
    Combined["Combined Portfolio<br/>(Futures + Options Legs)"] --> Scenarios["Scenario Matrix Analysis<br/>(Price Shifts ± Volatility Shifts)"]
    Scenarios --> WorstLoss["Identify Worst Plausible Loss Across Scenarios"]
    WorstLoss --> CreditOffset["Apply Spread & Hedging Risk Credits"]
    CreditOffset --> NetMargin["Total Portfolio Initial Margin Required"]
```

`src/content/topics/time-value-of-money/diagram.mmd`:
```
timeline
    title Cash flow timeline (t = 0 to t = 3)
    t = 0 (today) : Present value PV
    t = 1 year : Cash flow PMT 1 : Compounded by (1 + r)
    t = 2 years : Cash flow PMT 2 : Compounded by (1 + r)^2
    t = 3 years : Future value FV : Compounded by (1 + r)^3 : Discount back by dividing by (1 + r)^3
```

`src/content/topics/position-limits-risk-management/diagram.mmd`:
```
stateDiagram-v2
    [*] --> Normal
    state "Normal trading operations" as Normal
    Normal --> SquareOff: Client, member or market limit breached
    state "Square-off mode (only position-reducing trades permitted)" as SquareOff
    SquareOff --> Restored: Mandatory reduction completed within the deadline
    SquareOff --> Enforcement: Deadline missed
    state "Position restored within limits" as Restored
    state "Forced liquidation and penalties (fines, trading suspension)" as Enforcement
    Restored --> Normal
    Enforcement --> [*]
```

`src/content/topics/position-limits-risk-management/diagram-2.mmd`:
```
%% title: Position-limit levels and the layers of defence
graph TD
    ClientLimit["Client-Level Limit<br/>(Individual Participant Cap)"] --> TotalExposure["Total Risk Exposure Control"]
    MemberLimit["Trading Member-Level Limit<br/>(Broker Aggregate Cap)"] --> TotalExposure
    MarketLimit["Market-Wide Position Limit<br/>(Overall Contract Cap)"] --> TotalExposure
    MarginDef["Margining & Daily MTM<br/>(Protective Collateral)"] --> SystemicSafety["Overall Market Integrity & Stability"]
    LimitDef["Position Limits<br/>(Preventive Caps)"] --> SystemicSafety
    EnforceDef["Monitoring & Enforcement<br/>(Regulatory Oversight)"] --> SystemicSafety
    TotalExposure --> SystemicSafety
```
If Mermaid 11.17.2 rejects any syntax above (state-diagram label punctuation, timeline colons, `actor` keyword), fix the diagram so it renders and keeps the same meaning; do not leave a diagram that falls into the error fallback.

- [ ] **Step 6: Verify in headless Chrome (dev server)**

For each of the five chapters (and the two extra diagrams): (a) the diagram renders (an `svg` inside `.dg-root`, no `role="alert"` fallback) in light **and** dark mode, and a screenshot of each is viewed — colours come from the tokens (paper, ink, rust/gold accents), text is legible, nothing is clipped; (b) the walk-the-flow button is absent for sequence, state and timeline diagrams and present for the flowchart extras; (c) zoom +/−/Fit, Ctrl+wheel and fullscreen work (Escape closes), and the fullscreen diagram fits the viewport at Fit; (d) toggling the theme while a diagram is on screen re-themes it; (e) no console errors; (f) the page for margining shows the state diagram first and then "Portfolio-based margining (scenario analysis)" with its own heading; position-limits likewise. (g) Check that the 23 unchanged chapters still render (sample at least five, including one with a payoff chart, and confirm their walk-the-flow still works). If any variable name from Step 4 is visibly ineffective (for example sequence actors still use Mermaid's default colours), find the correct Mermaid variable name in `node_modules/mermaid` and fix it.

- [ ] **Step 7: Commit and push**

```bash
npm test && npm run build 2>&1 | tail -3
git add -A
git commit -m "feat(diagrams): sequence, state and timeline diagrams for five chapters, extra-diagram support

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 14: Polish, performance budget, docs, final verification

**Files:**
- Modify: `README.md`; fix any issues found

- [ ] **Step 1: Budget check**

```bash
npm run build 2>&1 | tail -5
```
List the built client chunks that belong to each explainer (look in `dist/_astro/` for the files each explainer island imports; or use `grep -l "Chapter example" dist/_astro/*.js`). For each explainer chunk compute gzipped size (`gzip -c file | wc -c`) excluding the shared KaTeX chunk. Each must be under 40 KB gzipped. If one exceeds it, find the cause (e.g. an accidental import of a large module) and fix it. Also confirm a chapter without an explainer (e.g. `dist/topics/hedge-funds/index.html`) references no explainer chunk.

- [ ] **Step 2: Whole-site audit**

Run axe (injected `axe-core` via puppeteer, light and dark) on: the eight explainer chapters, the five converted-diagram chapters, home and `/topics`. Run Lighthouse (mobile) against `npm run build && npm run preview` for one explainer page (`/topics/option-greeks-pricing-models-implied-volatility`) and one diagram page; record accessibility, performance and best-practices. Targets: zero axe violations; Lighthouse accessibility >= 95; performance >= 80 on the explainer page (it hydrates charts and KaTeX). If performance is below target, record the cause honestly and fix cheap wins (for example lazy-loading below-the-fold islands, which `client:visible` already does). Lighthouse JSON outputs go to the scratchpad, never the repo.

- [ ] **Step 3: Cross-check numbers against the chapters**

For each explainer, open its chapter and confirm every number in the chapter's worked example appears in the explainer on load: TVM `$14,693.28`/`$4,693.28`; futures `$102.53`, `$101.51`; parity `$3.12`; margin ledger `$700`, `$200`, `$300` call, `$700`. Confirm the chapter-example buttons reproduce them after changing values and pressing Reset.

- [ ] **Step 4: README**

Add an "Interactive explainers" section to `README.md`: what they are; the four explainers and which chapters show them; how to add an explainer to a chapter (the `explainers:` frontmatter line, including the `view` form); how to build a new one (folder with `model.ts` + tests and `index.tsx`, registry line in `src/explainers/registry.ts`, component map line in `src/components/explainer/Explainers.astro`); the kit components; the rule that models are pure and pinned to the chapter's worked numbers; the optional extra diagrams (`diagram-2.mmd`, `%% title:` first line) and which diagram types get walk-the-flow (flowcharts only).

- [ ] **Step 5: Final verification, commit, push**

```bash
npm test && npm run build 2>&1 | tail -4
git status --short
git add -A
git commit -m "chore(explainers): budget check, audits, docs

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push
```
Then report the branch URL `https://github.com/amateurcoder015/finance-fundamentals-learning-site/tree/explainers` and the pull-request link `https://github.com/amateurcoder015/finance-fundamentals-learning-site/pull/new/explainers`. Do not merge to `main` or `redesign/editorial`.
