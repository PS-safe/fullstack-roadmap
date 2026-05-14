import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TestTube, Clock, Network as NetworkIcon, Camera, Zap, RotateCcw, AlertTriangle, GitBranch } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 14;

export default function Layer14() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="aaa" kicker="14.1" title="Test Structure: AAA / Given-When-Then">
        <TopicCard
          layerId={L}
          index={0}
          title="Three lines, three roles"
          description="Arrange the world. Act on it. Assert what changed. Tests that follow this rhythm read like specifications. Tests that don't read like accidents."
        >
          <AaaInteractive />
        </TopicCard>
        <NamingConventions />
      </Section>

      <Section id="frameworks" kicker="14.2" title="Frameworks compared">
        <TopicCard
          layerId={L}
          index={1}
          title="Vitest, Jest, Pytest, Go testing, JUnit"
          description="The framework matters less than how you use it — they all express the same AAA shape. What differs is startup cost, ESM handling, and what ships in the box. Pick by stack, then stop arguing."
        >
          <FrameworkMatrix />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={240}
          title="The same test in three frameworks"
          initial={`// VITEST / JEST (modern JS)
import { describe, it, expect } from 'vitest';
describe('add', () => {
  it('sums two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});

// PYTEST (Python)
// def test_add_sums_two_numbers():
//     assert add(2, 3) == 5

// GO (built-in testing package)
// func TestAdd_SumsTwoNumbers(t *testing.T) {
//     if got := Add(2, 3); got != 5 {
//         t.Fatalf("Add(2,3) = %d, want 5", got)
//     }
// }

// All three say the same thing. Pick the one with the best DX
// for your stack. Don't argue about it for more than 30 minutes.

function add(a, b) { return a + b; }
console.log('add(2,3) =', add(2, 3));`}
        />
      </Section>

      <Section id="async" kicker="14.3" title="Async testing patterns">
        <TopicCard
          layerId={L}
          index={2}
          title="Promises, callbacks, intervals, retries"
          description="Async tests are where flakiness is born. Always await. Never sleep. Use fake timers for code that waits."
        >
          <Bullets
            items={[
              <>Always <InlineCode>await</InlineCode> the assertion. <InlineCode>expect(p).resolves.toBe(x)</InlineCode> returns a pending promise; without <InlineCode>await</InlineCode> the test function returns synchronously, the runner sees no thrown error, and a <em>rejected</em> promise becomes an unhandled rejection logged after the green checkmark. The test passes for code that's broken.</>,
              <>Fake timers swap <InlineCode>setTimeout</InlineCode>/<InlineCode>setInterval</InlineCode>/<InlineCode>Date</InlineCode> for a controllable clock. <InlineCode>vi.advanceTimersByTime(10_000)</InlineCode> fires a 10-second timeout in 0ms wall-clock — deterministic because <em>you</em> decide when time moves, not the OS scheduler. Without them you either <InlineCode>sleep</InlineCode> (slow + still racy) or never test the timeout path at all.</>,
              <><InlineCode>findByRole</InlineCode> retries on a polling loop until the element appears or the timeout hits; <InlineCode>getByRole</InlineCode> queries once and throws immediately. Use <InlineCode>getBy</InlineCode> on content that renders after an <InlineCode>await</InlineCode> and you get a guaranteed flake — it fails or passes depending on whether the microtask drained before the query ran.</>,
              <>Set timeouts per-test (<InlineCode>it('...', async () =&gt; {'{...}'}, 8000)</InlineCode>), never bump the global. A 30s global timeout doesn't fix a slow test — it hides which test is slow and turns a 2s suite into a 2-minute one when something hangs.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The async failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">The silent pass</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A test with a forgotten <InlineCode>await</InlineCode>, a missing <InlineCode>return</InlineCode> on a promise chain, or an <InlineCode>expect</InlineCode> inside an un-awaited <InlineCode>.then()</InlineCode> callback — all share one symptom: the assertion never runs before the test ends, so it can never fail. The suite is green and proves nothing.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: <InlineCode>await</InlineCode> every async assertion; for callback-style code use <InlineCode>expect.assertions(n)</InlineCode> so the runner <em>fails</em> if the expected count didn't run. Enable the <InlineCode>no-floating-promises</InlineCode> lint rule to catch it mechanically.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Real timers leaking into the test</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                You call <InlineCode>vi.useFakeTimers()</InlineCode> but the promise <em>inside</em> the timeout never resolves — fake timers control <InlineCode>setTimeout</InlineCode>, not the microtask queue. <InlineCode>advanceTimersByTime</InlineCode> fires the callback, but the <InlineCode>await</InlineCode> after it still needs a real tick to flush.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: use <InlineCode>await vi.advanceTimersByTimeAsync(ms)</InlineCode>, which drains pending microtasks between timer fires. And always <InlineCode>vi.useRealTimers()</InlineCode> in <InlineCode>afterEach</InlineCode> — a leaked fake clock makes the <em>next</em> file's timing tests fail mysteriously.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            The through-line: an async test must have a single observable settle point the runner waits on. Anything that lets the test function return before the assertion resolves is a bug in the test, not the code — and it always fails open (green), never closed.
          </p>
        </Card>
        <CodePlayground
          mode="js"
          height={260}
          title="Async patterns done right"
          initial={`// 1. Always await
async function fetchUser(id) {
  return { id, name: 'Ada' };
}

// ❌ WRONG — promise rejection isn't caught; test passes silently
function badTest() {
  expect(fetchUser(1)).resolves.toEqual({ id: 1, name: 'Ada' });
}

// ✓ RIGHT — awaited
async function goodTest() {
  await expect(fetchUser(1)).resolves.toEqual({ id: 1, name: 'Ada' });
}

// 2. Fake timers — test code that waits without actually waiting
function delayedHello(cb) { setTimeout(() => cb('hi'), 10_000); }

// In Vitest:
//   vi.useFakeTimers();
//   const cb = vi.fn();
//   delayedHello(cb);
//   vi.advanceTimersByTime(10_000);
//   expect(cb).toHaveBeenCalledWith('hi');
// 0ms wall-clock, 100% deterministic.

console.log('See comments — runtime can\\'t demo Vitest here.');`}
        />
      </Section>

      <Section id="mocking" kicker="14.4" title="Mocking: HTTP, time, modules">
        <TopicCard
          layerId={L}
          index={3}
          title="Three places to draw the line"
          description="Mock at the boundary, not in the middle. HTTP via MSW. Time via fake clocks. Modules only when there's no other seam."
        >
          <MockingMatrix />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">Why the boundary, and why <InlineCode>vi.mock</InlineCode> is the last resort</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Mock at the network layer</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                <InlineCode>jest.mock('./api-client')</InlineCode> replaces your client module — so your URL building, header logic, query-string encoding, and response parsing never run. The test passes; a typo in the real endpoint path ships. MSW intercepts the actual HTTP request, so every line of your real <InlineCode>fetch</InlineCode> path executes and only the wire response is faked.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                The rule generalizes: mock as far out as you can. A mocked DB hides the SQL and the migration; a real schema (Testcontainers, SQLite) on transaction-rollback runs the query you actually wrote.
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Module mocking is a refactor smell</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Reaching for <InlineCode>vi.mock</InlineCode> on a module in the <em>middle</em> of your own logic means there's no seam — the dependency is hard-wired with an <InlineCode>import</InlineCode>. The mock is brittle: it breaks on rename, it can't be type-checked, and it couples the test to the import graph instead of the behavior.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                The real fix is dependency injection — pass the collaborator in as an argument or constructor param, then hand the test a plain fake. No magic, type-checked, and the seam you needed for testing is the same seam that makes the code composable.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Heuristic: if a mock makes a test pass while the real integration is broken, you mocked too deep. Mock the thing you don't own (the network, the clock, the disk); never mock the thing you're trying to test.
          </p>
        </Card>
        <MswExample />
      </Section>

      <Section id="snapshot" kicker="14.5" title="Snapshot, Property-based, Mutation">
        <TopicCard
          layerId={L}
          index={4}
          title="Test types you should know"
          description="Snapshot tests are great until they aren't. Property-based finds bugs you never imagined. Mutation testing audits the auditors."
        >
          <SnapPropMutPicker />
        </TopicCard>
        <PropertyBasedDemo />
      </Section>

      <Section id="coverage" kicker="14.6" title="Coverage interpretation">
        <TopicCard
          layerId={L}
          index={5}
          title="100% lying vs 60% honest"
          description="Coverage measures which code executed, not whether anything was checked. Statement coverage is trivially gamed; branch and mutation coverage cost more to compute but actually constrain the suite."
        >
          <CoverageTypes />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">What 95% actually proved — and what it didn't</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            A test that calls <InlineCode>processOrder(order)</InlineCode> and asserts nothing still <em>executes</em> every line inside it. The coverage tool counts those lines as covered — it instruments execution, not verification. So 95% statement coverage with thin assertions means the code <em>ran</em> in CI; whether it produced the right answer was never checked. The discount-calculation off-by-one ships at 95% green.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Statement / line</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                "This line ran." Gameable by any test with no <InlineCode>expect</InlineCode>. Use it to find <em>untouched</em> code (genuinely useful), never as a quality bar.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Branch</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                "Both arms of every <InlineCode>if</InlineCode> ran." Forces the <InlineCode>else</InlineCode> and the early-return path. Catches the whole-branch-untested gap statement coverage hides — still says nothing about assertions.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Mutation</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                "A test <em>fails</em> when the code is wrong." Flips <InlineCode>&lt;</InlineCode> to <InlineCode>&lt;=</InlineCode>, deletes a line — if the suite stays green, the mutant survived and your assertions are too weak. The only metric that measures verification.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Default: track branch coverage to find gaps, gate CI loosely (cap regressions, don't fail a PR at 79.9% vs an 80% bar — you'll get assertion-free getter tests written to clear it), and run mutation testing nightly on critical-path code. Coverage is a floor on what's <em>tested</em>, never a measure of what's <em>correct</em>.
          </p>
        </Card>
      </Section>

      <Section id="flaky" kicker="14.7" title="Flaky tests — taxonomy and triage">
        <TopicCard
          layerId={L}
          index={6}
          title="The five reasons tests are flaky"
          description="Quarantine flakies fast. They're worse than failing tests because they erode trust in the suite — and one ignored failure becomes ten."
        >
          <FlakyClassifier />
        </TopicCard>
      </Section>

      <Section id="component" kicker="14.8" title="Component & UI testing (Testing Library)">
        <TopicCard
          layerId={L}
          index={7}
          title="Test like a user, not like the developer"
          description="Find elements by role, label, or text — what an assistive technology sees. Don't test classNames or internal state."
        >
          <QueryPriority />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={240}
          title="Component test the right way (pseudo-Vitest)"
          initial={`// import { render, screen } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import { LoginForm } from './LoginForm';

// it('shows an error when password is empty', async () => {
//   render(<LoginForm />);
//   await userEvent.type(screen.getByLabelText(/email/i), 'ada@x.com');
//   await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
//   expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
// });

// What it tests: behavior visible to users
//  - Filling a labeled email field
//  - Clicking a button by accessible name
//  - Seeing an error message appear

// What it does NOT test:
//  - Internal state, props, classes, refs
//  - "Did setState get called with X?"
// → resilient to refactor; breaks only when behavior changes

console.log('See the commented test for the recipe.');`}
        />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 14 Quiz">
        <Quiz id="L14" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-blue-500/10 via-bg-card to-indigo-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-blue-500 to-indigo-500 text-white">L14</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Unit Testing in Practice</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">From "we should test more" to actually shipping tests</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Layer 11 gave you the strategy. This is the day-to-day craft: AAA structure, async patterns, mocking, what
          coverage actually means, and how to keep tests fast and trustworthy.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <TestTube className="h-4 w-4 text-blue-400" />
          8 topics · 8 visualizers · 3 playgrounds · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function AaaInteractive() {
  const [hover, setHover] = useState<'arrange' | 'act' | 'assert' | null>(null);
  const lines: { kind: 'arrange' | 'act' | 'assert'; text: string }[] = [
    { kind: 'arrange', text: "const cart = new Cart();" },
    { kind: 'arrange', text: "cart.add(item('apple', 199));" },
    { kind: 'arrange', text: "cart.add(item('bread', 350));" },
    { kind: 'act',     text: "const total = cart.totalCents();" },
    { kind: 'assert',  text: "expect(total).toBe(549);" },
    { kind: 'assert',  text: "expect(cart.size).toBe(2);" },
  ];
  const colors = {
    arrange: 'bg-cyan-400/15 border-cyan-400/30 text-cyan-200',
    act:     'bg-amber-400/15 border-amber-400/30 text-amber-200',
    assert:  'bg-emerald-400/15 border-emerald-400/30 text-emerald-200',
  };

  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <h4 className="font-semibold">Hover the labels to highlight the role</h4>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[200px_1fr]">
        <div className="space-y-2">
          {(['arrange', 'act', 'assert'] as const).map((k) => (
            <button
              key={k}
              onMouseEnter={() => setHover(k)}
              onMouseLeave={() => setHover(null)}
              className={cn('w-full rounded-lg border px-3 py-2 text-left text-sm', hover === k ? colors[k] : 'border-white/10 bg-white/5 text-ink-dim')}
            >
              <span className="font-mono text-xs uppercase tracking-widest">{k}</span>
              <div className="text-[11px] text-ink-faint">
                {k === 'arrange' && 'Set up the world'}
                {k === 'act' && 'Trigger the behavior'}
                {k === 'assert' && 'Check the outcome'}
              </div>
            </button>
          ))}
        </div>
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12.5px] leading-6 text-ink">
          <span className="text-ink-faint">test('cart sums prices in cents', () =&gt; {'{'}</span>
          {'\n'}
          {lines.map((l, i) => (
            <span key={i} className={cn('block rounded px-2 transition-colors', hover === l.kind && colors[l.kind])}>
              {'  '}{l.text}
            </span>
          ))}
          <span className="text-ink-faint">{'}'});</span>
        </pre>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Some teams write <InlineCode>// arrange</InlineCode> / <InlineCode>// act</InlineCode> / <InlineCode>// assert</InlineCode> comments. Better: blank lines between blocks. Both work. Mixed code with no separation is a smell.
      </p>
    </Card>
  );
}

