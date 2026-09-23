import React from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT, DURATION_SLOW, STAGGER_BASE, getReducedMotion } from '../lib/motion';

interface HeroMotionProps {
  children: React.ReactNode;
}

export const HeroMotion: React.FC<HeroMotionProps> = ({ children }) => {
  const isReduced = getReducedMotion();

  if (isReduced) {
    return <div>{children}</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: STAGGER_BASE,
        delayChildren: 0.05,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
};

export const HeroItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const isReduced = getReducedMotion();

  if (isReduced) {
    return <div className={className}>{children}</div>;
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION_SLOW,
        ease: EASE_OUT,
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};
