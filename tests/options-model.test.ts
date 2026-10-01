import { describe, it, expect } from 'vitest';
import {
  OPTION_EXAMPLE,
  bsFormulaTex,
  bsGreeks,
  bsPrice,
  impliedCall,
  impliedPut,
  normCdf,
  normPdf,
  parityCheck,
  type BsInputs,
} from '../src/explainers/options-suite/model';

const REF: BsInputs = { spot: 100, strike: 100, rate: 0.05, vol: 0.2, time: 1 };

describe('normal distribution', () => {
  it('matches reference values for the CDF', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 12);
    expect(normCdf(1)).toBeCloseTo(0.8413447460685429, 10);
    expect(normCdf(-1)).toBeCloseTo(0.15865525393145707, 10);
    expect(normCdf(1.96)).toBeCloseTo(0.9750021048517795, 10);
    expect(normCdf(0.5)).toBeCloseTo(0.6914624612740131, 10);
    expect(normCdf(2)).toBeCloseTo(0.9772498680518208, 10);
    expect(normCdf(-3)).toBeCloseTo(0.0013498980316301035, 10);
  });
  it('is symmetric and bounded', () => {
    for (const x of [0.1, 0.7, 1.3, 2.9, 5, 8]) expect(normCdf(x) + normCdf(-x)).toBeCloseTo(1, 12);
    expect(normCdf(40)).toBe(1);
    expect(normCdf(-40)).toBe(0);
  });
  it('pdf peaks at zero', () => {
    expect(normPdf(0)).toBeCloseTo(0.3989422804014327, 12);
  });
});

describe('Black-Scholes reference vector (S=100, K=100, r=5%, sigma=20%, T=1)', () => {
  it('prices the call and put', () => {
    expect(bsPrice(REF, 'call')).toBeCloseTo(10.4506, 3);
    expect(bsPrice(REF, 'put')).toBeCloseTo(5.5735, 3);
  });
  it('computes the call Greeks', () => {
    const g = bsGreeks(REF, 'call');
    expect(g.delta).toBeCloseTo(0.6368, 3);
    expect(g.gamma).toBeCloseTo(0.018762, 5);
    expect(g.vega).toBeCloseTo(37.524, 2);
    expect(g.theta).toBeCloseTo(-6.414, 2);
    expect(g.rho).toBeCloseTo(53.2325, 2);
  });
  it('computes the put Greeks', () => {
    const g = bsGreeks(REF, 'put');
    expect(g.delta).toBeCloseTo(-0.3632, 3);
    expect(g.theta).toBeCloseTo(-1.658, 2);
    expect(g.rho).toBeCloseTo(-41.8904, 2);
  });
});

