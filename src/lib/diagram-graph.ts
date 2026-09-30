export interface GraphEdge {
  from: string;
  to: string;
}

/** Mermaid flowchart node DOM ids look like `flowchart-<id>-<n>`. */
export function parseNodeId(domId: string): string | null {
  const m = domId.match(/^flowchart-(.+)-\d+$/);
  return m ? m[1] : null;
}

/** Mermaid edge paths carry `LS-<from>` and `LE-<to>` classes. */
export function parseEdgeClasses(classNames: string[]): GraphEdge | null {
  const from = classNames.find((c) => c.startsWith('LS-'))?.slice(3);
  const to = classNames.find((c) => c.startsWith('LE-'))?.slice(3);
  return from && to ? { from, to } : null;
}

/**
 * Orders nodes for a step-through: breadth-first from nodes with no incoming edges,
 * then from any node not yet reached (cycles, leftovers) in document order.
 * Every node appears exactly once. Edges touching unknown ids or self-loops are ignored.
 */
export function computeWalkOrder(nodeIds: string[], edges: GraphEdge[]): string[] {
  const known = new Set(nodeIds);
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, number>();
  for (const id of nodeIds) {
    outgoing.set(id, []);
    incoming.set(id, 0);
  }
  for (const { from, to } of edges) {
    if (!known.has(from) || !known.has(to) || from === to) continue;
    outgoing.get(from)!.push(to);
    incoming.set(to, (incoming.get(to) ?? 0) + 1);
  }

  const visited = new Set<string>();
  const order: string[] = [];
  const bfs = (start: string) => {
    const queue = [start];
    visited.add(start);
    while (queue.length > 0) {
      const id = queue.shift()!;
      order.push(id);
      for (const next of outgoing.get(id) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
  };

  for (const id of nodeIds) if (incoming.get(id) === 0 && !visited.has(id)) bfs(id);
  for (const id of nodeIds) if (!visited.has(id)) bfs(id);
  return order;
}
