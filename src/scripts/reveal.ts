/**
 * Arms `.hl` highlights so they sweep in as they scroll into view.
 * Default CSS shows them fully highlighted; this only adds the animation, so
 * no-JS and reduced-motion users see the final state.
 */
export function initHighlights(root: ParentNode = document): void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('.hl'));
  if (els.length === 0) return;
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('hl-armed');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-on');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => observer.observe(el));
}
