import React, { useMemo } from 'react';
import katex from 'katex';

export const FormulaBlock: React.FC<{ tex: string; label?: string }> = ({ tex, label }) => {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: true, throwOnError: false, output: 'htmlAndMathml', trust: false }),
    [tex],
  );
  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={label ?? 'Formula with your current values'}
      className="overflow-x-auto rounded-xl border border-rule bg-paper p-4 [&_.katex-display]:m-0 [&_.katex-display]:overflow-visible [&_.katex-display]:border-0 [&_.katex-display]:bg-transparent [&_.katex-display]:p-0 [&_.katex-display]:shadow-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default FormulaBlock;
