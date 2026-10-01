import { describe, it, expect } from 'vitest';
import { extent, linePath, linearScale, niceTicks } from '../src/lib/chart-scales';

describe('extent', () => {
  it('returns min and max', () => expect(extent([3, 1, 2])).toEqual([1, 3]));
  it('widens a constant series so it can be drawn', () => {
    const [lo, hi] = extent([5, 5, 5]);
    expect(lo).toBeLessThan(5);
    expect(hi).toBeGreaterThan(5);
  });
  it('widens an all-zero series', () => {
    const [lo, hi] = extent([0, 0]);
    expect(hi).toBeGreaterThan(lo);
  });
  it('ignores non-finite values and handles empty input', () => {
    expect(extent([1, NaN, 3])).toEqual([1, 3]);
    expect(extent([])).toEqual([0, 1]);
  });
});

describe('linearScale', () => {
  it('maps the domain ends to the range ends', () => {
    const s = linearScale([0, 10], [100, 200]);
    expect(s(0)).toBe(100);
    expect(s(10)).toBe(200);
    expect(s(5)).toBe(150);
  });
  it('supports an inverted range (SVG y axis)', () => {
    const s = linearScale([0, 1], [300, 0]);
    expect(s(0)).toBe(300);
    expect(s(1)).toBe(0);
  });
  it('returns the range midpoint for a zero-width domain', () => {
    expect(linearScale([2, 2], [0, 10])(2)).toBe(5);
  });
});

describe('niceTicks', () => {
  it('chooses round steps', () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });
  it('handles negative ranges', () => {
    const t = niceTicks(-50, 50, 5);
    expect(t).toContain(0);
    expect(t.every((v) => v >= -50 && v <= 50)).toBe(true);
  });
  it('returns a single tick for an empty range', () => {
    expect(niceTicks(3, 3)).toEqual([3]);
  });
});

describe('linePath', () => {
  it('builds an SVG path', () => {
    expect(linePath([[0, 1], [2.5, 3]])).toBe('M 0.00 1.00 L 2.50 3.00');
  });
  it('is empty for no points', () => {
    expect(linePath([])).toBe('');
  });
});
