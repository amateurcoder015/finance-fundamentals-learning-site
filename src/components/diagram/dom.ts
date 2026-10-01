import { parseNodeId, parseEdgeClasses, parseEdgeId, computeWalkOrder, type GraphEdge } from '../../lib/diagram-graph';
import { THEME_TOKEN_NAMES, type ThemeTokens } from '../../lib/diagram-theme';

export interface DiagramGraph {
  nodeIds: string[];
  order: string[];
  labels: Record<string, string>;
  nodeEls: Map<string, SVGGElement>;
  edgeEls: SVGPathElement[];
}

export function readThemeTokens(): ThemeTokens {
  const style = getComputedStyle(document.documentElement);
  const out = {} as ThemeTokens;
  for (const name of THEME_TOKEN_NAMES) out[name] = style.getPropertyValue(`--${name}`);
  return out;
}

export function extractGraph(svg: SVGSVGElement): DiagramGraph {
  const nodeEls = new Map<string, SVGGElement>();
  const labels: Record<string, string> = {};
  const nodeIds: string[] = [];
  svg.querySelectorAll<SVGGElement>('g.node').forEach((el) => {
    const id = parseNodeId(el.id);
    if (!id || nodeEls.has(id)) return;
    nodeEls.set(id, el);
    nodeIds.push(id);
    labels[id] = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  });

  const edges: GraphEdge[] = [];
  const edgeEls: SVGPathElement[] = [];
  svg.querySelectorAll<SVGPathElement>('path.flowchart-link').forEach((el) => {
    edgeEls.push(el);
    const edge =
      parseEdgeClasses(Array.from(el.classList)) ?? parseEdgeId(el.getAttribute('data-id') ?? el.id, nodeIds);
    if (edge) edges.push(edge);
  });

  return { nodeIds, order: computeWalkOrder(nodeIds, edges), labels, nodeEls, edgeEls };
}

/** Prepares nodes/edges for the staggered reveal (styled by .dg-reveal in global.css). */
export function armReveal(graph: DiagramGraph): void {
  graph.order.forEach((id, i) => {
    const el = graph.nodeEls.get(id);
    if (!el) return;
    el.classList.add('dg-node');
    el.style.setProperty('--i', String(i));
  });
  // Mermaid scopes its own CSS to the SVG id (`#dg-1 .edge-pattern-solid { stroke-dasharray: 0 }`),
  // which outranks any class rule of ours, so the draw-in state must be set inline.
  graph.edgeEls.forEach((el) => {
    const len = String(Math.ceil(el.getTotalLength()));
    el.classList.add('dg-edge');
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
  });
}

/** Plays the reveal armed by armReveal, then hands edge dashing back to Mermaid's own styles. */
export function playReveal(root: HTMLElement, graph: DiagramGraph): void {
  const clear = (el: SVGPathElement) => {
    el.style.removeProperty('stroke-dasharray');
    el.style.removeProperty('stroke-dashoffset');
  };
  graph.edgeEls.forEach((el) => {
    el.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'stroke-dashoffset') clear(el);
    }, { once: true });
  });
  // Flush styles so the armed (hidden) state is committed before the transition rule applies;
  // otherwise the last-armed edge starts its transition from the undrawn default instead.
  void root.offsetWidth;
  root.classList.add('dg-reveal');
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      root.classList.add('dg-in');
      graph.edgeEls.forEach((el) => {
        el.style.strokeDashoffset = '0';
      });
    }),
  );
  // Safety net if transitionend never fires (hidden tab, interrupted transition).
  window.setTimeout(() => graph.edgeEls.forEach(clear), 2200);
}
