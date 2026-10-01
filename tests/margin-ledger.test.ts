import { describe, it, expect } from 'vitest';
import { MARGIN_EXAMPLE, buildLedger, type LedgerInputs } from '../src/explainers/margin-ledger/model';

describe('chapter worked example', () => {
  const rows = buildLedger(MARGIN_EXAMPLE);

  it('has the entry row plus one row per settlement price', () => {
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ day: 0, price: 50, endBalance: 500, status: 'opened' });
  });
  it('Day 1: price +2 gives +$200 and a $700 balance', () => {
    expect(rows[1]).toMatchObject({ day: 1, price: 52, change: 2, mtm: 200, deposit: 0, endBalance: 700, marginCall: 0, status: 'open' });
  });
  it('Day 2: price -5 gives -$500, balance $200, breaching maintenance with a $300 call', () => {
    expect(rows[2]).toMatchObject({ day: 2, price: 47, change: -5, mtm: -500, endBalance: 200, marginCall: 300, status: 'call' });
  });
  it('Day 3: the $300 variation margin is deposited, then +$200 gives $700', () => {
    expect(rows[3]).toMatchObject({ day: 3, price: 49, change: 2, mtm: 200, deposit: 300, endBalance: 700, marginCall: 0, status: 'open' });
  });
});

describe('edge cases', () => {
  const base: LedgerInputs = { entryPrice: 50, prices: [], lotSize: 100, side: 'long', initialMargin: 500, maintenanceMargin: 350, meetCalls: true };

  it('no price path gives just the entry row', () => {
    expect(buildLedger(base)).toHaveLength(1);
  });
  it('no price change means no cash flow and no call', () => {
    const r = buildLedger({ ...base, prices: [50] });
    expect(r[1]).toMatchObject({ mtm: 0, endBalance: 500, marginCall: 0, status: 'open' });
  });
  it('a call can occur on the first day', () => {
    const r = buildLedger({ ...base, prices: [46] });
    expect(r[1]).toMatchObject({ mtm: -400, endBalance: 100, marginCall: 400, status: 'call' });
  });
  it('a balance exactly at maintenance does not trigger a call', () => {
    const r = buildLedger({ ...base, prices: [48.5] });
    expect(r[1].endBalance).toBe(350);
    expect(r[1].marginCall).toBe(0);
  });
  it('a short position gains when the price falls', () => {
    const r = buildLedger({ ...base, side: 'short', prices: [48] });
    expect(r[1]).toMatchObject({ mtm: 200, endBalance: 700 });
  });
  it('a short position faces a call when the price rises', () => {
    const r = buildLedger({ ...base, side: 'short', prices: [55] });
    expect(r[1]).toMatchObject({ mtm: -500, endBalance: 0, marginCall: 500, status: 'call' });
  });
  it('the balance can go negative when losses exceed the margin', () => {
    const r = buildLedger({ ...base, prices: [40] });
    expect(r[1].endBalance).toBe(-500);
    expect(r[1].marginCall).toBe(1000);
  });
  it('an unmet call liquidates the position the next day and stops the ledger', () => {
    const r = buildLedger({ ...base, prices: [47, 49, 52], meetCalls: false });
    expect(r).toHaveLength(3);
    expect(r[1].status).toBe('call');
    expect(r[2].status).toBe('liquidated');
    expect(r[2].mtm).toBe(0);
    expect(r[2].endBalance).toBe(r[1].endBalance);
  });
  it('never produces NaN even with a zero lot size or zero margins', () => {
    const r = buildLedger({ ...base, lotSize: 0, initialMargin: 0, maintenanceMargin: 0, prices: [60, 40] });
    for (const row of r) for (const v of [row.price, row.change, row.mtm, row.deposit, row.endBalance, row.marginCall]) expect(Number.isNaN(v)).toBe(false);
  });
});

describe('robustness', () => {
  const base: LedgerInputs = { entryPrice: 50, prices: [], lotSize: 100, side: 'long', initialMargin: 500, maintenanceMargin: 350, meetCalls: true };
  const finite = (r: ReturnType<typeof buildLedger>) =>
    r.every((row) => [row.price, row.change, row.mtm, row.deposit, row.endBalance, row.marginCall].every(Number.isFinite));

  it('zero margins and zero lot give exact zeros, no call', () => {
    const r = buildLedger({ ...base, lotSize: 0, initialMargin: 0, maintenanceMargin: 0, prices: [60, 40] });
    expect(r).toHaveLength(3);
    expect(r[1]).toMatchObject({ mtm: 0, endBalance: 0, marginCall: 0, status: 'open' });
    expect(r[2]).toMatchObject({ mtm: 0, endBalance: 0, marginCall: 0, status: 'open' });
  });
  it('negative equity compounds: the unmet-then-met call restores to initial margin', () => {
    const r = buildLedger({ ...base, prices: [40, 40] });
    expect(r[1]).toMatchObject({ endBalance: -500, marginCall: 1000 });
    expect(r[2]).toMatchObject({ deposit: 1000, mtm: 0, endBalance: 500, marginCall: 0, status: 'open' });
  });
  it('huge price moves stay finite', () => {
    expect(finite(buildLedger({ ...base, prices: [1e9, -1e9, 0] }))).toBe(true);
    expect(finite(buildLedger({ ...base, side: 'short', prices: [1e12, 1e-12] }))).toBe(true);
  });
  it('non-finite inputs are sanitised, not propagated', () => {
    expect(finite(buildLedger({ ...base, prices: [NaN, Infinity, 52] }))).toBe(true);
  });
  it('a call on the final day is reported but nothing follows', () => {
    const r = buildLedger({ ...base, prices: [47], meetCalls: false });
    expect(r).toHaveLength(2);
    expect(r[1]).toMatchObject({ status: 'call', marginCall: 300 });
  });
});
