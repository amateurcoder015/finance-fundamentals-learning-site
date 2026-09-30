import { describe, it, expect } from 'vitest';
import { zoomAt, clampTransform } from '../src/lib/pan-zoom';

const screenOf = (world: number, t: { x: number; k: number }) => world * t.k + t.x;

describe('zoomAt', () => {
  it('keeps the point under the cursor fixed', () => {
    const t = { x: -40, y: -10, k: 1.5 };
    const cx = 200;
    const worldX = (cx - t.x) / t.k;
    const next = zoomAt(t, cx, 120, 1.4, 1, 4);
    expect(screenOf(worldX, next)).toBeCloseTo(cx, 6);
  });
  it('clamps to the maximum scale', () => {
    expect(zoomAt({ x: 0, y: 0, k: 3.9 }, 0, 0, 2, 1, 4).k).toBe(4);
  });
  it('clamps to the minimum scale', () => {
    expect(zoomAt({ x: 0, y: 0, k: 1.1 }, 0, 0, 0.1, 1, 4).k).toBe(1);
  });
});

describe('clampTransform', () => {
  it('forces zero offset at scale 1', () => {
    expect(clampTransform({ x: 50, y: -30, k: 1 }, 400, 300)).toEqual({ x: 0, y: 0, k: 1 });
  });
  it('keeps the content covering the viewport when zoomed', () => {
    const out = clampTransform({ x: 100, y: -9999, k: 2 }, 400, 300);
    expect(out.x).toBe(0);
    expect(out.y).toBe(300 - 300 * 2);
  });
});
