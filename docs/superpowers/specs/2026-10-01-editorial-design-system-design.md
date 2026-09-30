# Editorial Design System (Sub-project 1 of 3)

Date: 2026-10-01
Branch: `redesign/editorial`

## Context

Finance Fundamentals is an Astro 5 + React islands + MDX + Tailwind learning site (28 topics, each with `note.mdx`, `diagram.mmd`, `quiz.json`, `flashcards.json`, some with `payoff-chart.json`). The goal is to turn it into a real product learners return to. Three sub-projects, each with its own spec, plan and build:

1. **Design system (this spec):** visual identity, component kit, page redesign, Tier 1 diagram engine.
2. **Explainer framework (B):** interactive blocks and calculators, Tier 2 (right diagram form per topic) and Tier 3 (bespoke interactive diagrams for ~8 topics).
3. **Learning engine (A):** local-first progress behind a storage interface, spaced repetition, weak-topic review, learning paths, optional sync later.

This spec covers sub-project 1 only. Sub-projects 1 and 2 may proceed in parallel; 3 builds on the new look.

## Decisions already made

- **Audience/purpose:** a real product for returning learners, exam-minded (Indian derivatives / NISM-style, extending to CFA-style topics). Content will be added later via the existing `npm run new-topic` CLI.
- **Progress storage (sub-project 3):** hybrid, local-first behind a storage interface, optional sign-in later.
- **Visual direction:** Editorial (warm paper, serif headings, ink and rust accent), with real motion so it is not static.
- **Signature moments (all four):** living diagrams, reading delight, paper cards and stamps, ticker with marginalia.
- **Approach:** token-first, incremental migration, one page at a time, site builds and deploys after every step.
- **Git:** work on `redesign/editorial`, pushed regularly. Never pushed to `main` directly (production deploys from Vercel).

## Goals

- A distinctive editorial identity applied consistently across all pages, light and dark.
- A small reusable component kit that replaces repeated card markup.
- All 28 existing chapters improve automatically (themed prose, drop caps, ink progress, better diagrams) with **no edits to existing `note.mdx` files**.
- Better diagrams in every chapter (Tier 1).
- Build stays green; accessibility and performance do not regress.

## Non-goals

Accounts, search, progress tracking, spaced repetition, interactive explainers, Tier 2 and 3 diagrams, new content, i18n.

## 1. Foundations

**Colour tokens.** `src/styles/tokens.css` defines CSS variables: paper, ink, rust (accent), rule, highlighter gold, success, warning, danger. Light theme is the warm paper look. Dark theme ("ink on dark") is defined under `.dark` with the same variable names. `tailwind.config.mjs` maps theme colours to the variables (e.g. `bg-paper`, `text-ink`). The `preparoo*` colour names and scattered hardcoded hex and `dark:` pairs are removed as pages migrate.

**Typography.** Fraunces (variable) for headings and long-form reading; Plus Jakarta Sans retained for UI labels and buttons; monospace for numbers and formulas. Fonts self-hosted via `@fontsource-variable` (no render-blocking Google Fonts request). System serif/sans fallbacks. The Tailwind typography config reads tokens so prose and dark prose are styled in one place.

**Motion tokens.** `src/lib/motion.ts` is extended with named moves (`ink-draw`, `stagger-in`, `stamp`). The same values are mirrored as CSS variables for CSS-only effects. Reduced-motion is honoured globally in one place.

## 2. Component kit (`src/components/ui/`)

Astro components where static; React islands only where motion or state is needed.

- **Layout primitives (Astro):** `Section`, `Card`, `Badge`, `Button`, replacing repeated card classes in `[slug].astro`.
- **Reading delight:**
  - Drop cap via CSS on the first paragraph of prose (automatic for all notes).
  - `InkProgress` replaces `ReadingProgress`.
  - `<Hl>` opt-in MDX highlighter sweep, triggered on scroll into view.
  - `<Term>` hover/tap definition; definitions live in one shared `src/content/glossary.json` and are looked up by key.
- **Marginalia:** `<Note>` renders in a side gutter at wide widths and as an inline callout on small screens.
- **Paper cards and stamps:** flashcards restyled as stacking/fanning/flipping paper cards. `<Stamp variant="correct|complete">` is a standalone animated component with no data dependency; sub-project 3 will drive it.
- **Ticker:** CSS-only marquee on the home page, fed from topic titles and glossary terms. Pauses on hover; static under reduced-motion.
- **MDX registration:** all MDX components are registered in one place and are opt-in. Existing notes render unchanged and receive only the automatic upgrades.

## 3. Pages and build order

- **Topic page:** `[slug].astro` is split into `TopicLayout` plus section components. Reading column with marginalia gutter on wide screens. Sticky contents rail generated from the note's real headings (replacing four hardcoded links). Practice, flashcards, quiz, next/previous at the bottom, restyled.
- **Home:** editorial masthead, ticker, a "Continue reading" slot (shows a featured topic until sub-project 3 supplies progress), categories as newspaper-style sections.
- **Topics index and category pages:** restyled, plus a small category and difficulty filter island. No search.

Build order (each step keeps the site building and is committed and pushed to the branch):
1. Tokens, fonts, motion.
2. UI primitives.
3. Topic page, including the Tier 1 diagram engine.
4. Home page.
5. Topics index and category pages.
6. Polish: accessibility, reduced-motion, performance.

## 4. Tier 1 diagram engine

`MermaidDiagram.tsx` is replaced by `Diagram`:

- Loads Mermaid only when scrolled into view (`client:visible`); today it loads on every topic page.
- Mermaid theme variables are derived from the token variables (paper, ink, rust, serif labels). A watcher on the `<html>` class re-renders on dark mode toggle (fixes the stale-theme bug where dark mode is read once at load).
- Animated reveal after render: nodes stagger in, edges draw in ink (stroke-dash). Runs once on scroll-in. Static under reduced-motion.
- Zoom and pan: drag, pinch and wheel, a fit button, tap-for-fullscreen on phones. Self-implemented (~100 lines), no new dependency.
- Walk the flow: Next/Previous steps highlight one node and dim the rest, with a caption of the node label. Order is computed from graph edges, so it works on all existing diagrams with no authoring.
- Failure: shows the diagram source in a readable block instead of an error box. Accessible name plus a visually hidden outline of node labels for screen readers.
- `diagram.mmd` files and the content schema are unchanged.

## 5. Quality and verification

- `astro build` must pass at every step (existing Zod schemas validate content).
- Vitest for pure logic only: walk-the-flow ordering, heading extraction for the contents rail, glossary lookup.
- A contrast script verifies all token foreground/background pairs meet WCAG AA in both themes.
- Each pushed branch gets a Vercel preview. Before completion, an accessibility (axe) and performance (Lighthouse) pass on the topic page and home page.
- Fallbacks: system fonts if webfonts fail; diagram source if rendering fails; reduced-motion respected everywhere.

## Risks

- **Serif body text at length:** Fraunces suits headings; if body readability suffers, fall back to a calmer text serif for prose only (token change, no structural impact).
- **Mermaid SVG post-processing** depends on Mermaid's generated class names; pinned Mermaid version and a fallback to non-animated render if expected elements are absent.
- **Preview-only review:** the redesign is only visible on the branch preview until merged; merge to `main` is the owner's decision.
