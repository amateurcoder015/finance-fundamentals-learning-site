import { texMoney, texPlain } from '../../lib/explainer-format';

export type MarketStructure = 'contango' | 'backwardation' | 'flat';

export interface FuturesExample {
  label: string;
  spot: number;
  rate: number;
  carryYield: number;
  years: number;
}

/** The two worked examples in the chapter ($102.53 without dividends, $101.51 with a 2% yield). */
export const FUTURES_EXAMPLES: FuturesExample[] = [
  { label: 'Chapter example: no dividends', spot: 100, rate: 0.05, carryYield: 0, years: 0.5 },
  { label: 'Chapter example: 2% dividend yield', spot: 100, rate: 0.05, carryYield: 0.02, years: 0.5 },
];

/** Continuous-compounding cost of carry: F = S * e^((r - q) T). */
export function futuresPrice(spot: number, rate: number, carryYield: number, years: number): number {
  return spot * Math.exp((rate - carryYield) * Math.max(0, years));
}

/** The chapter defines basis as spot minus futures. */
export function basisSpotMinusFutures(spot: number, futures: number): number {
  return spot - futures;
}

export function marketStructure(spot: number, futures: number, tolerance = 1e-9): MarketStructure {
  if (futures - spot > tolerance) return 'contango';
  if (spot - futures > tolerance) return 'backwardation';
  return 'flat';
}

/** Futures price against time to expiry T (0 .. maxYears). */
export function curveByExpiry(spot: number, rate: number, carryYield: number, maxYears: number, steps = 60): Array<[number, number]> {
  const end = Math.max(0, maxYears);
  return Array.from({ length: steps + 1 }, (_, k) => {
    const t = (end * k) / steps;
    return [t, futuresPrice(spot, rate, carryYield, t)] as [number, number];
  });
}

/** Stylised convergence with spot held constant: futures price as time elapses toward expiry. */
export function convergenceSeries(spot: number, rate: number, carryYield: number, years: number, steps = 60): Array<[number, number]> {
  const total = Math.max(0, years);
  return Array.from({ length: steps + 1 }, (_, k) => {
    const elapsed = (total * k) / steps;
    return [elapsed, futuresPrice(spot, rate, carryYield, total - elapsed)] as [number, number];
  });
}

export function futuresFormulaTex(spot: number, rate: number, carryYield: number, years: number, currency = '$'): string {
  const f = futuresPrice(spot, rate, carryYield, years);
  return `F = S\\,e^{(r-q)T} = ${texMoney(spot, currency)}\\,e^{(${texPlain(rate)}-${texPlain(carryYield)})\\times ${texPlain(years)}} = ${texMoney(f, currency)}`;
}
