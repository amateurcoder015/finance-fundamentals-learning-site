import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildThemeVariables } from '../../lib/diagram-theme';
import { getReducedMotion } from '../../lib/motion';
import { extractGraph, armReveal, readThemeTokens, type DiagramGraph } from './dom';
import { usePanZoom } from './usePanZoom';
import { DiagramToolbar } from './DiagramToolbar';

export interface DiagramProps {
  code: string;
  title: string;
}

let renderCounter = 0;

/** True when the <html> element currently has the `dark` class. Only reports real changes. */
function useIsDark(): boolean {
  const read = () => document.documentElement.classList.contains('dark');
  // Lazy init so a dark-mode page renders once (not light-then-dark). Only effects use this value,
  // so the server/client markup cannot mismatch.
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && read());
  useEffect(() => {
    setDark(read());
    const observer = new MutationObserver(() => setDark(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export const Diagram: React.FC<DiagramProps> = ({ code, title }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasRevealed = useRef(false);
  const dark = useIsDark();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [graph, setGraph] = useState<DiagramGraph | null>(null);
  const [walkIndex, setWalkIndex] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const { t, viewportRef, zoomIn, zoomOut, fit, bind } = usePanZoom();

  // Render (and re-render when the theme flips).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: buildThemeVariables(readThemeTokens()),
          securityLevel: 'loose',
          flowchart: { curve: 'basis', htmlLabels: true },
        });
        const { svg: rendered } = await mermaid.render(`dg-${++renderCounter}`, code);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, dark]);

  // After each new SVG lands: extract the graph, and play the reveal once.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const svgEl = root?.querySelector('svg');
    if (!root || !svgEl) return;
    svgEl.removeAttribute('height');
    svgEl.style.maxWidth = 'none';

    const g = extractGraph(svgEl as SVGSVGElement);
    setGraph(g);

    const alreadyRevealed = hasRevealed.current;
    hasRevealed.current = true;
    if (alreadyRevealed || g.nodeIds.length === 0 || getReducedMotion()) return;

    armReveal(g);
    root.classList.add('dg-reveal');
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('dg-in')));
  }, [svg]);

  // Walk-the-flow highlighting.
  useEffect(() => {
    if (!graph) return;
    rootRef.current?.classList.toggle('dg-walking', walkIndex !== null);
    const currentId = walkIndex !== null ? graph.order[walkIndex] : null;
    graph.nodeEls.forEach((el, id) => el.classList.toggle('dg-current', id === currentId));
  }, [walkIndex, graph]);

  // Fullscreen: lock page scroll, close on Escape, re-fit the view.
  useEffect(() => {
    fit();
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen, fit]);

  // React 19 re-applies innerHTML whenever the prop object's identity changes, which would wipe
  // the reveal and walk classes (dg-walking / dg-current / dg-reveal), and pan/zoom state changes
  // re-render constantly. Keep the object stable per rendered svg.
  const innerHtml = useMemo(() => ({ __html: svg ?? '' }), [svg]);

  const total = graph?.order.length ?? 0;
  const canWalk = total >= 2;
  const walking = walkIndex !== null;

  const step = (delta: number) => {
    if (walkIndex === null || total === 0) return;
    setWalkIndex((walkIndex + delta + total) % total);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!walking) return;
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  };

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-rule bg-paper-raised p-5">
        <p className="mb-2 font-sans text-sm font-semibold text-ink">This diagram could not be drawn. Here is its source:</p>
        <pre className="overflow-x-auto rounded-lg bg-[rgb(var(--code-bg))] p-4 font-mono text-xs text-[rgb(var(--code-fg))]">{code}</pre>
      </div>
    );
  }

  return (
    <figure
      onKeyDown={onKeyDown}
      className={fullscreen ? 'fixed inset-0 z-[70] flex flex-col bg-paper p-4' : 'relative'}
    >
      <DiagramToolbar
        canWalk={canWalk}
        walking={walking}
        onToggleWalk={() => setWalkIndex(walking ? null : 0)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={fit}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((f) => !f)}
      />

      <div
        ref={viewportRef}
        {...bind}
        className={`relative overflow-hidden rounded-xl border border-rule bg-paper ${fullscreen ? 'flex-1' : ''} ${t.k > 1 ? 'select-none cursor-grab' : ''}`}
        style={{ touchAction: t.k > 1 ? 'none' : 'pan-y' }}
      >
        <div
          ref={rootRef}
          className="dg-root"
          role="img"
          aria-label={title}
          style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})`, transformOrigin: '0 0' }}
          dangerouslySetInnerHTML={innerHtml}
        />
        {svg === null && <p className="p-4 font-sans text-sm text-ink-muted">Drawing diagram…</p>}
      </div>

      {walking && graph && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-rule bg-paper-raised p-3">
          <button type="button" onClick={() => step(-1)} className="min-h-[44px] min-w-[44px] rounded-full border border-rule px-4 font-sans text-sm font-bold text-ink" aria-label="Previous step">←</button>
          <p aria-live="polite" className="flex-1 font-serif text-base text-ink">
            <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">
              Step {walkIndex! + 1} of {total}
            </span>
            <br />
            {graph.labels[graph.order[walkIndex!]]}
          </p>
          <button type="button" onClick={() => step(1)} className="min-h-[44px] min-w-[44px] rounded-full bg-rust px-4 font-sans text-sm font-bold text-on-accent" aria-label="Next step">→</button>
        </div>
      )}

      {graph && graph.order.length > 0 && (
        <ol className="sr-only" aria-label={`${title}: outline of steps`}>
          {graph.order.map((id) => (
            <li key={id}>{graph.labels[id]}</li>
          ))}
        </ol>
      )}
    </figure>
  );
};

export default Diagram;
