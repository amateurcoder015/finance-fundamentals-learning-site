import { describe, it, expect } from 'vitest';
import { tripletToHex, buildThemeVariables, type ThemeTokens } from '../src/lib/diagram-theme';

const tokens: ThemeTokens = {
  paper: '250 246 239',
  'paper-raised': '255 253 248',
  ink: '26 23 20',
  'ink-muted': '94 85 75',
  rule: '227 217 201',
  rust: '180 71 47',
  gold: '242 198 107',
};

describe('tripletToHex', () => {
  it('converts an RGB triplet, tolerating surrounding whitespace', () => {
    expect(tripletToHex(' 26 23 20 ')).toBe('#1a1714');
    expect(tripletToHex('255 255 255')).toBe('#ffffff');
    expect(tripletToHex('0 0 0')).toBe('#000000');
  });
});

describe('buildThemeVariables', () => {
  it('maps tokens onto Mermaid theme variables', () => {
    const v = buildThemeVariables(tokens);
    expect(v.primaryTextColor).toBe('#1a1714');
    expect(v.lineColor).toBe('#5e554b');
    expect(v.titleColor).toBe('#b4472f');
    expect(v.background).toBe('#faf6ef');
    expect(v.fontFamily).toContain('Fraunces');
  });
});

describe('buildThemeVariables covers non-flowchart diagram types', () => {
  const v = buildThemeVariables(tokens);
  it('sets sequence-diagram variables from the tokens', () => {
    expect(v.actorBkg).toBe('#fffdf8');
    expect(v.actorTextColor).toBe('#1a1714');
    expect(v.signalColor).toBe('#1a1714');
    expect(v.noteBkgColor).toBe('#f2c66b');
    expect(v.sequenceNumberColor).toBeDefined();
  });
  it('sets state-diagram variables', () => {
    expect(v.transitionColor).toBe('#5e554b');
    expect(v.stateLabelColor).toBe('#1a1714');
    expect(v.compositeBackground).toBeDefined();
  });
  it('sets timeline colour scale variables', () => {
    expect(v.cScale0).toBeDefined();
    expect(v.cScaleLabel0).toBe('#1a1714');
  });
});
