export interface GlossaryEntry {
  term: string;
  definition: string;
}

export type Glossary = Record<string, GlossaryEntry>;

export function lookupTerm(glossary: Glossary, key: string): GlossaryEntry {
  const entry = Object.prototype.hasOwnProperty.call(glossary, key) ? glossary[key] : undefined;
  if (!entry) {
    const known = Object.keys(glossary).sort().join(', ');
    throw new Error(`[Content Validation Error] Unknown glossary term "${key}". Known terms: ${known}`);
  }
  return entry;
}
