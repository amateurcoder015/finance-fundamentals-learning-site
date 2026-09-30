export type RGB = [number, number, number];

export function parseTriplet(value: string): RGB {
  const parts = value.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    throw new Error(`Invalid RGB triplet: "${value}"`);
  }
  return parts as RGB;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance([r, g, b]: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Extracts `--name: R G B;` declarations from the top-level rule with the given selector
 * (selector must start a line; indented rules inside @media are ignored).
 */
export function parseTokenBlock(css: string, selector: string): Record<string, RGB> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  if (!block) throw new Error(`Selector not found in tokens.css: ${selector}`);
  const tokens: Record<string, RGB> = {};
  for (const m of block[1].matchAll(/--([a-z-]+):\s*(\d+\s+\d+\s+\d+)\s*;/g)) {
    tokens[m[1]] = parseTriplet(m[2]);
  }
  return tokens;
}
