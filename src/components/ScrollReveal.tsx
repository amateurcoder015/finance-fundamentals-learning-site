import React from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT, DURATION_BASE, STAGGER_TIGHT, getReducedMotion } from '../lib/motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ children, className = '', stagger = false }) => {
  const isReduced = getReducedMotion();

  if (isReduced) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: STAGGER_TIGHT,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION_BASE,
        ease: EASE_OUT,
      },
    },
  };

  if (stagger) {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScrollItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const isReduced = getReducedMotion();

  if (isReduced) {
    return <div className={className}>{children}</div>;
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION_BASE,
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
