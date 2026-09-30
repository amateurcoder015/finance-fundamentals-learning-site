export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export function buildContents(headings: Heading[]): { items: Heading[]; show: boolean } {
  const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
  return { items, show: items.length >= 2 };
}
