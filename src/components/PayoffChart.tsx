import React, { useState, useId } from 'react';
import type { Position, PayoffChartData } from '../content/config';

export interface PayoffChartProps {
  positions: Position[];
  priceRange?: [number, number];
  title?: string;
  description?: string;
}

export default function PayoffChart({
  positions = [],
  priceRange: propPriceRange,
  title,
  description,
}: PayoffChartProps) {
  const uniqueId = useId().replace(/:/g, '');
  const [activeTab, setActiveTab] = useState<string>('combined');
  const [hoverX, setHoverX] = useState<number | null>(null);

  if (!positions || positions.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center text-slate-500 text-sm">
        No positions defined for this payoff chart.
      </div>
    );
  }

  // 1. Calculate price range
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  if (propPriceRange && propPriceRange.length === 2) {
    [minPrice, maxPrice] = propPriceRange;
  } else {
    positions.forEach((pos) => {
      const price = pos.contractPrice ?? pos.strike ?? 500;
      minPrice = Math.min(minPrice, price * 0.7);
      maxPrice = Math.max(maxPrice, price * 1.3);
    });
    if (minPrice === Infinity) {
      minPrice = 350;
      maxPrice = 650;
    }
  }

  // Round price bounds for nice axis steps
  minPrice = Math.floor(minPrice / 10) * 10;
  maxPrice = Math.ceil(maxPrice / 10) * 10;

  // Function to calculate single position P&L
  const getPnL = (pos: Position, st: number): number => {
    const lotSize = pos.lotSize ?? 1;
    const basePrice = pos.contractPrice ?? pos.strike ?? 0;
    const premium = pos.premium ?? 0;

    switch (pos.type) {
      case 'long-futures':
        return (st - basePrice) * lotSize;
      case 'short-futures':
        return (basePrice - st) * lotSize;
      case 'long-call':
        return (Math.max(0, st - basePrice) - premium) * lotSize;
      case 'short-call':
        return (premium - Math.max(0, st - basePrice)) * lotSize;
      case 'long-put':
        return (Math.max(0, basePrice - st) - premium) * lotSize;
      case 'short-put':
        return (premium - Math.max(0, basePrice - st)) * lotSize;
      default:
        return 0;
    }
  };

  // Determine active display positions
  const displayedPositions =
    activeTab === 'combined'
      ? positions
      : positions.filter((_, idx) => `pos-${idx}` === activeTab);

  // 2. Generate curve points across price domain
  const steps = 100;
  const priceStep = (maxPrice - minPrice) / steps;
  const samplePrices: number[] = [];
  for (let i = 0; i <= steps; i++) {
    samplePrices.push(minPrice + i * priceStep);
  }

  // Calculate min and max P&L to establish Y axis bounds
  let maxPnL = -Infinity;
  let minPnL = Infinity;

  samplePrices.forEach((st) => {
    let netPnL = 0;
    positions.forEach((pos) => {
      const pnl = getPnL(pos, st);
      netPnL += pnl;
      maxPnL = Math.max(maxPnL, pnl);
      minPnL = Math.min(minPnL, pnl);
    });
    maxPnL = Math.max(maxPnL, netPnL);
    minPnL = Math.min(minPnL, netPnL);
  });

  // Expand vertical padding symmetrically or neatly around zero
  const pnlSpan = Math.max(Math.abs(maxPnL), Math.abs(minPnL), 100);
  const yPadding = pnlSpan * 0.15;
  const yMin = Math.floor((-pnlSpan - yPadding) / 100) * 100;
  const yMax = Math.ceil((pnlSpan + yPadding) / 100) * 100;

  // Dimensions & Padding
  const svgWidth = 800;
  const svgHeight = 450;
  const padLeft = 85;
  const padRight = 40;
  const padTop = 40;
  const padBottom = 60;
  const graphWidth = svgWidth - padLeft - padRight;
  const graphHeight = svgHeight - padTop - padBottom;

  // Scale functions
  const scaleX = (st: number) =>
    padLeft + ((st - minPrice) / (maxPrice - minPrice)) * graphWidth;

  const scaleY = (pnl: number) =>
    padTop + graphHeight - ((pnl - yMin) / (yMax - yMin)) * graphHeight;

  const yZero = scaleY(0);

  // Reference points (break-even / contract prices)
  const breakEvens = Array.from(
    new Set(positions.map((p) => p.contractPrice ?? p.strike).filter(Boolean))
  ) as number[];

  // Generate path data for net payoff line
  const netPoints = samplePrices.map((st) => {
    const netPnL = displayedPositions.reduce(
      (sum, pos) => sum + getPnL(pos, st),
      0
    );
    return { st, pnl: netPnL, x: scaleX(st), y: scaleY(netPnL) };
  });

  const netPathD = netPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(' ');

  // Polygon path for green area fill (clipped to y <= yZero)
  const areaPathD = `
    M ${scaleX(minPrice).toFixed(2)} ${yZero.toFixed(2)}
    ${netPoints.map((pt) => `L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`).join(' ')}
    L ${scaleX(maxPrice).toFixed(2)} ${yZero.toFixed(2)}
    Z
  `;

  // X Axis Ticks (5 steps)
  const xTickCount = 5;
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) =>
    Math.round(minPrice + (i * (maxPrice - minPrice)) / xTickCount)
  );

  // Y Axis Ticks (5 steps)
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) =>
    Math.round(yMin + (i * (yMax - yMin)) / yTickCount)
  );

  // Hover detection
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * svgWidth;
    const clampedX = Math.max(padLeft, Math.min(svgWidth - padRight, svgX));
    const stVal =
      minPrice +
      ((clampedX - padLeft) / graphWidth) * (maxPrice - minPrice);
    setHoverX(Math.round(stVal));
  };

  const handleMouseLeave = () => {
    setHoverX(null);
  };

  // Hover info computation
  const hoverData = hoverX !== null ? {
    st: hoverX,
    x: scaleX(hoverX),
    positionsPnL: positions.map((pos) => ({
      label: pos.label || getPosDefaultLabel(pos),
      pnl: getPnL(pos, hoverX),
    })),
    netPnL: displayedPositions.reduce((sum, pos) => sum + getPnL(pos, hoverX), 0),
  } : null;

  return (
    <div className="w-full space-y-4">
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
            PAYOFF CHART
          </span>
          <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
            {title || 'Profit & Loss Profile at Expiration'}
          </h3>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {description}
            </p>
          )}
        </div>

        {/* Tab Controls for Positions */}
        {positions.length > 1 && (
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('combined')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'combined'
                  ? 'bg-white dark:bg-[#0F1E36] text-[#0F172A] dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Combined Net
            </button>
            {positions.map((pos, idx) => {
              const key = `pos-${idx}`;
              const label = pos.label || getPosDefaultLabel(pos);
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === key
                      ? 'bg-white dark:bg-[#0F1E36] text-[#0F172A] dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-slate-50/50 dark:bg-[#0B1528] border border-slate-200 dark:border-slate-800 p-2 sm:p-4 transition-colors">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = touch.clientX - rect.left;
              const svgX = (mouseX / rect.width) * svgWidth;
              const clampedX = Math.max(padLeft, Math.min(svgWidth - padRight, svgX));
              const stVal =
                minPrice +
                ((clampedX - padLeft) / graphWidth) * (maxPrice - minPrice);
              setHoverX(Math.round(stVal));
            }
          }}
        >
          <defs>
            {/* Soft Emerald Gradient for Profit Region */}
            <linearGradient id={`profitGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
            </linearGradient>

            {/* Soft Rose Gradient for Loss Region */}
            <linearGradient id={`lossGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.35" />
            </linearGradient>

            {/* Clip path above Y=0 (Profit) */}
            <clipPath id={`clipProfit-${uniqueId}`}>
              <rect x={padLeft} y={padTop} width={graphWidth} height={Math.max(0, yZero - padTop)} />
            </clipPath>

            {/* Clip path below Y=0 (Loss) */}
            <clipPath id={`clipLoss-${uniqueId}`}>
              <rect x={padLeft} y={yZero} width={graphWidth} height={Math.max(0, svgHeight - padBottom - yZero)} />
            </clipPath>
          </defs>

          {/* Grid Background Lines */}
          {yTicks.map((tick) => {
            const y = scaleY(tick);
            return (
              <g key={`yGrid-${tick}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800/60"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-400 font-mono text-[11px] font-semibold"
                >
                  {tick > 0 ? `+$${tick.toLocaleString()}` : tick < 0 ? `-$${Math.abs(tick).toLocaleString()}` : '$0'}
                </text>
              </g>
            );
          })}

          {xTicks.map((tick) => {
            const x = scaleX(tick);
            return (
              <g key={`xGrid-${tick}`}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={svgHeight - padBottom}
                  className="stroke-slate-200 dark:stroke-slate-800/60"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={svgHeight - padBottom + 24}
                  textAnchor="middle"
                  className="fill-slate-400 dark:fill-slate-400 font-mono text-[11px] font-semibold"
                >
                  ${tick}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padLeft + graphWidth / 2}
            y={svgHeight - 12}
            textAnchor="middle"
            className="fill-slate-600 dark:fill-slate-300 font-bold text-[12px]"
          >
            Underlying Spot Price at Expiration (Sₜ)
          </text>

          <text
            x={18}
            y={padTop + graphHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 18 ${padTop + graphHeight / 2})`}
            className="fill-slate-600 dark:fill-slate-300 font-bold text-[12px]"
          >
            Profit / Loss ($)
          </text>

          {/* Shaded Area Fills */}
          <path
            d={areaPathD}
            fill={`url(#profitGrad-${uniqueId})`}
            clipPath={`url(#clipProfit-${uniqueId})`}
          />
          <path
            d={areaPathD}
            fill={`url(#lossGrad-${uniqueId})`}
            clipPath={`url(#clipLoss-${uniqueId})`}
          />

          {/* Zero P&L Dashed Reference Line */}
          <line
            x1={padLeft}
            y1={yZero}
            x2={svgWidth - padRight}
            y2={yZero}
            className="stroke-slate-400 dark:stroke-slate-400"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          <text
            x={svgWidth - padRight - 6}
            y={yZero - 6}
            textAnchor="end"
            className="fill-slate-400 dark:fill-slate-400 font-semibold text-[10px] tracking-wide uppercase"
          >
            Zero P&L Break-even
          </text>

          {/* Vertical Break-even Price Line(s) */}
          {breakEvens.map((bePrice) => {
            const xBE = scaleX(bePrice);
            return (
              <g key={`be-${bePrice}`}>
                <line
                  x1={xBE}
                  y1={padTop}
                  x2={xBE}
                  y2={svgHeight - padBottom}
                  className="stroke-amber-500/80 dark:stroke-amber-400/80"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <rect
                  x={xBE - 45}
                  y={padTop - 28}
                  width="90"
                  height="22"
                  rx="6"
                  className="fill-amber-500/10 dark:fill-amber-400/20 stroke-amber-500/30 dark:stroke-amber-400/40"
                />
                <text
                  x={xBE}
                  y={padTop - 13}
                  textAnchor="middle"
                  className="fill-amber-700 dark:fill-amber-300 font-extrabold text-[10px]"
                >
                  Contract Price: ${bePrice}
                </text>
              </g>
            );
          })}

          {/* Draw Individual Position Lines if activeTab === 'combined' and multiple positions */}
          {activeTab === 'combined' &&
            positions.length > 1 &&
            positions.map((pos, idx) => {
              const legPoints = samplePrices.map((st) => ({
                x: scaleX(st),
                y: scaleY(getPnL(pos, st)),
              }));
              const legD = legPoints
                .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
                .join(' ');
              const strokeColor = getLegColor(pos.type, idx);

              return (
                <path
                  key={`leg-${idx}`}
                  d={legD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
              );
            })}

          {/* Primary Net Payoff Line */}
          <path
            d={netPathD}
            fill="none"
            className="stroke-blue-600 dark:stroke-blue-400"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Crosshair & Data Tooltip */}
          {hoverData && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={hoverData.x}
                y1={padTop}
                x2={hoverData.x}
                y2={svgHeight - padBottom}
                className="stroke-slate-500 dark:stroke-slate-300"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Point Indicator on Net Payoff Line */}
              <circle
                cx={hoverData.x}
                cy={scaleY(hoverData.netPnL)}
                r="6"
                className="fill-blue-600 dark:fill-blue-400 stroke-white dark:stroke-[#0F1E36]"
                strokeWidth="2.5"
              />

              {/* Floating Tooltip Card */}
              <g
                transform={`translate(${
                  hoverData.x > svgWidth / 2
                    ? hoverData.x - 220
                    : hoverData.x + 15
                }, ${Math.min(
                  Math.max(scaleY(hoverData.netPnL) - 60, padTop),
                  svgHeight - padBottom - 110
                )})`}
              >
                <foreignObject width="205" height="110">
                  <div className="p-2.5 rounded-xl bg-slate-900/95 text-white shadow-xl backdrop-blur-md border border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                      <span className="font-bold text-slate-300">Spot Price (Sₜ):</span>
                      <span className="font-mono font-black text-amber-400">
                        ${hoverData.st}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-300">Net Payoff:</span>
                      <span
                        className={`font-mono font-bold ${
                          hoverData.netPnL > 0
                            ? 'text-emerald-400'
                            : hoverData.netPnL < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {hoverData.netPnL > 0
                          ? `+$${hoverData.netPnL.toLocaleString()}`
                          : hoverData.netPnL < 0
                          ? `-$${Math.abs(hoverData.netPnL).toLocaleString()}`
                          : '$0'}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Status:</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                          hoverData.netPnL > 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : hoverData.netPnL < 0
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {hoverData.netPnL > 0
                          ? 'Profit'
                          : hoverData.netPnL < 0
                          ? 'Loss'
                          : 'Break-Even'}
                      </span>
                    </div>
                  </div>
                </foreignObject>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Legend & Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-1 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 opacity-80"></span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">Profit Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 opacity-80"></span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">Loss Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded"></span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">Net Payoff</span>
          </div>
        </div>

        <div className="text-slate-400 text-[11px] font-mono">
          Hover/Tap chart for exact settlement values
        </div>
      </div>
    </div>
  );
}

function getPosDefaultLabel(pos: Position): string {
  const lot = pos.lotSize ?? 1;
  const price = pos.contractPrice ?? pos.strike ?? 0;
  switch (pos.type) {
    case 'long-futures':
      return `Long Futures ($${price})`;
    case 'short-futures':
      return `Short Futures ($${price})`;
    case 'long-call':
      return `Long Call (Strike $${price})`;
    case 'short-call':
      return `Short Call (Strike $${price})`;
    case 'long-put':
      return `Long Put (Strike $${price})`;
    case 'short-put':
      return `Short Put (Strike $${price})`;
    default:
      return 'Position';
  }
}

function getLegColor(type: Position['type'], idx: number): string {
  if (type.startsWith('long')) return '#10B981';
  if (type.startsWith('short')) return '#F43F5E';
  const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4'];
  return colors[idx % colors.length];
}
