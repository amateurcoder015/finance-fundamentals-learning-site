import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { contrastRatio, parseTokenBlock, parseTriplet } from '../src/lib/contrast';

describe('contrast math', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 1);
  });
  it('identical colours are 1:1', () => {
    expect(contrastRatio([120, 40, 60], [120, 40, 60])).toBeCloseTo(1, 5);
  });
  it('is symmetric', () => {
    const a = contrastRatio([10, 20, 30], [240, 230, 220]);
    const b = contrastRatio([240, 230, 220], [10, 20, 30]);
    expect(a).toBeCloseTo(b, 10);
  });
  it('rejects malformed triplets', () => {
    expect(() => parseTriplet('12 34')).toThrow(/Invalid RGB triplet/);
    expect(() => parseTriplet('12 34 999')).toThrow(/Invalid RGB triplet/);
    expect(() => parseTriplet('a b c')).toThrow(/Invalid RGB triplet/);
  });
});

const css = readFileSync('src/styles/tokens.css', 'utf-8');

const PAIRS: Array<[fg: string, bg: string]> = [
  ['ink', 'paper'],
  ['ink', 'paper-raised'],
  ['ink-muted', 'paper'],
  ['ink-muted', 'paper-raised'],
  ['rust', 'paper'],
  ['rust', 'paper-raised'],
  ['success', 'paper'],
  ['danger', 'paper'],
  ['ink', 'gold'],
  ['on-accent', 'rust'],
  ['on-accent', 'ink'],
  ['code-fg', 'code-bg'],
];

for (const [theme, selector] of [
  ['light', ':root'],
  ['dark', '.dark'],
] as const) {
  describe(`${theme} theme tokens meet WCAG AA`, () => {
    const tokens = parseTokenBlock(css, selector);
    for (const [fg, bg] of PAIRS) {
      it(`${fg} on ${bg} is at least 4.5:1`, () => {
        expect(tokens[fg], `missing token --${fg}`).toBeDefined();
        expect(tokens[bg], `missing token --${bg}`).toBeDefined();
        expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
      });
    }
  });
}
