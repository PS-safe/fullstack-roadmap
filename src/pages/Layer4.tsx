import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutPanelLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 4;

export default function Layer4() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="html" kicker="4.1" title="HTML5 Semantics & Accessibility">
        <TopicCard
          layerId={L}
          index={0}
          title="Mean what you mark up"
          description="Semantic HTML is faster to read for humans, search engines, and screen readers. ARIA fills in the gaps when you really need a custom widget."
        >
          <Bullets
            items={[
              <>Use <InlineCode>&lt;header&gt;, &lt;nav&gt;, &lt;main&gt;, &lt;article&gt;, &lt;section&gt;, &lt;footer&gt;</InlineCode> over generic divs.</>,
              <>Form controls have native validation: <InlineCode>required</InlineCode>, <InlineCode>pattern</InlineCode>, <InlineCode>min/max</InlineCode>.</>,
              <>WCAG 2.1 AA: 4.5:1 contrast, full keyboard nav, visible focus, captions for video.</>,
              <>Modern observers: <InlineCode>IntersectionObserver</InlineCode> for lazy loads, <InlineCode>ResizeObserver</InlineCode> for container queries.</>,
            ]}
          />
        </TopicCard>
        <ContrastChecker />
      </Section>

      <Section id="css" kicker="4.2" title="CSS3, Layouts & Design Systems">
        <TopicCard
          layerId={L}
          index={1}
          title="Flexbox, Grid, and modern selectors"
          description="Flexbox is for one-dimensional layout. Grid is for two-dimensional. Stop reaching for floats — they're 2010."
        >
          <Bullets
            items={[
              <>Box model: always set <InlineCode>box-sizing: border-box</InlineCode> globally — width includes padding + border.</>,
              <>Custom properties (<InlineCode>--var</InlineCode>) enable runtime theming — JS can read/write them.</>,
              <>GPU-accelerated transforms: <InlineCode>translate, scale, rotate</InlineCode>. Avoid animating <InlineCode>top/left/width/height</InlineCode>.</>,
              <>New: <InlineCode>:has()</InlineCode> parent selector, <InlineCode>@container</InlineCode> queries, cascade <InlineCode>@layer</InlineCode>.</>,
            ]}
          />
        </TopicCard>
        <FlexboxPlayground />
        <CodePlayground
          mode="html"
          height={260}
          title="Live HTML/CSS sandbox"
          initial={`<!doctype html>
<html><body style="font-family: system-ui; padding: 20px; background:#0b0f17; color:#e7ecf3">
  <h2 style="background: linear-gradient(90deg,#6366f1,#22d3ee); -webkit-background-clip: text; color: transparent">Hello, full stack</h2>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px">
    <div style="padding:14px; background:#1f2937; border-radius:10px">A</div>
    <div style="padding:14px; background:#1f2937; border-radius:10px">B</div>
    <div style="padding:14px; background:#1f2937; border-radius:10px">C</div>
  </div>
</body></html>`}
        />
      </Section>

      <Section id="js" kicker="4.3" title="JavaScript Core Language">
        <TopicCard
          layerId={L}
          index={2}
          title="Closures, the event loop, prototypes"
          description="JavaScript is single-threaded but never blocking — because of the event loop. Promises run on the microtask queue, drained between every macrotask."
        >
          <Bullets
            items={[
              <>Every <InlineCode>function</InlineCode> creates a closure over its lexical environment.</>,
              <><InlineCode>this</InlineCode> rules: arrow functions inherit <InlineCode>this</InlineCode> from the enclosing scope; regular functions get it from how they're called.</>,
              <>Microtasks (Promises) drain before the next macrotask (setTimeout) — that's why <InlineCode>Promise.resolve().then</InlineCode> beats <InlineCode>setTimeout(0)</InlineCode>.</>,
            ]}
          />
        </TopicCard>
        <EventLoopVisualizer />
        <CodePlayground
          mode="js"
          height={220}
          title="Event loop traps"
          initial={`console.log('1: sync start');

setTimeout(() => console.log('2: macrotask'), 0);

Promise.resolve().then(() => console.log('3: microtask'));

queueMicrotask(() => console.log('4: queueMicrotask'));

console.log('5: sync end');

// Observe order: 1, 5, 3, 4, 2
// All microtasks drain before any macrotask runs.`}
        />
      </Section>

      <Section id="ts" kicker="4.4" title="TypeScript">
        <TopicCard
          layerId={L}
          index={3}
          title="Types as guarantees, not annotations"
          description="With strict mode on, TypeScript prevents whole classes of bugs at edit time — null derefs, missing fields, wrong call signatures."
        >
          <Bullets
            items={[
              <>Generics with constraints: <InlineCode>{'function pick<T, K extends keyof T>(obj: T, k: K): T[K]'}</InlineCode>.</>,
              <>Discriminated unions are the cleanest way to model state machines.</>,
              <>Utility types: <InlineCode>Partial, Pick, Omit, Record, ReturnType, Awaited</InlineCode>.</>,
              <>Always set <InlineCode>strict: true</InlineCode>, <InlineCode>noUncheckedIndexedAccess: true</InlineCode>.</>,
            ]}
          />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={220}
          title="(Plain JS — pretend it's TS)"
          initial={`// Discriminated union pattern
function area(s) {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r * s.r;
    case 'square': return s.size * s.size;
    case 'rect':   return s.w * s.h;
  }
}

console.log(area({ kind: 'circle', r: 3 }));
console.log(area({ kind: 'square', size: 4 }));
console.log(area({ kind: 'rect', w: 5, h: 6 }));`}
        />
      </Section>

      <Section id="react" kicker="4.5" title="React Ecosystem">
        <TopicCard
          layerId={L}
          index={4}
          title="Hooks, render cycles, server components"
          description="Components are pure functions of props + state. Hooks let you snap reactive behavior into them. Re-renders aren't expensive — DOM updates are."
        >
          <Bullets
            items={[
              <>Core: <InlineCode>useState</InlineCode>, <InlineCode>useEffect</InlineCode>, <InlineCode>useRef</InlineCode>, <InlineCode>useContext</InlineCode>, <InlineCode>useReducer</InlineCode>.</>,
              <>Memo only what's expensive — premature <InlineCode>useMemo/useCallback</InlineCode> adds noise.</>,
              <>Server vs client components in Next.js App Router: server is default; mark interactive ones <InlineCode>"use client"</InlineCode>.</>,
              <>Server state (React Query, SWR) ≠ client state (Zustand, Jotai). Don't mix them.</>,
            ]}
          />
        </TopicCard>
        <HooksPlayground />
      </Section>

      <Section id="perf" kicker="4.6" title="Build Tooling & Web Performance">
        <TopicCard
          layerId={L}
          index={5}
          title="Core Web Vitals are user-facing latency"
          description="LCP, INP, CLS measure the perceived experience. Optimizing them is mostly about loading fewer bytes, in the right order."
        >
          <Bullets
            items={[
              <>LCP &lt; 2.5s: largest visible element rendered. Preload hero image, inline critical CSS.</>,
              <>INP &lt; 200ms: interaction-to-paint. Break up long tasks; <InlineCode>scheduler.yield()</InlineCode>; defer non-critical JS.</>,
              <>CLS &lt; 0.1: reserve space for async content. Use <InlineCode>aspect-ratio</InlineCode>, set image dimensions.</>,
              <>Vite uses esbuild in dev (~50ms reload), Rollup for production (better chunking).</>,
            ]}
          />
        </TopicCard>
        <PerfBudget />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 4 Quiz">
        <Quiz id="L4" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-amber-500/10 via-bg-card to-orange-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-amber-500 to-orange-500 text-white">L04</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Frontend Development</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Where users meet your product</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Frontend turns design into interactive, accessible, performant experience. Browser internals, reactive programming, build tooling — a deep discipline.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <LayoutPanelLeft className="h-4 w-4 text-amber-400" />
          6 topics · 4 visualizers · 3 playgrounds · 1 quiz
        </div>
      </div>
    </header>
  );
}

