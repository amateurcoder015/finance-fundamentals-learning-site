# Interactive Explainers and Better Diagram Forms (Sub-project 2 of 3)

Date: 2026-10-01
Branch: `explainers` (cut from `redesign/editorial`, because `main` does not yet have the design system)

## Context

Sub-project 1 (editorial design system) is built on `redesign/editorial`: tokens, UI kit, prose theme, MDX components (`Hl`, `Note`, `Term`), paper flashcards and stamped quiz, the themed `Diagram` engine (zoom, pan, fullscreen, walk-the-flow), redesigned pages. Sub-project 3 (learning engine: local-first progress, spaced repetition, weak-topic review, learning paths) comes after this one.

The formula-heavy chapters (mostly Derivatives, plus Time Value of Money) currently teach maths with static text and KaTeX. Learners cannot change an input and watch the result move. All 28 diagrams are Mermaid flowcharts even where another shape fits better.

## Decisions already made

- **Authoring model: hybrid.** A small shared kit plus bespoke explainer components, embedded through the topic page. The existing JSON-configured `PayoffChart` stays for simple payoff charts.
- **First round of explainers (all four):** Time value of money; Futures pricing and convergence; Options suite (strategy payoff builder, Black-Scholes with Greeks, put-call parity); Margin and mark-to-market ledger.
- **Diagram forms: targeted set.** Five chapters get a better-fitting Mermaid diagram type; the rest keep their flowcharts.
- **Currency:** the chapters' worked examples use `$`. Explainers take a currency-symbol setting that defaults to `$` so on-screen numbers match what the learner just read. (The `₹` on the home-page hero is a separate, unrelated decoration.)
- **Delivery:** new branch `explainers` from `redesign/editorial`, pushed as work lands, a pull request at the end. Merge order into `main` is the owner's decision.

## Goals

- A learner can change inputs on the four flagship topics and see results, formulas with their own numbers substituted, and charts update live.
- Every explainer's maths is pure, unit-tested code pinned to the chapters' own worked examples.
- Adding an explainer to a chapter is a one-line frontmatter change; adding a new explainer is one folder plus one registry line.
- Explainers fit the editorial look, work in light and dark, are keyboard- and screen-reader-usable, and respect reduced motion.
- Chapters without explainers pay no extra JavaScript.
- Five diagrams use a better-fitting Mermaid type, themed and interactive like the rest (zoom, pan, fullscreen).

## Non-goals

Progress tracking and spaced repetition (sub-project 3); accounts; the binomial pricing model, American options and an implied-volatility solver (mentioned in the Greeks chapter, not needed for the explainer); a charting library; inline `<Explainer>` MDX placement (can be added later); extending walk-the-flow or the draw-in reveal to non-flowchart diagram types; new chapters.

## 1. Architecture and authoring

**Files**
- `src/explainers/<name>/model.ts` — pure maths, no UI imports.
- `src/explainers/<name>/index.tsx` — the React UI, default export.
- `src/explainers/registry.ts` — `name → { load: () => import(...), title, views? }`, typed.
- `src/components/explainer/kit/` — shared primitives: `Slider` (native range + number input, labelled), `Readout`, `FormulaBlock` (KaTeX with live values), `ChartFrame` (SVG scales, axes, line/area paths, hover readout, text summary and data-table toggle), `ExampleBar` ("Chapter example" and "Reset" buttons), `Tabs` (for the options suite).
- `src/components/explainer/Explainers.astro` — renders each requested explainer as a `client:visible` island with a static no-JS summary.

**Opt-in by frontmatter.** `src/content/config.ts` gains an optional field:
`explainers: z.array(z.union([z.string(), z.object({ name: z.string(), view: z.string().optional() })])).default([])`.
A chapter lists e.g. `explainers: ["time-value-of-money"]` or `explainers: [{ name: "options-suite", view: "greeks" }]`. The topic page renders a **"Try it yourself"** section after the note and before the diagram, with a contents-rail entry. Unknown names or views fail the build with a message listing valid ones (same pattern as `lookupTerm`).

