export type ExplainerRef = string | { name: string; view?: string };

export interface ResolvedExplainerRef {
  name: string;
  view?: string;
}

export interface RegistryEntryLike {
  views?: readonly string[];
}

/**
 * Validates frontmatter explainer references against the registry.
 * Unknown names or views throw with the valid options listed, so a typo fails the build.
 */
export function resolveExplainerRefs(
  refs: ExplainerRef[],
  registry: Record<string, RegistryEntryLike>,
  topic = 'unknown',
): ResolvedExplainerRef[] {
  const names = Object.keys(registry).sort();
  return refs.map((ref) => {
    const name = typeof ref === 'string' ? ref : ref.name;
    const view = typeof ref === 'string' ? undefined : ref.view;
    if (!Object.prototype.hasOwnProperty.call(registry, name)) {
      throw new Error(
        `[Content Validation Error] Unknown explainer "${name}" in topic '${topic}'. Valid explainers: ${
          names.join(', ') || '(none registered)'
        }`,
      );
    }
    if (view !== undefined) {
      const views = registry[name].views ?? [];
      if (!views.includes(view)) {
        throw new Error(
          `[Content Validation Error] Unknown view "${view}" for explainer "${name}" in topic '${topic}'. Valid views: ${
            views.join(', ') || '(this explainer has no views)'
          }`,
        );
      }
    }
    return { name, view };
  });
}
