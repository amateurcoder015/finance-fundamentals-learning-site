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

export function clampTransform(t: Transform, w: number, h: number): Transform {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return { k: t.k, x: clamp(t.x, w - w * t.k, 0), y: clamp(t.y, h - h * t.k, 0) };
}