**Chapters opting in (one-line frontmatter edit each, no body edits):**
- `time-value-of-money` → `time-value-of-money`
- `futures-pricing-cash-futures-convergence` → `futures-pricing`
- `options-basics-moneyness` → `options-suite` (view `payoff`)
- `intrinsic-value-time-value-options-payoff-charts` → `options-suite` (view `payoff`)
- `options-trading-hedging-strategies` → `options-suite` (view `payoff`)
- `option-greeks-pricing-models-implied-volatility` → `options-suite` (view `greeks`)
- `put-call-parity-delta-hedging` → `options-suite` (view `parity`)
- `margining-mark-to-market-span` → `margin-ledger`

**Reused code.** The options payoff view builds on the existing `PayoffChart` and `Position` types (`long-futures`, `short-futures`, `long-call`, `short-call`, `long-put`, `short-put`). The existing JSON `payoff-chart.json` flow is untouched.

## 2. Maths core (pure, tested)

All functions live in `model.ts` files and are covered by Vitest. Chapter numbers are test vectors.

**Time value of money** — lump sum FV and PV with compounding frequency `m`; ordinary annuity and annuity due (PV and FV); perpetuity. Vectors: `$10,000` at 8% for 5 years annually gives `$14,693.28`; chapter annuity examples. Edge cases: `r = 0` (annuity formulas fall back to `PMT × n`), `n = 0`, very high rates, large `m`.

**Futures pricing** — `F = S·e^{rT}` and `F = S·e^{(r−q)T}`; basis `F − S`; convergence as `T → 0` (`F → S`). Vectors: `S=100, r=5%, T=0.5` gives `$102.53`; with `q=2%` gives `$101.51`. Edge cases: `T = 0`, negative net carry (backwardation), `r = q`.

**Options** — Black-Scholes European call and put with `d₁`, `d₂`; Greeks (delta, gamma, theta, vega, rho); put-call parity `C − P = S − K·e^{−rT}` with an arbitrage signal; strategy payoff for any set of legs (including premiums and lot size). Normal CDF uses a double-precision implementation (error below 1e-12) validated against reference values. Reference vector (`S=100, K=100, r=5%, σ=20%, T=1`): call ≈ 10.4506, put ≈ 5.5735, call delta ≈ 0.6368, gamma ≈ 0.01876, vega ≈ 37.52 per 1.00 of volatility, call theta ≈ −6.414 per year, call rho ≈ 53.23. Properties tested: parity holds to rounding for the computed prices, call delta in [0,1], put delta in [−1,0], gamma and vega identical for call and put, price tends to intrinsic value as `T → 0`. Edge cases: `T → 0`, `σ → 0`, deep in/out of the money, `S` or `K` at slider extremes.

**Margin ledger** — day-by-day simulation: MTM cash flow `= (price − previous price) × lot size × side`, end-of-day balance, margin call when balance falls below maintenance (deposit to restore initial margin), liquidation when a call is not met (option in the UI). Vector: the chapter's table — long 1 contract, lot 100, entry `$50`, initial margin `$500`, maintenance `$350`; Day 2 settlement `$47` gives `−$500` MTM and balance `$200`, breaching maintenance, with a `$300` variation-margin call. Edge cases: no price change, a call on the first day, balance exactly equal to maintenance, a short position, balance going negative.

## 3. Explainer experience

