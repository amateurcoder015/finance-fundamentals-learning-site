import { describe, it, expect } from 'vitest';
import { buildTickerItems } from '../src/lib/ticker';

const glossary = {
  delta: { term: 'Delta', definition: 'How much an option price changes per unit move in the underlying asset.' },
  theta: { term: 'Theta', definition: 'Time decay.' },
};

describe('buildTickerItems', () => {
  it('interleaves glossary terms and topic titles', () => {
    const items = buildTickerItems([{ title: 'Hedge Funds' }, { title: 'Clearing' }], glossary);
    expect(items[0]).toMatch(/^Delta — /);
    expect(items[1]).toBe('Hedge Funds');
    expect(items[2]).toMatch(/^Theta — /);
    expect(items[3]).toBe('Clearing');
  });
  it('truncates long definitions with an ellipsis', () => {
    const [first] = buildTickerItems([], glossary);
    expect(first.endsWith('…')).toBe(true);
    expect(first.length).toBeLessThanOrEqual('Delta — '.length + 57);
  });
  it('does not truncate short definitions', () => {
    const items = buildTickerItems([], glossary);
    expect(items[1]).toBe('Theta — Time decay.');
  });
  it('de-duplicates and respects the cap', () => {
    const topics = Array.from({ length: 40 }, (_, i) => ({ title: `Topic ${i % 5}` }));
    const items = buildTickerItems(topics, glossary, 6);
    expect(items.length).toBeLessThanOrEqual(6);
    expect(new Set(items).size).toBe(items.length);
  });
  it('returns an empty list for empty inputs', () => {
    expect(buildTickerItems([], {})).toEqual([]);
  });
});
