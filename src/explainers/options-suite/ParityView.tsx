import React, { useState } from 'react';
import { Slider } from '../../components/explainer/kit/Slider';
import { Readout } from '../../components/explainer/kit/Readout';
import { FormulaBlock } from '../../components/explainer/kit/FormulaBlock';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { formatMoney, texMoney } from '../../lib/explainer-format';
import { OPTION_EXAMPLE, impliedPut, parityCheck, type ParityInputs } from './model';

export function ParityView({ currency }: { currency: string }) {
  const [i, setI] = useState<ParityInputs>(OPTION_EXAMPLE);
  const set = (patch: Partial<ParityInputs>) => setI((p) => ({ ...p, ...patch }));
  const result = parityCheck(i);
  const fairPut = impliedPut(i.call, i.spot, i.strike, i.rate, i.time);

  const tex = `C + K e^{-rT} = P + S \\;\\Rightarrow\\; ${texMoney(i.call, currency)} + ${texMoney(i.strike * Math.exp(-i.rate * i.time), currency)} \\;\\text{vs}\\; ${texMoney(i.put, currency)} + ${texMoney(i.spot, currency)}`;

  return (
    <div className="space-y-6">
      <ExampleBar
        examples={[
          { label: `Chapter example: call ${formatMoney(OPTION_EXAMPLE.call, currency)}, fair put ${formatMoney(impliedPut(OPTION_EXAMPLE.call, OPTION_EXAMPLE.spot, OPTION_EXAMPLE.strike, OPTION_EXAMPLE.rate, OPTION_EXAMPLE.time), currency)}`, apply: () => setI(OPTION_EXAMPLE) },
          { label: `Dislocated market: put at ${formatMoney(4, currency)}`, apply: () => setI({ ...OPTION_EXAMPLE, put: 4 }) },
        ]}
      />
      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-5">
          <Slider label="Spot price (S)" value={i.spot} min={1} max={300} step={1} onChange={(spot) => set({ spot })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Strike price (K)" value={i.strike} min={1} max={300} step={1} onChange={(strike) => set({ strike })} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Risk-free rate (r)" value={Number((i.rate * 100).toFixed(4))} min={0} max={15} step={0.1} onChange={(v) => set({ rate: v / 100 })} format={(v) => v.toFixed(1)} suffix="%" />
          <Slider label="Time to expiry (T)" value={i.time} min={0} max={3} step={0.05} onChange={(time) => set({ time })} format={(v) => v.toFixed(2)} suffix=" yr" />
        </div>
        <div className="space-y-5">
          <Slider label="Call premium (C)" value={i.call} min={0} max={100} step={0.05} onChange={(call) => set({ call })} format={(v) => formatMoney(v, currency)} />
          <Slider label="Put premium (P)" value={i.put} min={0} max={100} step={0.05} onChange={(put) => set({ put })} format={(v) => formatMoney(v, currency)} />
          <p className="font-sans text-sm text-ink-muted">
            For these inputs the fair put is {formatMoney(fairPut, currency)}.
          </p>
        </div>
      </div>

      <Readout
        items={[
          { label: 'Call + PV(K)', value: formatMoney(result.callSide, currency) },
          { label: 'Put + stock', value: formatMoney(result.putSide, currency) },
          { label: 'Difference', value: formatMoney(result.deviation, currency), tone: result.status === 'aligned' ? 'positive' : 'negative' },
        ]}
      />
      <p role="status" className="rounded-xl border border-rule bg-paper p-4 font-serif text-base text-ink">
        <span className="mr-2 font-sans text-xs font-bold uppercase tracking-[0.12em] text-rust">
          {result.status === 'aligned' ? 'Aligned' : 'Arbitrage'}
        </span>
        {result.action}
      </p>
      <FormulaBlock tex={tex} />
    </div>
  );
}
