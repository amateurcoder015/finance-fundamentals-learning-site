import React from 'react';

interface DiagramToolbarProps {
  canWalk: boolean;
  walking: boolean;
  onToggleWalk: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

const btn =
  'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-rule bg-paper-raised px-4 font-sans text-sm font-bold text-ink hover:border-ink/40';

export const DiagramToolbar: React.FC<DiagramToolbarProps> = (p) => (
  <div className="mb-3 flex flex-wrap items-center gap-2" role="toolbar" aria-label="Diagram controls">
    {p.canWalk && (
      <button type="button" className={`${btn} ${p.walking ? 'bg-ink text-on-accent' : ''}`} onClick={p.onToggleWalk} aria-pressed={p.walking}>
        {p.walking ? 'Stop walk' : 'Walk the flow'}
      </button>
    )}
    <span className="ml-auto flex gap-2">
      <button type="button" className={btn} onClick={p.onZoomOut} aria-label="Zoom out">−</button>
      <button type="button" className={btn} onClick={p.onZoomIn} aria-label="Zoom in">+</button>
      <button type="button" className={btn} onClick={p.onFit} aria-label="Fit to view">Fit</button>
      <button type="button" className={btn} onClick={p.onToggleFullscreen} aria-label={p.fullscreen ? 'Exit full screen' : 'Full screen'}>
        {p.fullscreen ? 'Close' : '⤢'}
      </button>
    </span>
  </div>
);

export default DiagramToolbar;
