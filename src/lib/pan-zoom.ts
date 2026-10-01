export interface Transform {
  x: number;
  y: number;
  k: number;
}

export function zoomAt(t: Transform, cx: number, cy: number, factor: number, min: number, max: number): Transform {
  const k = Math.min(max, Math.max(min, t.k * factor));
  const ratio = k / t.k;
  return { k, x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio };
}

/**
 * Keeps the scaled content covering the viewport. `vw`/`vh` are the viewport size and `cw`/`ch`
 * the content's unscaled layout size (they differ when the content is taller than the viewport).
 * If the scaled content is smaller than the viewport on an axis, that axis is pinned to 0.
 */
export function clampTransform(t: Transform, vw: number, vh: number, cw: number, ch: number): Transform {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    k: t.k,
    x: clamp(t.x, Math.min(0, vw - cw * t.k), 0),
    y: clamp(t.y, Math.min(0, vh - ch * t.k), 0),
  };
}