function ContrastChecker() {
  const [fg, setFg] = useState('#e7ecf3');
  const [bg, setBg] = useState('#0b0f17');
  const ratio = contrastRatio(fg, bg);
  const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'fail';
  const tone = grade === 'fail' ? 'text-rose-300' : 'text-emerald-300';

  return (
    <Card>
      <h4 className="mb-3 font-semibold">WCAG contrast checker</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block">
            <span className="text-xs text-ink-faint">Text color</span>
            <div className="mt-1 flex gap-2">
              <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border border-white/10 bg-transparent" />
              <input value={fg} onChange={(e) => setFg(e.target.value)} className="input flex-1 font-mono text-xs" />
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-ink-faint">Background</span>
            <div className="mt-1 flex gap-2">
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border border-white/10 bg-transparent" />
              <input value={bg} onChange={(e) => setBg(e.target.value)} className="input flex-1 font-mono text-xs" />
            </div>
          </label>
          <div className="rounded-lg border border-white/5 bg-bg-soft/40 p-3">
            <div className="text-xs uppercase tracking-widest text-ink-faint">Ratio</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{ratio.toFixed(2)}</span>
              <span className={cn('text-sm font-medium', tone)}>{grade}</span>
            </div>
            <div className="mt-1 text-[11px] text-ink-faint">AA: ≥ 4.5 (normal text), 3 (large). AAA: ≥ 7.</div>
          </div>
        </div>
        <div className="rounded-xl p-6" style={{ background: bg, color: fg }}>
          <div className="text-2xl font-semibold">Headline preview</div>
          <p className="mt-2 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Hover, focus, click — does it read clearly?</p>
          <p className="mt-3 text-xs opacity-80">Small body — passes only at higher ratios.</p>
        </div>
      </div>
    </Card>
  );
}

