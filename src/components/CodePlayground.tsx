import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Eye, Code as CodeIcon } from 'lucide-react';
import { cn } from '../lib/cn';

type Mode = 'js' | 'html';

export function CodePlayground({
  initial,
  mode = 'js',
  height = 240,
  title,
}: {
  initial: string;
  mode?: Mode;
  height?: number;
  title?: string;
}) {
  const [code, setCode] = useState(initial);
  const [logs, setLogs] = useState<{ kind: 'log' | 'error' | 'warn'; text: string }[]>([]);
  const [view, setView] = useState<'editor' | 'preview'>('editor');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => setCode(initial), [initial]);

  const run = () => {
    if (mode === 'js') {
      const out: typeof logs = [];
      const fakeConsole = {
        log: (...args: unknown[]) => out.push({ kind: 'log', text: args.map(stringify).join(' ') }),
        warn: (...args: unknown[]) => out.push({ kind: 'warn', text: args.map(stringify).join(' ') }),
        error: (...args: unknown[]) => out.push({ kind: 'error', text: args.map(stringify).join(' ') }),
      };
      try {
        const fn = new Function('console', `"use strict";\n${code}`);
        const result = fn(fakeConsole);
        if (result instanceof Promise) {
          result.catch((e) => out.push({ kind: 'error', text: String(e) })).finally(() => setLogs([...out]));
        }
        setLogs(out);
      } catch (e) {
        setLogs([{ kind: 'error', text: String(e) }]);
      }
    } else {
      setView('preview');
      setTimeout(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument;
        if (!doc) return;
        doc.open();
        doc.write(code);
        doc.close();
      }, 30);
    }
  };

  const reset = () => {
    setCode(initial);
    setLogs([]);
  };

  const lines = useMemo(() => code.split('\n').length, [code]);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 bg-white/[0.02] px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-ink-dim">
          <span className="font-mono uppercase tracking-widest">{mode}</span>
          {title && <span className="text-ink-faint">·</span>}
          {title && <span>{title}</span>}
        </div>
        <div className="flex items-center gap-1">
          {mode === 'html' && (
            <div className="mr-2 flex rounded-md border border-white/10 p-0.5">
              <button
                onClick={() => setView('editor')}
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-0.5 text-[11px]',
                  view === 'editor' ? 'bg-white/10 text-ink' : 'text-ink-dim',
                )}
              >
                <CodeIcon className="h-3 w-3" />
                Code
              </button>
              <button
                onClick={() => setView('preview')}
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-0.5 text-[11px]',
                  view === 'preview' ? 'bg-white/10 text-ink' : 'text-ink-dim',
                )}
              >
                <Eye className="h-3 w-3" />
                Preview
              </button>
            </div>
          )}
          <button onClick={reset} className="btn-ghost h-7 px-2 text-xs" aria-label="Reset">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button onClick={run} className="btn-primary h-7 px-2.5 text-xs">
            <Play className="h-3.5 w-3.5" /> Run
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {(mode === 'js' || view === 'editor') && (
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 select-none border-r border-white/5 bg-white/[0.02] py-3 text-right font-mono text-[11px] leading-5 text-ink-faint"
              style={{ width: 36 }}
            >
              {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="px-2">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              wrap="off"
              className="block w-full resize-none border-0 bg-transparent py-3 pl-12 pr-3 font-mono text-[13px] leading-5 text-ink outline-none"
              style={{ minHeight: height }}
            />
          </div>
        )}

        {mode === 'html' && view === 'preview' && (
          <iframe
            ref={iframeRef}
            title="preview"
            sandbox="allow-scripts"
            className="block w-full bg-white"
            style={{ minHeight: height }}
          />
        )}

        {mode === 'js' && (
          <div
            className="overflow-y-auto border-l border-white/5 bg-black/30 p-3 font-mono text-[12.5px] leading-5"
            style={{ minHeight: height }}
          >
            {logs.length === 0 ? (
              <div className="text-ink-faint">// console output will appear here</div>
            ) : (
              logs.map((l, i) => (
                <div
                  key={i}
                  className={cn(
                    'whitespace-pre-wrap',
                    l.kind === 'error' && 'text-rose-300',
                    l.kind === 'warn' && 'text-amber-300',
                    l.kind === 'log' && 'text-ink',
                  )}
                >
                  {l.kind !== 'log' && <span className="mr-2 text-ink-faint">[{l.kind}]</span>}
                  {l.text}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function stringify(v: unknown): string {
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v, replacer, 2);
  } catch {
    return String(v);
  }
}

function replacer(_key: string, value: unknown) {
  if (typeof value === 'function') return `[Function ${(value as Function).name || 'anonymous'}]`;
  if (typeof value === 'bigint') return `${value.toString()}n`;
  if (value instanceof Map) return Object.fromEntries(value);
  if (value instanceof Set) return Array.from(value);
  return value;
}
