import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildThemeVariables } from '../../lib/diagram-theme';
import { getReducedMotion } from '../../lib/motion';
import { extractGraph, armReveal, readThemeTokens, type DiagramGraph } from './dom';

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

  // React 19 re-applies innerHTML whenever the prop object's identity changes, which would wipe
  // the reveal classes added by armReveal. Keep the object stable per rendered svg.
  const innerHtml = useMemo(() => ({ __html: svg ?? '' }), [svg]);

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-rule bg-paper-raised p-5">
        <p className="mb-2 font-sans text-sm font-semibold text-ink">This diagram could not be drawn. Here is its source:</p>
        <pre className="overflow-x-auto rounded-lg bg-[rgb(var(--code-bg))] p-4 font-mono text-xs text-[rgb(var(--code-fg))]">{code}</pre>
      </div>
    );
  }

  return (
    <figure className="relative">
      <div
        ref={rootRef}
        className="dg-root overflow-x-auto"
        role="img"
        aria-label={title}
        dangerouslySetInnerHTML={innerHtml}
      />
      {svg === null && <p className="font-sans text-sm text-ink-muted">Drawing diagram…</p>}
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
