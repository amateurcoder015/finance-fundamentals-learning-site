import React, { useCallback, useEffect, useRef, useState } from 'react';
import { clampTransform, zoomAt, type Transform } from '../../lib/pan-zoom';

const IDENTITY: Transform = { x: 0, y: 0, k: 1 };

export function usePanZoom(minK = 1, maxK = 4) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<Transform>(IDENTITY);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const size = () => {
    const r = viewportRef.current?.getBoundingClientRect();
    return { w: r?.width ?? 0, h: r?.height ?? 0, left: r?.left ?? 0, top: r?.top ?? 0 };
  };

  const applyZoom = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const { w, h } = size();
      setT((prev) => clampTransform(zoomAt(prev, cx ?? w / 2, cy ?? h / 2, factor, minK, maxK), w, h));
    },
    [minK, maxK],
  );

  // Pinch-zoom on trackpads arrives as ctrl+wheel; plain wheel keeps scrolling the page.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const { left, top } = size();
      applyZoom(Math.exp(-e.deltaY * 0.01), e.clientX - left, e.clientY - top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    const { w, h, left, top } = size();
    if (pointers.current.size === 2) {
      const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)![1];
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      if (before > 0) applyZoom(after / before, (next.x + other.x) / 2 - left, (next.y + other.y) / 2 - top);
    } else {
      setT((cur) =>
        cur.k > 1 ? clampTransform({ ...cur, x: cur.x + next.x - prev.x, y: cur.y + next.y - prev.y }, w, h) : cur,
      );
    }
    pointers.current.set(e.pointerId, next);
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
  };

  const fit = useCallback(() => setT(IDENTITY), []);

  return {
    t,
    viewportRef,
    zoomIn: () => applyZoom(1.4),
    zoomOut: () => applyZoom(1 / 1.4),
    fit,
    bind: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd },
  };
}
