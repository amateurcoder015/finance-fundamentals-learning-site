import type { ExplainerMeta } from './types';

/** Explainer name -> metadata. Each explainer task adds its entry here. */
export const registry: Record<string, ExplainerMeta> = {
  'time-value-of-money': { title: 'Time value of money' },
};
