import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Menu, X, Home, RotateCcw } from 'lucide-react';
import { LAYERS } from '../data/layers';
import { progressForLayer, useProgress } from '../lib/progress';
import { cn } from '../lib/cn';

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { map, reset } = useProgress();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  const totalCompleted = useMemo(() => Object.values(map).filter(Boolean).length, [map]);
  const totalTopics = useMemo(() => LAYERS.reduce((acc, l) => acc + l.topics.length, 0), []);

  return (
    <div className="flex min-h-screen">
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-bg-card lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-72 flex-col overflow-y-auto overscroll-contain border-r border-white/5 bg-bg-card/95 px-4 py-6 backdrop-blur transition-transform lg:translate-x-0 lg:bg-bg-card/60',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-cyan text-white">
              <span className="font-mono text-sm font-bold">{'</>'}</span>
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">Full Stack</div>
              <div className="text-[11px] text-ink-dim">Interactive Roadmap</div>
            </div>
          </NavLink>
          <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-white/10 text-ink' : 'text-ink-dim hover:bg-white/5 hover:text-ink',
              )
            }
          >
            <Home className="h-4 w-4" />
            Overview
          </NavLink>

          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            const p = progressForLayer(map, layer.id, layer.topics.length);
            return (
              <NavLink
                key={layer.id}
                to={`/layer/${layer.slug}`}
                className={({ isActive }) =>
                  cn(
                    'group flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive ? 'bg-white/10 text-ink' : 'text-ink-dim hover:bg-white/5 hover:text-ink',
                  )
                }
              >
                <div className={cn('mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-white', layer.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">L{layer.id} · {shortName(layer.title)}</span>
                    <span className="text-[10px] text-ink-faint">{p.completed}/{p.total}</span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <div className={cn('h-full bg-gradient-to-r', layer.color)} style={{ width: `${p.pct * 100}%` }} />
                  </div>
                </div>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-ink-faint">Progress</div>
            <button onClick={reset} className="text-ink-faint hover:text-ink-dim" aria-label="Reset progress">
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-1 text-2xl font-semibold">{totalCompleted}<span className="text-sm font-normal text-ink-dim"> / {totalTopics}</span></div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-gradient-to-r from-accent to-accent-cyan" style={{ width: `${(totalCompleted / totalTopics) * 100}%` }} />
          </div>
          <div className="mt-2 text-[11px] text-ink-faint">Saved locally · per browser</div>
        </div>

        <div className="mt-6 text-[11px] leading-relaxed text-ink-faint">
          {LAYERS.length} layers · {LAYERS.reduce((a, l) => a + l.topics.length, 0)}+ core topics · 50+ interactive demos.
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      <main className="flex min-h-screen w-full flex-col lg:pl-72">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <Outlet />
        </div>
        <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-ink-faint">
          From fundamentals to micro-level · Interactive Full Stack Roadmap · {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}

function shortName(title: string) {
  return title.replace(/^Foundations of /, '').replace(/ Fundamentals$/, '').replace(/ Development$/, '');
}
