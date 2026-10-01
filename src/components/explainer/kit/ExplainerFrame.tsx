import React from 'react';

class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Explainer error:', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert" className="rounded-xl border border-rule bg-paper p-4 font-sans text-sm text-ink">
          This interactive could not load. The worked example is described in the note above.
        </div>
      );
    }
    return this.props.children;
  }
}

export const ExplainerFrame: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <section aria-label={title} className="rounded-2xl border border-rule bg-paper-raised p-5 sm:p-8">
    <h3 className="font-serif text-2xl font-semibold tracking-tight text-ink">{title}</h3>
    {description && <p className="mb-6 mt-1 font-serif text-base text-ink-muted">{description}</p>}
    <Boundary>{children}</Boundary>
  </section>
);

export default ExplainerFrame;
