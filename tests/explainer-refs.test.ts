import { describe, it, expect } from 'vitest';
import { resolveExplainerRefs } from '../src/lib/explainer-refs';

const registry = {
  'time-value-of-money': {},
  'options-suite': { views: ['payoff', 'greeks', 'parity'] as const },
};

describe('resolveExplainerRefs', () => {
  it('accepts a bare name', () => {
    expect(resolveExplainerRefs(['time-value-of-money'], registry)).toEqual([
      { name: 'time-value-of-money', view: undefined },
    ]);
  });

  it('accepts an object with a valid view', () => {
    expect(resolveExplainerRefs([{ name: 'options-suite', view: 'greeks' }], registry)).toEqual([
      { name: 'options-suite', view: 'greeks' },
    ]);
  });

  it('keeps order and allows several explainers', () => {
    const out = resolveExplainerRefs(['time-value-of-money', { name: 'options-suite' }], registry);
    expect(out.map((r) => r.name)).toEqual(['time-value-of-money', 'options-suite']);
  });

  it('fails loudly for an unknown name, listing valid ones and the topic', () => {
    expect(() => resolveExplainerRefs(['nope'], registry, 'my-topic')).toThrow(/Unknown explainer "nope" in topic 'my-topic'/);
    expect(() => resolveExplainerRefs(['nope'], registry)).toThrow(/options-suite, time-value-of-money/);
  });

  it('fails for an unknown view, listing valid views', () => {
    expect(() => resolveExplainerRefs([{ name: 'options-suite', view: 'delta' }], registry)).toThrow(
      /Unknown view "delta" for explainer "options-suite".*payoff, greeks, parity/,
    );
  });

  it('fails when a view is given for an explainer that has none', () => {
    expect(() => resolveExplainerRefs([{ name: 'time-value-of-money', view: 'x' }], registry)).toThrow(
      /this explainer has no views/,
    );
  });

  it('does not treat inherited object properties as explainers', () => {
    expect(() => resolveExplainerRefs(['constructor'], registry)).toThrow(/Unknown explainer/);
  });

  it('returns an empty list for no refs', () => {
    expect(resolveExplainerRefs([], registry)).toEqual([]);
  });
});