describe('Black-Scholes properties', () => {
  const grid: BsInputs[] = [];
  for (const spot of [60, 100, 140]) for (const strike of [80, 100, 120]) for (const vol of [0.05, 0.2, 0.6]) for (const time of [0.1, 1, 2]) grid.push({ spot, strike, rate: 0.05, vol, time });

  it('put-call parity holds for the computed prices', () => {
    for (const i of grid) {
      const lhs = bsPrice(i, 'call') - bsPrice(i, 'put');
      const rhs = i.spot - i.strike * Math.exp(-i.rate * i.time);
      expect(lhs).toBeCloseTo(rhs, 8);
    }
  });
  it('deltas stay in their ranges and differ by exactly one', () => {
    for (const i of grid) {
      const c = bsGreeks(i, 'call').delta;
      const p = bsGreeks(i, 'put').delta;
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
      expect(p).toBeGreaterThanOrEqual(-1);
      expect(p).toBeLessThanOrEqual(0);
      expect(c - p).toBeCloseTo(1, 10);
    }
  });
  it('gamma and vega are identical for calls and puts and non-negative', () => {
    for (const i of grid) {
      const c = bsGreeks(i, 'call');
      const p = bsGreeks(i, 'put');
      expect(c.gamma).toBeCloseTo(p.gamma, 12);
      expect(c.vega).toBeCloseTo(p.vega, 10);
      expect(c.gamma).toBeGreaterThanOrEqual(0);
      expect(c.vega).toBeGreaterThanOrEqual(0);
    }
  });
  it('price tends to intrinsic value as time to expiry goes to zero', () => {
    expect(bsPrice({ spot: 110, strike: 100, rate: 0, vol: 0.2, time: 1e-9 }, 'call')).toBeCloseTo(10, 6);
    expect(bsPrice({ spot: 90, strike: 100, rate: 0, vol: 0.2, time: 1e-9 }, 'call')).toBeCloseTo(0, 6);
  });
  it('degenerate inputs give finite numbers, never NaN', () => {
    const cases: BsInputs[] = [
      { spot: 100, strike: 100, rate: 0.05, vol: 0.2, time: 0 },
      { spot: 100, strike: 100, rate: 0.05, vol: 0, time: 1 },
      { spot: 100, strike: 100, rate: 0, vol: 0, time: 0 },
      { spot: 1, strike: 500, rate: 0.15, vol: 0.01, time: 0.01 },
      { spot: 500, strike: 1, rate: 0, vol: 0.8, time: 2 },
    ];
    for (const i of cases) {
      for (const type of ['call', 'put'] as const) {
        expect(Number.isFinite(bsPrice(i, type))).toBe(true);
        const g = bsGreeks(i, type);
        for (const v of Object.values(g)) expect(Number.isFinite(v)).toBe(true);
      }
    }
  });
  it('at time zero the price is intrinsic value', () => {
    expect(bsPrice({ spot: 110, strike: 100, rate: 0.05, vol: 0.2, time: 0 }, 'call')).toBe(10);
    expect(bsPrice({ spot: 110, strike: 100, rate: 0.05, vol: 0.2, time: 0 }, 'put')).toBe(0);
  });
});

describe('put-call parity (chapter worked example)', () => {
  it('S=100, K=100, r=5%, T=1 and call premium $8.00 imply a put of $3.12', () => {
    expect(impliedPut(8, 100, 100, 0.05, 1)).toBeCloseTo(3.12, 2);
  });
  it('implied call is the inverse', () => {
    expect(impliedCall(3.1229, 100, 100, 0.05, 1)).toBeCloseTo(8, 3);
  });
  it('the chapter example is aligned', () => {
    const r = parityCheck({ ...OPTION_EXAMPLE, put: 3.12 });
    expect(r.status).toBe('aligned');
    expect(r.callSide).toBeCloseTo(103.1229, 3);
    expect(r.putSide).toBeCloseTo(103.12, 6);
  });
  it('a dear put shows a put-side-rich dislocation and an action', () => {
    const r = parityCheck({ ...OPTION_EXAMPLE, put: 4 });
    expect(r.status).toBe('put-side-rich');
    expect(r.deviation).toBeCloseTo(-0.8771, 3);
    expect(r.action).toMatch(/sell the put/i);
  });
  it('a dear call shows a call-side-rich dislocation', () => {
    const r = parityCheck({ ...OPTION_EXAMPLE, put: 2 });
    expect(r.status).toBe('call-side-rich');
    expect(r.action).toMatch(/sell the call/i);
  });
  it('is finite at a zero rate or zero time', () => {
    const r = parityCheck({ spot: 100, strike: 100, rate: 0, time: 0, call: 5, put: 5 });
    expect(Number.isFinite(r.deviation)).toBe(true);
  });
});

describe('bsFormulaTex', () => {
  it('shows d1, d2 and the price for the reference inputs', () => {
    const tex = bsFormulaTex(REF, 'call');
    expect(tex).toContain('d_1');
    expect(tex).toContain('10.45');
    expect(tex).not.toContain('NaN');
  });
  it('does not crash on degenerate inputs', () => {
    expect(() => bsFormulaTex({ ...REF, time: 0 }, 'put')).not.toThrow();
  });
});
