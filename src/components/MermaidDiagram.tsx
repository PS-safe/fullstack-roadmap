import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    background: '#0f1623',
    primaryColor: '#1f2937',
    primaryTextColor: '#e7ecf3',
    primaryBorderColor: '#374151',
    lineColor: '#6366f1',
    secondaryColor: '#1f2937',
    tertiaryColor: '#0f1623',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  },
});

let counter = 0;

export function MermaidDiagram({ chart, caption }: { chart: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const id = `mmd-${++counter}-${Math.random().toString(36).slice(2, 7)}`;
    mermaid
      .render(id, chart)
      .then((result: { svg: string }) => {
        if (alive && ref.current) {
          ref.current.innerHTML = result.svg;
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive) setError(String(e));
      });
    return () => {
      alive = false;
    };
  }, [chart]);

  return (
    <figure className="card-pad">
      {error ? (
        <pre className="text-xs text-rose-300">{error}</pre>
      ) : (
        <div ref={ref} className="mermaid-container overflow-x-auto" />
      )}
      {caption && <figcaption className="mt-3 text-center text-xs text-ink-dim">{caption}</figcaption>}
    </figure>
  );
}
