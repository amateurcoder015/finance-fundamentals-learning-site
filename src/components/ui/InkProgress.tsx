import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { getReducedMotion } from '../../lib/motion';

export const InkProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  const [reduced, setReduced] = useState(false);

  useEffect(() => setReduced(getReducedMotion()), []);

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left bg-rust"
      style={{ scaleX }}
    />
  );
};

export default InkProgress;
