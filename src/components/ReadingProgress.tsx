import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { getReducedMotion } from '../lib/motion';

export const ReadingProgress: React.FC = () => {
  const isReduced = getReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  if (isReduced) {
    return null;
  }

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-500 z-[60] origin-left"
      style={{ scaleX }}
    />
  );
};

export default ReadingProgress;
