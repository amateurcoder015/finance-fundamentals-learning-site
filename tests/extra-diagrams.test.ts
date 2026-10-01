import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseDiagramTitle, readExtraDiagrams } from '../src/utils/extra-diagrams';

describe('parseDiagramTitle', () => {
  it('strips a leading title comment and trims the code', () => {
    expect(parseDiagramTitle('%% title: Portfolio margining\n\ngraph TD\n  A-->B\n')).toEqual({
      title: 'Portfolio margining',
      code: 'graph TD\n  A-->B',
    });
  });
  it('returns a null title when there is none', () => {
    expect(parseDiagramTitle('graph TD\n  A-->B')).toEqual({ title: null, code: 'graph TD\n  A-->B' });
  });
  it('does not treat other comments as titles', () => {
    expect(parseDiagramTitle('%% a comment\ngraph TD').title).toBeNull();
  });
});

describe('readExtraDiagrams', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'extra-diagrams-'));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns nothing when there are no extra files', () => {
    fs.writeFileSync(path.join(dir, 'diagram.mmd'), 'graph TD');
    expect(readExtraDiagrams(dir)).toEqual([]);
  });
  it('reads diagram-2, diagram-3 in order', () => {
    fs.writeFileSync(path.join(dir, 'diagram-2.mmd'), '%% title: Second\ngraph TD\n  A-->B');
    fs.writeFileSync(path.join(dir, 'diagram-3.mmd'), 'graph LR\n  C-->D');
    const out = readExtraDiagrams(dir);
    expect(out).toHaveLength(2);
    expect(out[0].title).toBe('Second');
    expect(out[1]).toEqual({ title: null, code: 'graph LR\n  C-->D' });
  });
  it('stops at the first missing number', () => {
    fs.writeFileSync(path.join(dir, 'diagram-3.mmd'), 'graph TD');
    expect(readExtraDiagrams(dir)).toEqual([]);
  });
  it('fails loudly for an empty extra file', () => {
    fs.writeFileSync(path.join(dir, 'diagram-2.mmd'), '   \n');
    expect(() => readExtraDiagrams(dir)).toThrow(/diagram-2\.mmd is empty/);
  });
});
