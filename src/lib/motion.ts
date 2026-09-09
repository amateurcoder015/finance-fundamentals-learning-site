export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const DURATION_FAST = 0.15;
export const DURATION_BASE = 0.25;
export const DURATION_SLOW = 0.45;

export const STAGGER_TIGHT = 0.06;
export const STAGGER_BASE = 0.09;

// Motion variants for container / staggered children
export const fadeInUpContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_BASE,
      delayChildren: 0.05,
    },
  },
};

export const fadeInUpTightContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_TIGHT,
      delayChildren: 0.05,
    },
  },
};

export const fadeInUpItem = {
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

export const heroItemVariants = {
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

/**
 * Utility to check if user prefers reduced motion
 */
export function getReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
