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

  describe('with note source (readable labels)', () => {
    // Astro collects heading text after KaTeX has rendered, so maths leaks into `text`.
    const garbled = (depth: number, slug: string, text: string) => ({ depth, slug, text });

    it('strips inline maths and the empty brackets it leaves', () => {
      const src = '## Intro\n### Step 2: Calculate Initial Margin Required ($M_{\\text{initial}}$)\n';
      const { items } = buildContents(
        [garbled(2, 'intro', 'Intro'), garbled(3, 'step-2', 'Step 2: Calculate Initial Margin Required (MinitialM_{\\text{initial}}Minitial​)')],
        src,
      );
      expect(items.map((i) => i.text)).toEqual(['Intro', 'Step 2: Calculate Initial Margin Required']);
      expect(items[1].slug).toBe('step-2');
    });

    it('keeps escaped dollars, drops maths with escaped dollars inside', () => {
      const src = '## A\n### Scenario A: Spot Rises to \\$7.00 per Bushel ($S_T > K$)\n### Case A: Call Option ($K = \\$100$, Premium = \\$8)\n';
      const { items } = buildContents(
        [garbled(2, 'a', 'A'), garbled(3, 'x', 'junk'), garbled(3, 'y', 'junk')],
        src,
      );
      expect(items.map((i) => i.text)).toEqual([
        'A',
        'Scenario A: Spot Rises to $7.00 per Bushel',
        'Case A: Call Option (Premium = $8)',
      ]);
    });

    it('strips bold, italic, code and link syntax', () => {
      const src = '## **Bold** and *italic* with `code`\n## A [link text](https://example.com/x) here\n';
      const { items } = buildContents([garbled(2, 'a', 'x'), garbled(2, 'b', 'y')], src);
      expect(items.map((i) => i.text)).toEqual(['Bold and italic with code', 'A link text here']);
    });

    it('ignores headings inside fenced code blocks', () => {
      const src = '## Real one\n```\n## Not a heading\n```\n~~~py\n### Nor this\n~~~\n## Second\n';
      const { items } = buildContents([garbled(2, 'real-one', 'Real one'), garbled(2, 'second', 'Second')], src);
      expect(items.map((i) => i.text)).toEqual(['Real one', 'Second']);
    });

    it('falls back to Astro text when heading counts disagree', () => {
      const src = '## One ($x$)\n## Two\n## Three\n';
      const { items } = buildContents([garbled(2, 'one', 'One (x)'), garbled(2, 'two', 'Two')], src);
      expect(items.map((i) => i.text)).toEqual(['One (x)', 'Two']);
    });

    it('falls back for a single heading whose depth does not line up', () => {
      const src = '## One\n### Two ($x$)\n';
      const { items } = buildContents([garbled(2, 'one', 'One'), garbled(2, 'two', 'Two (x)')], src);
      expect(items.map((i) => i.text)).toEqual(['One', 'Two (x)']);
    });

    it('still hides the list for fewer than two entries', () => {
      expect(buildContents([garbled(1, 't', 'T'), garbled(2, 'a', 'A')], '# T\n## A\n').show).toBe(false);
    });
  });
});
