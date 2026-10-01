import { texMoney, texPlain } from '../../lib/explainer-format';
import type { ModelSeries } from '../types';

export type TvmMode = 'lump-fv' | 'lump-pv' | 'ordinary-annuity' | 'annuity-due' | 'perpetuity';
export type AnnuityTiming = 'ordinary' | 'due';

export interface TvmInputs {
  mode: TvmMode;
  amount: number;
  /** Annual rate as a fraction (0.08 = 8%). */
  rate: number;
  years: number;
  /** Compounding periods per year (lump-sum modes only). */
  compounding: number;
}

/** The chapter's worked example: $10,000 at 8% for 5 years, compounded annually. */
export const TVM_DEFAULTS: TvmInputs = { mode: 'lump-fv', amount: 10000, rate: 0.08, years: 5, compounding: 1 };

export function futureValue(pv: number, rate: number, years: number, m = 1): number {
  const k = Math.max(1, m);
  return pv * Math.pow(1 + rate / k, years * k);
}

export function presentValue(fv: number, rate: number, years: number, m = 1): number {
  const k = Math.max(1, m);
  return fv / Math.pow(1 + rate / k, years * k);
}

export function annuityPV(pmt: number, rate: number, n: number, timing: AnnuityTiming = 'ordinary'): number {
  const ordinary = rate === 0 ? pmt * n : (pmt * (1 - Math.pow(1 + rate, -n))) / rate;
  return timing === 'due' ? ordinary * (1 + rate) : ordinary;
}

export function annuityFV(pmt: number, rate: number, n: number, timing: AnnuityTiming = 'ordinary'): number {
  const ordinary = rate === 0 ? pmt * n : (pmt * (Math.pow(1 + rate, n) - 1)) / rate;
  return timing === 'due' ? ordinary * (1 + rate) : ordinary;
}

export function perpetuityPV(pmt: number, rate: number): number {
  if (pmt === 0) return 0;
  return rate > 0 ? pmt / rate : Infinity;
}

export interface TvmRow {
  label: string;
  value: number;
  kind: 'money' | 'percent';
}

const periods = (years: number) => Math.max(0, Math.round(years));
const timingOf = (mode: TvmMode): AnnuityTiming => (mode === 'annuity-due' ? 'due' : 'ordinary');

export function evaluateTvm(i: TvmInputs): { primary: TvmRow; rows: TvmRow[] } {
  const years = Math.max(0, i.years);
  switch (i.mode) {
    case 'lump-fv': {
      const fv = futureValue(i.amount, i.rate, years, i.compounding);
      return {
        primary: { label: 'Future value', value: fv, kind: 'money' },
        rows: [
          { label: 'Interest earned', value: fv - i.amount, kind: 'money' },
          { label: 'Effective annual rate', value: Math.pow(1 + i.rate / Math.max(1, i.compounding), Math.max(1, i.compounding)) - 1, kind: 'percent' },
        ],
      };
    }
    case 'lump-pv': {
      const pv = presentValue(i.amount, i.rate, years, i.compounding);
      return {
        primary: { label: 'Present value', value: pv, kind: 'money' },
        rows: [{ label: 'Discount applied', value: i.amount - pv, kind: 'money' }],
      };
    }
    case 'ordinary-annuity':
    case 'annuity-due': {
      const n = periods(years);
      const timing = timingOf(i.mode);
      const pv = annuityPV(i.amount, i.rate, n, timing);
      const fv = annuityFV(i.amount, i.rate, n, timing);
      const paid = i.amount * n;
      return {
        primary: { label: 'Present value of payments', value: pv, kind: 'money' },
        rows: [
          { label: 'Future value of payments', value: fv, kind: 'money' },
          { label: 'Total paid in', value: paid, kind: 'money' },
          { label: 'Interest component', value: fv - paid, kind: 'money' },
        ],
      };
    }
    case 'perpetuity': {
      return {
        primary: { label: 'Present value', value: perpetuityPV(i.amount, i.rate), kind: 'money' },
        rows: [{ label: 'Payment each year', value: i.amount, kind: 'money' }],
      };
    }
  }
}

export interface TvmChart {
  title: string;
  xLabel: string;
  yLabel: string;
  xKind: 'years' | 'percent';
  series: ModelSeries[];
  marker?: { x: number; label: string };
}

const STEPS = 60;
const grid = (end: number) => Array.from({ length: STEPS + 1 }, (_, k) => (end * k) / STEPS);
const finite = (v: number) => (Number.isFinite(v) ? v : 0);

