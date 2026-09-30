import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { DURATION_FAST, DURATION_BASE, DURATION_SLOW, DURATION_INK } from '../src/lib/motion';

const css = readFileSync('src/styles/tokens.css', 'utf-8');
const ms = (name: string): number => {
  const m = css.match(new RegExp(`--${name}:\\s*(\\d+)ms`));
  if (!m) throw new Error(`--${name} not found in tokens.css`);
  return Number(m[1]);
};

describe('motion tokens stay in sync between CSS and JS', () => {
  it('fast', () => expect(ms('dur-fast')).toBe(DURATION_FAST * 1000));
  it('base', () => expect(ms('dur-base')).toBe(DURATION_BASE * 1000));
  it('slow', () => expect(ms('dur-slow')).toBe(DURATION_SLOW * 1000));
  it('ink', () => expect(ms('dur-ink')).toBe(DURATION_INK * 1000));
});
