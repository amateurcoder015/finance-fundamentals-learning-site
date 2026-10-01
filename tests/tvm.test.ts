import { describe, it, expect } from 'vitest';
import {
  TVM_DEFAULTS,
  annuityFV,
  annuityPV,
  evaluateTvm,
  futureValue,
  perpetuityPV,
  presentValue,
  tvmChart,
  tvmFormulaTex,
  type TvmInputs,
} from '../src/explainers/time-value-of-money/model';

describe('lump sum (chapter worked example)', () => {
  it('$10,000 at 8% for 5 years compounded annually is $14,693.28', () => {
    expect(futureValue(10000, 0.08, 5)).toBeCloseTo(14693.28, 2);
  });
  it('discounting reverses compounding', () => {
    expect(presentValue(14693.280768, 0.08, 5)).toBeCloseTo(10000, 4);
  });
  it('more frequent compounding gives more: $1,000 at 12% quarterly for 1 year', () => {
    expect(futureValue(1000, 0.12, 1, 4)).toBeCloseTo(1125.5088, 4);
  });
  it('zero years or zero rate leaves the amount unchanged', () => {
    expect(futureValue(500, 0.08, 0)).toBe(500);
    expect(futureValue(500, 0, 10)).toBe(500);
  });
});

describe('annuities', () => {
  it('ordinary annuity PV and FV (formula check: $1,000, 5%, 3 periods)', () => {
    expect(annuityPV(1000, 0.05, 3)).toBeCloseTo(2723.2480, 3);
    expect(annuityFV(1000, 0.05, 3)).toBeCloseTo(3152.5, 3);
  });
  it('annuity due is the ordinary value times (1 + r)', () => {
    expect(annuityPV(1000, 0.05, 3, 'due')).toBeCloseTo(2723.248 * 1.05, 3);
    expect(annuityFV(1000, 0.05, 3, 'due')).toBeCloseTo(3152.5 * 1.05, 3);
  });
  it('at a zero rate annuity formulas fall back to payment times periods', () => {
    expect(annuityPV(1000, 0, 4)).toBe(4000);
    expect(annuityFV(1000, 0, 4)).toBe(4000);
    expect(Number.isFinite(annuityPV(1000, 0, 4, 'due'))).toBe(true);
  });
  it('zero periods is worth nothing', () => {
    expect(annuityPV(1000, 0.05, 0)).toBe(0);
    expect(annuityFV(1000, 0.05, 0)).toBe(0);
  });
});

describe('perpetuity', () => {
  it('is payment divided by rate', () => {
    expect(perpetuityPV(1000, 0.05)).toBeCloseTo(20000, 6);
  });
  it('is infinite (not NaN) at a zero rate', () => {
    expect(perpetuityPV(1000, 0)).toBe(Infinity);
  });
});

describe('evaluateTvm', () => {
  it('lump-fv reproduces the chapter numbers', () => {
    const r = evaluateTvm(TVM_DEFAULTS);
    expect(r.primary.label).toBe('Future value');
    expect(r.primary.value).toBeCloseTo(14693.28, 2);
    const interest = r.rows.find((x) => x.label === 'Interest earned');
    expect(interest?.value).toBeCloseTo(4693.28, 2);
  });
  it('lump-pv returns the present value of a target amount', () => {
    const r = evaluateTvm({ ...TVM_DEFAULTS, mode: 'lump-pv', amount: 14693.28 });
    expect(r.primary.label).toBe('Present value');
    expect(r.primary.value).toBeCloseTo(10000, 1);
  });
  it('annuity rows include total payments and the interest component', () => {
    const r = evaluateTvm({ mode: 'ordinary-annuity', amount: 1000, rate: 0.05, years: 3, compounding: 1 });
    expect(r.rows.find((x) => x.label === 'Total paid in')?.value).toBe(3000);
    expect(r.rows.find((x) => x.label === 'Interest component')?.value).toBeCloseTo(152.5, 3);
  });
  it('never returns NaN for slider extremes', () => {
    const modes = ['lump-fv', 'lump-pv', 'ordinary-annuity', 'annuity-due', 'perpetuity'] as const;
    for (const mode of modes) {
      for (const rate of [0, 0.001, 0.3]) {
        for (const years of [0, 1, 40]) {
          for (const compounding of [1, 365]) {
            const r = evaluateTvm({ mode, amount: 10000, rate, years, compounding } as TvmInputs);
            for (const row of [r.primary, ...r.rows]) expect(Number.isNaN(row.value)).toBe(false);
          }
        }
      }
    }
  });
});

