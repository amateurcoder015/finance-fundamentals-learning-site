import React, { useState } from 'react';
import { ExplainerFrame } from '../../components/explainer/kit/ExplainerFrame';
import { Slider } from '../../components/explainer/kit/Slider';
import { Readout } from '../../components/explainer/kit/Readout';
import { FormulaBlock } from '../../components/explainer/kit/FormulaBlock';
import { ChartFrame } from '../../components/explainer/kit/ChartFrame';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { Tabs } from '../../components/explainer/kit/Tabs';
import { formatMoney, formatNumber } from '../../lib/explainer-format';
import type { ExplainerProps } from '../types';
import {
  FUTURES_EXAMPLES,
  basisSpotMinusFutures,
  convergenceSeries,
  curveByExpiry,
  futuresFormulaTex,
  futuresPrice,
  marketStructure,
} from './model';

interface State {
  spot: number;
  rate: number;
  carryYield: number;
  years: number;
}

const toState = (e: (typeof FUTURES_EXAMPLES)[number]): State => ({ spot: e.spot, rate: e.rate, carryYield: e.carryYield, years: e.years });
const STRUCTURE_TEXT = { contango: 'Contango (F > S)', backwardation: 'Backwardation (F < S)', flat: 'Flat (F = S)' } as const;

function Inner({ currency }: { currency: string }) {
  const [s, setS] = useState<State>(toState(FUTURES_EXAMPLES[0]));
  const [view, setView] = useState<'curve' | 'convergence'>('convergence');
  const set = (patch: Partial<State>) => setS((p) => ({ ...p, ...patch }));

  const f = futuresPrice(s.spot, s.rate, s.carryYield, s.years);
  const basis = basisSpotMinusFutures(s.spot, f);
  // Half a cent: never label contango/backwardation while the displayed basis is $0.00.
  const structure = marketStructure(s.spot, f, 0.005);

  const curve = curveByExpiry(s.spot, s.rate, s.carryYield, Math.max(s.years, 0.5, 2));
  const conv = convergenceSeries(s.spot, s.rate, s.carryYield, s.years);
  const net = s.rate - s.carryYield;
  const netPct = formatNumber(net * 100, 1);
  const direction = Math.abs(net) < 1e-9 ? 'stay flat' : net > 0 ? 'rise' : 'fall';

  return (
    <div className="space-y-6">
      <ExampleBar examples={FUTURES_EXAMPLES.map((e) => ({ label: e.label, apply: () => setS(toState(e)) }))} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Slider label="Spot price (S)" value={s.spot} min={1} max={500} step={1} onChange={(spot) => set({ spot })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Risk-free rate (r)" value={Number((s.rate * 100).toFixed(4))} min={0} max={15} step={0.1} onChange={(v) => set({ rate: v / 100 })} format={(v) => v.toFixed(1)} suffix="%" />
          <Slider label="Dividend or carry yield (q)" value={Number((s.carryYield * 100).toFixed(4))} min={0} max={15} step={0.1} onChange={(v) => set({ carryYield: v / 100 })} format={(v) => v.toFixed(1)} suffix="%" />
          <Slider label="Time to expiry (T)" value={Number((s.years * 12).toFixed(4))} min={0} max={24} step={1} onChange={(v) => set({ years: v / 12 })} suffix=" months" />
        </div>

        <Tabs
          tabs={[
            { id: 'convergence', label: 'Convergence to spot' },
            { id: 'curve', label: 'Price by expiry' },
          ]}
          active={view}
          onChange={(id) => setView(id as 'curve' | 'convergence')}
        >
          {view === 'convergence' ? (
            <ChartFrame
              series={[
                { id: 'futures', label: 'Futures price', tone: 'rust', points: conv },
                { id: 'spot', label: 'Spot price', tone: 'muted', dashed: true, points: [[0, s.spot], [Math.max(s.years, 0), s.spot]] },
              ]}
              xLabel="Years elapsed"
              yLabel="Price"
              formatX={(v) => formatNumber(v, 2)}
              formatY={(v) => formatMoney(v, currency)}
              summary={`With spot held at ${formatMoney(s.spot, currency)}, the futures price moves from ${formatMoney(f, currency)} to ${formatMoney(s.spot, currency)} at expiry: the basis shrinks to zero.`}
            />
          ) : (
            <ChartFrame
              series={[
                { id: 'futures', label: 'Futures price', tone: 'rust', points: curve },
                { id: 'spot', label: 'Spot price', tone: 'muted', dashed: true, points: [[0, s.spot], [curve[curve.length - 1][0], s.spot]] },
              ]}
              xLabel="Time to expiry (years)"
              yLabel="Price"
              markers={s.years > 0 ? [{ x: s.years, label: 'Your expiry', tone: 'ink' }] : []}
              formatX={(v) => formatNumber(v, 2)}
              formatY={(v) => formatMoney(v, currency)}
              summary={`Futures prices ${direction} with time to expiry because the net cost of carry (r minus q) is ${netPct}% a year.`}
            />
          )}
        </Tabs>
      </div>

      <Readout
        items={[
          { label: 'Futures price (F)', value: formatMoney(f, currency), tone: 'accent' },
          { label: 'Basis (S − F)', value: formatMoney(basis, currency), tone: basis < 0 ? 'negative' : 'positive' },
          { label: 'Market structure', value: STRUCTURE_TEXT[structure] },
        ]}
      />
      <FormulaBlock tex={futuresFormulaTex(s.spot, s.rate, s.carryYield, s.years, currency)} />
    </div>
  );
}

export default function FuturesPricing({ currency = '$' }: ExplainerProps) {
  return (
    <ExplainerFrame title="Futures pricing and convergence" description="See how the cost of carry sets the futures price, and how it converges to spot at expiry.">
      <Inner currency={currency} />
    </ExplainerFrame>
  );
}
