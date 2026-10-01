import { NumberField } from '../../components/explainer/kit/NumberField';
import React, { useId, useState } from 'react';
import { ExplainerFrame } from '../../components/explainer/kit/ExplainerFrame';
import { Slider } from '../../components/explainer/kit/Slider';
import { Readout } from '../../components/explainer/kit/Readout';
import { ChartFrame } from '../../components/explainer/kit/ChartFrame';
import { ExampleBar } from '../../components/explainer/kit/ExampleBar';
import { formatMoney, formatNumber } from '../../lib/explainer-format';
import type { ExplainerProps } from '../types';
import { MARGIN_EXAMPLE, buildLedger, type LedgerInputs, type LedgerRow } from './model';

const num = 'min-h-[44px] w-full rounded-lg border border-rule bg-paper px-3 font-mono text-sm text-ink';
const half = (v: number) => (Number.isFinite(v) ? Math.round(v * 2) / 2 : 0);

function statusLabel(row: LedgerRow, currency: string): string {
  switch (row.status) {
    case 'opened':
      return 'Position opened';
    case 'call':
      return `Margin call: deposit ${formatMoney(row.marginCall, currency)}`;
    case 'liquidated':
      return 'Position liquidated';
    default:
      return row.mtm > 0 ? 'Profit credited' : row.mtm < 0 ? 'Loss debited' : 'No change';
  }
}

