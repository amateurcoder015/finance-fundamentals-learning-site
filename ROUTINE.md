# Daily Topic Routine

Instructions for the scheduled cloud agent that adds **two new topics every day** and pushes them to `main`. Vercel deploys `main` automatically.

## 1. Set up

```bash
npm ci
```

Today's date (IST) is the `dateAdded` value for both topics:

```bash
TZ=Asia/Kolkata date +%Y-%m-%d
```

## 2. Pick the topics

Open `TOPIC_QUEUE.md`. Take the **first two unchecked** lines under `## Queue`. Each line is `Title | Category | difficulty`.

If a topic folder with the same slug already exists in `src/content/topics/`, skip that line (move it to Done with the note "already existed") and take the next one. If the queue is empty, stop and change nothing.

## 3. Learn the house style first

Before you write, read these in full:

- `README.md` (schema, MDX components, diagram rules)
- `src/content/config.ts` (allowed categories and the frontmatter schema)
- `src/content/topics/hedge-funds/` (all four files)
- `src/content/topics/time-value-of-money/` (all four files)
- `src/content/topics/futures-pricing-cash-futures-convergence/note.mdx`

Match their depth, tone, and structure. Each new note must be comparable in length to those notes (roughly 150–300 lines).

## 4. Write each topic

Create `src/content/topics/<slug>/` with `npm run new-topic -- --title "<Title>" --category "<Category>"`, then replace the scaffolded content in all four files.

**`note.mdx`**
- Frontmatter: `title`, `description` (one or two sentences), `category`, `difficulty` (from the queue line), `dateAdded` (today, IST), `tags` (4–6 lowercase kebab-case tags).
- Body: numbered `##` sections that cover the CFA Level I learning outcomes for that reading. Use clear definitions, KaTeX formulas (`$...$` / `$$...$$`), at least one fully worked numerical example with the numbers shown step by step, and tables where they help. A short "Key takeaways" section at the end.
- Optional: `<Hl>` and `<Note>`. Use `<Term term="x">` **only** for keys that already exist in `src/data/glossary.json`, or add a new entry there in the same shape. An unknown term fails the build.
- Do not add `explainers:` to the frontmatter.

**`diagram.mmd`**: one Mermaid `flowchart`/`graph TD` diagram (Mermaid 11) that shows the topic's main structure or process. Quote labels with `["..."]`. Use `<br/>` for line breaks.

**`quiz.json`**: 6–8 multiple-choice questions in CFA style (3 or 4 options). Mix concept and calculation questions. `correctIndex` is 0-based. Every `explanation` says why the answer is right. Check every calculation answer yourself; vary the position of the correct answer.

**`flashcards.json`**: 8–12 front/back cards covering definitions and formulas.

**Accuracy matters more than length.** This is study material for a CFA candidate. Re-check every formula, every number in the worked examples, and every quiz answer before moving on.

## 5. Update the queue

In `TOPIC_QUEUE.md`, remove the two lines from `## Queue` and add them under `## Done` as `- [x] Title | Category | difficulty | YYYY-MM-DD`.

## 6. Verify

```bash
npm test
npm run build
```

Both must pass. If the build fails, read the error, fix the new files, and run again. Never edit or delete existing topics or tests to make the build pass. If you cannot make it pass, discard your changes (`git checkout -- . && git clean -fd src/content/topics`) and stop without pushing.

## 7. Commit and push

```bash
git add src/content/topics TOPIC_QUEUE.md src/data/glossary.json
git commit -m "content: add <Title 1> and <Title 2>"
git push origin HEAD:main
```

If the push is rejected because `main` moved, run `git pull --rebase origin main`, re-run `npm run build`, and push again.

## Rules

- Change only: the two new topic folders, `TOPIC_QUEUE.md`, and (if needed) `src/data/glossary.json`.
- Do not touch components, layouts, styles, config, tests, or other topics.
- Do not commit `dist/`, `.astro/` or `node_modules/`.
