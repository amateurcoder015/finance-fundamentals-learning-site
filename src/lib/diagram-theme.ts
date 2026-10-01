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
    // Sequence diagrams
    actorBkg: h(t['paper-raised']),
    actorBorder: h(t.ink),
    actorTextColor: h(t.ink),
    actorLineColor: h(t['ink-muted']),
    signalColor: h(t.ink),
    signalTextColor: h(t.ink),
    labelBoxBkgColor: h(t['paper-raised']),
    labelBoxBorderColor: h(t.rule),
    labelTextColor: h(t.ink),
    loopTextColor: h(t.ink),
    noteBkgColor: h(t.gold),
    noteBorderColor: h(t.rule),
    noteTextColor: h(t.ink),
    activationBkgColor: h(t.paper),
    activationBorderColor: h(t['ink-muted']),
    sequenceNumberColor: h(t.paper),
    // State diagrams
    transitionColor: h(t['ink-muted']),
    transitionLabelColor: h(t.ink),
    stateLabelColor: h(t.ink),
    stateBkg: h(t['paper-raised']),
    labelBackgroundColor: h(t.paper),
    compositeBackground: h(t.paper),
    compositeTitleBackground: h(t['paper-raised']),
    altBackground: h(t.paper),
    specialStateColor: h(t.ink),
    // Timeline
    cScale0: h(t['paper-raised']),
    cScale1: h(t.gold),
    cScale2: h(t['paper-raised']),
    cScale3: h(t.gold),
    cScaleLabel0: h(t.ink),
    cScaleLabel1: h(t.ink),
    cScaleLabel2: h(t.ink),
    cScaleLabel3: h(t.ink),
    fontFamily: "'Fraunces Variable', Georgia, serif",
    fontSize: '15px',
  };
}
