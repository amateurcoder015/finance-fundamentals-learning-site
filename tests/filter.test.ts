import { describe, it, expect } from 'vitest';
import { matchesFilter } from '../src/lib/filter';

const card = { category: 'Derivatives', difficulty: 'advanced' };

describe('matchesFilter', () => {
  it('matches everything when both filters are "all"', () => {
    expect(matchesFilter(card, { category: 'all', difficulty: 'all' })).toBe(true);
  });
  it('filters by category', () => {
    expect(matchesFilter(card, { category: 'Derivatives', difficulty: 'all' })).toBe(true);
    expect(matchesFilter(card, { category: 'Equities', difficulty: 'all' })).toBe(false);
  });
  it('filters by difficulty', () => {
    expect(matchesFilter(card, { category: 'all', difficulty: 'advanced' })).toBe(true);
    expect(matchesFilter(card, { category: 'all', difficulty: 'beginner' })).toBe(false);
  });
  it('requires both to match', () => {
    expect(matchesFilter(card, { category: 'Derivatives', difficulty: 'beginner' })).toBe(false);
  });
});
