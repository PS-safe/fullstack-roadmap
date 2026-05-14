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
          description="Don't Repeat Yourself, Keep It Simple, You Aren't Gonna Need It. All three lose to over-engineering far more often than to under-engineering — the default failure mode of a learning engineer is too much structure, not too little."
        >
          <Bullets
            items={[
              <><strong className="text-ink">DRY is about knowledge, not characters.</strong> Extract when two pieces share a <em>reason to change</em> — one concept, one stakeholder. Two functions that look identical today but answer to different stakeholders (a tax rule and a discount rule that both happen to be <InlineCode>x * 0.9</InlineCode>) will diverge; sharing them couples unrelated features so one team's change breaks the other's. The smell of false DRY is a shared helper with a <InlineCode>kind</InlineCode> flag and growing branches inside it.</>,
              <><strong className="text-ink">KISS — clever is a debt that compounds.</strong> Optimize for the person debugging this at 2am, who is often you. The cost isn't writing the clever version, it's that every future reader pays the re-derivation tax. A dumb explicit <InlineCode>switch</InlineCode> beats a one-line lookup nobody can modify safely.</>,
              <><strong className="text-ink">YAGNI — build for the requirement in front of you.</strong> Add the parameter, hook, or layer <em>when</em> the case actually arrives, not when you imagine it. The cost of waiting is one refactor later; the cost of speculating is carrying — and testing, and explaining — flexibility nobody uses, often shaped wrong because you guessed before you knew.</>,
              <><strong className="text-ink">The tension: DRY pushes toward abstraction, YAGNI pushes against it.</strong> The tiebreaker is the rule of three — duplication is cheaper than the wrong abstraction. Wait for the third instance <em>and</em> a confirmed shared intent before extracting. "Duplication is far cheaper than the wrong abstraction" (Sandi Metz) is the load-bearing sentence here.</>,
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
          description="All four isolate business logic from delivery and persistence, and the dependency rule is identical — arrows point inward, toward the domain. They differ in vocabulary and diagram shape, not substance. The one decision that actually does the work is DIP: the domain depends on an interface, the DB adapter implements it. Everything else is bookkeeping on top of that."
        >
          <ArchitectureSwitcher />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">When each — and when none</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Layered, or no architecture</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Small app or a CRUD service with a thin rules layer → plain layered, or honestly just a controller and an ORM. The classic layered trap: "each layer depends on the one below" quietly lets the domain import the data layer, so you can't test the domain without a database. If you go layered, still point that one arrow inward.
              </p>
            </div>
            <div className="rounded-xl border border-indigo-400/30 bg-indigo-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Hexagonal / Clean / Onion</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Real domain logic worth protecting <em>and</em> a concrete need to swap or fake I/O (test without the DB, support a second persistence target, mock an external API). The payoff is a domain test suite that runs in milliseconds with no infrastructure. The tax is more files and more indirection — it needs team buy-in, and on a 200-line CRUD app it's pure overhead.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Hexagonal, Clean, and Onion are the <em>same architecture</em> drawn three ways — ports/adapters, concentric circles, rings. Pick the vocabulary your team already speaks; don't adopt Clean because Netflix did. The honest cost question: are you writing more interfaces than you have implementations? Then you've bought flexibility nobody's using yet.
          </p>
        </Card>
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
          description="Three takes on splitting UI from logic from data — all aiming at a testable view layer, differing in who pushes state to the view. Be precise about which you mean: 'MVC' in Rails, in iOS, and in a 2005 Java book are three different diagrams, and most arguments about them are people using the same word for different things. The deciding question: does your UI framework give you data-binding?"
        >
          <MvcCompare />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">When each — picked by one question</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            <strong className="text-ink">Server-rendered, no binding</strong> → <strong>MVC</strong>. Request comes in, controller mutates the model, picks a view, view renders once. Rails, Django, Laravel. The model and view can drift because the round-trip resets everything.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
            <strong className="text-ink">You need the view fully unit-testable with no UI framework loaded</strong> → <strong>MVP</strong>. The view is "humble" — it has no logic, the presenter sets every value explicitly. You test the presenter against a fake view interface. The cost is verbosity: every field is a manual <InlineCode>view.setX(...)</InlineCode> call.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
            <strong className="text-ink">Your framework has declarative data-binding</strong> → <strong>MVVM</strong>. The view-model exposes observable state, the view binds to it, changes propagate automatically — Vue, Angular, WPF. React isn't classic MVVM (no two-way binding), but a component plus its hooks is the same shape: hooks are the view-model, JSX is the view. Picking MVP or MVVM by taste rather than by "do I have binding" is how you end up fighting the framework.
          </p>
        </Card>
      </Section>

      <Section id="ddd" kicker="9.5" title="Domain-Driven Design">
        <TopicCard
          layerId={L}
          index={4}
          title="Bounded contexts, aggregates, ubiquitous language"
          description="DDD's strategic patterns (boundaries, contexts) matter more than the tactical ones (entities, value objects). Get the boundaries wrong and the tactical patterns just decorate a confused model — entities and value objects on top of bad boundaries are still bad design."
        >
          <Bullets
            items={[
              <><strong className="text-ink">Bounded context — the unit that actually matters.</strong> One model, one team, one ubiquitous language. <InlineCode>Customer</InlineCode> in Sales (cart, payment method, lifetime value) and <InlineCode>Customer</InlineCode> in Shipping (name, address, delivery instructions) are <em>different objects that share an id</em> — and that is correct, not a bug to unify. Forcing one shared <InlineCode>Customer</InlineCode> class produces a god object every team has to touch and nobody fully understands.</>,
              <><strong className="text-ink">Ubiquitous language is enforced, not aspirational.</strong> The words in the code are the words the domain expert uses — if they say "policy" and the code says "record", every conversation needs a translation step and bugs hide in the gap. The payoff: a domain expert can read a method name and tell you it's wrong.</>,
              <><strong className="text-ink">Aggregate — a consistency boundary, keep it small.</strong> A cluster of entities with one root; the root is the only entry point and enforces invariants in <em>one</em> transaction. The failure mode is the greedy aggregate: pull <InlineCode>Order</InlineCode> + every <InlineCode>LineItem</InlineCode> + <InlineCode>Customer</InlineCode> + <InlineCode>Inventory</InlineCode> under one root and every concurrent order update now contends on the same lock and loads half the database. Reference other aggregates by id, not by object.</>,
              <><strong className="text-ink">Value object</strong>: identity-less, immutable, compared by value. <InlineCode>Money</InlineCode>, <InlineCode>Address</InlineCode>, <InlineCode>DateRange</InlineCode>. Modelling these as plain primitives is where the validation-everywhere smell comes from — make <InlineCode>Money</InlineCode> a type and "can't add USD to EUR" becomes a compile error, not a runtime check copy-pasted in twelve places.</>,
              <><strong className="text-ink">Domain event</strong>: something that happened, past tense — <InlineCode>OrderShipped</InlineCode>, <InlineCode>PaymentFailed</InlineCode>. It's how one aggregate tells another the world changed without a direct call (this is the seam L7's event-driven and CQRS designs build on).</>,
              <><strong className="text-ink">Anti-corruption layer (ACL)</strong>: a translator at a context boundary so each side keeps its own language. When you integrate a legacy system or a third-party API, the ACL stops their model from leaking into yours — without it, their <InlineCode>Customer</InlineCode> shape slowly infects your domain and you've lost the boundary.</>,
            ]}
          />
        </TopicCard>
        <BoundedContextMap />
        <Card>
          <h4 className="mb-3 font-semibold">When DDD is the wrong call</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">No domain worth protecting</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                If the app is CRUD with a thin rules layer — a form saves a row, a list reads rows — DDD's aggregates, repositories, and domain events are pure ceremony. You get five files and three indirections for what a controller and an ORM call would do. DDD earns its cost only where the business logic itself is hard: pricing, scheduling, eligibility, settlement.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Tactical without strategic</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                The common failure: a team reads the blue book, adds <InlineCode>Entity</InlineCode> base classes and <InlineCode>ValueObject</InlineCode> wrappers and a <InlineCode>Repository</InlineCode> per table — but never draws the context boundaries. Result is the same big shared model as before, now with more boilerplate. The boundaries are the value; the building blocks are bookkeeping.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Rule of thumb: do the strategic work (context map, ubiquitous language) on any non-trivial system — it's just talking to domain experts and drawing boxes. Reach for the tactical patterns only inside a context whose logic is genuinely complex.
          </p>
        </Card>
      </Section>

      <Section id="frontend" kicker="9.6" title="Frontend Architecture & Micro-Frontends">
        <TopicCard
          layerId={L}
          index={5}
          title="Component-driven, BFF, micro-frontends"
          description="The same dependency-and-boundary thinking, applied to the frontend. Each of these is a tool with a real tax — the judgment is matching the tool to a problem you actually have, not adopting it because a bigger company did."
        >
          <Bullets
            items={[
              <><strong className="text-ink">Atomic Design</strong>: atoms → molecules → organisms → templates → pages — a shared vocabulary for a component library, not a law. Its value is letting a team say "that's an organism" and agree on scope. The failure mode is treating the taxonomy as the goal: agonizing over whether a search field is a molecule or an organism is wasted time. Use it to communicate, don't litigate it.</>,
              <><strong className="text-ink">Container vs presentational</strong>: separate "where data comes from" from "how it looks". Hooks blurred the mechanical split (you no longer need a wrapper component), but the <em>principle</em> holds — a component that both fetches and renders is hard to test and hard to reuse. Keep data-access in a hook or a parent, keep the leaf component a pure function of props. This is L4 craft; here it's the same boundary rule, scoped to one component.</>,
              <><strong className="text-ink">BFF (Backend-for-Frontend)</strong>: a thin per-client server that aggregates and shapes data — web, iOS, and Android have genuinely different field and round-trip needs. The problem it solves is the lowest-common-denominator API: one shared endpoint that over-fetches for mobile and under-fetches for web because it serves both. Behind the BFFs the same microservices serve everyone. Cost: one more deployable per client to own. Skip it when you have one client, or when GraphQL already lets each client ask for its own shape.</>,
              <><strong className="text-ink">Micro-frontends</strong>: split the app by domain so independent teams ship to one shell (iframes, web components, Module Federation). It's an <em>org-scaling</em> tool — it trades a heavy technical tax (shared-dependency hell, duplicated bundle weight, cross-app styling and auth, integration testing across repos) for the ability of many teams to deploy without coordinating. <strong>When NOT to:</strong> one team, or a few. With fewer than ~3 teams that genuinely need independent release cadences, you've bought all the tax and none of the benefit — a well-structured modular monolith with feature folders gives you the boundaries without the distribution cost. Reaching for micro-frontends without the org problem is cargo cult.</>,
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
          description="A pattern is a communication shortcut — saying 'Strategy' compresses a paragraph into a word. But every pattern is also a layer of indirection, and indirection you don't need is just cost. Reach for a pattern when you feel the pain it solves; reaching first is how you get FactoryBuilderProviderManagerImpl."
        >
          <PatternLibrary />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">When NOT to reach for the pattern</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">The pattern is a generalization of a case you have once</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Strategy with one strategy, Factory that always returns the same class, Observer with one fixed subscriber — that's an interface and an indirection wrapping a hard-coded call. The pattern earns its keep only at the <em>second</em> real variant. Until then it's speculative generality: YAGNI at the pattern scale.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Test: can you name the second concrete case today? If not, write the direct code and extract the pattern when the case shows up — the refactor is cheap, the wrong abstraction is not.
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">The language already has it</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Half the GoF catalog exists to work around 1994 Java. In JS/TS a Strategy is usually just a function passed as an argument; Command is a closure; Iterator is the iterator protocol; Observer is an <InlineCode>EventEmitter</InlineCode> or a signal. Singleton is almost always a hidden global — a module-scoped value with no DI seam, untestable and order-dependent. Naming the GoF class for something the language gives you for free adds ceremony, not clarity.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Patterns are descriptive — names for structures that recur — not prescriptive. The skill is recognizing one after the pain appears, not installing it in advance. A codebase named after its patterns (<InlineCode>AbstractProviderFactoryBean</InlineCode>) is a codebase that confused the vocabulary for the design.
          </p>
        </Card>
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