describe('tvmChart', () => {
  it('lump-fv starts at the deposit and ends at the future value', () => {
    const c = tvmChart(TVM_DEFAULTS);
    const balance = c.series.find((s) => s.id === 'balance')!;
    expect(balance.points[0]).toEqual([0, 10000]);
    const last = balance.points[balance.points.length - 1];
    expect(last[0]).toBeCloseTo(5, 6);
    expect(last[1]).toBeCloseTo(14693.28, 2);
    expect(c.xKind).toBe('years');
  });
  it('annuity chart has one point per period plus the start', () => {
    const c = tvmChart({ mode: 'ordinary-annuity', amount: 1000, rate: 0.05, years: 3, compounding: 1 });
    expect(c.series[0].points).toHaveLength(4);
  });
  it('perpetuity chart plots present value against rate and marks the current rate', () => {
    const c = tvmChart({ mode: 'perpetuity', amount: 1000, rate: 0.05, years: 0, compounding: 1 });
    expect(c.xKind).toBe('percent');
    expect(c.marker?.x).toBeCloseTo(5, 6);
  });
  it('contains no NaN or infinite y values at extremes', () => {
    for (const mode of ['lump-fv', 'lump-pv', 'ordinary-annuity', 'annuity-due', 'perpetuity'] as const) {
      const c = tvmChart({ mode, amount: 10000, rate: 0, years: 0, compounding: 365 });
      for (const s of c.series) for (const [x, y] of s.points) {
        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(y)).toBe(true);
      }
    }
  });
});

describe('tvmFormulaTex', () => {
  it('substitutes the learner numbers into the lump-sum formula', () => {
    const tex = tvmFormulaTex(TVM_DEFAULTS);
    expect(tex).toContain('10{,}000.00');
    expect(tex).toContain('14{,}693.28');
    expect(tex).toContain('0.08');
  });
  it('handles a zero-rate annuity and perpetuity without dividing by zero', () => {
    expect(tvmFormulaTex({ mode: 'ordinary-annuity', amount: 1000, rate: 0, years: 4, compounding: 1 })).not.toContain('NaN');
    expect(tvmFormulaTex({ mode: 'perpetuity', amount: 1000, rate: 0, years: 0, compounding: 1 })).toContain('\\infty');
  });
});

