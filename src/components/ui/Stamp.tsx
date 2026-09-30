import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { STAMP, getReducedMotion } from '../../lib/motion';

export type StampVariant = 'correct' | 'incorrect' | 'complete';

const LABEL: Record<StampVariant, string> = { correct: 'Correct', incorrect: 'Review', complete: 'Complete' };
const TONE: Record<StampVariant, string> = {
  correct: 'border-success text-success',
  incorrect: 'border-danger text-danger',
  complete: 'border-rust text-rust',
};

interface StampProps {
  variant: StampVariant;
  label?: string;
  className?: string;
}

export const Stamp: React.FC<StampProps> = ({ variant, label, className = '' }) => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(getReducedMotion()), []);

  return (
    <motion.span
      role="status"
      initial={reduced ? false : { opacity: 0, scale: 2.2, rotate: -14 }}
      animate={{ opacity: 1, scale: 1, rotate: -6 }}
      transition={STAMP}
      className={`inline-block select-none rounded border-[3px] px-2.5 py-0.5 font-sans text-sm font-extrabold uppercase tracking-[0.14em] ${TONE[variant]} ${className}`}
    >
      {label ?? LABEL[variant]}
    </motion.span>
  );
};

export default Stamp;
