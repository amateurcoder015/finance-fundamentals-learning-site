import { describe, it, expect } from 'vitest';
import { netPnL, positionPnL, summarisePayoff } from '../src/lib/payoff';
import type { Position } from '../src/content/config';

const longCall = (strike: number, premium: number, lotSize = 1): Position => ({ type: 'long-call', strike, premium, lotSize });
const shortCall = (strike: number, premium: number, lotSize = 1): Position => ({ type: 'short-call', strike, premium, lotSize });
const longPut = (strike: number, premium: number, lotSize = 1): Position => ({ type: 'long-put', strike, premium, lotSize });

describe('positionPnL', () => {
  it('long futures gains when price rises, scaled by lot size', () => {
    expect(positionPnL({ type: 'long-futures', contractPrice: 500, lotSize: 100 }, 520)).toBe(2000);
    expect(positionPnL({ type: 'short-futures', contractPrice: 500, lotSize: 100 }, 520)).toBe(-2000);
  });
  it('long call loses the premium out of the money and gains above breakeven', () => {
    expect(positionPnL(longCall(100, 5), 90)).toBe(-5);
    expect(positionPnL(longCall(100, 5), 110)).toBe(5);
  });
  it('short put keeps the premium out of the money', () => {
    expect(positionPnL({ type: 'short-put', strike: 100, premium: 4, lotSize: 1 }, 120)).toBe(4);
  });
});

describe('netPnL', () => {
  it('sums legs (bull call spread)', () => {
    const legs = [longCall(100, 6), shortCall(110, 2)];
    expect(netPnL(legs, 90)).toBe(-4);
    expect(netPnL(legs, 120)).toBe(6);
  });
});

describe('summarisePayoff', () => {
  const range: [number, number] = [50, 150];

  it('long call: max loss is the premium, profit unlimited, break-even strike plus premium', () => {
    const s = summarisePayoff([longCall(100, 5)], range);
    expect(s.maxLoss).toBe(-5);
    expect(s.maxProfit).toBeNull();
    expect(s.unboundedProfit).toBe(true);
    expect(s.unboundedLoss).toBe(false);
    expect(s.breakEvens).toHaveLength(1);
    expect(s.breakEvens[0]).toBeCloseTo(105, 6);
  });

  it('short call: profit capped at the premium, loss unlimited', () => {
    const s = summarisePayoff([shortCall(100, 5)], range);
    expect(s.maxProfit).toBe(5);
    expect(s.maxLoss).toBeNull();
    expect(s.unboundedLoss).toBe(true);
    expect(s.breakEvens[0]).toBeCloseTo(105, 6);
  });

  it('long put: loss is the premium and profit is bounded because price cannot go below zero', () => {
    const s = summarisePayoff([longPut(100, 4)], range);
    expect(s.maxLoss).toBe(-4);
    expect(s.maxProfit).toBeCloseTo(96, 6);
    expect(s.unboundedProfit).toBe(false);
    expect(s.breakEvens[0]).toBeCloseTo(96, 6);
  });

  it('bull call spread: bounded both ways, break-even 104', () => {
    const s = summarisePayoff([longCall(100, 6), shortCall(110, 2)], range);
    expect(s.maxLoss).toBeCloseTo(-4, 6);
    expect(s.maxProfit).toBeCloseTo(6, 6);
    expect(s.breakEvens).toHaveLength(1);
    expect(s.breakEvens[0]).toBeCloseTo(104, 6);
  });

  it('long straddle: two break-evens, unlimited profit, loss is the total premium', () => {
    const s = summarisePayoff([longCall(100, 5), longPut(100, 4)], range);
    expect(s.maxLoss).toBeCloseTo(-9, 6);
    expect(s.unboundedProfit).toBe(true);
    expect(s.breakEvens.map((b) => Math.round(b))).toEqual([91, 109]);
  });

  it('scales by lot size', () => {
    const s = summarisePayoff([longCall(100, 5, 50)], range);
    expect(s.maxLoss).toBe(-250);
  });

  it('long futures: break-even at the contract price, loss bounded at price zero', () => {
    const s = summarisePayoff([{ type: 'long-futures', contractPrice: 500, lotSize: 100 }], [350, 650]);
    expect(s.breakEvens[0]).toBeCloseTo(500, 6);
    expect(s.maxLoss).toBe(-50000);
    expect(s.unboundedProfit).toBe(true);
  });

  it('break-even beyond the visible range is still found', () => {
    const s = summarisePayoff([longCall(100, 5)], [50, 102]);
    expect(s.breakEvens[0]).toBeCloseTo(105, 6);
  });

  it('empty legs give an empty summary without NaN', () => {
    const s = summarisePayoff([], range);
    expect(s.breakEvens).toEqual([]);
    expect(s.maxProfit === null || Number.isFinite(s.maxProfit)).toBe(true);
  });
});
