import React, { useState } from 'react';
import PayoffChart from '../../components/PayoffChart';
import { Readout } from '../../components/explainer/kit/Readout';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { formatMoney, formatNumber } from '../../lib/explainer-format';
import { netPnL, summarisePayoff } from '../../lib/payoff';
import type { Position } from '../../content/config';

type LegType = Position['type'];
interface Leg {
  id: number;
  type: LegType;
  strike: number;
  premium: number;
  lot: number;
}

const TYPES: Array<{ id: LegType; label: string }> = [
  { id: 'long-call', label: 'Long call' },
  { id: 'short-call', label: 'Short call' },
  { id: 'long-put', label: 'Long put' },
  { id: 'short-put', label: 'Short put' },
  { id: 'long-futures', label: 'Long underlying / futures' },
  { id: 'short-futures', label: 'Short underlying / futures' },
];

const isFuture = (t: LegType) => t === 'long-futures' || t === 'short-futures';

let nextId = 100;
const leg = (type: LegType, strike: number, premium = 0): Leg => ({ id: nextId++, type, strike, premium, lot: 1 });

const PRESETS: Array<{ label: string; build: () => Leg[] }> = [
  { label: 'Long call', build: () => [leg('long-call', 100, 5)] },
  { label: 'Long put', build: () => [leg('long-put', 100, 4)] },
  { label: 'Bull call spread', build: () => [leg('long-call', 100, 6), leg('short-call', 110, 2)] },
  { label: 'Long straddle', build: () => [leg('long-call', 100, 5), leg('long-put', 100, 4)] },
  { label: 'Covered call', build: () => [leg('long-futures', 100), leg('short-call', 105, 3)] },
  { label: 'Protective put', build: () => [leg('long-futures', 100), leg('long-put', 95, 2)] },
];

const num = 'min-h-[44px] w-full rounded-lg border border-rule bg-paper px-3 font-mono text-sm text-ink';

export function PayoffView({ currency }: { currency: string }) {
  const [legs, setLegs] = useState<Leg[]>(() => PRESETS[0].build());
  const update = (id: number, patch: Partial<Leg>) => setLegs((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const positions: Position[] = legs.map((l) => ({
    type: l.type,
    lotSize: Math.max(1, l.lot),
    ...(isFuture(l.type) ? { contractPrice: l.strike } : { strike: l.strike, premium: l.premium }),
  }));
  const strikes = legs.map((l) => l.strike).filter((s) => s > 0);
  const lo = Math.max(0, Math.floor((Math.min(...strikes, 100) * 0.6) / 10) * 10);
  const hi = Math.ceil((Math.max(...strikes, 100) * 1.4) / 10) * 10;
  const range: [number, number] = [lo, hi > lo ? hi : lo + 10];
  const summary = summarisePayoff(positions, range);
  // When the legs cancel exactly (e.g. long and short of the same option) the payoff is identically zero.
  const checkXs = [0, ...strikes, range[1] * 1.5];
  const flat = checkXs.every((x) => Math.abs(netPnL(positions, x)) < 1e-9);

  return (
    <div className="space-y-6">
      <ExampleBar examples={PRESETS.map((p) => ({ label: p.label, apply: () => setLegs(p.build()) }))} />

      <div className="space-y-3">
        {legs.map((l, idx) => (
          <fieldset key={l.id} className="grid gap-3 rounded-xl border border-rule bg-paper p-3 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] sm:items-end">
            <legend className="sr-only">Leg {idx + 1}</legend>
            <label className="space-y-1 font-sans text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
              Position
              <select value={l.type} onChange={(e) => update(l.id, { type: e.target.value as LegType })} className={`${num} font-sans`}>
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 font-sans text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
              {isFuture(l.type) ? 'Entry price' : 'Strike'}
              <input type="number" min={1} step={1} value={l.strike} onChange={(e) => update(l.id, { strike: Math.max(1, Number(e.target.value) || 1) })} className={num} />
            </label>
            {!isFuture(l.type) ? (
              <label className="space-y-1 font-sans text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
                Premium
                <input type="number" min={0} step={0.5} value={l.premium} onChange={(e) => update(l.id, { premium: Math.max(0, Number(e.target.value) || 0) })} className={num} />
              </label>
            ) : (
              <div aria-hidden="true" />
            )}
            <label className="space-y-1 font-sans text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
              Lot size
              <input type="number" min={1} step={1} value={l.lot} onChange={(e) => update(l.id, { lot: Math.max(1, Math.round(Number(e.target.value) || 1)) })} className={num} />
            </label>
            <button
              type="button"
              disabled={legs.length === 1}
              onClick={() => setLegs((ls) => ls.filter((x) => x.id !== l.id))}
              aria-label={`Remove leg ${idx + 1}`}
              className="min-h-[44px] rounded-lg border border-rule px-3 font-sans text-sm font-semibold text-ink hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Remove
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          disabled={legs.length >= 4}
          onClick={() => setLegs((ls) => [...ls, leg('long-call', 100, 5)])}
          className="min-h-[44px] rounded-full border border-rule bg-paper px-5 font-sans text-sm font-bold text-ink hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add a leg
        </button>
      </div>

      <PayoffChart positions={positions} priceRange={range} title="Profit and loss at expiry" description="Per the legs above; the dashed lines are the individual legs." />

      <Readout
        items={[
          { label: 'Maximum profit', value: flat ? formatMoney(0, currency) : summary.maxProfit === null ? 'Unlimited' : formatMoney(summary.maxProfit, currency), tone: 'positive' },
          { label: 'Maximum loss', value: flat ? formatMoney(0, currency) : summary.maxLoss === null ? 'Unlimited' : formatMoney(summary.maxLoss, currency), tone: 'negative' },
          { label: 'Break-even', value: !flat && summary.breakEvens.length ? summary.breakEvens.map((b) => formatNumber(b, 2)).join(' and ') : 'None', hint: flat ? 'The legs cancel out: no profit or loss at any price' : undefined },
        ]}
      />
    </div>
  );
}
