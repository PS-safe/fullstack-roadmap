import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Boxes, Layers as LayersIcon, Component, Network as NetworkIcon } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { MermaidDiagram } from '../components/MermaidDiagram';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 9;

export default function Layer9() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="solid" kicker="9.1" title="SOLID Principles">
        <TopicCard
          layerId={L}
          index={0}
          title="Five rules for change-resilient code"
          description="SOLID is the OO classic, but the spirit (single concern, depend on abstractions, open to extension) applies to functional code too."
        >
          <SolidGrid />
        </TopicCard>
        <SolidExamples />
      </Section>

      <Section id="dry" kicker="9.2" title="DRY · KISS · YAGNI">
        <TopicCard
          layerId={L}
          index={1}
          title="The pragmatic three"
          description="Don't Repeat Yourself, Keep It Simple, You Aren't Gonna Need It. The most useful guidance is also the most ignored."
        >
          <Bullets
            items={[
              <><strong className="text-ink">DRY</strong>: extract a concept, not a coincidence. Two pieces of code that look similar but evolve separately are <em>not</em> duplicates.</>,
              <><strong className="text-ink">KISS</strong>: optimize for the next person reading this code at 2am. Clever code is a debt.</>,
              <><strong className="text-ink">YAGNI</strong>: don't build for hypothetical future requirements. Add the abstraction <em>when</em> the third use case shows up.</>,
              <>Related: separation of concerns, composition over inheritance, principle of least astonishment.</>,
            ]}
          />
        </TopicCard>
        <DryAntipatterns />
      </Section>

      <Section id="layered" kicker="9.3" title="Layered, Hexagonal, Clean, Onion">
        <TopicCard
          layerId={L}
          index={2}
          title="Where you draw the lines"
          description="All four are about isolating business logic from delivery and persistence. Pick the one that fits your team's vocabulary; the rules are nearly identical."
        >
          <ArchitectureSwitcher />
        </TopicCard>
        <MermaidDiagram
          chart={`flowchart TB
            subgraph delivery [Delivery / Adapters]
              HTTP[HTTP handler]
              GQL[GraphQL resolver]
              CLI[CLI command]
              Job[Worker / cron]
            end
            subgraph app [Application / Use cases]
              UC1[CreateOrder]
              UC2[ShipOrder]
              UC3[CancelOrder]
            end
            subgraph domain [Domain / Entities]
              Order((Order))
              Customer((Customer))
              Inventory((Inventory))
            end
            subgraph infra [Infrastructure / Adapters]
              DB[(Postgres)]
              MQ[Kafka]
              Mail[Email API]
              Cache[Redis]
            end
            HTTP --> UC1
            GQL --> UC2
            CLI --> UC3
            Job --> UC2
            UC1 --> Order
            UC2 --> Order
            UC3 --> Order
            Order --> DB
            UC2 --> MQ
            UC2 --> Mail
            UC1 --> Cache
            style domain fill:#1f2937,stroke:#22d3ee
            style app fill:#1f2937,stroke:#6366f1`}
          caption="Hexagonal / Clean: domain in the center, adapters on the edges"
        />
      </Section>

      <Section id="mvc" kicker="9.4" title="MVC, MVP, MVVM">
        <TopicCard
          layerId={L}
          index={3}
          title="The UI architecture family"
          description="Three takes on splitting UI from logic from data. They're often misunderstood — same words, different communities mean different things."
        >
          <MvcCompare />
        </TopicCard>
      </Section>

      <Section id="ddd" kicker="9.5" title="Domain-Driven Design">
        <TopicCard
          layerId={L}
          index={4}
          title="Bounded contexts, aggregates, ubiquitous language"
          description="DDD's strategic patterns (boundaries, contexts) matter more than the tactical ones (entities, value objects). Get the boundaries right and the rest falls out."
        >
          <Bullets
            items={[
              <><strong className="text-ink">Bounded context</strong>: one model, one team, one ubiquitous language. <InlineCode>Order</InlineCode> in Sales ≠ <InlineCode>Order</InlineCode> in Shipping.</>,
              <><strong className="text-ink">Aggregate</strong>: a cluster of entities with one root. The root is the only entry point and enforces invariants.</>,
              <><strong className="text-ink">Value object</strong>: identity-less, immutable. <InlineCode>Money</InlineCode>, <InlineCode>Address</InlineCode>, <InlineCode>DateRange</InlineCode>.</>,
              <><strong className="text-ink">Domain event</strong>: something that happened (past tense): <InlineCode>OrderShipped</InlineCode>, <InlineCode>PaymentFailed</InlineCode>.</>,
              <><strong className="text-ink">Anti-corruption layer</strong>: a translator between bounded contexts so each keeps its own language.</>,
            ]}
          />
        </TopicCard>
        <BoundedContextMap />
      </Section>

      <Section id="frontend" kicker="9.6" title="Frontend Architecture & Micro-Frontends">
        <TopicCard
          layerId={L}
          index={5}
          title="Component-driven, BFF, micro-frontends"
          description="Atomic Design organizes UI; BFF gives each frontend its own API; micro-frontends let independent teams ship to one app shell."
        >
          <Bullets
            items={[
              <><strong className="text-ink">Atomic Design</strong>: atoms → molecules → organisms → templates → pages.</>,
              <><strong className="text-ink">BFF (Backend-for-Frontend)</strong>: a thin server that aggregates and shapes data for one client (web, iOS, Android).</>,
              <><strong className="text-ink">Micro-frontends</strong>: split by domain (Checkout team owns /checkout). Stitch via iframes, web components, or Module Federation.</>,
              <><strong className="text-ink">Container vs presentational</strong>: still useful — separate "where data comes from" from "how it looks".</>,
            ]}
          />
        </TopicCard>
        <BffDiagram />
        <AtomicDesign />
      </Section>

      <Section id="patterns" kicker="9.7" title="GoF Design Patterns & Anti-Patterns">
        <TopicCard
          layerId={L}
          index={6}
          title="Vocabulary, not gospel"
          description="Knowing pattern names lets you communicate quickly. Knowing when *not* to apply them is more important."
        >
          <PatternLibrary />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={240}
          title="Strategy + Observer in 30 lines"
          initial={`// Strategy: parametrize behavior
const compress = {
  none: (s) => s,
  base64: (s) => btoa(s),
  reverse: (s) => s.split('').reverse().join(''),
};

function send(data, strategy) {
  const fn = compress[strategy] || compress.none;
  console.log('[' + strategy + ']', fn(data));
}

send('hello', 'none');
send('hello', 'base64');
send('hello', 'reverse');

// Observer: pub/sub
function emitter() {
  const subs = new Map();
  return {
    on: (e, fn) => { subs.set(e, [...(subs.get(e) || []), fn]); },
    emit: (e, p) => (subs.get(e) || []).forEach((fn) => fn(p)),
  };
}

const bus = emitter();
bus.on('order:placed', (o) => console.log('email:', o.id));
bus.on('order:placed', (o) => console.log('inventory:', o.id));
bus.emit('order:placed', { id: 42 });`}
        />
        <AntiPatterns />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 9 Quiz">
        <Quiz id="L9" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-orange-500/10 via-bg-card to-red-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-orange-500 to-red-500 text-white">L09</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Architecture & Design Patterns</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">How code stays soft</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Architecture is the set of decisions hardest to change later. Patterns are the vocabulary you use to discuss them.
          Get the boundaries right; the details follow.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Boxes className="h-4 w-4 text-orange-400" />
          7 topics · 7 visualizers · 1 playground · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function SolidGrid() {
  const items = [
    { key: 'S', name: 'Single Responsibility', short: 'A class/module has one reason to change.', tip: 'When you find yourself saying "and" describing what a module does, split it.' },
    { key: 'O', name: 'Open / Closed', short: 'Open to extension, closed to modification.', tip: 'Add new behavior by adding new code, not editing old code (plugins, strategies).' },
    { key: 'L', name: 'Liskov Substitution', short: 'Subtypes must be drop-in replacements.', tip: 'Square is NOT a Rectangle if Rectangle.setWidth(x) breaks Square invariant.' },
    { key: 'I', name: 'Interface Segregation', short: 'Many small interfaces > one fat one.', tip: 'Don\'t force clients to depend on methods they don\'t use.' },
    { key: 'D', name: 'Dependency Inversion', short: 'Depend on abstractions, not concretions.', tip: 'Pass the database client in via interface; don\'t import a singleton.' },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
      {items.map((it, i) => (
        <motion.div
          key={it.key}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          viewport={{ once: true }}
          className="rounded-xl border border-white/5 bg-bg-soft/40 p-4"
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 font-mono text-lg font-bold text-white">
            {it.key}
          </div>
          <div className="mt-2 text-sm font-semibold">{it.name}</div>
          <div className="mt-1 text-xs text-ink-dim">{it.short}</div>
          <div className="mt-2 rounded-md border border-white/5 bg-white/[0.03] p-2 text-[11px] text-ink-faint">{it.tip}</div>
        </motion.div>
      ))}
    </div>
  );
}

