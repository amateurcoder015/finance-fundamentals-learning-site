import React, { useState } from 'react';
import { ExplainerFrame } from '../../components/explainer/kit/ExplainerFrame';
import { Slider } from '../../components/explainer/kit/Slider';
import { Readout, type ReadoutItem } from '../../components/explainer/kit/Readout';
import { FormulaBlock } from '../../components/explainer/kit/FormulaBlock';
import { ChartFrame } from '../../components/explainer/kit/ChartFrame';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { formatMoney, formatNumber, formatPercent } from '../../lib/explainer-format';
import type { ExplainerProps } from '../types';
import { TVM_DEFAULTS, evaluateTvm, tvmChart, tvmFormulaTex, type TvmInputs, type TvmMode, type TvmRow } from './model';

const MODES: Array<{ id: TvmMode; label: string }> = [
  { id: 'lump-fv', label: 'Future value of a deposit' },
  { id: 'lump-pv', label: 'Present value of a target' },
  { id: 'ordinary-annuity', label: 'Annuity (end of year)' },
  { id: 'annuity-due', label: 'Annuity due (start of year)' },
  { id: 'perpetuity', label: 'Perpetuity' },
];

const COMPOUNDING = [
  { value: 1, label: 'Annually' },
  { value: 2, label: 'Semi-annually' },
  { value: 4, label: 'Quarterly' },
  { value: 12, label: 'Monthly' },
  { value: 365, label: 'Daily' },
];

const AMOUNT_LABEL: Record<TvmMode, string> = {
  'lump-fv': 'Amount deposited today (PV)',
  'lump-pv': 'Target amount (FV)',
  'ordinary-annuity': 'Payment each year',
  'annuity-due': 'Payment each year',
  perpetuity: 'Payment each year',
};

function Inner({ currency }: { currency: string }) {
  const [inputs, setInputs] = useState<TvmInputs>(TVM_DEFAULTS);
  const set = (patch: Partial<TvmInputs>) => setInputs((p) => ({ ...p, ...patch }));
  const result = evaluateTvm(inputs);
  const chart = tvmChart(inputs);
  const isLump = inputs.mode === 'lump-fv' || inputs.mode === 'lump-pv';
  const isPerpetuity = inputs.mode === 'perpetuity';

  const fmt = (row: TvmRow) => (row.kind === 'percent' ? formatPercent(row.value) : formatMoney(row.value, currency));
  const items: ReadoutItem[] = [
    { label: result.primary.label, value: fmt(result.primary), tone: 'accent' },
    ...result.rows.map((row) => ({ label: row.label, value: fmt(row) })),
  ];

  const first = chart.series[0].points[0];
  const lastPoints = chart.series[0].points;
  const last = lastPoints[lastPoints.length - 1];
  const summary = `${chart.title}. Starts at ${formatMoney(first[1], currency)} and ends at ${formatMoney(last[1], currency)}.`;
  const xFormat = chart.xKind === 'percent' ? (v: number) => `${formatNumber(v, 1)}%` : (v: number) => formatNumber(v, v % 1 === 0 ? 0 : 1);

  return (
    <div className="space-y-6">
      <ExampleBar examples={[{ label: 'Chapter example: $10,000 at 8% for 5 years', apply: () => setInputs(TVM_DEFAULTS) }]} />

      <div role="radiogroup" aria-label="What do you want to find?" className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={inputs.mode === m.id}
            onClick={() => set({ mode: m.id })}
            className={`inline-flex min-h-[44px] items-center rounded-full border px-4 font-sans text-sm font-semibold ${
              inputs.mode === m.id ? 'border-ink bg-ink text-on-accent' : 'border-rule bg-paper text-ink hover:border-ink/40'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Slider label={AMOUNT_LABEL[inputs.mode]} value={inputs.amount} min={0} max={100000} step={100} onChange={(amount) => set({ amount })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Annual interest rate" value={Number((inputs.rate * 100).toFixed(4))} min={0} max={30} step={0.1} onChange={(v) => set({ rate: v / 100 })} format={(v) => v.toFixed(1)} suffix="%" />
          {!isPerpetuity && (
            <Slider label={isLump ? 'Years' : 'Number of yearly payments'} value={inputs.years} min={0} max={40} step={1} onChange={(years) => set({ years })} />
          )}
          {isLump && (
            <div className="space-y-1.5">
              <label htmlFor="tvm-compounding" className="font-sans text-sm font-semibold text-ink">Compounding</label>
              <select
                id="tvm-compounding"
                value={inputs.compounding}
                onChange={(e) => set({ compounding: Number(e.target.value) })}
                className="min-h-[44px] w-full rounded-lg border border-rule bg-paper px-3 font-sans text-sm text-ink"
              >
                {COMPOUNDING.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <ChartFrame
          series={chart.series}
          xLabel={chart.xLabel}
          yLabel={chart.yLabel}
          summary={summary}
          formatX={xFormat}
          formatY={(v) => formatMoney(v, currency, 0)}
          markers={chart.marker ? [{ x: chart.marker.x, label: chart.marker.label, tone: 'rust' }] : []}
          includeZeroY
        />
      </div>

      <Readout items={items} />
      <FormulaBlock tex={tvmFormulaTex(inputs, currency)} />
    </div>
  );
}

export default function TimeValueOfMoney({ currency = '$' }: ExplainerProps) {
  return (
    <ExplainerFrame title="Time value of money" description="Change the amount, rate and time and watch the value move. It opens on the chapter's worked example.">
      <Inner currency={currency} />
    </ExplainerFrame>
  );
}
