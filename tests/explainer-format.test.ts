import { describe, it, expect } from 'vitest';
import { formatMoney, formatNumber, formatPercent, texMoney, texNumber, texPlain } from '../src/lib/explainer-format';

describe('formatNumber', () => {
  it('groups thousands and fixes digits', () => {
    expect(formatNumber(14693.28)).toBe('14,693.28');
    expect(formatNumber(2, 0)).toBe('2');
  });
  it('shows a dash for non-finite values', () => {
    expect(formatNumber(NaN)).toBe('—');
    expect(formatNumber(Infinity)).toBe('—');
    expect(formatNumber(-Infinity)).toBe('—');
  });
});

describe('formatMoney', () => {
  it('formats with the currency symbol', () => {
    expect(formatMoney(14693.28)).toBe('$14,693.28');
    expect(formatMoney(1250, '₹')).toBe('₹1,250.00');
  });
  it('puts the minus before the symbol', () => {
    expect(formatMoney(-500)).toBe('-$500.00');
  });
  it('never shows a negative zero', () => {
    expect(formatMoney(-0.001)).toBe('$0.00');
    expect(formatMoney(-0)).toBe('$0.00');
  });
  it('guards non-finite values', () => {
    expect(formatMoney(NaN)).toBe('—');
    expect(formatMoney(Infinity)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('formats a fraction as a percentage', () => {
    expect(formatPercent(0.08)).toBe('8.00%');
    expect(formatPercent(0.0525, 1)).toBe('5.3%');
    expect(formatPercent(NaN)).toBe('—');
  });
});

describe('TeX helpers', () => {
  it('escapes the dollar sign and uses TeX thousands separators', () => {
    expect(texMoney(10000)).toBe('\\$10{,}000.00');
    expect(texMoney(-500)).toBe('-\\$500.00');
    expect(texNumber(1234567.891, 1)).toBe('1{,}234{,}567.9');
  });
  it('trims trailing zeros for plain numbers', () => {
    expect(texPlain(0.08)).toBe('0.08');
    expect(texPlain(5, 4)).toBe('5');
    expect(texPlain(0.123456, 4)).toBe('0.1235');
  });
});
