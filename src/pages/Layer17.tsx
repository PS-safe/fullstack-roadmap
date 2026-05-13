import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Atom, Box, FormInput, Layers as LayersIcon, Route as RouteIcon, Sparkles, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 17;

export default function Layer17() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="state" kicker="17.1" title="Where state actually lives">
        <TopicCard
          layerId={L}
          index={0}
          title="Server state ≠ client state ≠ URL state ≠ form state"
          description="Most React app pain comes from mixing these. Each has its own canonical tool."
        >
          <StateDecisionTree />
          <StateLibCompare />
        </TopicCard>
      </Section>

      <Section id="query" kicker="17.2" title="TanStack Query (data fetching done right)">
        <TopicCard
          layerId={L}
          index={1}
          title="Server state with cache, dedup, retry, optimistic updates"
          description="Stop putting fetched data in useState/useEffect. Query libraries solve cache invalidation, request dedup, mutation rollback — the bug-prone parts."
        >
          <TanStackQueryDemo />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={260}
          title="TanStack Query patterns (pseudo)"
          initial={`// READ: dedup + cache + auto-refetch + retry — all built in
// const { data, isLoading, error } = useQuery({
//   queryKey: ['user', userId],
//   queryFn: () => fetch('/api/users/' + userId).then(r => r.json()),
//   staleTime: 60_000,
// });

// WRITE: mutation with optimistic update + rollback
// const qc = useQueryClient();
// const m = useMutation({
//   mutationFn: (todo) => fetch('/api/todos', { method: 'POST', body: JSON.stringify(todo) }),
//   onMutate: async (newTodo) => {
//     await qc.cancelQueries({ queryKey: ['todos'] });
//     const previous = qc.getQueryData(['todos']);
//     qc.setQueryData(['todos'], (old) => [...old, { ...newTodo, id: 'temp' }]);
//     return { previous };
//   },
//   onError: (_err, _vars, ctx) => qc.setQueryData(['todos'], ctx.previous),
//   onSettled: () => qc.invalidateQueries({ queryKey: ['todos'] }),
// });

console.log('Read above. Pattern is universal — same shape in SWR, RTK Query.');`}
        />
      </Section>

      <Section id="forms" kicker="17.3" title="Forms: React Hook Form + Zod">
        <TopicCard
          layerId={L}
          index={2}
          title="Schema-first, controlled-when-needed"
          description="RHF is uncontrolled by default — fewer re-renders. Zod gives you one schema for client validation AND server parsing AND TypeScript types. One source of truth."
        >
          <FormPlayground />
        </TopicCard>
      </Section>

      <Section id="routing" kicker="17.4" title="Routing">
        <TopicCard
          layerId={L}
          index={3}
          title="React Router · TanStack Router · Next.js App Router"
          description="If you're inside Next.js, use the App Router. Standalone SPA: TanStack Router for type-safety, React Router for ecosystem."
        >
          <RoutingMatrix />
        </TopicCard>
      </Section>

      <Section id="patterns" kicker="17.5" title="Component patterns">
        <TopicCard
          layerId={L}
          index={4}
          title="Compound components, render props, controlled vs uncontrolled"
          description="The patterns that make components reusable without coupling them to a single layout or style."
        >
          <CompoundDemo />
          <ControlledVsUncontrolled />
        </TopicCard>
      </Section>

      <Section id="hooks" kicker="17.6" title="Custom hooks done right">
        <TopicCard
          layerId={L}
          index={5}
          title="Extract behavior, not just code"
          description="A custom hook is a contract: 'give me these inputs, I'll return this state and these handlers'. The win is reusable behavior with full type safety, not 'less code'."
        >
          <Bullets
            items={[
              <>Name custom hooks <InlineCode>use*</InlineCode> — required by the rules of hooks linter.</>,
              <>Hooks compose: <InlineCode>useUser()</InlineCode> can call <InlineCode>useQuery()</InlineCode> internally.</>,
              <>Don't put DOM access in hooks unless they need it (use refs); keep them platform-agnostic where possible.</>,
              <>If a hook returns more than 4 things, return an object — destructure at call site.</>,
            ]}
          />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={260}
          title="Custom hook examples"
          initial={`// useDebounce — defer a value
function useDebounce(value, delay = 300) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

// useToggle — boolean with helpers
function useToggle(initial = false) {
  const [v, setV] = React.useState(initial);
  return {
    value: v,
    on: () => setV(true),
    off: () => setV(false),
    toggle: () => setV((x) => !x),
  };
}

// useLocalStorage — persistent state
function useLocalStorage(key, initial) {
  const [v, setV] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial; }
    catch { return initial; }
  });
  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(v));
  }, [key, v]);
  return [v, setV];
}

console.log('Three hooks every app reuses. Keep them ~10 lines each.');`}
        />
      </Section>

      <Section id="animation" kicker="17.7" title="Animation libraries">
        <TopicCard
          layerId={L}
          index={6}
          title="Framer Motion · React Spring · auto-animate · CSS"
          description="Don't reach for a library before trying CSS transitions and the View Transitions API. When you need orchestration or physics-based motion, Motion is the default."
        >
          <AnimationCompare />
          <AnimationDemo />
        </TopicCard>
      </Section>

      <Section id="ui" kicker="17.8" title="Component libraries">
        <TopicCard
          layerId={L}
          index={7}
          title="shadcn/ui · Radix · Headless UI · Mantine · Chakra"
          description="Headless (Radix, Headless UI, RAC): you own the styles, they own behavior + a11y. Themed (Mantine, Chakra): you adopt their look. shadcn/ui = Radix + your own styles, copied into your repo."
        >
          <ComponentLibMatrix />
        </TopicCard>
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 17 Quiz">
        <Quiz id="L17" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-400/10 via-bg-card to-sky-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-cyan-400 to-sky-500 text-white">L17</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">React Patterns Deep</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Beyond useState in useEffect</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          The React patterns that compound: where state lives, schema-first forms, server-state with TanStack Query,
          compound components, animation, and the headless-component trade-off.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Atom className="h-4 w-4 text-cyan-400" />
          8 topics · 9 visualizers · 3 playgrounds · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function StateDecisionTree() {
  const buckets = [
    { kind: 'Server state', q: 'Comes from an API?', tool: 'TanStack Query / SWR / RTK Query', color: 'border-emerald-400/30 bg-emerald-400/5' },
    { kind: 'URL state', q: 'Should survive refresh? Shareable link?', tool: 'Router params / search params', color: 'border-cyan-400/30 bg-cyan-400/5' },
    { kind: 'Form state', q: 'Tied to inputs? Needs validation?', tool: 'React Hook Form + Zod', color: 'border-amber-400/30 bg-amber-400/5' },
    { kind: 'Local UI state', q: 'Open/closed, selected tab, hover?', tool: 'useState / useReducer in the component', color: 'border-rose-400/30 bg-rose-400/5' },
    { kind: 'Cross-tree shared state', q: 'Multiple trees need it (theme, auth, cart)?', tool: 'Zustand / Jotai / Context (small)', color: 'border-violet-400/30 bg-violet-400/5' },
    { kind: 'Persistent client state', q: 'Survives page reload, no API?', tool: 'localStorage / IndexedDB + tiny wrapper hook', color: 'border-blue-400/30 bg-blue-400/5' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Where does this state belong?</h4>
      <div className="space-y-2">
        {buckets.map((b) => (
          <div key={b.kind} className={cn('rounded-xl border p-3', b.color)}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">{b.kind}</span>
              <span className="font-mono text-xs text-ink-dim">{b.tool}</span>
            </div>
            <div className="mt-1 text-xs text-ink-dim">{b.q}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        The classic React mistake is putting server data in <InlineCode>useState</InlineCode> and refetching in <InlineCode>useEffect</InlineCode>. That's a query library reimplemented poorly.
      </p>
    </Card>
  );
}

function StateLibCompare() {
  const rows = [
    { name: 'useState / useReducer', size: '0 KB', store: 'component-local', when: 'Always start here' },
    { name: 'Context',                size: '0 KB', store: 'tree-scoped',   when: 'Theme, auth, locale (low-frequency updates)' },
    { name: 'Zustand',                size: '~1 KB', store: 'global',       when: 'Default for "shared global" state' },
    { name: 'Jotai',                  size: '~3 KB', store: 'atomic',        when: 'Many independent atoms; bottom-up composition' },
    { name: 'Redux Toolkit',          size: '~12 KB', store: 'global',       when: 'Big team / heavy DevTools needs / RTK Query stack' },
    { name: 'XState',                 size: '~13 KB', store: 'state machine', when: 'Complex finite state (auth flows, multi-step forms)' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Client state libraries</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Tool</th><th className="px-4 py-2 text-left">Size (gz)</th><th className="px-4 py-2 text-left">Model</th><th className="px-4 py-2 text-left">When to pick</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 font-mono text-ink-dim">{r.size}</td>
                <td className="px-4 py-2 text-ink-dim">{r.store}</td>
                <td className="px-4 py-2 text-ink-dim">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">2026 default for shared client state: <strong className="text-ink">Zustand</strong>. For server state: <strong className="text-ink">TanStack Query</strong>. Don't use one library for the other's job.</p>
    </Card>
  );
}

type FakeTodo = { id: number; text: string; status: 'pending' | 'done' };

function TanStackQueryDemo() {
  const [todos, setTodos] = useState<FakeTodo[]>([
    { id: 1, text: 'Read the docs', status: 'done' },
    { id: 2, text: 'Set up TanStack Query', status: 'pending' },
  ]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addOptimistic = () => {
    if (!draft.trim()) return;
    const tempId = -Date.now();
    setTodos((arr) => [...arr, { id: tempId, text: draft, status: 'pending' }]);
    setPending(tempId);
    setLog((l) => ['1. onMutate: optimistic add (id=temp)', ...l]);
    setDraft('');
    setTimeout(() => {
      // Simulate either success (replace temp) or failure (rollback)
      if (Math.random() > 0.25) {
        const realId = Math.floor(Math.random() * 1000) + 100;
        setTodos((arr) => arr.map((t) => (t.id === tempId ? { ...t, id: realId } : t)));
        setLog((l) => [`2. onSuccess: server returned id=${realId}; reconcile`, ...l]);
        setLog((l) => ['3. onSettled: invalidate ["todos"]', ...l]);
      } else {
        setTodos((arr) => arr.filter((t) => t.id !== tempId));
        setLog((l) => ['2. onError: server failed → rollback to previous cache', ...l]);
      }
      setPending(null);
    }, 1000);
  };

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Optimistic mutation (live)</h4>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <form onSubmit={(e) => { e.preventDefault(); addOptimistic(); }} className="flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="add a todo" className="input" />
            <button className="btn-primary">add</button>
          </form>
          <div className="mt-3 space-y-1">
            <AnimatePresence>
              {todos.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: pending === t.id ? 0.6 : 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-bg-soft/40 px-3 py-2 text-sm"
                >
                  <span>{t.text}</span>
                  <span className="font-mono text-[10px] text-ink-faint">id={t.id < 0 ? 'temp' : t.id}{pending === t.id && ' · saving'}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">Mutation lifecycle</div>
          <div className="h-44 overflow-y-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[12px]">
            {log.length === 0 ? <div className="text-ink-faint">// add a todo to see mutation events</div> : log.map((l, i) => <div key={i} className={cn(l.includes('onError') && 'text-rose-300', l.includes('onSuccess') && 'text-emerald-300')}>{l}</div>)}
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">25% of writes fail to demo rollback. With TanStack Query the UI revert is automatic.</p>
        </div>
      </div>
    </Card>
  );
}

function FormPlayground() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');

  // Pretend Zod parse
  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required';
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  if (!email) errors.email = 'Email is required';
  else if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) errors.email = 'Email is not valid';
  if (age && (!/^\d+$/.test(age) || parseInt(age) < 18 || parseInt(age) > 120)) errors.age = 'Age must be 18–120';

  const valid = Object.keys(errors).length === 0 && name && email;
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><FormInput className="h-4 w-4" /> <h4 className="font-semibold">Schema-first form (Zod-style)</h4></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <pre className="rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[12px] leading-5 text-ink-dim">{`const schema = z.object({
  name:  z.string().min(2),
  email: z.string().email(),
  age:   z.coerce.number().int()
                  .min(18).max(120).optional(),
});

type FormValues = z.infer<typeof schema>;

const { register, handleSubmit, formState } =
  useForm<FormValues>({ resolver: zodResolver(schema) });`}</pre>
          <p className="mt-2 text-xs text-ink-faint">Same schema validates server-side. Same schema generates the TS type. One source of truth.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-3">
          <Field label="Name" v={name} setV={setName} err={errors.name} />
          <Field label="Email" v={email} setV={setEmail} err={errors.email} />
          <Field label="Age (optional)" v={age} setV={setAge} err={errors.age} type="number" />
          <button className="btn-primary w-full" disabled={!valid}>{valid ? 'Submit' : 'Fix errors first'}</button>
        </form>
      </div>
    </Card>
  );
}

function Field({ label, v, setV, err, type = 'text' }: { label: string; v: string; setV: (s: string) => void; err?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs">
        <span className="mb-1 block uppercase tracking-widest text-ink-faint">{label}</span>
        <input type={type} value={v} onChange={(e) => setV(e.target.value)} className={cn('input', err ? 'border-rose-400/40' : '')} />
      </label>
      {err && <div className="mt-1 text-xs text-rose-300">{err}</div>}
    </div>
  );
}

function RoutingMatrix() {
  const rows = [
    { name: 'Next.js App Router',     model: 'file-system, server-first', types: 'inferred via TS', loader: 'Server Components + fetch + cache', when: 'Inside Next.js — no question' },
    { name: 'TanStack Router',         model: 'file-system or code',       types: 'fully inferred params + search',     loader: 'beforeLoad / loader, integrates with TanStack Query', when: 'Standalone SPA, want type safety end-to-end' },
    { name: 'React Router 6',          model: 'code-defined',              types: 'minimal',                           loader: 'loader / action (data routers)', when: 'Existing apps, vast ecosystem' },
    { name: 'wouter',                  model: 'minimal hooks',             types: 'minimal',                           loader: 'none',                              when: 'Tiny apps, embedded widgets' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><RouteIcon className="h-4 w-4" /> <h4 className="font-semibold">Routing comparator</h4></div>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Router</th><th className="px-4 py-2 text-left">Style</th><th className="px-4 py-2 text-left">Type-safety</th><th className="px-4 py-2 text-left">Data loading</th><th className="px-4 py-2 text-left">Pick when</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-ink-dim">{r.model}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.types}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.loader}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* compound demo */

const TabsCtx = ({ children, value }: { children: ReactNode; value: { active: string; setActive: (v: string) => void } }) => (
  <div data-tabs="">{children}</div>
);

function CompoundDemo() {
  const [active, setActive] = useState('overview');
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><LayersIcon className="h-4 w-4" /> <h4 className="font-semibold">Compound components — Tabs example</h4></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-5 text-ink-dim">{`<Tabs value={tab} onChange={setTab}>
  <Tabs.List>
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
    <Tabs.Tab value="billing">Billing</Tabs.Tab>
  </Tabs.List>

  <Tabs.Panel value="overview">…</Tabs.Panel>
  <Tabs.Panel value="settings">…</Tabs.Panel>
  <Tabs.Panel value="billing">…</Tabs.Panel>
</Tabs>

// Why compound:
//   - parent owns shared state (active tab)
//   - children opt in by name, in any layout
//   - users can interleave their own elements
//   - no monolithic "tabs={[...]}" prop`}</pre>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Live preview</div>
          <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-3">
            <div className="flex gap-1 border-b border-white/5">
              {['overview', 'settings', 'billing'].map((t) => (
                <button key={t} onClick={() => setActive(t)} className={cn('-mb-px border-b-2 px-3 py-1.5 text-sm', active === t ? 'border-accent text-accent' : 'border-transparent text-ink-dim')}>
                  {t}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-ink-dim">
                {active === 'overview' && 'Quick stats and recent activity.'}
                {active === 'settings' && 'Account preferences and security.'}
                {active === 'billing' && 'Subscription and invoices.'}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ControlledVsUncontrolled() {
  const [value, setValue] = useState('controlled — every keystroke re-renders parent');
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Controlled vs Uncontrolled inputs</h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-cyan-300">Controlled</div>
          <input value={value} onChange={(e) => setValue(e.target.value)} className="input" />
          <div className="mt-1 text-xs text-ink-faint">Parent owns state. Re-renders on every change. Easy validation, transformation, derived state.</div>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-amber-300">Uncontrolled</div>
          <input defaultValue="uncontrolled — DOM owns it" className="input" />
          <div className="mt-1 text-xs text-ink-faint">DOM owns the value. Read via ref or on submit. Fewer re-renders. RHF defaults to this.</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-dim">Rule: prefer uncontrolled for big forms (perf). Use controlled when you need to react to every keystroke (autocomplete, masked inputs).</p>
    </Card>
  );
}

function AnimationCompare() {
  const rows = [
    { tool: 'CSS transitions / @keyframes',     style: 'declarative, no JS', good: 'simple state changes (hover, open/close)', bad: 'no orchestration, no sequencing', size: '0 KB' },
    { tool: 'Framer Motion',                    style: 'declarative React',  good: 'gestures, layout transitions, orchestration, AnimatePresence', bad: 'large bundle (~30 KB)', size: '~30 KB' },
    { tool: 'react-spring',                     style: 'physics-based',      good: 'natural motion, rubber-band drag', bad: 'API takes practice', size: '~12 KB' },
    { tool: '@formkit/auto-animate',            style: 'one-line drop-in',   good: 'list reorder/add/remove with zero config', bad: 'limited customization', size: '~3 KB' },
    { tool: 'View Transitions API',             style: 'browser-native',     good: 'cross-page transitions, free', bad: 'partial browser support, polyfill needed', size: '0 KB (native)' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Animation tooling</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Tool</th><th className="px-4 py-2 text-left">Style</th><th className="px-4 py-2 text-left">Good for</th><th className="px-4 py-2 text-left">Watch out</th><th className="px-4 py-2 text-left">Size</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tool} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.tool}</td>
                <td className="px-4 py-2 text-ink-dim">{r.style}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.good}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.bad}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-dim">{r.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AnimationDemo() {
  const [items, setItems] = useState<number[]>([1, 2, 3, 4]);
  const [counter, setCounter] = useState(5);
  const add = () => { setItems((a) => [...a, counter]); setCounter((c) => c + 1); };
  const removeRandom = () => setItems((a) => a.filter((_, i) => i !== Math.floor(a.length / 2)));
  const shuffle = () => setItems((a) => [...a].sort(() => Math.random() - 0.5));
  const reset = () => { setItems([1, 2, 3, 4]); setCounter(5); };
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" /> Layout animation (Framer Motion)</h4>
        <div className="flex gap-2">
          <button onClick={add} className="btn-ghost h-8 text-xs">+ add</button>
          <button onClick={removeRandom} className="btn-ghost h-8 text-xs">− remove</button>
          <button onClick={shuffle} className="btn-ghost h-8 text-xs">shuffle</button>
          <button onClick={reset} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/5 bg-bg-soft/30 p-3">
        <AnimatePresence>
          {items.map((n) => (
            <motion.div
              key={n}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg"
            >
              {n}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Just <InlineCode>{`<motion.div layout>`}</InlineCode> + <InlineCode>{`<AnimatePresence>`}</InlineCode>. The library handles the FLIP math.</p>
    </Card>
  );
}

function ComponentLibMatrix() {
  const rows = [
    { name: 'shadcn/ui',   style: 'copy-paste',  basis: 'Radix + Tailwind', a11y: 'great', custom: 'unlimited (you own the code)', when: '2026 default for new TS apps' },
    { name: 'Radix UI',    style: 'headless',    basis: '—',                a11y: 'great', custom: 'styling is yours', when: 'You want primitives, not opinions' },
    { name: 'Headless UI', style: 'headless',    basis: '—',                a11y: 'good',  custom: 'styling is yours', when: 'Tailwind-first stack' },
    { name: 'React Aria',  style: 'headless',    basis: 'Adobe spec',       a11y: 'gold',  custom: 'styling is yours', when: 'Accessibility above all' },
    { name: 'Mantine',     style: 'styled',      basis: 'own design system', a11y: 'good',  custom: 'theme tokens', when: 'You want a finished look' },
    { name: 'Chakra UI',   style: 'styled',      basis: 'own design system', a11y: 'good',  custom: 'theme tokens', when: 'Mature React apps' },
    { name: 'MUI',         style: 'styled',      basis: 'Material Design',  a11y: 'good',  custom: 'theme + override', when: 'Material design required' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Box className="h-4 w-4" /> <h4 className="font-semibold">Component library comparator</h4></div>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Library</th><th className="px-4 py-2 text-left">Style</th><th className="px-4 py-2 text-left">Built on</th><th className="px-4 py-2 text-left">a11y</th><th className="px-4 py-2 text-left">Customisation</th><th className="px-4 py-2 text-left">When</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-ink-dim">{r.style}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.basis}</td>
                <td className="px-4 py-2 text-ink-dim">{r.a11y}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.custom}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">"Headless" = behavior + a11y, no styles. You ship the design. "Styled" = pre-built look you theme. shadcn/ui is the third way: you copy headless components into your repo, then own them.</p>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'You\'re fetching a list in useEffect, storing in useState, refetching on filter change. Better tool?',
    options: [
      'Redux',
      'TanStack Query — handles cache, dedup, retry, refetch on focus.',
      'Zustand',
      'Context',
    ],
    answer: 1,
    explain: 'Server state has its own toolset. Query libraries solve cache invalidation — the bug everyone reinvents.',
  },
  {
    q: 'Big form with 30 fields. To minimize re-renders use...',
    options: [
      'Controlled inputs in useState.',
      'Uncontrolled inputs (refs) or React Hook Form (uncontrolled by default).',
      'Context for each field.',
      'Redux per field.',
    ],
    answer: 1,
    explain: 'Each controlled keystroke re-renders the parent. RHF subscribes per-field and only re-renders what changed.',
  },
  {
    q: 'A "compound component" is one that...',
    options: [
      'Is rendered by multiple parents.',
      'Exposes sub-components (Tabs.Tab, Tabs.Panel) sharing state via context.',
      'Has many props.',
      'Combines two component libraries.',
    ],
    answer: 1,
    explain: 'Tabs / Tabs.List / Tabs.Tab / Tabs.Panel — composition over a fat config object.',
  },
  {
    q: 'You want behavior + accessibility, but bring your own styles. Pick:',
    options: ['Mantine', 'MUI', 'Radix UI / React Aria / Headless UI', 'Bootstrap'],
    answer: 2,
    explain: 'Headless libraries give you the keyboard handlers, ARIA, focus management — you style.',
  },
  {
    q: 'Optimistic update implies that on the server failing you should...',
    options: [
      'Show an error and keep the optimistic UI.',
      'Roll back to the previous cache, then surface the error.',
      'Retry forever.',
      'Refresh the page.',
    ],
    answer: 1,
    explain: 'The "optimistic" part is showing the change immediately. The contract is: revert on failure. TanStack Query does this for you via onError / context.',
  },
];
