export const THEME_TOKEN_NAMES = ['paper', 'paper-raised', 'ink', 'ink-muted', 'rule', 'rust', 'gold'] as const;
export type ThemeTokens = Record<(typeof THEME_TOKEN_NAMES)[number], string>;

export function tripletToHex(triplet: string): string {
  const [r, g, b] = triplet.trim().split(/\s+/).map(Number);
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

export function buildThemeVariables(t: ThemeTokens): Record<string, string> {
  const h = tripletToHex;
  return {
    background: h(t.paper),
    primaryColor: h(t['paper-raised']),
    primaryTextColor: h(t.ink),
    primaryBorderColor: h(t.ink),
    secondaryColor: h(t.gold),
    secondaryTextColor: h(t.ink),
    tertiaryColor: h(t.paper),
    mainBkg: h(t['paper-raised']),
    nodeBorder: h(t.ink),
    clusterBkg: h(t.paper),
    clusterBorder: h(t.rule),
    lineColor: h(t['ink-muted']),
    titleColor: h(t.rust),
    edgeLabelBackground: h(t.paper),
    fontFamily: "'Fraunces Variable', Georgia, serif",
    fontSize: '15px',
  };
}