describe('review fixes', () => {
  const modes = ['lump-fv', 'lump-pv', 'ordinary-annuity', 'annuity-due', 'perpetuity'] as const;
  const rates = [0, 0.001, 0.3];
  const yearsList = [0, 1, 40];
  const comps = [1, 365];
  const amounts = [0, 10000, 100000];

  it('perpetuity marker stays inside the plotted range', () => {
    for (const rate of [0, 0.05, 0.3]) {
      const c = tvmChart({ mode: 'perpetuity', amount: 1000, rate, years: 0, compounding: 1 });
      const xs = c.series[0].points.map((p) => p[0]);
      expect(c.marker!.x).toBeGreaterThanOrEqual(Math.min(...xs));
      expect(c.marker!.x).toBeLessThanOrEqual(Math.max(...xs));
      expect(c.marker!.label).toBe('Your rate');
    }
    const c30 = tvmChart({ mode: 'perpetuity', amount: 1000, rate: 0.3, years: 0, compounding: 1 });
    expect(Math.max(...c30.series[0].points.map((p) => p[0]))).toBeCloseTo(30, 6);
    const c0 = tvmChart({ mode: 'perpetuity', amount: 1000, rate: 0, years: 0, compounding: 1 });
    expect(c0.marker!.x).toBeCloseTo(0.5, 6);
  });

  it('a zero payment perpetuity is worth 0 at any rate', () => {
    expect(perpetuityPV(0, 0)).toBe(0);
    expect(perpetuityPV(0, 0.05)).toBe(0);
    expect(perpetuityPV(1000, 0)).toBe(Infinity);
    expect(evaluateTvm({ mode: 'perpetuity', amount: 0, rate: 0, years: 0, compounding: 1 }).primary.value).toBe(0);
  });

  it('evaluateTvm sweep: no NaN, finite except positive perpetuity at zero rate', () => {
    for (const mode of modes) for (const rate of rates) for (const years of yearsList)
      for (const compounding of comps) for (const amount of amounts) {
        const r = evaluateTvm({ mode, amount, rate, years, compounding });
        for (const row of [r.primary, ...r.rows]) {
          expect(Number.isNaN(row.value)).toBe(false);
          const documented = row === r.primary && mode === 'perpetuity' && amount > 0 && rate === 0;
          if (documented) expect(row.value).toBe(Infinity);
          else expect(Number.isFinite(row.value)).toBe(true);
        }
      }
  });

  it('tvmChart sweep: every point finite, every series non-empty', () => {
    for (const mode of modes) for (const rate of rates) for (const years of yearsList)
      for (const compounding of comps) for (const amount of amounts) {
        const c = tvmChart({ mode, amount, rate, years, compounding });
        for (const s of c.series) {
          expect(s.points.length).toBeGreaterThan(0);
          for (const [x, y] of s.points) {
            expect(Number.isFinite(x)).toBe(true);
            expect(Number.isFinite(y)).toBe(true);
          }
        }
      }
  });

  it('tvmFormulaTex for lump-pv and annuity-due', () => {
    const pv = tvmFormulaTex({ mode: 'lump-pv', amount: 14693.28, rate: 0.08, years: 5, compounding: 1 });
    expect(pv).toContain('14{,}693.28');
    expect(pv).toContain('10{,}000.00');
    expect(pv).not.toContain('NaN');
    const due = tvmFormulaTex({ mode: 'annuity-due', amount: 1000, rate: 0.05, years: 3, compounding: 1 });
    expect(due).toContain('due');
    expect(due).not.toContain('NaN');
  });

  it('tvmChart for lump-pv and annuity-due', () => {
    const i: TvmInputs = { mode: 'lump-pv', amount: 14693.28, rate: 0.08, years: 5, compounding: 1 };
    const pts = tvmChart(i).series[0].points;
    expect(pts[0][0]).toBe(0);
    expect(pts[0][1]).toBeCloseTo(presentValue(14693.28, 0.08, 5), 6);
    expect(pts[pts.length - 1][1]).toBeCloseTo(14693.28, 6);
    const due = tvmChart({ mode: 'annuity-due', amount: 1000, rate: 0.05, years: 3, compounding: 1 });
    expect(due.series[0].points).toHaveLength(4);
  });

  it('evaluateTvm extra rows', () => {
    const pv = evaluateTvm({ mode: 'lump-pv', amount: 14693.28, rate: 0.08, years: 5, compounding: 1 });
    expect(pv.rows.find((x) => x.label === 'Discount applied')?.value).toBeCloseTo(4693.28, 1);
    const fv = evaluateTvm({ ...TVM_DEFAULTS, compounding: 12 });
    expect(fv.rows.find((x) => x.label === 'Effective annual rate')!.value).toBeGreaterThan(0.08);
  });

  it('non-positive compounding is clamped to 1', () => {
    expect(Number.isFinite(futureValue(100, 0.1, 1, 0))).toBe(true);
    expect(futureValue(100, 0.1, 1, 0)).toBe(futureValue(100, 0.1, 1, 1));
  });
});
