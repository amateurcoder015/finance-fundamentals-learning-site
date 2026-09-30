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
