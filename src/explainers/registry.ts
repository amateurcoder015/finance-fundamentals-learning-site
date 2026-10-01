import type { ExplainerMeta } from './types';

/** Explainer name -> metadata. Each explainer task adds its entry here. */
export const registry: Record<string, ExplainerMeta> = {
  'time-value-of-money': { title: 'Time value of money' },
  'futures-pricing': { title: 'Futures pricing and convergence' },
  'options-suite': { title: 'Options explorer', views: ['payoff', 'greeks', 'parity'] as const },
  'margin-ledger': { title: 'Margin and mark-to-market ledger' },
};