function contrastRatio(fg: string, bg: string): number {
  const lum = (hex: string) => {
    const c = hex.replace('#', '');
    if (c.length !== 6) return 0;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lum(fg);
  const b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function FlexboxPlayground() {
  const [direction, setDirection] = useState('row');
  const [justify, setJustify] = useState('flex-start');
  const [align, setAlign] = useState('stretch');
  const [wrap, setWrap] = useState('nowrap');
  const [gap, setGap] = useState(8);
  const [count, setCount] = useState(4);

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Flexbox playground</h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-2 text-xs">
          <Label>flex-direction</Label>
          <Pills options={['row', 'row-reverse', 'column', 'column-reverse']} value={direction} onChange={setDirection} />
          <Label>justify-content</Label>
          <Pills options={['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']} value={justify} onChange={setJustify} />
          <Label>align-items</Label>
          <Pills options={['stretch', 'flex-start', 'center', 'flex-end', 'baseline']} value={align} onChange={setAlign} />
          <Label>flex-wrap</Label>
          <Pills options={['nowrap', 'wrap', 'wrap-reverse']} value={wrap} onChange={setWrap} />
          <Label>gap: {gap}px · items: {count}</Label>
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="40" value={gap} onChange={(e) => setGap(parseInt(e.target.value))} className="flex-1" />
            <input type="range" min="1" max="8" value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="flex-1" />
          </div>
        </div>
        <div>
          <div
            className="grid-bg rounded-xl border border-white/10 p-3"
            style={{
              display: 'flex',
              flexDirection: direction as any,
              justifyContent: justify,
              alignItems: align,
              flexWrap: wrap as any,
              gap: `${gap}px`,
              minHeight: 220,
            }}
          >
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                style={{ width: 56, height: 36 + (i % 3) * 24 }}
                className="grid place-items-center rounded-md bg-gradient-to-br from-amber-500 to-orange-500 text-sm font-semibold text-white"
              >
                {i + 1}
              </div>
            ))}
          </div>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-white/5 bg-black/40 p-3 font-mono text-[12px] leading-5 text-ink-dim">{`display: flex;