- **Layout:** controls on the left (labelled sliders and number inputs, 44px targets), live chart on the right, below it a readout with the formula and the learner's own numbers substituted (KaTeX). Stacks on phones.
- **`ExampleBar`:** "Chapter example" loads the worked example from the note; "Reset" returns to defaults.
- **Per-explainer controls and charts:**
  - *Time value of money:* mode (lump sum / ordinary annuity / annuity due / perpetuity), amount, rate, years, compounding frequency; chart of growth and discounting over time.
  - *Futures pricing:* spot, rate, carry yield, time to expiry; chart of futures price against time to expiry and of basis converging to zero.
  - *Options suite (tabs `payoff`, `greeks`, `parity`):* payoff builder with presets and add/remove legs, net and per-leg payoff using `PayoffChart`; Black-Scholes price and the five Greeks with price-vs-spot and delta-vs-spot curves; parity check with deviation and the arbitrage action.
  - *Margin ledger:* entry price, lot size, side, initial and maintenance margin, editable daily price path (defaults to the chapter's); ledger table and balance chart with margin calls marked.
- **Accessibility:** native range inputs with the current value announced; every chart has a text summary and a data-table toggle; focus styles from the global theme; reduced motion disables animated transitions.
- **No JavaScript:** each explainer's default state is the chapter's worked example and the island is server-rendered, so the section is never empty and readers without JavaScript see the real numbers; there is no separate static summary. A runtime error boundary shows a short message instead of the explainer if it fails.
- **Currency:** a `currency` option on each explainer, default `$`.

## 4. Better diagram forms

Targeted conversions (diagram files only; the content schema is unchanged):
- `clearing-settlement-mechanism` → `sequenceDiagram` (buyer, seller, exchange, clearing corporation, clearing members: novation and settlement).
- `derivatives-trading-mechanism` → `sequenceDiagram` (investor, broker, exchange, matching).
- `margining-mark-to-market-span` → `stateDiagram-v2` for the margin-account lifecycle; the portfolio-margining half remains a flowchart (kept in the same file only if Mermaid allows; otherwise as a second diagram, in which case the topic loader gains support for an optional second diagram — decided during planning).
- `time-value-of-money` → `timeline`.
- `position-limits-risk-management` → `stateDiagram-v2` for the breach and enforcement workflow.

The other 23 keep their flowcharts.

Engine changes: `buildThemeVariables` is extended with the variables Mermaid uses for sequence, state and timeline diagrams, mapped from the same tokens. For non-flowchart types the existing graph extraction finds no nodes, so walk-the-flow controls and the draw-in reveal are skipped automatically while zoom, pan, fullscreen, theming and the error fallback still work. This graceful degradation is verified in a real browser.

## 5. Quality, performance, delivery

- **Tests:** Vitest for every model against chapter vectors and the edge cases above; a registry test that every frontmatter-referenced name and view exists; a schema test for the `explainers` field.
- **Browser verification (headless Chrome, as in sub-project 1):** sliders update readouts; "Chapter example" reproduces the note's numbers; reset works; keyboard operation; light and dark; reduced motion; no-JS summary; the five converted diagrams render themed in both modes with working zoom and fullscreen. axe on every page with an explainer and the five converted diagrams; Lighthouse on one explainer page.
- **Performance:** explainers are lazy islands (`client:visible` plus dynamic import); a chapter without an explainer loads nothing extra. KaTeX is already a dependency and loads only inside explainer islands. No chart library. Budget: each explainer chunk under 40 KB gzipped excluding KaTeX.
- **Failure handling:** unknown explainer name or view fails the build with valid options listed; a runtime error inside an explainer is caught by an error boundary showing a short message.
- **Delivery:** spec, then plan, then subagent-driven execution with per-task review, pushed to `explainers`; pull request when complete.

## Risks

- **Numerical correctness** of Black-Scholes and Greeks: mitigated by reference vectors, property tests, and an independently computed check of the vector values during implementation.
- **Mermaid theming for new diagram types** may not fully honour the token palette: verified visually in both themes; fall back to a per-type override block if needed.
- **A second diagram in one chapter** (margining, position limits) is handled by optional `diagram-N.mmd` files read by the topic loader.
- **Editing frontmatter of eight chapters** is a content change; only the one `explainers:` line is added to each.

## Decisions made while planning

- **Schema lives in `config.ts`.** The `explainers` frontmatter field is defined inside `src/content/config.ts` with Astro's `z` (to avoid mixing zod instances); only the resolver (`resolveExplainerRefs`) and types live in `src/lib/explainer-refs.ts`, so the resolver is unit-testable without `astro:content`.
- **No separate static summary.** Each explainer's default state is the chapter's worked example and the island is server-rendered, so readers without JavaScript see the real numbers; there is no separate summary module. A runtime error boundary shows a short message instead of the explainer.
- **`view` selects the initial tab only.** For the options suite, the `view` value chooses which tab is active on load; all three tabs stay available.
- **Extra diagrams.** Chapters whose diagram is converted but whose second half must be kept (margining, position limits) get an optional `diagram-2.mmd` (first line `%% title: ...` for its heading); the topic loader gains `extraDiagrams`.
- **Placement.** The "Try it yourself" section sits between the note body and "The picture", with its own contents-rail entry shown only when a chapter has explainers.
