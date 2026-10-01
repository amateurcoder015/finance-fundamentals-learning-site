import type { Position } from '../content/config';

/** Profit or loss of one leg at expiry. Matches the logic previously inside PayoffChart. */
export function positionPnL(pos: Position, st: number): number {
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
}

export function netPnL(positions: Position[], st: number): number {
  return positions.reduce((sum, pos) => sum + positionPnL(pos, st), 0);
}

export interface PayoffSummary {
  /** Maximum profit, or null when unlimited. */
  maxProfit: number | null;
  /** Maximum loss (a negative number), or null when unlimited. */
  maxLoss: number | null;
  breakEvens: number[];
  unboundedProfit: boolean;
  unboundedLoss: boolean;
}

const EPS = 1e-9;

/**
 * The payoff is piecewise linear with kinks at the strikes, so evaluating it at the kinks (plus price 0
 * and the right edge) gives exact extremes and break-evens. Price is assumed to stay at or above 0.
 */
export function summarisePayoff(positions: Position[], range: [number, number]): PayoffSummary {
  if (positions.length === 0) {
    return { maxProfit: 0, maxLoss: 0, breakEvens: [], unboundedProfit: false, unboundedLoss: false };
  }
  const kinks = positions
    .map((p) => p.contractPrice ?? p.strike)
    .filter((k): k is number => typeof k === 'number' && Number.isFinite(k) && k > 0);
  const hi = Math.max(range[1], ...kinks, 1) * 1.5;
  const xs = Array.from(new Set([0, ...kinks, hi])).sort((a, b) => a - b);
  const ys = xs.map((x) => netPnL(positions, x));

  const lastSlope = xs.length >= 2 ? (ys[ys.length - 1] - ys[ys.length - 2]) / (xs[xs.length - 1] - xs[xs.length - 2]) : 0;
  const unboundedProfit = lastSlope > EPS;
  const unboundedLoss = lastSlope < -EPS;

  const breakEvens: number[] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const [xa, xb, ya, yb] = [xs[i], xs[i + 1], ys[i], ys[i + 1]];
    if (Math.abs(ya) < EPS) {
      breakEvens.push(xa);
    } else if (ya * yb < 0) {
      breakEvens.push(xa + (-ya * (xb - xa)) / (yb - ya));
    }
  }
  const lastY = ys[ys.length - 1];
  if (Math.abs(lastY) < EPS) breakEvens.push(xs[xs.length - 1]);
  else if (lastY < 0 && unboundedProfit) breakEvens.push(hi - lastY / lastSlope);
  else if (lastY > 0 && unboundedLoss) breakEvens.push(hi - lastY / lastSlope);

  const uniqueBreakEvens = Array.from(new Set(breakEvens.map((b) => Number(b.toFixed(9))))).sort((a, b) => a - b);

  return {
    maxProfit: unboundedProfit ? null : Math.max(...ys),
    maxLoss: unboundedLoss ? null : Math.min(...ys),
    breakEvens: uniqueBreakEvens,
    unboundedProfit,
    unboundedLoss,
  };
}
