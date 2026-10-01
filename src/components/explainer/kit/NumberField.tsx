import React, { useState } from 'react';

export interface NumberFieldProps {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  step?: number;
  integer?: boolean;
  className?: string;
  id?: string;
}

/**
 * Number input that keeps a string draft while the user edits, so clearing the
 * field and typing a new value works. Only finite numbers at or above `min` are
 * committed; on blur the field snaps back to the last committed value.
 */
export const NumberField: React.FC<NumberFieldProps> = ({ value, onCommit, min = 0, step = 1, integer = false, className, id }) => {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min={min}
      step={step}
      value={draft ?? String(value)}
      onChange={(e) => {
        const text = e.target.value;
        setDraft(text);
        const n = Number(text);
        if (text.trim() === '' || !Number.isFinite(n)) return;
        const v = integer ? Math.round(n) : n;
        if (v >= min) onCommit(v);
      }}
      onBlur={() => setDraft(null)}
      className={className}
    />
  );
};

export default NumberField;
