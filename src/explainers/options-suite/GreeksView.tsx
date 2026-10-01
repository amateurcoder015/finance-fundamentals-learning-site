import React, { useState } from 'react';
import { Slider } from '../../components/explainer/kit/Slider';
import { Readout } from '../../components/explainer/kit/Readout';
import { FormulaBlock } from '../../components/explainer/kit/FormulaBlock';
import { ChartFrame } from '../../components/explainer/kit/ChartFrame';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { formatMoney, formatNumber } from '../../lib/explainer-format';
import { bsFormulaTex, bsGreeks, bsPrice, type BsInputs, type OptionType } from './model';

const REFERENCE: BsInputs = { spot: 100, strike: 100, rate: 0.05, vol: 0.2, time: 1 };
type ChartKind = 'price' | 'delta' | 'gamma';

export function GreeksView({ currency }: { currency: string }) {
  const [i, setI] = useState<BsInputs>(REFERENCE);
  const [type, setType] = useState<OptionType>('call');
  const [chart, setChart] = useState<ChartKind>('price');
  const set = (patch: Partial<BsInputs>) => setI((p) => ({ ...p, ...patch }));

  const price = bsPrice(i, type);
  const intrinsicNow = type === 'call' ? Math.max(0, i.spot - i.strike) : Math.max(0, i.strike - i.spot);
  const timeValue = price - intrinsicNow;
  const g = bsGreeks(i, type);

  const spots = Array.from({ length: 61 }, (_, k) => i.strike * 0.5 + (i.strike * k) / 60);
  const at = (s: number) => ({ ...i, spot: s });
  const priceSeries = spots.map((s) => [s, bsPrice(at(s), type)] as [number, number]);
  const intrinsic = spots.map((s) => [s, type === 'call' ? Math.max(0, s - i.strike) : Math.max(0, i.strike - s)] as [number, number]);
  const deltaSeries = spots.map((s) => [s, bsGreeks(at(s), type).delta] as [number, number]);
  const gammaSeries = spots.map((s) => [s, bsGreeks(at(s), type).gamma] as [number, number]);

  const kinds: Array<{ id: ChartKind; label: string }> = [
    { id: 'price', label: 'Price' },
    { id: 'delta', label: 'Delta' },
    { id: 'gamma', label: 'Gamma' },
  ];

  return (
    <div className="space-y-6">
      <ExampleBar examples={[{ label: `Textbook example: ${formatMoney(100, currency, 0)} spot and strike, 20% volatility, 1 year`, apply: () => { setI(REFERENCE); setType('call'); setChart('price'); } }]} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div role="radiogroup" aria-label="Option type" className="flex gap-2">
            {(['call', 'put'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                onClick={() => setType(t)}
                className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border px-4 font-sans text-sm font-bold capitalize ${
                  type === t ? 'border-ink bg-ink text-on-accent' : 'border-rule bg-paper text-ink hover:border-ink/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Slider label="Spot price (S)" value={i.spot} min={1} max={300} step={1} onChange={(spot) => set({ spot })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Strike price (K)" value={i.strike} min={1} max={300} step={1} onChange={(strike) => set({ strike })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Risk-free rate (r)" value={Number((i.rate * 100).toFixed(4))} min={0} max={15} step={0.1} onChange={(v) => set({ rate: v / 100 })} format={(v) => v.toFixed(1)} suffix="%" />
          <Slider label="Volatility (σ)" value={Number((i.vol * 100).toFixed(4))} min={1} max={80} step={1} onChange={(v) => set({ vol: v / 100 })} suffix="%" />
          <Slider label="Time to expiry (T)" value={i.time} min={0.01} max={2} step={0.01} onChange={(time) => set({ time })} format={(v) => v.toFixed(2)} suffix=" yr" />
        </div>

        <div className="space-y-4">
          <div role="radiogroup" aria-label="Chart" className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button
                key={k.id}
                type="button"
                role="radio"
                aria-checked={chart === k.id}
                onClick={() => setChart(k.id)}
                className={`inline-flex min-h-[44px] items-center rounded-full border px-4 font-sans text-sm font-semibold ${
                  chart === k.id ? 'border-ink bg-ink text-on-accent' : 'border-rule bg-paper text-ink hover:border-ink/40'
                }`}
              >
                {k.label} against spot
              </button>
            ))}
          </div>
          {chart === 'price' && (
            <ChartFrame
              series={[
                { id: 'price', label: `${type} price`, tone: 'rust', points: priceSeries },
                { id: 'intrinsic', label: 'Intrinsic value', tone: 'muted', dashed: true, points: intrinsic },
              ]}
              xLabel="Spot price"
              yLabel="Option price"
              formatX={(v) => formatNumber(v, 0)}
              formatY={(v) => formatMoney(v, currency)}
              markers={[{ x: i.spot, label: 'Spot', tone: 'ink' }]}
              includeZeroY
              summary={`The ${type} is worth ${formatMoney(price, currency)} at a spot of ${formatMoney(i.spot, currency, 0)}, against an intrinsic value of ${formatMoney(intrinsicNow, currency)}: ${timeValue >= 0.005 ? `a time value of ${formatMoney(timeValue, currency)}` : timeValue <= -0.005 ? `${formatMoney(-timeValue, currency)} below intrinsic value, which a deep in-the-money European put can be` : 'almost no time value'}.`}
            />
          )}
          {chart === 'delta' && (
            <ChartFrame
              series={[{ id: 'delta', label: `${type} delta`, tone: 'rust', points: deltaSeries }]}
              xLabel="Spot price"
              yLabel="Delta"
              formatX={(v) => formatNumber(v, 0)}
              formatY={(v) => formatNumber(v, 2)}
              markers={[{ x: i.spot, label: 'Spot', tone: 'ink' }]}
              includeZeroY
              summary={`Delta is ${formatNumber(g.delta, 3)} at the current spot. As spot rises it climbs ${type === 'call' ? 'from 0 toward 1' : 'from -1 toward 0'}.`}
            />
          )}
          {chart === 'gamma' && (
            <ChartFrame
              series={[{ id: 'gamma', label: 'Gamma', tone: 'rust', points: gammaSeries }]}
              xLabel="Spot price"
              yLabel="Gamma"
              formatX={(v) => formatNumber(v, 0)}
              formatY={(v) => formatNumber(v, 3)}
              markers={[{ x: i.spot, label: 'Spot', tone: 'ink' }]}
              includeZeroY
              summary={`Gamma is ${formatNumber(g.gamma, 4)} at the current spot and peaks close to the strike, where the option is most sensitive to spot.`}
            />
          )}
        </div>
      </div>

      <Readout
        items={[
          { label: `${type === 'call' ? 'Call' : 'Put'} price`, value: formatMoney(price, currency), tone: 'accent' },
          { label: 'Delta', value: formatNumber(g.delta, 4) },
          { label: 'Gamma', value: formatNumber(g.gamma, 5) },
          { label: 'Theta (per day)', value: formatMoney(g.theta / 365, currency, 4), hint: 'Time decay each calendar day' },
          { label: 'Vega (per 1 vol point)', value: formatMoney(g.vega / 100, currency, 4) },
          { label: 'Rho (per 1% rate)', value: formatMoney(g.rho / 100, currency, 4) },
        ]}
      />
      <FormulaBlock tex={bsFormulaTex(i, type, currency)} />
    </div>
  );
}
