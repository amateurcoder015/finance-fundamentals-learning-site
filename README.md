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

## 🗺️ Build Stages

- **Stage 1 (Current)**: Scaffold + Content Model + Zod Schema + CLI + React Islands + Seed Topic ("Time Value of Money") + Plain functional pages.
- **Stage 2**: Design System & Layout Enhancements (Colors, Typography, Card Aesthetics).
- **Stage 3**: Animations, Motion & Micro-interactions.
- **Stage 4**: Advanced Features & CFA Study Tools (Progress tracking, review queues, search).
