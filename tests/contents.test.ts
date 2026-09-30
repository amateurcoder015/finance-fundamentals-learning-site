import { describe, it, expect } from 'vitest';
import { buildContents } from '../src/lib/contents';

const h = (depth: number, text: string) => ({ depth, slug: text.toLowerCase().replace(/\s+/g, '-'), text });

describe('buildContents', () => {
  it('keeps only h2 and h3', () => {
    const { items } = buildContents([h(1, 'Title'), h(2, 'A'), h(3, 'B'), h(4, 'C')]);
    expect(items.map((i) => i.text)).toEqual(['A', 'B']);
  });
  it('shows the rail when there are at least two entries', () => {
    expect(buildContents([h(2, 'A'), h(2, 'B')]).show).toBe(true);
  });
  it('hides the heading list for notes with fewer than two sections', () => {
    expect(buildContents([h(1, 'Title'), h(2, 'Only one')]).show).toBe(false);
    expect(buildContents([h(1, 'Title')]).show).toBe(false);
    expect(buildContents([]).show).toBe(false);
  });
});