function SolidExamples() {
  const [pick, setPick] = useState<'S' | 'O' | 'D'>('S');
  const examples = {
    S: {
      title: 'Single Responsibility',
      bad: `class User {
  save() { /* DB code */ }
  sendWelcomeEmail() { /* SMTP */ }
  toCSV() { /* serialization */ }
}
// Three reasons to change.`,
      good: `class User { /* fields only */ }
class UserRepository { save(u: User) {} }
class UserMailer { sendWelcome(u: User) {} }
class UserCsv { format(u: User): string {} }`,
    },
    O: {
      title: 'Open / Closed',
      bad: `function discount(order, kind) {
  if (kind === 'student') return order.total * 0.9;
  if (kind === 'senior')  return order.total * 0.85;
  if (kind === 'staff')   return order.total * 0.7;
  // every new discount = edit this function
}`,
      good: `interface Discount { apply(o: Order): number }
class StudentDiscount implements Discount { ... }
class SeniorDiscount implements Discount { ... }

function priceWith(o, d: Discount) { return d.apply(o); }
// New discount = new class. No edit to existing code.`,
    },
    D: {
      title: 'Dependency Inversion',
      bad: `import { pgClient } from './db';
class OrderService {
  list() { return pgClient.query('SELECT * FROM orders'); }
}
// Tightly coupled to Postgres. Hard to test, hard to swap.`,
      good: `interface OrderRepo { list(): Promise<Order[]> }
class OrderService {
  constructor(private repo: OrderRepo) {}
  list() { return this.repo.list(); }
}
// Pass FakeRepo in tests, PgRepo in prod.`,
    },
  };
  const ex = examples[pick];
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">SOLID — before / after</h4>
        <div className="flex gap-1.5">
          {(['S', 'O', 'D'] as const).map((k) => (
            <button key={k} onClick={() => setPick(k)} className={cn('rounded-md border px-2 py-1 font-mono text-xs', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="text-sm font-medium">{ex.title}</div>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-rose-300">Bad</div>
          <pre className="overflow-x-auto rounded-xl border border-rose-400/30 bg-rose-400/5 p-3 font-mono text-[12px] leading-5 text-ink-dim">{ex.bad}</pre>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-emerald-300">Good</div>
          <pre className="overflow-x-auto rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3 font-mono text-[12px] leading-5 text-ink-dim">{ex.good}</pre>
        </div>
      </div>
    </Card>
  );
}

function DryAntipatterns() {
  const examples = [
    {
      title: 'False DRY (premature)',
      desc: 'Two methods look the same now but evolve separately. Sharing them couples unrelated features.',
      code: `// Don't extract until you have ≥3 instances and you're sure they share intent.`,
    },
    {
      title: 'Over-engineering',
      desc: 'A "framework for the framework". 5 files for what could have been 30 lines.',
      code: `class FactoryBuilderProviderManagerImpl // ← run away`,
    },
    {
      title: 'Speculative generality',
      desc: 'Adding parameters / hooks for cases you imagine but never need.',
      code: `function send(msg, opts = { retry: 3, timeout: 5000, fallback: null, hook: null })  // YAGNI`,
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {examples.map((e) => (
        <div key={e.title} className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
          <div className="text-sm font-semibold text-amber-200">{e.title}</div>
          <p className="mt-1 text-xs text-ink-dim">{e.desc}</p>
          <pre className="mt-2 rounded border border-white/5 bg-black/40 p-2 font-mono text-[11px] text-ink-faint">{e.code}</pre>
        </div>
      ))}
    </div>
  );
}

function ArchitectureSwitcher() {
  const [pick, setPick] = useState<'layered' | 'hex' | 'clean' | 'onion'>('layered');
  const data = {
    layered: {
      label: 'Layered (n-tier)',
      desc: 'Strict top-down: presentation → application → domain → data. Each layer only depends on the one below.',
      pros: ['Easy to learn', 'Maps to many existing codebases'],
      cons: ['Domain ends up depending on data layer', 'Hard to test domain in isolation'],
      stack: ['Presentation', 'Application', 'Domain', 'Persistence'],
    },
    hex: {
      label: 'Hexagonal (Ports & Adapters)',
      desc: 'Domain in the center; ports = interfaces; adapters = implementations (HTTP, DB, queue). Dependency arrows point inward.',
      pros: ['Domain knows nothing about delivery or DB', 'Trivial to swap or fake adapters'],
      cons: ['More files', 'Indirection requires team buy-in'],
      stack: ['Adapter', 'Port', 'Application', 'Domain', 'Port', 'Adapter'],
    },
    clean: {
      label: 'Clean Architecture',
      desc: 'Same idea as hex with concentric circles: entities at the core, then use cases, then interface adapters, then frameworks.',
      pros: ['Crystal-clear dependency rule (inward only)', 'Frameworks become details, not foundations'],
      cons: ['Beginners over-apply it everywhere', 'YAGNI for small apps'],
      stack: ['Frameworks', 'Interface adapters', 'Use cases', 'Entities'],
    },
    onion: {
      label: 'Onion',
      desc: 'Ring model: domain model at the center, then domain services, then app services, then infrastructure.',
      pros: ['Same dependency rule as Clean / Hex'],
      cons: ['Yet another name for the same idea'],
      stack: ['Infrastructure', 'App services', 'Domain services', 'Domain model'],
    },
  };
  const d = data[pick];
  return (
    <Card>
      <div className="mb-3 flex flex-wrap gap-2">
        {(['layered', 'hex', 'clean', 'onion'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setPick(k)}
            className={cn('rounded-md border px-3 py-1.5 text-xs', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}
          >
            {data[k].label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
        <div>
          <p className="text-sm text-ink-dim">{d.desc}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3">
              <div className="text-xs uppercase tracking-widest text-emerald-300">Pros</div>
              <ul className="mt-1 space-y-1 text-xs text-ink-dim">
                {d.pros.map((p) => <li key={p}>+ {p}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs uppercase tracking-widest text-rose-300">Cons</div>
              <ul className="mt-1 space-y-1 text-xs text-ink-dim">
                {d.cons.map((p) => <li key={p}>− {p}</li>)}
              </ul>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-3">
          <div className="text-xs uppercase tracking-widest text-ink-faint">Layers</div>
          <div className="mt-2 space-y-1">
            <AnimatePresence mode="wait">
              <motion.div key={pick} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1">
                {d.stack.map((s, i) => (
                  <div
                    key={i}
                    className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-center text-xs"
                    style={{ marginLeft: `${Math.min(i, d.stack.length - 1 - i) * 6}px`, marginRight: `${Math.min(i, d.stack.length - 1 - i) * 6}px` }}
                  >
                    {s}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MvcCompare() {
  const cols = [
    {
      name: 'MVC',
      controller: 'Routes input → Model. Picks View.',
      view: 'Renders Model state. May listen for changes.',
      use: 'Server-rendered web (Rails, Django).',
      flow: 'Input → Controller → Model → View',
    },
    {
      name: 'MVP',
      controller: 'Presenter pulls from Model, pushes to View. View is "humble" (no logic).',
      view: 'Passive — Presenter sets every value.',
      use: 'Desktop apps, easy unit-test of Presenter.',
      flow: 'View → Presenter ↔ Model',
    },
    {
      name: 'MVVM',
      controller: 'ViewModel exposes observable state. View binds to it.',
      view: 'Declarative bindings (Vue / Angular / WPF).',
      use: 'Reactive UIs. State changes propagate automatically.',
      flow: 'View ⇄ ViewModel ⇄ Model',
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {cols.map((c) => (
        <div key={c.name} className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
          <div className="text-lg font-semibold">{c.name}</div>
          <div className="mt-2 space-y-1 text-xs text-ink-dim">
            <div><span className="text-ink-faint">Mediator:</span> {c.controller}</div>
            <div><span className="text-ink-faint">View:</span> {c.view}</div>
            <div><span className="text-ink-faint">Best for:</span> {c.use}</div>
          </div>
          <div className="mt-3 rounded-md border border-white/5 bg-black/30 p-2 text-center font-mono text-[11px] text-accent-cyan">
            {c.flow}
          </div>
        </div>
      ))}
    </div>
  );
}

function BoundedContextMap() {
  const [pick, setPick] = useState<string | null>(null);
  const contexts = [
    { name: 'Catalog', x: 60, y: 40, color: '#6366f1', concepts: ['Product', 'Category', 'Variant'] },
    { name: 'Sales', x: 220, y: 40, color: '#22d3ee', concepts: ['Cart', 'Order', 'Customer'] },
    { name: 'Shipping', x: 380, y: 40, color: '#34d399', concepts: ['Shipment', 'Carrier', 'Address'] },
    { name: 'Billing', x: 220, y: 160, color: '#f59e0b', concepts: ['Invoice', 'Payment', 'Customer'] },
    { name: 'Identity', x: 60, y: 160, color: '#a78bfa', concepts: ['User', 'Account', 'Role'] },
    { name: 'Notifications', x: 380, y: 160, color: '#f43f5e', concepts: ['Email', 'SMS', 'Push'] },
  ];
  const arrows = [
    ['Sales', 'Catalog'],
    ['Sales', 'Identity'],
    ['Sales', 'Billing'],
    ['Sales', 'Shipping'],
    ['Billing', 'Notifications'],
    ['Shipping', 'Notifications'],
  ];
  const cur = pick ? contexts.find((c) => c.name === pick) : null;

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Bounded context map</h4>
      <svg viewBox="0 0 480 240" className="w-full">
        {arrows.map(([a, b]) => {
          const ca = contexts.find((c) => c.name === a)!;
          const cb = contexts.find((c) => c.name === b)!;
          return <path key={`${a}-${b}`} d={`M${ca.x + 50},${ca.y + 25} L${cb.x + 50},${cb.y + 25}`} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" />;
        })}
        {contexts.map((c) => (
          <g key={c.name} onClick={() => setPick(c.name)} style={{ cursor: 'pointer' }}>
            <rect x={c.x} y={c.y} width="100" height="50" rx="10" fill={pick === c.name ? c.color : 'rgba(255,255,255,0.05)'} stroke={c.color} strokeWidth="1.5" />
            <text x={c.x + 50} y={c.y + 30} textAnchor="middle" fill="white" fontSize="13" fontFamily="ui-sans-serif">{c.name}</text>
          </g>
        ))}
      </svg>
      <AnimatePresence mode="wait">
        {cur && (
          <motion.div key={cur.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 rounded-xl border border-white/5 bg-bg-soft/40 p-3">
            <div className="text-sm font-semibold" style={{ color: cur.color }}>{cur.name}</div>
            <div className="mt-1 text-xs text-ink-dim">Concepts in this context: <span className="font-mono text-ink">{cur.concepts.join(', ')}</span></div>
            <div className="mt-1 text-[11px] text-ink-faint">
              Note: <strong>Customer</strong> appears in Sales <em>and</em> Billing — different shapes. The translation between them is your anti-corruption layer.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function BffDiagram() {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <NetworkIcon className="h-4 w-4" />
        <h4 className="font-semibold">Backend-for-Frontend</h4>
      </div>
      <svg viewBox="0 0 600 280" className="w-full">
        {/* Clients */}
        {[
          { x: 40, label: 'Web', color: '#6366f1' },
          { x: 230, label: 'iOS', color: '#22d3ee' },
          { x: 420, label: 'Android', color: '#34d399' },
        ].map((c) => (
          <g key={c.label}>
            <rect x={c.x} y={20} width="140" height="40" rx="8" fill="rgba(255,255,255,0.04)" stroke={c.color} />
            <text x={c.x + 70} y={45} textAnchor="middle" fill="white" fontSize="12">{c.label}</text>
          </g>
        ))}
        {/* BFFs */}
        {[
          { x: 40, label: 'Web BFF', color: '#6366f1' },
          { x: 230, label: 'iOS BFF', color: '#22d3ee' },
          { x: 420, label: 'Android BFF', color: '#34d399' },
        ].map((b, i) => (
          <g key={b.label}>
            <line x1={b.x + 70} y1={60} x2={b.x + 70} y2={110} stroke={b.color} strokeWidth="1.5" />
            <rect x={b.x} y={110} width="140" height="40" rx="8" fill={b.color + '20'} stroke={b.color} />
            <text x={b.x + 70} y={135} textAnchor="middle" fill="white" fontSize="12">{b.label}</text>
            <line x1={b.x + 70} y1={150} x2={300 + (i - 1) * 120} y2={210} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
          </g>
        ))}
        {/* Microservices */}
        {[
          { x: 60, label: 'Catalog' },
          { x: 200, label: 'Orders' },
          { x: 340, label: 'Auth' },
          { x: 480, label: 'Payments' },
        ].map((m) => (
          <g key={m.label}>
            <rect x={m.x} y={210} width="100" height="40" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.2)" />
            <text x={m.x + 50} y={235} textAnchor="middle" fill="#9aa6b2" fontSize="11">{m.label}</text>
          </g>
        ))}
      </svg>
      <p className="mt-3 text-xs text-ink-dim">
        Each client gets a BFF tuned for it (different fields, different aggregation, different auth). Behind the BFFs, the same microservices serve everyone.
      </p>
    </Card>
  );
}

function AtomicDesign() {
  const levels = [
    { name: 'Atoms', items: 'Button, Input, Label, Icon', color: 'bg-rose-500' },
    { name: 'Molecules', items: 'SearchField (Input + Button), FormRow (Label + Input)', color: 'bg-amber-500' },
    { name: 'Organisms', items: 'Header, ProductCard, CommentList', color: 'bg-emerald-500' },
    { name: 'Templates', items: 'Page layouts with placeholder data', color: 'bg-cyan-500' },
    { name: 'Pages', items: 'Real content in a Template', color: 'bg-violet-500' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Component className="h-4 w-4" />
        <h4 className="font-semibold">Atomic Design</h4>
      </div>
      <div className="space-y-1">
        {levels.map((l, i) => (
          <div
            key={l.name}
            className="flex items-center gap-3 rounded-lg border border-white/5 bg-bg-soft/40 p-3"
            style={{ marginLeft: `${i * 14}px` }}
          >
            <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded text-xs font-bold text-white', l.color)}>
              {i + 1}
            </span>
            <div>
              <div className="text-sm font-semibold">{l.name}</div>
              <div className="text-xs text-ink-dim">{l.items}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PatternLibrary() {
  const [pick, setPick] = useState('Singleton');
  const patterns: Record<string, { kind: string; intent: string; example: string }> = {
    Singleton: { kind: 'Creational', intent: 'One instance, global access.', example: 'Logger, ConfigService — but most "singletons" are just hidden globals. Avoid.' },
    Factory: { kind: 'Creational', intent: 'Decide which class to instantiate at runtime.', example: 'createConnection(env) → PgConnection or SqliteConnection' },
    Builder: { kind: 'Creational', intent: 'Construct complex objects step by step.', example: 'queryBuilder.where(...).orderBy(...).limit(10).build()' },
    Adapter: { kind: 'Structural', intent: 'Translate one interface to another.', example: 'StripeAdapter implements PaymentGateway' },
    Decorator: { kind: 'Structural', intent: 'Add behavior without subclassing.', example: 'withLogging(handler), withRetry(handler) — middleware' },
    Facade: { kind: 'Structural', intent: 'One simple API in front of a complex subsystem.', example: 'class Auth { login(), logout(), isLoggedIn() } over OAuth + cookies + DB' },
    Strategy: { kind: 'Behavioral', intent: 'Swap algorithms at runtime.', example: 'sort(arr, comparator). compress(data, "gzip" | "brotli")' },
    Observer: { kind: 'Behavioral', intent: 'One-to-many notification.', example: 'EventEmitter, RxJS Subjects, React state' },
    Command: { kind: 'Behavioral', intent: 'Encapsulate a request as an object.', example: 'Undo/redo stack, CQRS commands, job queue payloads' },
    State: { kind: 'Behavioral', intent: 'Object behaviour changes with internal state.', example: 'Order: pending → paid → shipped → delivered' },
  };
  const cur = patterns[pick];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Pattern picker</h4>
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(patterns).map((p) => (
          <button
            key={p}
            onClick={() => setPick(p)}
            className={cn('rounded-md border px-2.5 py-1 text-xs', pick === p ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim hover:bg-white/10')}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-white/5 bg-bg-soft/40 p-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-accent-cyan">{cur.kind}</span>
          <span className="text-base font-semibold">{pick}</span>
        </div>
        <p className="mt-2 text-sm text-ink-dim">{cur.intent}</p>
        <p className="mt-1 text-xs text-ink-faint"><strong className="text-ink-dim">Example:</strong> {cur.example}</p>
      </div>
    </Card>
  );
}

function AntiPatterns() {
  const items = [
    { name: 'God Object', desc: 'One class that knows or does everything. Touches every change.' },
    { name: 'Spaghetti Code', desc: 'Goto-style flow with no clear seams. Often hidden in monster functions.' },
    { name: 'Magic Numbers', desc: 'Unnamed literals scattered through code. 86400, 0.85 — what do they mean?' },
    { name: 'Hidden Coupling', desc: 'Modules that share global state, env vars, or untyped event payloads.' },
    { name: 'Premature Optimization', desc: 'Cleverness before measurement. Read: Knuth.' },
    { name: 'Lava Flow', desc: 'Old code nobody dares touch — half-rewrites, dead branches, ancient TODOs.' },
    { name: 'Cargo Cult', desc: 'Copying patterns without understanding why. "We do hex because Netflix does."' },
    { name: 'Goldplating', desc: 'Polishing features the user never asked for instead of shipping.' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Anti-patterns to recognize</h4>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.name} className="rounded-lg border border-rose-400/20 bg-rose-400/5 p-3">
            <div className="text-sm font-semibold text-rose-200">{it.name}</div>
            <div className="mt-1 text-xs text-ink-dim">{it.desc}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Which SOLID letter says "depend on abstractions, not concretions"?',
    options: ['S', 'L', 'I', 'D'],
    answer: 3,
    explain: 'D = Dependency Inversion. High-level modules and low-level modules both depend on the same interface.',
  },
  {
    q: 'Hexagonal architecture\'s key idea is...',
    options: [
      'Six-sided diagrams.',
      'Domain at the center; adapters on the outside; dependency arrows point inward.',
      'Six microservices.',
      'A pattern for service mesh.',
    ],
    answer: 1,
    explain: 'The "hexagon" is just the visual — the rule is that the domain knows nothing about delivery (HTTP) or persistence (DB).',
  },
  {
    q: 'In DDD, what does "bounded context" mean?',
    options: [
      'A maximum line of code count.',
      'A part of the system with its own model and ubiquitous language.',
      'A database transaction boundary.',
      'A team meeting.',
    ],
    answer: 1,
    explain: '"Customer" in Sales and "Customer" in Billing can be different shapes — each context owns its meaning.',
  },
  {
    q: 'Why use a Backend-for-Frontend (BFF)?',
    options: [
      'To replace microservices with a monolith.',
      'To shape and aggregate API responses for a specific client (web vs mobile vs TV).',
      'To cache static assets.',
      'To handle authentication only.',
    ],
    answer: 1,
    explain: 'Each client has different field needs and aggregation patterns. BFFs avoid the "lowest common denominator" API.',
  },
  {
    q: 'Strategy pattern lets you...',
    options: [
      'Make a class with one instance.',
      'Wrap an object to add features.',
      'Swap algorithms (sort, compress, render) at runtime.',
      'Notify many listeners of one event.',
    ],
    answer: 2,
    explain: 'Strategy parametrizes behavior. Encapsulate each algorithm; clients pick which to use.',
  },
];
