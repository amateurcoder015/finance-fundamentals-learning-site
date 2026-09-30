export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface SourceHeading {
  depth: number;
  text: string;
}

/** Reduce one heading's markdown to plain, readable text (maths dropped). */
function cleanHeadingText(raw: string): string {
  let text = raw.replace(/\\\$|\$(?:\\.|[^$\\\n])+\$/g, (m) => (m === '\\$' ? '$' : ''));
  text = text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) -> text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/<[^>]+>/g, '') // inline JSX/HTML tags
    .replace(/\(\s*[,;]\s*/g, '(') // "(, Premium)" left behind by removed maths
    .replace(/\(\s*\)|\[\s*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s:,;\-–—]+$/, '');
  return text;
}

/** ATX headings (`## Title`) of a markdown source, in order, skipping fenced code blocks. */
function parseSourceHeadings(source: string): SourceHeading[] {
  const out: SourceHeading[] = [];
  let fence: string | null = null;
  for (const line of source.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const m = line.match(/^ {0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/);
    if (m) out.push({ depth: m[1].length, text: m[2] });
  }
  return out;
}

/**
 * Astro collects heading text after KaTeX has rendered, so maths leaks into `text`. When the
 * note source is supplied, labels come from the markdown instead; each item keeps Astro's slug
 * (the real id). If the two lists do not line up, Astro's text is used.
 */
function withReadableText(headings: Heading[], source: string): Heading[] {
  const parsed = parseSourceHeadings(source);
  if (parsed.length !== headings.length) return headings;
  return headings.map((h, i) => {
    if (parsed[i].depth !== h.depth) return h;
    const text = cleanHeadingText(parsed[i].text);
    return text ? { ...h, text } : h;
  });
}

export function buildContents(
  headings: Heading[],
  source?: string,
): { items: Heading[]; show: boolean } {
  const readable = source === undefined ? headings : withReadableText(headings, source);
  const items = readable.filter((h) => h.depth === 2 || h.depth === 3);
  return { items, show: items.length >= 2 };
}
