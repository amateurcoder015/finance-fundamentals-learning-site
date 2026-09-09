import { defineCollection, z } from 'astro:content';

export const CATEGORIES = [
  "Corporate Finance",
  "Financial Statements",
  "Equities",
  "Fixed Income",
  "Derivatives",
  "Portfolio Management",
  "Economics"
] as const;

export type Category = (typeof CATEGORIES)[number];

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

// Schema for frontmatter in note.mdx
export const topicFrontmatterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${CATEGORIES.join(", ")}` }),
  }),
  difficulty: z.enum(DIFFICULTIES),
  dateAdded: z.string().or(z.date()),
  tags: z.array(z.string()).default([]),
});

// Quiz Zod Schema
export const quizItemSchema = z.object({
  question: z.string().min(1, "Quiz question cannot be empty"),
  options: z.array(z.string()).min(2, "Quiz question must have at least 2 options"),
  correctIndex: z.number().int().min(0, "correctIndex must be non-negative"),
  explanation: z.string().min(1, "Quiz explanation cannot be empty"),
});

export const quizSchema = z.array(quizItemSchema).min(1, "quiz.json must contain at least 1 question");
export type QuizItem = z.infer<typeof quizItemSchema>;

// Flashcard Zod Schema
export const flashcardItemSchema = z.object({
  front: z.string().min(1, "Flashcard front cannot be empty"),
  back: z.string().min(1, "Flashcard back cannot be empty"),
});

export const flashcardsSchema = z.array(flashcardItemSchema).min(1, "flashcards.json must contain at least 1 flashcard");
export type FlashcardItem = z.infer<typeof flashcardItemSchema>;

const topicsCollection = defineCollection({
  type: 'content',
  schema: topicFrontmatterSchema,
});

export const collections = {
  topics: topicsCollection,
};
