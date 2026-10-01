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
  it('pins the negative-range ticks exactly', () => {
    expect(niceTicks(-50, 50, 5)).toEqual([-40, -20, 0, 20, 40]);
  });
  it('handles extreme large numbers without infinite loop', () => {
    const t = niceTicks(1e16, 1e16 + 4);
    expect(t.length).toBeLessThanOrEqual(1000);
    expect(t.every((v) => Number.isFinite(v))).toBe(true);
  });
  it('handles extreme small ranges without infinite loop', () => {
    const t = niceTicks(1, 1 + 4.4e-16);
    expect(t.length).toBeLessThanOrEqual(1000);
    expect(t.every((v) => Number.isFinite(v))).toBe(true);
  });
  it('handles count 0 and 1', () => {
    const t0 = niceTicks(0, 100, 0);
    expect(t0).toEqual([0]);
    const t1 = niceTicks(0, 100, 1);
    expect(t1.every((v) => Number.isFinite(v))).toBe(true);
  });
  it('handles min > max', () => {
    expect(niceTicks(50, 10)).toEqual([50]);
  });
  it('handles NaN and Infinity inputs', () => {
    const tNaN = niceTicks(NaN, 100);
    expect(tNaN[0]).toEqual(NaN);
    const tInf = niceTicks(0, Infinity);
    expect(tInf.every((v) => Number.isFinite(v) || Number.isNaN(v))).toBe(true);
  });
  it('handles 1e-9-wide range', () => {
    const t = niceTicks(0, 1e-9, 5);
    expect(t.length).toBeLessThanOrEqual(1000);
    expect(t.every((v) => Number.isFinite(v))).toBe(true);
  });
  it('handles 1e12-wide range', () => {
    const t = niceTicks(0, 1e12, 5);
    expect(t.length).toBeLessThanOrEqual(1000);
    expect(t.every((v) => Number.isFinite(v))).toBe(true);
  });
  it('normalizes negative zero', () => {
    const t = niceTicks(-0.5, 5);
    expect(t.every((v) => !Object.is(v, -0))).toBe(true);
  });
});

describe('linePath', () => {
  it('builds an SVG path', () => {
    expect(linePath([[0, 1], [2.5, 3]])).toBe('M 0.00 1.00 L 2.50 3.00');
  });
  it('is empty for no points', () => {
    expect(linePath([])).toBe('');
  });
  it('skips non-finite points and starts new subpath', () => {
    const path = linePath([[0, 1], [NaN, 2], [3, 4]]);
    expect(path).toBe('M 0.00 1.00 M 3.00 4.00');
    expect(path).not.toContain('NaN');
  });
  it('returns empty for all-non-finite input', () => {
    expect(linePath([[NaN, NaN], [Infinity, 0]])).toBe('');
  });
});