function NamingConventions() {
  const styles = [
    { name: 'Method_State_Expected', ex: 'add_negativeNumber_throws()', pros: 'machine-greppable', cons: 'verbose, snake_camel mix' },
    { name: 'should + behavior', ex: "it('should reject negative amounts')", pros: 'reads like a sentence', cons: 'starts with "should" gets old' },
    { name: 'when_then', ex: "describe('Cart > when empty', () => it('total is 0'))", pros: 'great for nested specs', cons: 'extra ceremony' },
    { name: 'given_when_then', ex: "it('Given empty cart, when totalCents called, returns 0')", pros: 'BDD-friendly', cons: 'wordy' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Test naming styles (pick ONE per repo)</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Style</th><th className="px-4 py-2 text-left">Example</th><th className="px-4 py-2 text-left">Pros</th><th className="px-4 py-2 text-left">Cons</th></tr>
          </thead>
          <tbody>
            {styles.map((s) => (
              <tr key={s.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{s.name}</td>
                <td className="px-4 py-2 font-mono text-[11.5px] text-accent-cyan">{s.ex}</td>
                <td className="px-4 py-2 text-ink-dim">{s.pros}</td>
                <td className="px-4 py-2 text-ink-dim">{s.cons}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function FrameworkMatrix() {
  const rows = [
    { name: 'Vitest',  lang: 'TS / JS',  speed: 'fastest',  features: 'ESM-native, Jest-compat API, in-source tests', pick: 'New JS/TS projects (2026 default)' },
    { name: 'Jest',    lang: 'JS',       speed: 'medium',   features: 'Mature ecosystem, snapshot, mocks built-in', pick: 'Existing JS codebases' },
    { name: 'Pytest',  lang: 'Python',   speed: 'fast',     features: 'Fixtures, parametrize, plugins galore', pick: 'Python — no contest' },
    { name: 'Go testing', lang: 'Go',    speed: 'instant',  features: 'Built-in, table tests, t.Parallel(), benchmarks', pick: 'Go — use the stdlib, skip 3rd party' },
    { name: 'JUnit 5', lang: 'Java',     speed: 'medium',   features: 'Annotations, parameterized, lifecycle hooks', pick: 'JVM' },
    { name: 'Playwright Test', lang: 'TS / JS / Py', speed: 'slow (browser)', features: 'E2E + component, parallel, traces', pick: 'E2E + visual regression' },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
          <tr><th className="px-4 py-2 text-left">Framework</th><th className="px-4 py-2 text-left">Language</th><th className="px-4 py-2 text-left">Speed</th><th className="px-4 py-2 text-left">Features</th><th className="px-4 py-2 text-left">When to pick</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-white/5">
              <td className="px-4 py-2 font-medium">{r.name}</td>
              <td className="px-4 py-2 font-mono text-ink-dim">{r.lang}</td>
              <td className="px-4 py-2 text-ink-dim">{r.speed}</td>
              <td className="px-4 py-2 text-ink-dim">{r.features}</td>
              <td className="px-4 py-2 text-ink-dim">{r.pick}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MockingMatrix() {
  const rows = [
    { what: 'HTTP / external API', tool: 'MSW (Mock Service Worker)', why: 'Intercepts at the network layer — same code path as real fetch' },
    { what: 'Time / Date.now', tool: 'vi.useFakeTimers / sinon', why: 'Make code that waits run instantly + deterministically' },
    { what: 'Random', tool: 'seedrandom + DI', why: 'Inject the RNG; tests use a fixed seed' },
    { what: 'Database', tool: 'Testcontainers, in-memory (sqlite), or transaction-rollback', why: 'Real schema, real SQL, isolated per test' },
    { what: 'File system', tool: 'memfs / mock-fs', why: 'No actual disk, no leftover files between tests' },
    { what: 'Imports / modules', tool: 'vi.mock / jest.mock / DI refactor', why: 'Last resort — prefer dependency injection' },
    { what: 'Environment vars', tool: 'beforeEach restore', why: 'Save + restore process.env; never leak between tests' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">What to mock with what</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Boundary</th><th className="px-4 py-2 text-left">Tool</th><th className="px-4 py-2 text-left">Why</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.what} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.what}</td>
                <td className="px-4 py-2 font-mono text-accent-cyan">{r.tool}</td>
                <td className="px-4 py-2 text-ink-dim">{r.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MswExample() {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><NetworkIcon className="h-4 w-4" /> <h4 className="font-semibold">Mock Service Worker pattern</h4></div>
      <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-5 text-ink-dim">{`// test-setup.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('https://api.example.com/users/:id', ({ params }) =>
    HttpResponse.json({ id: params.id, email: 'ada@x.com' })
  ),
  http.post('https://api.example.com/orders', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'ord_42', ...body }, { status: 201 });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// In your test — your real fetch() is intercepted; same code path as production.
it('creates an order', async () => {
  const res = await fetch('https://api.example.com/orders', { method: 'POST', body: '{"sku":"A1"}' });
  expect(res.status).toBe(201);
});`}</pre>
      <p className="mt-3 text-xs text-ink-faint">Key idea: MSW intercepts at the network layer — your code uses real <InlineCode>fetch</InlineCode>. No SDK monkey-patching, no <InlineCode>jest.mock</InlineCode>. Browser + Node share the same handlers.</p>
    </Card>
  );
}

function SnapPropMutPicker() {
  const [pick, setPick] = useState<'snapshot' | 'property' | 'mutation'>('snapshot');
  const data = {
    snapshot: {
      title: 'Snapshot tests',
      good: 'Catch unintended UI / output changes. Great for serializers, codegen, complex JSON shape.',
      bad: 'On churn-prone UI: every PR has 30 snapshot diffs nobody reads carefully. Becomes rubber-stamping.',
      rule: 'Snapshot stable artifacts (markdown rendering, error messages, generated code). Avoid for fast-changing UI.',
      icon: <Camera className="h-4 w-4" />,
    },
    property: {
      title: 'Property-based tests',
      good: 'Tools (fast-check, Hypothesis, jqwik) generate inputs you didn\'t think of: empty strings, max ints, unicode, weird chars.',
      bad: 'Slower than example-based. Need to express invariants ("reverse(reverse(x)) == x") which takes practice.',
      rule: 'Use for pure functions: parsers, serializers, math, idempotent operations. Find bugs no human writes.',
      icon: <Zap className="h-4 w-4" />,
    },
    mutation: {
      title: 'Mutation testing',
      good: 'Mutates your code (changes < to <=, removes ifs) and checks if a test catches it. Audits the auditors.',
      bad: 'Slow. CI-only. Output requires interpretation — surviving mutants aren\'t always real bugs.',
      rule: 'Run nightly on critical-path code (auth, payments, billing). Use Stryker (JS/TS), mutmut (Python), PIT (Java).',
      icon: <RotateCcw className="h-4 w-4" />,
    },
  } as const;
  const cur = data[pick];
  return (
    <Card>
      <div className="mb-3 flex flex-wrap gap-2">
        {(['snapshot', 'property', 'mutation'] as const).map((k) => (
          <button key={k} onClick={() => setPick(k)} className={cn('rounded-md border px-3 py-1.5 text-xs', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
            {data[k].title}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
        <div className="flex items-center gap-2 text-base font-semibold">{cur.icon} {cur.title}</div>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3 text-sm">
            <div className="text-xs uppercase tracking-widest text-emerald-300">Good for</div>
            <p className="mt-1 text-ink-dim">{cur.good}</p>
          </div>
          <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-3 text-sm">
            <div className="text-xs uppercase tracking-widest text-rose-300">Watch out</div>
            <p className="mt-1 text-ink-dim">{cur.bad}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-dim"><strong className="text-ink">Rule of thumb:</strong> {cur.rule}</p>
      </div>
    </Card>
  );
}

function PropertyBasedDemo() {
  const [seed, setSeed] = useState(42);
  // Mulberry32 for deterministic random
  const rng = (s: number) => {
    let t = s + 0x6D2B79F5;
    return () => {
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const r = rng(seed);

  const cases = Array.from({ length: 8 }).map(() => {
    const n = Math.floor(r() * 12);
    const arr = Array.from({ length: n }).map(() => Math.floor(r() * 100) - 50);
    const reversed = [...arr].reverse().reverse();
    const ok = JSON.stringify(arr) === JSON.stringify(reversed);
    return { arr, reversed, ok };
  });

  // Plant a "bug": for arrays of length 3, force a failure to demo
  const buggyCases = cases.map((c) => c.arr.length === 3 ? { ...c, reversed: [...c.arr].reverse(), ok: false } : c);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Property-based test — generated inputs</h4>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink-dim">seed:</span>
          <input type="number" value={seed} onChange={(e) => setSeed(parseInt(e.target.value || '0'))} className="input w-20 py-1 text-xs" />
        </div>
      </div>
      <p className="mb-3 text-sm text-ink-dim">Property: <InlineCode>reverse(reverse(arr)) == arr</InlineCode>. The framework throws random arrays at your function.</p>
      <div className="space-y-1">
        {cases.map((c, i) => (
          <div key={i} className={cn('flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs', c.ok ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/30 bg-rose-400/10 text-rose-200')}>
            <span>{JSON.stringify(c.arr)}</span>
            <span className="text-ink-faint">{c.ok ? '✓' : '✗ shrinking…'}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">When a property fails, the framework <em>shrinks</em> the input to the smallest case that still fails — so you debug <InlineCode>[1,2]</InlineCode>, not <InlineCode>[42,-9,17,3,...]</InlineCode>.</p>
    </Card>
  );
}

function CoverageTypes() {
  const types = [
    { name: 'Statement', meaning: 'Lines executed', easy: 'easy', honest: 'low', note: 'Default. Easy to game with execution-without-assertion.' },
    { name: 'Branch', meaning: 'Both arms of every if/else taken', easy: 'medium', honest: 'medium', note: 'Forces you to test both true and false paths.' },
    { name: 'Function', meaning: '% of functions called at all', easy: 'easy', honest: 'low', note: 'Often inflated by setup code.' },
    { name: 'Line', meaning: 'Lines hit (≈ statement)', easy: 'easy', honest: 'low', note: 'Misleading on multi-statement lines.' },
    { name: 'MC/DC', meaning: 'Each condition independently affects outcome', easy: 'hard', honest: 'high', note: 'Required for safety-critical (avionics).' },
    { name: 'Mutation', meaning: '% of injected mutants killed by tests', easy: 'hard', honest: 'highest', note: 'The truest measure. Slow. Run nightly.' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Coverage types (most → least game-able)</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-left">Measures</th><th className="px-4 py-2 text-left">Easy?</th><th className="px-4 py-2 text-left">Honest?</th><th className="px-4 py-2 text-left">Note</th></tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{t.name}</td>
                <td className="px-4 py-2 text-ink-dim">{t.meaning}</td>
                <td className="px-4 py-2 text-ink-dim">{t.easy}</td>
                <td className="px-4 py-2 text-ink-dim">{t.honest}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{t.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Coverage gates in CI cap regressions, not quality. Don't fail PRs at 79.9% if you're at 80% — you'll get tests of <InlineCode>private getId() {'{ return this.id; }'}</InlineCode> just to clear the bar.
      </p>
    </Card>
  );
}

function FlakyClassifier() {
  const [pick, setPick] = useState<'time' | 'order' | 'concurrency' | 'network' | 'state'>('time');
  const causes = {
    time: { title: 'Time-dependent', symptom: 'Passes locally, fails near midnight, timezone, DST.', fix: 'Inject the clock. <code>vi.useFakeTimers()</code>. Never call <code>Date.now()</code> directly in code under test.' },
    order: { title: 'Test-order dependent', symptom: 'Passes alone, fails when run after test X.', fix: 'Reset shared state. DB transaction rollback per test. Never share mutable globals.' },
    concurrency: { title: 'Concurrency / async race', symptom: 'Fails ~1 in 20 runs. Heisenbug.', fix: 'Find every <code>setTimeout</code>, <code>setInterval</code>, polling. Replace with deterministic awaits or fake timers.' },
    network: { title: 'External network', symptom: 'Fails when GitHub/AWS hiccups.', fix: 'Mock external HTTP with MSW. No third-party calls in unit/integration tests.' },
    state: { title: 'Leaked state', symptom: 'Test pollutes filesystem, env, DB rows.', fix: 'Use <code>afterEach</code> teardown. Use unique IDs per test (UUIDs, table prefixes). Use temp dirs.' },
  };
  const cur = causes[pick];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-300" /> <h4 className="font-semibold">Flaky test root causes</h4></div>
      <div className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(causes) as Array<keyof typeof causes>).map((k) => (
          <button key={k} onClick={() => setPick(k)} className={cn('rounded-md border px-2.5 py-1 text-xs', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
            {causes[k].title}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={pick} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
          <div className="text-base font-semibold">{cur.title}</div>
          <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-widest text-ink-faint">Symptom</div>
              <p className="mt-1 text-sm text-ink-dim">{cur.symptom}</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-emerald-300">Fix</div>
              <p className="mt-1 text-sm text-ink-dim" dangerouslySetInnerHTML={{ __html: cur.fix.replace(/<code>/g, '<code class="font-mono text-accent-cyan">') }} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 rounded-lg border border-white/5 bg-bg-soft/40 p-3 text-xs">
        <div className="font-medium">Triage flow</div>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-ink-dim">
          <li>Mark the test <InlineCode>.skip</InlineCode> immediately and open a ticket — not a TODO comment.</li>
          <li>Capture the failure (logs, screenshot, video) before unfailing.</li>
          <li>Reproduce locally with the same seed / order / TZ.</li>
          <li>Fix the root cause. <em>Never</em> add a retry loop — that hides bugs.</li>
        </ol>
      </div>
    </Card>
  );
}

function QueryPriority() {
  const queries = [
    { tier: 1, name: 'getByRole', ex: "getByRole('button', { name: /sign in/i })", note: 'Most accessible — what screen readers see' },
    { tier: 1, name: 'getByLabelText', ex: "getByLabelText(/email/i)", note: 'Forms — pairs with <label>' },
    { tier: 1, name: 'getByPlaceholderText', ex: "getByPlaceholderText(/search/i)", note: 'Only if no label (label preferred)' },
    { tier: 2, name: 'getByText', ex: "getByText(/welcome back/i)", note: 'Body text users can read' },
    { tier: 2, name: 'getByDisplayValue', ex: "getByDisplayValue('ada@x.com')", note: 'Filled-in form values' },
    { tier: 3, name: 'getByAltText', ex: "getByAltText(/profile photo/i)", note: 'Images' },
    { tier: 3, name: 'getByTitle', ex: "getByTitle(/close/i)", note: 'Tooltip text' },
    { tier: 4, name: 'getByTestId', ex: "getByTestId('submit-btn')", note: 'Last resort — couples test to implementation' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Testing Library — query priority</h4>
      <div className="space-y-2">
        {queries.map((q) => {
          const tone = q.tier === 1 ? 'border-emerald-400/30 bg-emerald-400/10' : q.tier === 2 ? 'border-cyan-400/30 bg-cyan-400/10' : q.tier === 3 ? 'border-amber-400/30 bg-amber-400/10' : 'border-rose-400/30 bg-rose-400/10';
          return (
            <div key={q.name} className={cn('rounded-xl border p-3', tone)}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{q.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">tier {q.tier}</span>
              </div>
              <pre className="mt-1 font-mono text-[11.5px] text-ink-dim">{q.ex}</pre>
              <div className="mt-1 text-xs text-ink-faint">{q.note}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-ink-faint">Reach for the highest tier that works. <InlineCode>data-testid</InlineCode> is escape hatch — it means your component isn't accessible enough to test by role.</p>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'You write `expect(fetchUser(1)).resolves.toBe(user)`. Test passes. Then you change fetchUser to throw. Test still passes. Why?',
    options: [
      'Vitest bug.',
      'You forgot to `await` the assertion — promise rejection wasn\'t caught.',
      'Need `.toEqual` instead of `.toBe`.',
      '.resolves swallows errors.',
    ],
    answer: 1,
    explain: 'Without `await`, the rejected promise is unhandled. The synchronous test function returns and Vitest sees no assertion failure.',
  },
  {
    q: 'Best way to mock `fetch` calls to a third-party API in tests?',
    options: [
      'Override global.fetch in beforeEach.',
      'jest.mock(\'./api-client\').',
      'MSW (Mock Service Worker) — intercepts at the network layer.',
      'Wrap fetch in your own client and inject a fake.',
    ],
    answer: 2,
    explain: 'MSW intercepts at the network layer so your real fetch code path runs. It works in Node and browser with the same handlers. Wrapping + DI is also fine but more refactoring.',
  },
  {
    q: 'Coverage at 95%. Production breaks the next day. What\'s the most likely cause?',
    options: [
      'Coverage tool was wrong.',
      'Statement coverage measures execution, not assertion. Tests ran code without checking results.',
      'Should have used Jest, not Vitest.',
      'Branch coverage was ignored.',
    ],
    answer: 1,
    explain: 'High statement coverage with no assertions is the classic gaming pattern. Branch + mutation coverage tells the truth.',
  },
  {
    q: 'A test passes alone, fails when run after another test. What\'s wrong?',
    options: [
      'Test framework bug.',
      'Random ordering issue — disable test parallelization.',
      'Shared mutable state between tests (DB rows, env vars, module-level vars).',
      'Need to mark the test as flaky.',
    ],
    answer: 2,
    explain: 'Order-dependent tests = leaked state. Reset DB per test, restore env vars, never share mutable singletons.',
  },
  {
    q: 'Testing Library — best query to find a "Submit" button?',
    options: [
      "screen.getByTestId('submit')",
      "screen.querySelector('.submit-btn')",
      "screen.getByRole('button', { name: /submit/i })",
      "screen.getByText('Submit')",
    ],
    answer: 2,
    explain: 'getByRole finds it the way a screen-reader user would — by role + accessible name. Resilient to className changes and survives refactors.',
  },
];