export function tvmChart(i: TvmInputs): TvmChart {
  const years = Math.max(0, i.years);
  switch (i.mode) {
    case 'lump-fv':
      return {
        title: 'Growth of your deposit',
        xLabel: 'Years',
        yLabel: 'Balance',
        xKind: 'years',
        series: [
          { id: 'balance', label: 'Balance', tone: 'rust', points: grid(years).map((t) => [t, finite(futureValue(i.amount, i.rate, t, i.compounding))]) },
          { id: 'principal', label: 'Amount deposited', tone: 'muted', dashed: true, points: [[0, i.amount], [years, i.amount]] },
        ],
      };
    case 'lump-pv':
      return {
        title: 'Value of the target amount over time',
        xLabel: 'Years from today',
        yLabel: 'Value',
        xKind: 'years',
        series: [
          { id: 'value', label: 'Value today and onward', tone: 'rust', points: grid(years).map((t) => [t, finite(presentValue(i.amount, i.rate, Math.max(0, years - t), i.compounding))]) },
          { id: 'target', label: 'Target amount', tone: 'muted', dashed: true, points: [[0, i.amount], [years, i.amount]] },
        ],
      };
    case 'ordinary-annuity':
    case 'annuity-due': {
      const n = periods(years);
      const timing = timingOf(i.mode);
      return {
        title: 'Account balance as payments are made',
        xLabel: 'Payments made',
        yLabel: 'Balance',
        xKind: 'years',
        series: [
          { id: 'balance', label: 'Account balance', tone: 'rust', points: Array.from({ length: n + 1 }, (_, k) => [k, finite(annuityFV(i.amount, i.rate, k, timing))] as [number, number]) },
          { id: 'paid', label: 'Total paid in', tone: 'muted', dashed: true, points: Array.from({ length: n + 1 }, (_, k) => [k, i.amount * k] as [number, number]) },
        ],
      };
    }
    case 'perpetuity': {
      const rates = Array.from({ length: 60 }, (_, k) => 0.005 * (k + 1));
      return {
        title: 'Present value of a perpetuity at different discount rates',
        xLabel: 'Discount rate (%)',
        yLabel: 'Present value',
        xKind: 'percent',
        series: [{ id: 'pv', label: 'Present value', tone: 'rust', points: rates.map((r) => [r * 100, finite(perpetuityPV(i.amount, r))] as [number, number]) }],
        marker: { x: Math.min(30, Math.max(0.5, i.rate * 100)), label: 'Your rate' },
      };
    }
  }
}

export function tvmFormulaTex(i: TvmInputs, currency = '$'): string {
  const money = (v: number) => texMoney(v, currency);
  const r = texPlain(i.rate, 4);
  const years = Math.max(0, i.years);
  const n = periods(years);
  switch (i.mode) {
    case 'lump-fv': {
      const m = i.compounding;
      const fv = futureValue(i.amount, i.rate, years, m);
      return `FV = PV\\left(1+\\frac{r}{m}\\right)^{nm} = ${money(i.amount)}\\left(1+\\frac{${r}}{${m}}\\right)^{${texPlain(years)}\\times ${m}} = ${money(fv)}`;
    }
    case 'lump-pv': {
      const m = i.compounding;
      const pv = presentValue(i.amount, i.rate, years, m);
      return `PV = \\frac{FV}{\\left(1+\\frac{r}{m}\\right)^{nm}} = \\frac{${money(i.amount)}}{\\left(1+\\frac{${r}}{${m}}\\right)^{${texPlain(years)}\\times ${m}}} = ${money(pv)}`;
    }
    case 'ordinary-annuity': {
      const pv = annuityPV(i.amount, i.rate, n);
      if (i.rate === 0) return `PV = PMT \\times n = ${money(i.amount)} \\times ${n} = ${money(pv)}`;
      return `PV = PMT\\left[\\frac{1-(1+r)^{-n}}{r}\\right] = ${money(i.amount)}\\left[\\frac{1-(1+${r})^{-${n}}}{${r}}\\right] = ${money(pv)}`;
    }
    case 'annuity-due': {
      const ordinary = annuityPV(i.amount, i.rate, n);
      const due = annuityPV(i.amount, i.rate, n, 'due');
      return `PV_{\\text{due}} = PV_{\\text{ordinary}}(1+r) = ${money(ordinary)} \\times (1+${r}) = ${money(due)}`;
    }
    case 'perpetuity': {
      if (i.rate <= 0) return `PV = \\frac{PMT}{r} \\to \\infty \\quad (r = 0)`;
      return `PV = \\frac{PMT}{r} = \\frac{${money(i.amount)}}{${r}} = ${money(perpetuityPV(i.amount, i.rate))}`;
    }
  }
}
