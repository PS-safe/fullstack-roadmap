import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useProgress } from '../lib/progress';

export function Section({
  id,
  title,
  kicker,
  children,
}: {
  id?: string;
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="mb-4">
        {kicker && <div className="mb-1 font-mono text-xs uppercase tracking-widest text-accent-cyan">{kicker}</div>}
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card-pad', className)}>{children}</div>;
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'warn' | 'info' }) {
  const tones = {
    default: 'border-white/10 bg-white/5 text-ink-dim',
    success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    warn: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    info: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  } as const;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}

export function Code({ children, lang = 'text' }: { children: ReactNode; lang?: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 text-[13px] leading-relaxed">
      <code className={`language-${lang} font-mono text-ink`}>{children}</code>
    </pre>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return <code className="rounded-md border border-white/5 bg-white/5 px-1.5 py-0.5 font-mono text-[12.5px] text-accent-cyan">{children}</code>;
}

export function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <span className="text-ink-dim">{children}</span>
    </li>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <Bullet key={i}>{it}</Bullet>
      ))}
    </ul>
  );
}

export function TopicCard({
  layerId,
  index,
  title,
  description,
  children,
}: {
  layerId: number;
  index: number;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  const { map, toggle } = useProgress();
  const id = `L${layerId}.t${index}`;
  const done = !!map[id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.35 }}
      className="card-pad relative"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-ink-faint">
            Topic {layerId}.{index + 1}
          </div>
          <h3 className="text-lg font-semibold sm:text-xl">{title}</h3>
          {description && <p className="mt-1 text-sm text-ink-dim">{description}</p>}
        </div>
        <button
          onClick={() => toggle(id)}
          aria-pressed={done}
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-1 text-xs transition-all',
            done
              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
              : 'border-white/10 bg-white/5 text-ink-dim hover:bg-white/10',
          )}
        >
          {done ? (
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Mastered
            </span>
          ) : (
            'Mark mastered'
          )}
        </button>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </motion.div>
  );
}

export function TwoCol({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-bg-soft/60 p-4">
      <div className="text-xs uppercase tracking-widest text-ink-faint">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-dim">{sub}</div>}
    </div>
  );
}