function Inner({ currency }: { currency: string }) {
  const uid = useId();
  const [i, setI] = useState<LedgerInputs>(MARGIN_EXAMPLE);
  const set = (patch: Partial<LedgerInputs>) => setI((p) => ({ ...p, ...patch }));
  const rows = buildLedger(i);
  const last = rows[rows.length - 1];
  const calls = rows.filter((r) => r.status === 'call').length;
  const liquidated = rows.some((r) => r.status === 'liquidated');
  const totalPaid = rows.reduce((s, r) => s + r.deposit, 0);

  const setPrice = (idx: number, value: number) => set({ prices: i.prices.map((p, k) => (k === idx ? value : p)) });
  // Keep maintenance <= initial so a margin call never demands a negative deposit.
  const setInitial = (initialMargin: number) => set({ initialMargin, maintenanceMargin: Math.min(i.maintenanceMargin, initialMargin) });

  const balanceSeries = rows.map((r) => [r.day, r.endBalance] as [number, number]);
  const spanX: [number, number] = [0, Math.max(1, rows.length - 1)];

  return (
    <div className="space-y-6">
      <ExampleBar examples={[{ label: `Chapter example: long 1 contract at ${formatMoney(MARGIN_EXAMPLE.entryPrice, currency, 0)}`, apply: () => setI(MARGIN_EXAMPLE) }]} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div role="radiogroup" aria-label="Position side" className="flex gap-2">
            {(['long', 'short'] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={i.side === s}
                onClick={() => set({ side: s })}
                className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border px-4 font-sans text-sm font-bold capitalize ${
                  i.side === s ? 'border-ink bg-ink text-on-accent' : 'border-rule bg-paper text-ink hover:border-ink/40'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Slider label="Entry price" value={i.entryPrice} min={1} max={200} step={0.5} onChange={(v) => set({ entryPrice: half(v) })} format={(v) => formatMoney(v, currency)} />
          <Slider label="Lot size (units per contract)" value={i.lotSize} min={1} max={1000} step={1} onChange={(v) => set({ lotSize: Math.round(v) })} />
          <Slider label="Initial margin" value={i.initialMargin} min={0} max={5000} step={50} onChange={setInitial} format={(v) => formatMoney(v, currency, 0)} />
          <Slider label="Maintenance margin" value={Math.min(i.maintenanceMargin, i.initialMargin)} min={0} max={Math.max(i.initialMargin, 50)} step={50} onChange={(v) => set({ maintenanceMargin: Math.min(v, i.initialMargin) })} format={(v) => formatMoney(v, currency, 0)} hint="At most the initial margin" />
          <label className="flex min-h-[44px] items-center gap-3 font-sans text-sm font-semibold text-ink">
            <input type="checkbox" checked={i.meetCalls} onChange={(e) => set({ meetCalls: e.target.checked })} className="h-5 w-5 accent-[rgb(var(--rust))]" />
            Trader meets every margin call
          </label>

          <fieldset className="space-y-2">
            <legend className="font-sans text-sm font-semibold text-ink">Daily settlement prices</legend>
            {i.prices.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <label htmlFor={`${uid}-day-${idx}`} className="w-14 shrink-0 font-sans text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">Day {idx + 1}</label>
                <NumberField id={`${uid}-day-${idx}`} step={0.5} min={0} value={p} onCommit={(v) => setPrice(idx, half(v))} className={num} />
                <button
                  type="button"
                  aria-label={`Remove day ${idx + 1}`}
                  onClick={() => set({ prices: i.prices.filter((_, k) => k !== idx) })}
                  className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg border border-rule px-3 font-sans text-sm font-semibold text-ink hover:border-ink/40"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={i.prices.length >= 20}
              onClick={() => set({ prices: [...i.prices, i.prices[i.prices.length - 1] ?? i.entryPrice] })}
              className="min-h-[44px] rounded-full border border-rule bg-paper px-5 font-sans text-sm font-bold text-ink hover:border-ink/40 disabled:opacity-40"
            >
              Add a day
            </button>
          </fieldset>
        </div>

        <ChartFrame
          series={[
            { id: 'balance', label: 'Account balance', tone: 'rust', points: balanceSeries },
            { id: 'maintenance', label: 'Maintenance margin', tone: 'danger', dashed: true, points: [[spanX[0], i.maintenanceMargin], [spanX[1], i.maintenanceMargin]] },
            { id: 'initial', label: 'Initial margin', tone: 'muted', dashed: true, points: [[spanX[0], i.initialMargin], [spanX[1], i.initialMargin]] },
          ]}
          xLabel="Trading day"
          yLabel="Balance"
          formatX={(v) => (Number.isInteger(v) ? formatNumber(v, 0) : '')}
          formatY={(v) => formatMoney(v, currency, 0)}
          markers={rows.filter((r) => r.status === 'call').map((r) => ({ x: r.day, label: 'Call', tone: 'danger' as const }))}
          includeZeroY
          summary={`The balance starts at ${formatMoney(rows[0].endBalance, currency, 0)} and ends at ${formatMoney(last.endBalance, currency, 0)} after ${rows.length - 1} days with ${calls} margin call${calls === 1 ? '' : 's'}${liquidated ? ' and a forced liquidation' : ''}.`}
        />
      </div>

      <div role="region" aria-label="Daily mark-to-market ledger, scrollable" tabIndex={0} className="overflow-x-auto rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust">
        <table className="w-full min-w-[40rem] border-collapse text-left font-mono text-sm">
          <caption className="mb-2 text-left font-sans text-sm font-semibold text-ink">Daily mark-to-market ledger</caption>
          <thead>
            <tr className="font-sans text-xs uppercase tracking-[0.1em] text-ink-muted">
              {['Day', 'Settlement', 'Change', 'MTM cash flow', 'Deposit', 'End balance', 'Status'].map((h) => (
                <th key={h} scope="col" className="border-b-2 border-ink px-2 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.day} className={r.status === 'call' || r.status === 'liquidated' ? 'bg-danger/10' : ''}>
                <th scope="row" className="border-b border-rule px-2 py-2 font-semibold">{r.day}</th>
                <td className="border-b border-rule px-2 py-2">{formatMoney(r.price, currency)}</td>
                <td className="border-b border-rule px-2 py-2">{r.day === 0 ? '—' : formatMoney(r.change, currency)}</td>
                <td className="border-b border-rule px-2 py-2">{r.day === 0 ? '—' : formatMoney(r.mtm, currency)}</td>
                <td className="border-b border-rule px-2 py-2">{r.deposit > 0 ? formatMoney(r.deposit, currency) : '—'}</td>
                <td className="border-b border-rule px-2 py-2 font-semibold">{formatMoney(r.endBalance, currency)}</td>
                <td className="border-b border-rule px-2 py-2 font-sans">{statusLabel(r, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Readout
        items={[
          { label: 'Final balance', value: formatMoney(last.endBalance, currency), tone: last.endBalance < i.maintenanceMargin ? 'negative' : 'accent' },
          { label: 'Margin calls', value: String(calls), tone: calls > 0 ? 'negative' : 'default' },
          { label: 'Total variation margin paid', value: formatMoney(totalPaid, currency) },
        ]}
      />
    </div>
  );
}

export default function MarginLedger({ currency = '$' }: ExplainerProps) {
  return (
    <ExplainerFrame title="Margin and mark-to-market ledger" description="Change the price path and see daily settlement, margin calls and variation margin. It opens on the chapter's four-day example.">
      <Inner currency={currency} />
    </ExplainerFrame>
  );
}
