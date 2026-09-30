import { describe, it, expect } from 'vitest';
import { parseNodeId, parseEdgeClasses, computeWalkOrder } from '../src/lib/diagram-graph';

describe('parseNodeId', () => {
  it('extracts the Mermaid node id', () => {
    expect(parseNodeId('flowchart-T0-0')).toBe('T0');
    expect(parseNodeId('flowchart-My-Node-3')).toBe('My-Node');
  });
  it('returns null for non-node ids', () => {
    expect(parseNodeId('cluster-x')).toBeNull();
    expect(parseNodeId('')).toBeNull();
  });
});

describe('parseEdgeClasses', () => {
  it('reads LS- and LE- classes', () => {
    expect(parseEdgeClasses(['flowchart-link', 'LS-A', 'LE-B'])).toEqual({ from: 'A', to: 'B' });
  });
  it('returns null when either end is missing', () => {
    expect(parseEdgeClasses(['flowchart-link', 'LS-A'])).toBeNull();
    expect(parseEdgeClasses([])).toBeNull();
  });
});

describe('computeWalkOrder', () => {
  it('walks a linear chain in order', () => {
    expect(computeWalkOrder(['A', 'B', 'C'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }])).toEqual(['A', 'B', 'C']);
  });
  it('walks branches breadth-first', () => {
    const edges = [
      { from: 'A', to: 'B' }, { from: 'A', to: 'C' },
      { from: 'B', to: 'D' }, { from: 'C', to: 'D' },
    ];
    expect(computeWalkOrder(['A', 'B', 'C', 'D'], edges)).toEqual(['A', 'B', 'C', 'D']);
  });
  it('visits every node exactly once in a cycle', () => {
    const order = computeWalkOrder(['A', 'B'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'A' }]);
    expect(order).toEqual(['A', 'B']);
  });
  it('handles a loop back to an earlier node (margin-call style)', () => {
    const edges = [
      { from: 'Open', to: 'Close' }, { from: 'Close', to: 'Check' },
      { from: 'Check', to: 'Safe' }, { from: 'Safe', to: 'Close' },
    ];
    expect(computeWalkOrder(['Open', 'Close', 'Check', 'Safe'], edges)).toEqual(['Open', 'Close', 'Check', 'Safe']);
  });
  it('returns document order when there are no edges', () => {
    expect(computeWalkOrder(['X', 'Y', 'Z'], [])).toEqual(['X', 'Y', 'Z']);
  });
  it('handles a single node', () => {
    expect(computeWalkOrder(['Only'], [])).toEqual(['Only']);
  });
  it('handles an empty graph', () => {
    expect(computeWalkOrder([], [])).toEqual([]);
  });
  it('ignores edges to unknown nodes (subgraph clusters) and self-loops', () => {
    const order = computeWalkOrder(['A', 'B'], [{ from: 'Cluster', to: 'A' }, { from: 'A', to: 'A' }, { from: 'A', to: 'B' }]);
    expect(order).toEqual(['A', 'B']);
  });
  it('starts each disconnected component from its own source', () => {
    const edges = [{ from: 'A', to: 'B' }, { from: 'C', to: 'D' }];
    expect(computeWalkOrder(['A', 'B', 'C', 'D'], edges)).toEqual(['A', 'B', 'C', 'D']);
  });
});
