import fs from 'node:fs';
import path from 'node:path';
import {
  quizSchema,
  flashcardsSchema,
  payoffChartSchema,
  type QuizItem,
  type FlashcardItem,
  type PayoffChartData,
} from '../content/config';

export interface TopicAuxiliaryData {
  diagram: string;
  quiz: QuizItem[];
  flashcards: FlashcardItem[];
  payoffChart?: PayoffChartData;
}

/**
 * Extracts clean folder slug from Astro entry (e.g., 'time-value-of-money/note' -> 'time-value-of-money')
 */
export function getTopicSlug(entry: { slug: string }): string {
  return entry.slug.includes('/') ? entry.slug.split('/')[0] : entry.slug;
}

/**
 * Reads and strictly validates auxiliary topic files (diagram.mmd, quiz.json, flashcards.json, optional payoff-chart.json).
 * Throws loud, clear descriptive errors if files are missing or fail Zod schema validation.
 */
export function loadTopicAuxiliaryData(slug: string): TopicAuxiliaryData {
  const cleanSlug = slug.includes('/') ? slug.split('/')[0] : slug;
  const topicDir = path.join(process.cwd(), 'src', 'content', 'topics', cleanSlug);

  const diagramPath = path.join(topicDir, 'diagram.mmd');
  const quizPath = path.join(topicDir, 'quiz.json');
  const flashcardsPath = path.join(topicDir, 'flashcards.json');
  const payoffChartPath = path.join(topicDir, 'payoff-chart.json');

  if (!fs.existsSync(diagramPath)) {
    throw new Error(`[Content Validation Error] Missing diagram.mmd for topic '${cleanSlug}' at ${diagramPath}`);
  }
  if (!fs.existsSync(quizPath)) {
    throw new Error(`[Content Validation Error] Missing quiz.json for topic '${cleanSlug}' at ${quizPath}`);
  }
  if (!fs.existsSync(flashcardsPath)) {
    throw new Error(`[Content Validation Error] Missing flashcards.json for topic '${cleanSlug}' at ${flashcardsPath}`);
  }

  const diagram = fs.readFileSync(diagramPath, 'utf-8').trim();

  let quizRaw: unknown;
  try {
    quizRaw = JSON.parse(fs.readFileSync(quizPath, 'utf-8'));
  } catch (err) {
    throw new Error(`[Content Validation Error] Invalid JSON in quiz.json for topic '${cleanSlug}'`);
  }

  const quizParsed = quizSchema.safeParse(quizRaw);
  if (!quizParsed.success) {
    throw new Error(`[Content Validation Error] Malformed quiz.json in topic '${cleanSlug}':\n` + JSON.stringify(quizParsed.error.format(), null, 2));
  }

  let flashcardsRaw: unknown;
  try {
    flashcardsRaw = JSON.parse(fs.readFileSync(flashcardsPath, 'utf-8'));
  } catch (err) {
    throw new Error(`[Content Validation Error] Invalid JSON in flashcards.json for topic '${cleanSlug}'`);
  }

  const flashcardsParsed = flashcardsSchema.safeParse(flashcardsRaw);
  if (!flashcardsParsed.success) {
    throw new Error(`[Content Validation Error] Malformed flashcards.json in topic '${cleanSlug}':\n` + JSON.stringify(flashcardsParsed.error.format(), null, 2));
  }

  let payoffChart: PayoffChartData | undefined = undefined;
  if (fs.existsSync(payoffChartPath)) {
    let payoffChartRaw: unknown;
    try {
      payoffChartRaw = JSON.parse(fs.readFileSync(payoffChartPath, 'utf-8'));
    } catch (err) {
      throw new Error(`[Content Validation Error] Invalid JSON in payoff-chart.json for topic '${cleanSlug}'`);
    }

    const payoffChartParsed = payoffChartSchema.safeParse(payoffChartRaw);
    if (!payoffChartParsed.success) {
      throw new Error(
        `[Content Validation Error] Malformed payoff-chart.json in topic '${cleanSlug}':\n` +
          JSON.stringify(payoffChartParsed.error.format(), null, 2)
      );
    }
    payoffChart = payoffChartParsed.data;
  }

  return {
    diagram,
    quiz: quizParsed.data,
    flashcards: flashcardsParsed.data,
    payoffChart,
  };
}

