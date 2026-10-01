import fs from 'node:fs';
import path from 'node:path';

export interface ExtraDiagram {
  title: string | null;
  code: string;
}

export function parseDiagramTitle(source: string): ExtraDiagram {
  const trimmed = source.trim();
  const match = trimmed.match(/^%%\s*title:\s*(.+?)\s*(?:\r?\n|$)/);
  if (!match) return { title: null, code: trimmed };
  return { title: match[1], code: trimmed.slice(match[0].length).trim() };
}

/** Reads optional extra diagrams `diagram-2.mmd`, `diagram-3.mmd`, ... (stops at the first missing number). */
export function readExtraDiagrams(topicDir: string): ExtraDiagram[] {
  const out: ExtraDiagram[] = [];
  for (let n = 2; ; n++) {
    const file = path.join(topicDir, `diagram-${n}.mmd`);
    if (!fs.existsSync(file)) break;
    const raw = fs.readFileSync(file, 'utf-8');
    if (raw.trim() === '') {
      throw new Error(`[Content Validation Error] diagram-${n}.mmd is empty in ${topicDir}`);
    }
    out.push(parseDiagramTitle(raw));
  }
  return out;
}
