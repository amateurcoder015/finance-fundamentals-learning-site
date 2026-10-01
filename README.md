# Personal Finance Fundamentals — Learning Site (Stage 1 Scaffold)

A long-term, low-friction personal finance learning repository designed for daily/weekly expansion. Built with **Astro**, **MDX Content Collections**, **React Islands**, **Tailwind CSS**, and **Mermaid**.

---

## 🎯 Purpose & Goals

This project provides a structured, topic-by-topic knowledge base across core financial domains:
- **Corporate Finance**
- **Financial Statements**
- **Equities**
- **Fixed Income**
- **Derivatives**
- **Portfolio Management**
- **Economics**

**Priority #1**: Extremely low friction to add new topics daily/weekly via a dedicated CLI generator.

---

## 🛠️ Tech Stack & Architecture

- **Astro v5**: Lightning-fast content-driven framework with file-based routing and Content Collections.
- **MDX**: Markdown with embedded JSX components for explanations and formulas.
- **React Islands (`client:load`)**: Interactive, isolated UI components for Quizzes and Flashcards without bloating static pages.
- **Tailwind CSS**: Utility-first CSS framework for layout and clean functional styling.
- **Zod Content Validation**: Strict build-time schema enforcement for frontmatter metadata, quiz JSON structure, and flashcard JSON structure.
- **Mermaid Diagrams (Client-Side)**: Client-rendered SVG diagrams via the `mermaid` package.
  - *Why Client-Side?*: Build-time Mermaid generation requires heavy headless browser dependencies (like Puppeteer/Chromium) that slow down builds and fail in lightweight CLI/CI environments. Client-side rendering delivers instant builds with crisp SVG rendering in the browser.

---

## 📁 Content Directory Structure

Every topic resides in `src/content/topics/{topic-slug}/` and contains four required files:

```
src/content/topics/time-value-of-money/
├── note.mdx         # Explanation, key formulas, and practical examples
├── diagram.mmd      # Mermaid diagram source code
├── quiz.json        # 5-10 Multiple Choice Questions (MCQs)
└── flashcards.json  # Front/Back flashcard pairs
```

### Schema Requirements:

- **`note.mdx` Frontmatter**:
  ```yaml
  ---
  title: "Time Value of Money"
  description: "Core financial principle establishing..."
  category: "Corporate Finance" # Must be 1 of the 7 allowed categories
  difficulty: "beginner"        # beginner | intermediate | advanced
  dateAdded: "2026-09-09"
  tags: ["tvm", "pv", "fv"]
  ---
  ```
- **`quiz.json`**:
  ```json
  [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "Detailed explanation of correct answer."
    }
  ]
  ```
- **`flashcards.json`**:
  ```json
  [
    {
      "front": "Front question / concept",
      "back": "Back answer / explanation"
    }
  ]
  ```

> ⚠️ **Build Safety**: If any file is missing or contains malformed JSON/frontmatter, `npm run build` will fail loudly with clear error tracebacks.

---

## ⚡ Daily-Add Workflow (`npm run new-topic`)

To add a new topic in seconds, run:

### Interactive Mode:
```bash
npm run new-topic
```
The CLI will prompt for the topic title and let you choose a category from an enumerated list (1–7).

### Non-Interactive CLI Arguments:
```bash
npm run new-topic -- --title "Bond Valuation" --category "Fixed Income"
```

### Output:
The CLI automatically:
1. Generates a clean URL slug (`bond-valuation`).
2. Creates `src/content/topics/bond-valuation/`.
3. Scaffolds `note.mdx`, `diagram.mmd`, `quiz.json`, and `flashcards.json` with pre-filled schemas.
4. Outputs exact file paths to terminal for immediate editing.

---

## 🚀 Getting Started Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:4321` in your browser.

3. **Build & Verify Production Site**:
   ```bash
   npm run build
   ```

---

## 🎨 Design system

An editorial look (warm paper, ink text, rust accent, serif headings) with a matching dark theme.

- **Tokens**: `src/styles/tokens.css`. Colours are space-separated RGB triplets (`--paper`, `--paper-raised`, `--ink`, `--ink-muted`, `--rule`, `--rust`, `--gold`, `--success`, `--danger`, `--on-accent`, plus `--code-bg`/`--code-fg` for code blocks) in `:root` (light) and `.dark`. Tailwind maps them to classes such as `bg-paper`, `text-ink`, `border-rule`, `text-rust` (see `tailwind.config.mjs`). Fonts and motion durations live there too.
- **Retheme**: edit the values in `tokens.css`; components use the tokens, with one exception: the PayoffChart tooltip card keeps hard-coded slate colours, so update it by hand when retheming. Keep the top-level `:root` and `.dark` rules at column 0 and re-run `npm test`, because `tests/contrast.test.ts` enforces WCAG contrast on the token pairs.
- **UI kit**: `src/components/ui/` (Card, Section, Badge, Button, DifficultyBadge, Stamp, InkProgress). Site shell in `src/layouts/BaseLayout.astro`; topic and home pieces in `src/components/topic/` and `src/components/home/`; the diagram viewer in `src/components/diagram/`.
- **Opt-in MDX components** (available in every `note.mdx`, no imports needed; registered in `src/components/mdx/index.ts`):
  - `<Hl>key phrase</Hl>` highlights text with a marker-style underline.
  - `<Note>...</Note>` renders a margin-style callout.
  - `<Term term="delta">delta</Term>` shows a hover/focus definition taken from `src/data/glossary.json` (add entries there; an unknown term fails the build).
- **Motion and accessibility**: animations respect `prefers-reduced-motion`, and reading content stays visible with JavaScript disabled. Two rules keep it that way: the `<noscript>` style in `src/layouts/BaseLayout.astro` and the `prefers-reduced-motion` rule at the bottom of `src/styles/global.css` both override the server-rendered `opacity:0` states. Topic pages also carry a `<noscript>` fallback that shows the diagram source.
- **Mermaid is pinned** to `11.17.2` in `package.json`. `src/lib/diagram-graph.ts` and `src/components/diagram/dom.ts` parse that version's SVG DOM (node and edge ids and classes); when upgrading, re-check `parseNodeId`/`parseEdgeId` and the diagram tests.
- **Tests**: `npm test` runs the Vitest suite (contrast, motion tokens, glossary, and other helpers).

---

## 🗺️ Status

The editorial design system, motion layer, diagram viewer (walk the flow, zoom, full screen), topic reading layout and browse pages are implemented. Possible future work: progress tracking, review queues and search for CFA study.
