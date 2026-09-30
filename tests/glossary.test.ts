import { describe, it, expect } from 'vitest';
import { lookupTerm, type Glossary } from '../src/lib/glossary';

const glossary: Glossary = {
  delta: { term: 'Delta', definition: 'Change in option price per unit change in the underlying.' },
  theta: { term: 'Theta', definition: 'Time decay of an option.' },
};

describe('lookupTerm', () => {
  it('returns the entry for a known key', () => {
    expect(lookupTerm(glossary, 'delta').term).toBe('Delta');
  });

  it('throws a loud, helpful error for an unknown key', () => {
    expect(() => lookupTerm(glossary, 'deltaa')).toThrow(/Unknown glossary term "deltaa"/);
    expect(() => lookupTerm(glossary, 'deltaa')).toThrow(/delta, theta/);
  });

  it('does not treat inherited object properties as terms', () => {
    expect(() => lookupTerm(glossary, 'constructor')).toThrow(/Unknown glossary term/);
  });
});
