import React from 'react';

export interface ReadoutItem {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative' | 'accent';
  hint?: string;
}

const TONE: Record<NonNullable<ReadoutItem['tone']>, string> = {
  default: 'text-ink',
  positive: 'text-success',
  negative: 'text-danger',
  accent: 'text-rust',
};

export const Readout: React.FC<{ items: ReadoutItem[]; label?: string }> = ({ items, label = 'Results' }) => (
  <dl aria-label={label} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {items.map((item) => (
      <div key={item.label} className="rounded-xl border border-rule bg-paper p-3">
        <dt className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">{item.label}</dt>
        <dd className={`mt-1 font-mono text-lg font-semibold ${TONE[item.tone ?? 'default']}`}>{item.value}</dd>
        {item.hint && <dd className="mt-0.5 font-sans text-xs text-ink-muted">{item.hint}</dd>}
      </div>
    ))}
  </dl>
);

export default Readout;