flex-direction: ${direction};
justify-content: ${justify};
align-items: ${align};
flex-wrap: ${wrap};
gap: ${gap}px;`}</pre>
        </div>
      </div>
    </Card>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="font-mono uppercase tracking-widest text-ink-faint">{children}</div>;
}

function Pills({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            'rounded-md border px-2 py-1 font-mono text-[11px]',
            value === o ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim hover:bg-white/10',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

type LoopItem = { id: number; label: string; kind: 'sync' | 'micro' | 'macro' };

function EventLoopVisualizer() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [stack, setStack] = useState<LoopItem[]>([]);
  const [microQ, setMicroQ] = useState<LoopItem[]>([]);
  const [macroQ, setMacroQ] = useState<LoopItem[]>([]);
  const [output, setOutput] = useState<string[]>([]);

  const reset = () => {
    setRunning(false);
    setStep(0);
    setStack([]);
    setMicroQ([]);
    setMacroQ([]);
    setOutput([]);
  };

  const events = useMemo<{ desc: string; apply: () => void }[]>(() => {
    let id = 0;
    const next = () => ++id;
    return [
      { desc: 'Push main()', apply: () => setStack([{ id: next(), label: 'main()', kind: 'sync' }]) },
      { desc: 'console.log("1: sync start")', apply: () => setOutput((o) => [...o, '1: sync start']) },
      { desc: 'setTimeout queues macrotask', apply: () => setMacroQ((q) => [...q, { id: next(), label: 'cb (timeout)', kind: 'macro' }]) },
      { desc: 'Promise.resolve().then queues microtask', apply: () => setMicroQ((q) => [...q, { id: next(), label: '.then', kind: 'micro' }]) },
      { desc: 'console.log("5: sync end")', apply: () => setOutput((o) => [...o, '5: sync end']) },
      { desc: 'main() returns; pop frame', apply: () => setStack([]) },
      {
        desc: 'Drain microtask queue first',
        apply: () => {
          setMicroQ([]);
          setOutput((o) => [...o, '3: microtask']);
        },
      },
      {
        desc: 'Tick: next macrotask',
        apply: () => {
          setMacroQ([]);
          setOutput((o) => [...o, '2: macrotask']);
        },
      },
    ];
  }, []);

  useEffect(() => {
    if (!running) return;
    if (step >= events.length) {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => {
      events[step].apply();
      setStep((s) => s + 1);
    }, 900);
    return () => clearTimeout(id);
  }, [running, step, events]);

  const current = events[step];

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">JavaScript event loop visualizer</h4>
        <div className="flex items-center gap-2">
          <button onClick={() => { if (step >= events.length) reset(); setRunning((r) => !r); }} className="btn-primary h-8 text-xs">
            {running ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> {step >= events.length ? 'Replay' : 'Play'}</>}
          </button>
          <button onClick={() => { if (step >= events.length) return; events[step].apply(); setStep((s) => s + 1); }} className="btn-ghost h-8 text-xs">Step</button>
          <button onClick={reset} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Lane title="Call stack" items={stack} color="bg-rose-500/30 border-rose-400/30" reverse />
        <Lane title="Microtask queue" items={microQ} color="bg-cyan-500/30 border-cyan-400/30" />
        <Lane title="Macrotask queue" items={macroQ} color="bg-amber-500/30 border-amber-400/30" />
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">console.log</div>
          <div className="h-44 overflow-y-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-xs">
            {output.length === 0 ? <div className="text-ink-faint">// nothing yet</div> : output.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-white/5 bg-bg-soft/50 px-3 py-2 text-xs">
        <span className="font-mono text-ink-faint">step {Math.min(step + 1, events.length)} / {events.length}: </span>
        {current ? current.desc : 'done — microtasks always drain before the next macrotask'}
      </div>
    </Card>
  );
}

function Lane({ title, items, color, reverse }: { title: string; items: LoopItem[]; color: string; reverse?: boolean }) {
  const list = reverse ? [...items].reverse() : items;
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">{title}</div>
      <div className="flex h-44 flex-col gap-1 rounded-xl border border-white/5 bg-bg-soft/40 p-2">
        <AnimatePresence>
          {list.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className={cn('rounded border px-2 py-1 text-center font-mono text-[11px]', color)}
            >
              {it.label}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HooksPlayground() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  return (
    <Card>
      <h4 className="mb-3 font-semibold">React hooks in action</h4>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
          <div className="text-xs uppercase tracking-widest text-ink-faint">useState</div>
          <div className="mt-1 text-3xl font-semibold">{count}</div>
          <div className="mt-2 flex items-center gap-2">
            <button className="btn-ghost h-8 text-xs" onClick={() => setCount((c) => c - step)}>−{step}</button>
            <button className="btn-ghost h-8 text-xs" onClick={() => setCount((c) => c + step)}>+{step}</button>
            <button className="btn-ghost h-8 text-xs" onClick={() => setCount(0)}>reset</button>
            <input type="range" min="1" max="10" value={step} onChange={(e) => setStep(parseInt(e.target.value))} className="flex-1" />
            <span className="font-mono text-xs text-ink-dim">step={step}</span>
          </div>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 text-[12.5px] leading-relaxed text-ink-dim">{`function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  return (
    <button onClick={() => setCount(c => c + step)}>
      {count}
    </button>
  );
}

// useState returns the current value and a setter.
// React re-renders when setter is called with a new value.
// Use the function form (c => c + 1) when reading prev state.`}</pre>
      </div>
    </Card>
  );
}

