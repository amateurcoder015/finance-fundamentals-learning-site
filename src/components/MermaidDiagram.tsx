import React, { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  code: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderDiagram() {
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;

        const isDarkMode = document.documentElement.classList.contains('dark');

        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkMode ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, code);

        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Mermaid render error:', err);
          setError(err?.message || 'Failed to render diagram');
        }
      }
    }

    if (code) {
      renderDiagram();
    }

    return () => {
      isMounted = false;
    };
  }, [code]);

  if (error) {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg font-mono text-sm">
        <p className="font-bold">Diagram Render Error:</p>
        <pre className="whitespace-pre-wrap mt-1">{error}</pre>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-stone-50 dark:bg-slate-900/40 rounded-lg border border-dashed border-stone-200 dark:border-slate-800">
        Rendering diagram...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container overflow-x-auto p-6 bg-white dark:bg-[#131B2E] rounded-xl border border-stone-200 dark:border-slate-800 flex justify-center shadow-sm"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default MermaidDiagram;
