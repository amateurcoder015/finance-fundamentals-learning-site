import { describe, it, expect } from 'vitest';
import {
  FUTURES_EXAMPLES,
  basisSpotMinusFutures,
  convergenceSeries,
  curveByExpiry,
  futuresFormulaTex,
  futuresPrice,
  marketStructure,
} from '../src/explainers/futures-pricing/model';

describe('futuresPrice (chapter worked examples)', () => {
  it('S=100, r=5%, T=0.5 gives $102.53', () => {
    expect(futuresPrice(100, 0.05, 0, 0.5)).toBeCloseTo(102.5315, 3);
    expect(futuresPrice(100, 0.05, 0, 0.5).toFixed(2)).toBe('102.53');
  });
  it('with a 2% dividend yield gives $101.51', () => {
    expect(futuresPrice(100, 0.05, 0.02, 0.5)).toBeCloseTo(101.5113, 3);
    expect(futuresPrice(100, 0.05, 0.02, 0.5).toFixed(2)).toBe('101.51');
  });
  it('equals spot at expiry (T = 0), the convergence limit', () => {
    expect(futuresPrice(100, 0.05, 0.02, 0)).toBe(100);
  });
  it('equals spot when r equals q', () => {
    expect(futuresPrice(100, 0.03, 0.03, 2)).toBeCloseTo(100, 10);
  });
});

describe('basis and market structure', () => {
  it('basis is spot minus futures (negative in contango)', () => {
    expect(basisSpotMinusFutures(100, 102.53)).toBeCloseTo(-2.53, 6);
  });
  it('detects contango, backwardation and flat', () => {
    expect(marketStructure(100, futuresPrice(100, 0.05, 0.02, 1))).toBe('contango');
    expect(marketStructure(100, futuresPrice(100, 0.02, 0.05, 1))).toBe('backwardation');
    expect(marketStructure(100, futuresPrice(100, 0.03, 0.03, 1))).toBe('flat');
  });
});

describe('series', () => {
  it('curveByExpiry runs from spot at T=0 to the long-dated price', () => {
    const c = curveByExpiry(100, 0.05, 0, 2, 20);
    expect(c).toHaveLength(21);
    expect(c[0]).toEqual([0, 100]);
    expect(c[20][0]).toBeCloseTo(2, 10);
    expect(c[20][1]).toBeCloseTo(100 * Math.exp(0.1), 6);
  });
  it('convergenceSeries starts at the futures price and ends exactly at spot', () => {
    const s = convergenceSeries(100, 0.05, 0, 0.5, 10);
    expect(s).toHaveLength(11);
    expect(s[0][0]).toBe(0);
    expect(s[0][1]).toBeCloseTo(102.5315, 3);
    expect(s[10][0]).toBeCloseTo(0.5, 10);
    expect(s[10][1]).toBeCloseTo(100, 10);
  });
  it('convergence is monotone toward spot in contango', () => {
    const s = convergenceSeries(100, 0.05, 0, 1, 12);
    for (let k = 1; k < s.length; k++) expect(s[k][1]).toBeLessThanOrEqual(s[k - 1][1] + 1e-12);
  });
  it('zero time to expiry yields a flat, finite series', () => {
    const s = convergenceSeries(100, 0.05, 0, 0, 5);
    for (const [x, y] of s) {
      expect(Number.isFinite(x)).toBe(true);
      expect(y).toBeCloseTo(100, 10);
    }
  });
});

describe('examples and formula text', () => {
  it('ships the chapter examples', () => {
    expect(FUTURES_EXAMPLES[0]).toMatchObject({ spot: 100, rate: 0.05, carryYield: 0, years: 0.5 });
    expect(FUTURES_EXAMPLES[1]).toMatchObject({ spot: 100, rate: 0.05, carryYield: 0.02, years: 0.5 });
  });
  it('substitutes numbers into the formula', () => {
    const tex = futuresFormulaTex(100, 0.05, 0.02, 0.5);
    expect(tex).toContain('101.51');
    expect(tex).toContain('0.05');
    expect(tex).not.toContain('NaN');
  });
});

describe('slider-grid sweep', () => {
  it('never produces non-finite values and converges exactly to spot', () => {
    for (const spot of [1, 100, 500])
      for (const rate of [0, 0.05, 0.15])
        for (const q of [0, 0.05, 0.15])
          for (const years of [0, 0.5, 2]) {
            expect(Number.isFinite(futuresPrice(spot, rate, q, years))).toBe(true);
            for (const [x, y] of curveByExpiry(spot, rate, q, years)) {
              expect(Number.isFinite(x)).toBe(true);
              expect(Number.isFinite(y)).toBe(true);
            }
            const s = convergenceSeries(spot, rate, q, years);
            for (const [x, y] of s) {
              expect(Number.isFinite(x)).toBe(true);
              expect(Number.isFinite(y)).toBe(true);
            }
            expect(Math.abs(s[s.length - 1][1] - spot)).toBeLessThan(1e-9);
          }
  });
});
