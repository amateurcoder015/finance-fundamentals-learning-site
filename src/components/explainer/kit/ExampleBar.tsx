import React from 'react';

export interface ExampleOption {
  label: string;
  apply: () => void;
}

const btn =
  'inline-flex min-h-[44px] items-center rounded-full border border-rule bg-paper px-4 font-sans text-sm font-semibold text-ink hover:border-ink/40';

export const ExampleBar: React.FC<{ examples: ExampleOption[] }> = ({ examples }) => (
  <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Examples">
    {examples.map((example) => (
      <button key={example.label} type="button" onClick={example.apply} className={btn}>
        {example.label}
      </button>
    ))}
    {examples.length > 0 && (
      <button type="button" onClick={examples[0].apply} className={`${btn} text-ink-muted`}>
        Reset
      </button>
    )}
  </div>
);

export default ExampleBar;
