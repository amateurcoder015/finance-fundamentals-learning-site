import React, { useId, useState } from 'react';
import { extent, linePath, linearScale, niceTicks } from '../../../lib/chart-scales';

export type ChartTone = 'ink' | 'rust' | 'success' | 'danger' | 'muted';

export interface ChartSeries {
  id: string;
  label: string;
  points: Array<[number, number]>;
  tone?: ChartTone;
  dashed?: boolean;
}

export interface ChartMarker {
  x: number;
  label: string;
  tone?: ChartTone;
}

export interface ChartFrameProps {
  series: ChartSeries[];
  xLabel: string;
  yLabel: string;
  summary: string;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  markers?: ChartMarker[];
  height?: number;
  includeZeroY?: boolean;
  tableRows?: number;
}

const STROKE: Record<ChartTone, string> = {
  ink: 'stroke-ink',
  rust: 'stroke-rust',
  success: 'stroke-success',
  danger: 'stroke-danger',
  muted: 'stroke-ink-muted',
};
const FILL: Record<ChartTone, string> = {
  ink: 'fill-ink',
  rust: 'fill-rust',
  success: 'fill-success',
  danger: 'fill-danger',
  muted: 'fill-ink-muted',
};
const SWATCH: Record<ChartTone, string> = {
  ink: 'bg-ink',
  rust: 'bg-rust',
  success: 'bg-success',
  danger: 'bg-danger',
  muted: 'bg-ink-muted',
};

const W = 640;
const M = { l: 68, r: 20, t: 16, b: 52 };
const defaultFormat = (v: number) => String(Number(v.toFixed(2)));

function nearest(points: Array<[number, number]>, x: number): [number, number] | null {
  if (points.length === 0) return null;
  let best = points[0];
  for (const p of points) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
  return best;
}

export const ChartFrame: React.FC<ChartFrameProps> = ({
  series,
  xLabel,
  yLabel,
  summary,
  formatX = defaultFormat,
  formatY = defaultFormat,
  markers = [],
  height = 340,
  includeZeroY = false,
  tableRows = 10,
}) => {
  const uid = useId();
  const [hoverX, setHoverX] = useState<number | null>(null);

  const all = series.flatMap((s) => s.points);
  const [x0, x1] = extent(all.map((p) => p[0]));
  let [y0, y1] = extent(all.map((p) => p[1]));
  if (includeZeroY) {
    y0 = Math.min(y0, 0);
    y1 = Math.max(y1, 0);
  }
  const sx = linearScale([x0, x1], [M.l, W - M.r]);
  const sy = linearScale([y0, y1], [height - M.b, M.t]);
  const xTicks = niceTicks(x0, x1, 6);
  const yTicks = niceTicks(y0, y1, 5);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const x = x0 + ((px - M.l) / (W - M.l - M.r)) * (x1 - x0);
    setHoverX(Math.min(x1, Math.max(x0, x)));
  };

  const primary = series[0]?.points ?? [];
  const step = Math.max(1, Math.floor(primary.length / tableRows));
  const tableXs = primary.filter((_, i) => i % step === 0 || i === primary.length - 1).map((p) => p[0]);

  const hoverText =
    hoverX === null
      ? 'Hover or tap the chart to read exact values.'
      : `${xLabel} ${formatX(nearest(primary, hoverX)?.[0] ?? hoverX)}: ` +
        series
          .map((s) => {
            const p = nearest(s.points, hoverX);
            return `${s.label} ${p ? formatY(p[1]) : '—'}`;
          })
          .join(' · ');

  return (
    <figure className="space-y-3">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={summary}
        className="w-full touch-pan-y select-none text-[11px]"
        onPointerMove={onMove}
        onPointerLeave={() => setHoverX(null)}
      >
        {yTicks.map((t) => (
          <g key={`y-${uid}-${t}`}>
            <line x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} className="stroke-rule" strokeWidth={1} />
            <text x={M.l - 8} y={sy(t) + 4} textAnchor="end" className="fill-ink-muted font-mono">{formatY(t)}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={`x-${uid}-${t}`}>
            <line x1={sx(t)} x2={sx(t)} y1={M.t} y2={height - M.b} className="stroke-rule" strokeWidth={1} />
            <text x={sx(t)} y={height - M.b + 18} textAnchor="middle" className="fill-ink-muted font-mono">{formatX(t)}</text>
          </g>
        ))}
        <text x={(M.l + W - M.r) / 2} y={height - 8} textAnchor="middle" className="fill-ink font-sans text-xs font-semibold">{xLabel}</text>
        <text transform={`translate(14 ${(M.t + height - M.b) / 2}) rotate(-90)`} textAnchor="middle" className="fill-ink font-sans text-xs font-semibold">{yLabel}</text>

        {markers.map((m) => (
          <g key={`m-${uid}-${m.label}-${m.x}`}>
            <line x1={sx(m.x)} x2={sx(m.x)} y1={M.t} y2={height - M.b} className={STROKE[m.tone ?? 'ink']} strokeWidth={1.5} strokeDasharray="4 4" />
            <text x={sx(m.x)} y={M.t + 10} textAnchor="middle" className={`${FILL[m.tone ?? 'ink']} font-sans text-[10px] font-bold`}>{m.label}</text>
          </g>
        ))}

        {series.map((s) => (
          <path
            key={s.id}
            d={linePath(s.points.map(([x, y]) => [sx(x), sy(y)] as [number, number]))}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? '6 5' : undefined}
            className={STROKE[s.tone ?? 'ink']}
          />
        ))}

        {hoverX !== null && (
          <g>
            <line x1={sx(hoverX)} x2={sx(hoverX)} y1={M.t} y2={height - M.b} className="stroke-ink-muted" strokeWidth={1} />
            {series.map((s) => {
              const p = nearest(s.points, hoverX);
              return p ? <circle key={s.id} cx={sx(p[0])} cy={sy(p[1])} r={4} className={`${FILL[s.tone ?? 'ink']} stroke-paper`} strokeWidth={2} /> : null;
            })}
          </g>
        )}
      </svg>

      <p className="min-h-[1.25rem] font-mono text-xs text-ink-muted">{hoverText}</p>

      <ul className="flex flex-wrap gap-x-5 gap-y-1 font-sans text-xs text-ink-muted">
        {series.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <span className={`inline-block h-[3px] w-5 ${SWATCH[s.tone ?? 'ink']}`} aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ul>

      <figcaption className="font-serif text-sm italic text-ink-muted">{summary}</figcaption>

      <details className="font-sans text-sm text-ink">
        <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-semibold text-rust">Show data table</summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full border-collapse text-left font-mono text-xs">
            <thead>
              <tr>
                <th className="border-b-2 border-ink px-2 py-1">{xLabel}</th>
                {series.map((s) => (
                  <th key={s.id} className="border-b-2 border-ink px-2 py-1">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableXs.map((x) => (
                <tr key={x}>
                  <td className="border-b border-rule px-2 py-1">{formatX(x)}</td>
                  {series.map((s) => {
                    const p = nearest(s.points, x);
                    return <td key={s.id} className="border-b border-rule px-2 py-1">{p ? formatY(p[1]) : '—'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
};

export default ChartFrame;
