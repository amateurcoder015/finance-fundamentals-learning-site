import React, { useEffect, useId, useState } from 'react';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  suffix?: string;
  hint?: string;
}

const trim = (v: number) => String(Number(v.toFixed(6)));

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange, format, suffix = '', hint }) => {
  const id = useId();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const [text, setText] = useState(trim(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setText(trim(value));
  }, [value, editing]);

  const display = `${format ? format(value) : trim(value)}${suffix}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`${id}-range`} className="font-sans text-sm font-semibold text-ink">{label}</label>
        <span className="font-mono text-sm font-semibold text-rust" aria-hidden="true">{display}</span>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-valuetext={display}
        className="h-11 w-full cursor-pointer accent-[rgb(var(--rust))]"
      />
      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-num`} className="sr-only">{label} (exact value)</label>
        <input
          id={`${id}-num`}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={text}
          onFocus={() => setEditing(true)}
          onBlur={() => {
            setEditing(false);
            setText(trim(value));
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value);
            if (e.target.value.trim() !== '' && Number.isFinite(n)) onChange(clamp(n));
          }}
          className="min-h-[44px] w-32 rounded-lg border border-rule bg-paper px-3 font-mono text-sm text-ink"
        />
        {hint && <span className="font-sans text-xs text-ink-muted">{hint}</span>}
      </div>
    </div>
  );
};

export default Slider;