function PerfBudget() {
  const [bytes, setBytes] = useState(420);
  const [reqs, setReqs] = useState(28);
  const [thirdParty, setThirdParty] = useState(120);

  const lcp = (bytes * 1000) / 350 + reqs * 8 + thirdParty * 1.5;
  const inp = 60 + reqs * 1.2 + thirdParty * 0.8 + Math.max(0, bytes - 300) * 0.3;
  const cls = Math.min(0.5, 0.02 + reqs * 0.0015 + thirdParty * 0.0006);

  const score = (val: number, good: number, poor: number) => (val <= good ? 'good' : val <= poor ? 'meh' : 'poor');
  const lcpClass = score(lcp, 2500, 4000);
  const inpClass = score(inp, 200, 500);
  const clsClass = score(cls, 0.1, 0.25);

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Performance budget calculator</h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Slider label="JS bundle (KB)" value={bytes} setValue={setBytes} min={50} max={1500} />
          <Slider label="Requests" value={reqs} setValue={setReqs} min={5} max={150} />
          <Slider label="Third-party scripts (KB)" value={thirdParty} setValue={setThirdParty} min={0} max={500} />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Vital name="LCP" value={`${(lcp / 1000).toFixed(2)}s`} status={lcpClass} thresholds="≤ 2.5s good · ≤ 4s ok" />
          <Vital name="INP" value={`${Math.round(inp)} ms`} status={inpClass} thresholds="≤ 200ms good · ≤ 500ms ok" />
          <Vital name="CLS" value={cls.toFixed(2)} status={clsClass} thresholds="≤ 0.1 good · ≤ 0.25 ok" />
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Numbers are illustrative. Real Web Vitals depend on device, network, and code.</p>
    </Card>
  );
}

function Slider({ label, value, setValue, min, max }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-ink-dim">{label}</span>
        <span className="font-mono text-ink">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => setValue(parseInt(e.target.value))} className="w-full" />
    </div>
  );
}

function Vital({ name, value, status, thresholds }: { name: string; value: string; status: 'good' | 'meh' | 'poor'; thresholds: string }) {
  const color = status === 'good' ? 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' : status === 'meh' ? 'text-amber-300 border-amber-400/30 bg-amber-400/10' : 'text-rose-300 border-rose-400/30 bg-rose-400/10';
  return (
    <div className={cn('rounded-xl border p-3', color)}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest">{name}</span>
        <span className="text-2xl font-semibold">{value}</span>
      </div>
      <div className="mt-1 text-[11px] opacity-80">{thresholds}</div>
    </div>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Which order does this print?\nconsole.log("a"); setTimeout(() => console.log("b")); Promise.resolve().then(() => console.log("c")); console.log("d");',
    options: ['a b c d', 'a d c b', 'a c d b', 'a d b c'],
    answer: 1,
    explain: 'Sync first (a, d). Microtasks (Promise) drain before macrotasks (setTimeout) → c, then b.',
  },
  {
    q: 'For one-dimensional layout (toolbar, nav row), the right tool is...',
    options: ['CSS Grid', 'Flexbox', 'Floats', 'Position absolute'],
    answer: 1,
    explain: 'Flexbox is 1D. Grid is 2D. Use Grid for full-page layouts, Flex for components in a row or column.',
  },
  {
    q: 'Which transform property is GPU-accelerated and won\'t cause layout?',
    options: ['width: 50%', 'top: 100px', 'transform: translateX(100px)', 'margin-left: 10px'],
    answer: 2,
    explain: 'Transforms run on the compositor and skip layout/paint. Animating left/top/width forces reflow.',
  },
  {
    q: 'A React component re-renders. Which is the most expensive?',
    options: ['Function execution', 'Reconciliation', 'Real DOM updates', 'Reading state'],
    answer: 2,
    explain: 'React calls your function and diffs the virtual DOM cheaply. The cost is committing changes to the actual DOM.',
  },
  {
    q: 'You ship a 1.2 MB JS bundle on the home page. Likely Web Vital impact?',
    options: ['Mostly CLS', 'Mostly INP', 'Mostly LCP — JS blocks rendering and main thread', 'No impact, modern browsers parse fast'],
    answer: 2,
    explain: 'Large JS delays parse, compile, and main-thread work — the LCP element waits.',
  },
];
