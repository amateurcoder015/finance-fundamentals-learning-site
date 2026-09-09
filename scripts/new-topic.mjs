import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const CATEGORIES = [
  "Corporate Finance",
  "Financial Statements",
  "Equities",
  "Fixed Income",
  "Derivatives",
  "Portfolio Management",
  "Economics"
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function parseArgs() {
  const args = process.argv.slice(2);
  let title = null;
  let category = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      title = args[i + 1];
      i++;
    } else if (args[i] === '--category' && args[i + 1]) {
      category = args[i + 1];
      i++;
    }
  }

  return { title, category };
}

async function promptInput(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function run() {
  console.log('\n🚀 Personal Finance Topic Scaffold CLI Generator\n');

  let { title, category } = parseArgs();

  if (!title) {
    title = await promptInput('Enter Topic Title (e.g. "Bond Valuation"): ');
    while (!title) {
      console.log('❌ Title cannot be empty!');
      title = await promptInput('Enter Topic Title: ');
    }
  }

  if (!category) {
    console.log('\nSelect a Category:');
    CATEGORIES.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat}`);
    });

    const categoryChoice = await promptInput('\nEnter category number (1-7) or category name: ');
    const choiceNum = parseInt(categoryChoice, 10);

    if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= CATEGORIES.length) {
      category = CATEGORIES[choiceNum - 1];
    } else {
      const match = CATEGORIES.find(
        (c) => c.toLowerCase() === categoryChoice.toLowerCase()
      );
      if (match) {
        category = match;
      }
    }

    while (!category) {
      console.log('❌ Invalid category selection!');
      const retryChoice = await promptInput('Enter category number (1-7): ');
      const num = parseInt(retryChoice, 10);
      if (!isNaN(num) && num >= 1 && num <= CATEGORIES.length) {
        category = CATEGORIES[num - 1];
      }
    }
  }

  // Validate category
  if (!CATEGORIES.includes(category)) {
    console.error(`❌ Category '${category}' is invalid. Must be one of:\n${CATEGORIES.map(c => ` - ${c}`).join('\n')}`);
    process.exit(1);
  }

  const slug = slugify(title);
  const dateStr = new Date().toISOString().split('T')[0];
  const topicDir = path.join(process.cwd(), 'src', 'content', 'topics', slug);

  if (fs.existsSync(topicDir)) {
    console.error(`❌ Error: Topic folder already exists at ${topicDir}`);
    process.exit(1);
  }

  fs.mkdirSync(topicDir, { recursive: true });

  // Template note.mdx
  const noteContent = `---
title: "${title}"
description: "Comprehensive introduction and key concepts for ${title}."
category: "${category}"
difficulty: "beginner"
dateAdded: "${dateStr}"
tags: ["${slug}"]
---

# ${title}

## Overview

Provide a concise, high-level summary of ${title} and why it matters in personal finance and CFA foundations.

## Key Formulas & Concepts

- **Concept 1**: Explanation of primary principle.
- **Concept 2**: Explanation of secondary principle.

## Practical Examples

Provide a step-by-step numerical calculation or practical scenario here.
`;

  // Template diagram.mmd
  const diagramContent = `graph TD
    A[Start: ${title}] --> B[Core Concept 1]
    A --> C[Core Concept 2]
    B --> D[Application / Result]
    C --> D
`;

  // Template quiz.json
  const quizContent = [
    {
      question: `What is the primary objective of understanding ${title}?`,
      options: [
        `To evaluate financial metrics and make informed decisions`,
        `To calculate taxes incorrectly`,
        `To memorize arbitrary numbers`,
        `None of the above`
      ],
      correctIndex: 0,
      explanation: `Understanding ${title} provides foundational insights for quantitative analysis and decision making.`
    }
  ];

  // Template flashcards.json
  const flashcardsContent = [
    {
      front: `What is ${title}?`,
      back: `A fundamental finance topic under the ${category} category.`
    }
  ];

  const notePath = path.join(topicDir, 'note.mdx');
  const diagramPath = path.join(topicDir, 'diagram.mmd');
  const quizPath = path.join(topicDir, 'quiz.json');
  const flashcardsPath = path.join(topicDir, 'flashcards.json');

  fs.writeFileSync(notePath, noteContent, 'utf-8');
  fs.writeFileSync(diagramPath, diagramContent, 'utf-8');
  fs.writeFileSync(quizPath, JSON.stringify(quizContent, null, 2), 'utf-8');
  fs.writeFileSync(flashcardsPath, JSON.stringify(flashcardsContent, null, 2), 'utf-8');

  console.log(`\n✅ Topic '${title}' successfully scaffolded!\n`);
  console.log(`Topic Slug: ${slug}`);
  console.log(`Category:   ${category}\n`);
  console.log('📁 Created Files (Fill these in next):');
  console.log(`  - Note:       ${notePath}`);
  console.log(`  - Diagram:    ${diagramPath}`);
  console.log(`  - Quiz:       ${quizPath}`);
  console.log(`  - Flashcards: ${flashcardsPath}`);
  console.log('\nReady to edit! Commit when done. 🎉\n');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
