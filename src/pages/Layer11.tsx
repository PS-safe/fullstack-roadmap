import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, AlertTriangle, ShieldAlert, Database, Play, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 11;

export default function Layer11() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="pyramid" kicker="11.1" title="The Testing Pyramid (and its critics)">
        <TopicCard
          layerId={L}
          index={0}
          title="Lots of fast tests, fewer slow ones"
          description="Many cheap unit tests, fewer integration tests, even fewer end-to-end. The pyramid biases towards fast feedback. Newer thinking — the 'testing trophy' — leans more on integration, because most bugs live at the seams."
        >
          <PyramidComparator />
        </TopicCard>
      </Section>

      <Section id="doubles" kicker="11.2" title="Test Doubles">
        <TopicCard
          layerId={L}
          index={1}
          title="Mock, stub, fake, spy — they're not the same"
          description="Sloppy vocabulary leads to sloppy tests. Use the smallest double that gets the job done."
        >
          <TestDoubleMatrix />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={240}
          title="Same scenario, four doubles"
          initial={`// We're testing a checkout function that calls a payment service.

// 1. STUB — pre-canned answers, no behavior verification
const stubPayments = { charge: () => ({ ok: true, id: 'ch_stub' }) };

// 2. SPY — real or fake, plus call recording
function spyPayments() {
  const calls = [];
  return { charge: (...args) => { calls.push(args); return { ok: true, id: 'ch_spy' }; }, calls };
}

// 3. MOCK — pre-set expectations, fails if not met
function mockPayments(expected) {
  let called = false;
  return {
    charge: (amount) => {
      if (amount !== expected) throw new Error('mock: wrong amount');
      called = true;
      return { ok: true, id: 'ch_mock' };
    },
    verify: () => { if (!called) throw new Error('mock: charge not called'); },
  };
}

// 4. FAKE — working alternative, simpler than real (in-memory DB, etc.)
class FakePayments {
  constructor() { this.charges = []; }
  charge(amount) { const id = 'ch_' + this.charges.length; this.charges.push({ id, amount }); return { ok: true, id }; }
}

const fake = new FakePayments();
fake.charge(99);
fake.charge(50);
console.log('fake recorded:', fake.charges);`}
        />
      </Section>

      <Section id="tdd" kicker="11.3" title="TDD: Red → Green → Refactor">
        <TopicCard
          layerId={L}
          index={2}
          title="Tests before code, in tight loops"
          description="Write a failing test, write the minimum code to pass it, refactor with the safety net. Best for well-understood problems with clear inputs/outputs — calculators, parsers, business rules."
        >
          <Bullets
            items={[
              <>TDD shines on pure logic; it's painful for UI exploration where you don't yet know what you want.</>,
              <>Don't write 10 tests then code. One test, one minimal pass, then refactor — micro-loops.</>,
              <>"Tidy First?" by Kent Beck — keep refactor commits separate from behavior commits.</>,
            ]}
          />
        </TopicCard>
        <TddCycle />
      </Section>

      <Section id="contract" kicker="11.4" title="Contract Testing">
        <TopicCard
          layerId={L}
          index={3}
          title="Tests that prove two services agree"
          description="Consumer-driven contract tests (Pact, Spring Cloud Contract): the consumer declares 'when I send X, I expect Y'. The provider runs those expectations against the real implementation. Both sides break the build if they drift apart."
        >
          <ContractTestDemo />
        </TopicCard>
      </Section>

      <Section id="strategy" kicker="11.5" title="What to test, what to skip">
        <TopicCard
          layerId={L}
          index={4}
          title="Coverage is a lie; behavior is what matters"
          description="100% coverage means every line ran. It says nothing about whether the right behavior was asserted. Test what hurts when it breaks."
        >
          <Bullets
            items={[
              <><strong className="text-ink">Test: business rules, edge cases, regressions, public APIs, security boundaries.</strong></>,
              <><strong className="text-ink">Skip: trivial getters, framework-internal behavior, third-party libraries, snapshot tests of churn-prone UI.</strong></>,
              <>Aim for tests that fail when behavior changes, not when implementation changes.</>,
              <>Property-based tests (fast-check, Hypothesis) generate inputs you wouldn't have thought of.</>,
            ]}
          />
        </TopicCard>
        <TestPicker />
      </Section>

      <Section id="incident" kicker="11.6" title="Incident Response">
        <TopicCard
          layerId={L}
          index={5}
          title="Severity, IC, comms, mitigation, write-up"
          description="When prod is on fire, the goal is restore service first, root-cause later. Calm process beats heroic individual."
        >
          <IncidentRunbook />
          <SeverityCalculator />
        </TopicCard>
      </Section>

      <Section id="postmortem" kicker="11.7" title="Blameless Postmortems">
        <TopicCard
          layerId={L}
          index={6}
          title="Process bugs, not people bugs"
          description="People act rationally given their information at the time. The fix is in systems, runbooks, and observability — not in 'be more careful'."
        >
          <PostmortemTemplate />
        </TopicCard>
      </Section>

      <Section id="rpo" kicker="11.8" title="Backups, RPO/RTO, Chaos">
        <TopicCard
          layerId={L}
          index={7}
          title="A backup you've never restored is not a backup"
          description="RPO = how much data loss you can tolerate. RTO = how long you can be down. Cheap backups have terrible RTO; expensive HA has near-zero RPO. Pick consciously."
        >
          <RpoRtoSelector />
          <ChaosExperiments />
        </TopicCard>
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 11 Quiz">
        <Quiz id="L11" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-teal-500/10 via-bg-card to-cyan-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-teal-500 to-cyan-500 text-white">L11</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Testing & Reliability</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sleep through the night</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Tests that catch real bugs. Doubles you can defend. Postmortems without finger-pointing. Backups you've actually
          restored. The discipline of running software, not just writing it.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <FlaskConical className="h-4 w-4 text-teal-400" />
          8 topics · 8 visualizers · 1 playground · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function PyramidComparator() {
  const [view, setView] = useState<'pyramid' | 'trophy'>('pyramid');
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Pyramid vs Testing Trophy</h4>
        <div className="flex gap-2">
          {(['pyramid', 'trophy'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn('rounded-md border px-2.5 py-1 text-xs', view === v ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}
            >
              {v === 'pyramid' ? 'Mike Cohn pyramid' : 'Kent C. Dodds trophy'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div>
          {view === 'pyramid' ? (
            <PyramidShape
              levels={[
                { name: 'E2E', share: 5, color: 'bg-rose-400' },
                { name: 'Integration', share: 20, color: 'bg-amber-400' },
                { name: 'Unit', share: 75, color: 'bg-emerald-400' },
              ]}
            />
          ) : (
            <PyramidShape
              levels={[
                { name: 'Static (TS, lint)', share: 15, color: 'bg-cyan-400' },
                { name: 'E2E', share: 10, color: 'bg-rose-400' },
                { name: 'Integration', share: 50, color: 'bg-violet-400' },
                { name: 'Unit', share: 25, color: 'bg-emerald-400' },
              ]}
            />
          )}
        </div>
        <div className="space-y-2 text-sm text-ink-dim">
          {view === 'pyramid' ? (
            <>
              <p><strong className="text-ink">Why it works:</strong> unit tests are fast and stable. Few E2E tests because they're slow and flaky.</p>
              <p><strong className="text-ink">Critique:</strong> heavy-mocked unit tests pass while the integration is broken. Confidence is in seams, not lines.</p>
            </>
          ) : (
            <>
              <p><strong className="text-ink">Trophy idea:</strong> static checks catch the silly stuff for free. Most ROI is in integration (real DB, real HTTP, real wiring).</p>
              <p><strong className="text-ink">Pragmatic mix:</strong> TS strict + Prettier + ESLint, ~50% integration tests against ephemeral DB, a handful of unit tests for pure logic, a few E2E happy-paths.</p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function PyramidShape({ levels }: { levels: { name: string; share: number; color: string }[] }) {
  const max = Math.max(...levels.map((l) => l.share));
  return (
    <div className="space-y-1">
      {levels.map((l, i) => {
        const w = 30 + (l.share / max) * 65;
        return (
          <div key={l.name} className="flex justify-center">
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${w}%`, opacity: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 80 }}
              className={cn('relative flex h-12 items-center justify-center rounded font-mono text-xs text-bg', l.color)}
            >
              {l.name} <span className="ml-2 opacity-70">{l.share}%</span>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

function TestDoubleMatrix() {
  const rows = [
    { name: 'Dummy', purpose: 'Required arg, never used', behavior: 'no-op', verify: 'no', use: 'fill function signatures' },
    { name: 'Stub', purpose: 'Provide canned response', behavior: 'returns fixed values', verify: 'no', use: 'isolate code under test' },
    { name: 'Spy', purpose: 'Record interactions', behavior: 'real or stubbed + log', verify: 'after the fact', use: 'check callback invocation' },
    { name: 'Mock', purpose: 'Pre-set expectations', behavior: 'asserts on use', verify: 'expectations met', use: 'verify protocol with collaborators' },
    { name: 'Fake', purpose: 'Working alternative', behavior: 'real but simpler', verify: 'observe state', use: 'in-memory DB, fake clock' },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
          <tr>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Purpose</th>
            <th className="px-4 py-2 text-left">Behavior</th>
            <th className="px-4 py-2 text-left">Verify?</th>
            <th className="px-4 py-2 text-left">Best use</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-white/5">
              <td className="px-4 py-2 font-medium">{r.name}</td>
              <td className="px-4 py-2 text-ink-dim">{r.purpose}</td>
              <td className="px-4 py-2 text-ink-dim">{r.behavior}</td>
              <td className="px-4 py-2 font-mono text-ink-dim">{r.verify}</td>
              <td className="px-4 py-2 text-ink-dim">{r.use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TDD_STEPS = [
  { phase: 'red', title: 'Red — write a failing test', code: `test('add(1,2) = 3', () => {\n  expect(add(1, 2)).toBe(3);\n}); // FAIL: add is not defined` },
  { phase: 'green', title: 'Green — minimum code to pass', code: `function add(a, b) {\n  return 3;            // ← shameless. tests pass.\n}` },
  { phase: 'red', title: 'Red — second failing test', code: `test('add(2,3) = 5', () => {\n  expect(add(2, 3)).toBe(5);\n}); // FAIL: returns 3` },
  { phase: 'green', title: 'Green — generalize', code: `function add(a, b) {\n  return a + b;        // now both pass.\n}` },
  { phase: 'refactor', title: 'Refactor — improve while green', code: `// rename, dedupe, extract — tests must stay green.\nexport const add = (a, b) => a + b;` },
];

function TddCycle() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (step >= TDD_STEPS.length - 1) { setRunning(false); return; }
    const id = setTimeout(() => setStep((s) => s + 1), 1500);
    return () => clearTimeout(id);
  }, [running, step]);
  const cur = TDD_STEPS[step];
  const phaseColor = { red: 'border-rose-400/40 bg-rose-400/10 text-rose-200', green: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200', refactor: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' }[cur.phase];

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">TDD micro-loop</h4>
        <div className="flex gap-2">
          <button onClick={() => { setStep(0); setRunning(true); }} className="btn-primary h-8 text-xs"><Play className="h-3 w-3" /> Play</button>
          <button onClick={() => { setRunning(false); setStep(0); }} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap gap-2">
        {TDD_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={cn('rounded-md border px-2 py-1 text-[11px]', step === i ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}
          >
            {i + 1}. {s.phase}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn('rounded-xl border p-4', phaseColor)}>
          <div className="text-sm font-semibold">{cur.title}</div>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[12px] leading-5 text-ink-dim">{cur.code}</pre>
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}

function ContractTestDemo() {
  const consumerExpect = `// consumer (frontend): "when I GET /users/42, I expect..."
{
  status: 200,
  headers: { 'content-type': 'application/json' },
  body: { id: 42, email: 'ada@example.com', role: 'admin' }
}`;
  const providerCheck = `// provider (backend) replays consumer expectation against real impl
GET /users/42  →  200 { id: 42, email: 'ada@example.com', role: 'admin' }
✓ status matches
✓ content-type matches
✓ body shape matches

// CI fails if provider drifts from any consumer's expectations.`;

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Pact-style contract test</h4>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-cyan-300">Consumer side</div>
          <pre className="overflow-x-auto rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3 font-mono text-[12px] leading-5 text-ink-dim">{consumerExpect}</pre>
          <p className="mt-2 text-xs text-ink-faint">Generated as a JSON pact file. Published to a broker.</p>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-emerald-300">Provider side</div>
          <pre className="overflow-x-auto rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3 font-mono text-[12px] leading-5 text-ink-dim">{providerCheck}</pre>
          <p className="mt-2 text-xs text-ink-faint">CI on either side fails before deploy if the contract drifts.</p>
        </div>
      </div>
    </Card>
  );
}

function TestPicker() {
  const items = [
    { what: 'A util that formats currency', test: 'unit', why: 'Pure function, edge cases (rounding, locale)' },
    { what: 'POST /api/orders end-to-end', test: 'integration', why: 'Real DB, real auth, real validation' },
    { what: 'Login → checkout flow on a fresh browser', test: 'e2e', why: 'User journey across pages' },
    { what: 'A getter that returns a private field', test: 'skip', why: 'Trivial — testing the language' },
    { what: 'Stripe webhook signature verification', test: 'unit + integration', why: 'Crypto edge cases + real signing' },
    { what: 'A button changes color on hover', test: 'skip', why: 'Visual regression at most — costs more than it saves' },
    { what: 'Date parser with fuzzy inputs ("next Tuesday")', test: 'property-based', why: 'Generated inputs catch what you forget' },
    { what: 'Migration from v1 → v2 schema', test: 'integration on prod-like data', why: 'Constraints, FKs, and real volume reveal bugs' },
  ];
  const tones: Record<string, string> = {
    unit: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    integration: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    e2e: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    skip: 'border-white/10 bg-white/5 text-ink-faint',
    'unit + integration': 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
    'property-based': 'border-violet-400/30 bg-violet-400/10 text-violet-200',
    'integration on prod-like data': 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  };
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Where would you put this test?</h4>
      <div className="grid grid-cols-1 gap-2">
        {items.map((it) => (
          <div key={it.what} className="grid grid-cols-1 items-center gap-2 rounded-lg border border-white/5 bg-bg-soft/40 p-3 sm:grid-cols-[2fr_1.2fr_2fr]">
            <div className="text-sm">{it.what}</div>
            <div><span className={cn('inline-block rounded-md border px-2 py-1 font-mono text-[11px]', tones[it.test])}>{it.test}</span></div>
            <div className="text-xs text-ink-dim">{it.why}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function IncidentRunbook() {
  const steps = [
    { name: '1. Acknowledge', detail: 'Page received → ack within minutes. You\'re now incident commander.' },
    { name: '2. Open a channel', detail: 'Dedicated #inc-NNN slack/discord channel. Only signal, no chatter.' },
    { name: '3. Stabilize first', detail: 'Roll back, scale up, kill bad pod, fail over to replica. Restore service > root-cause.' },
    { name: '4. Communicate', detail: 'Status page update every 15-30 min until resolved. Customers prefer honesty over silence.' },
    { name: '5. Mitigate', detail: 'Apply the smallest reversible fix. Patch later, don\'t rewrite during incident.' },
    { name: '6. Resolve', detail: 'Confirm error rate back to baseline for at least one window.' },
    { name: '7. Postmortem', detail: 'Write within 5 business days. Blameless. Action items with owners and dates.' },
  ];
  return (
    <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-4 w-4 text-amber-300" /> Incident runbook
      </div>
      <ol className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.name} className="flex gap-3 text-sm">
            <span className="font-mono text-amber-300">{s.name.split('.')[0]}.</span>
            <span><strong className="text-ink">{s.name.split('. ')[1]}</strong> — <span className="text-ink-dim">{s.detail}</span></span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SeverityCalculator() {
  const [users, setUsers] = useState(60);
  const [revenue, setRevenue] = useState(true);
  const [data, setData] = useState(false);
  const [reputational, setReputational] = useState(false);

  let sev = 'SEV4';
  if (data) sev = 'SEV1';
  else if (revenue && users > 50) sev = 'SEV1';
  else if (revenue || users > 50) sev = 'SEV2';
  else if (users > 10 || reputational) sev = 'SEV3';

  const tones: Record<string, string> = {
    SEV1: 'border-rose-500 bg-rose-500/10 text-rose-200',
    SEV2: 'border-amber-500 bg-amber-500/10 text-amber-200',
    SEV3: 'border-cyan-500 bg-cyan-500/10 text-cyan-200',
    SEV4: 'border-emerald-500 bg-emerald-500/10 text-emerald-200',
  };

  const action: Record<string, string> = {
    SEV1: 'Page on-call now. Status page red. CEO + customers updated.',
    SEV2: 'Page on-call now. Status page yellow. Frequent updates.',
    SEV3: 'Investigate during business hours. Note in #incidents.',
    SEV4: 'Open a ticket; fix in next sprint.',
  };

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Severity classifier</h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-ink-dim">% of users impacted</span>
              <span className="font-mono">{users}%</span>
            </div>
            <input type="range" min={0} max={100} value={users} onChange={(e) => setUsers(parseInt(e.target.value))} className="w-full" />
          </div>
          <Toggle label="Revenue impact (payment, checkout)" v={revenue} setV={setRevenue} />
          <Toggle label="Data loss / corruption / breach" v={data} setV={setData} />
          <Toggle label="Reputational (news, social media)" v={reputational} setV={setReputational} />
        </div>
        <div>
          <div className={cn('rounded-xl border-2 p-4 text-center', tones[sev])}>
            <div className="text-xs uppercase tracking-widest opacity-80">Severity</div>
            <div className="mt-1 text-4xl font-bold">{sev}</div>
          </div>
          <p className="mt-3 text-sm text-ink-dim">{action[sev]}</p>
        </div>
      </div>
    </Card>
  );
}

function Toggle({ label, v, setV }: { label: string; v: boolean; setV: (b: boolean) => void }) {
  return (
    <button
      onClick={() => setV(!v)}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm',
        v ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-ink-dim',
      )}
    >
      <span className="font-mono">{v ? '✓' : '○'}</span> {label}
    </button>
  );
}

function PostmortemTemplate() {
  const [open, setOpen] = useState<Record<string, boolean>>({ summary: true, timeline: false, contributing: false, action: false });
  const sections = [
    {
      key: 'summary',
      title: 'Summary',
      body: `Incident: Checkout returned 500 for 19 minutes on 2026-04-08.
Severity: SEV1. Root cause: stale DB connection pool after failover.
Customer impact: ~12% of checkouts failed (≈ $4,200 GMV).`,
    },
    {
      key: 'timeline',
      title: 'Timeline (UTC)',
      body: `14:02  PagerDuty fires — error rate > 5%
14:04  IC acknowledges; opens #inc-204
14:08  First mitigation: scale up checkout pods. No effect.
14:12  Notice failover at 14:00 in DB logs. Hypothesize stale conns.
14:14  Restart checkout deployment to flush pool.
14:17  Error rate back to baseline.
14:25  Status page resolved.`,
    },
    {
      key: 'contributing',
      title: 'Contributing factors',
      body: `• PgBouncer pool didn't auto-recycle after primary failover.
• No alert on connection-error rate (only on HTTP 5xx).
• Runbook for DB failover did not include "restart app pool".`,
    },
    {
      key: 'action',
      title: 'Action items (with owner + date)',
      body: `[ ] Configure pool to test connection on borrow (PR #1247)         — @ada,  by 04-15
[ ] Add Prometheus alert: pg_stat_activity error_rate > 1%           — @lin,  by 04-22
[ ] Update DB-failover runbook with "restart app deployments" step    — @ada,  by 04-15
[ ] Game day: simulate primary failover quarterly                    — @team, ongoing`,
    },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> <h4 className="font-semibold">Postmortem template</h4></div>
      <div className="space-y-2">
        {sections.map((s) => (
          <div key={s.key} className="rounded-xl border border-white/5 bg-bg-soft/40">
            <button onClick={() => setOpen({ ...open, [s.key]: !open[s.key] })} className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium">
              {s.title}
              <span className="text-ink-faint">{open[s.key] ? '−' : '+'}</span>
            </button>
            {open[s.key] && (
              <pre className="overflow-x-auto border-t border-white/5 px-4 py-3 font-mono text-[12px] leading-5 text-ink-dim">{s.body}</pre>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ink-faint">No "Bob shouldn't have deployed at 5pm". Always: "the system allowed deploys without canary on Fridays." Fix the system.</p>
    </Card>
  );
}

function RpoRtoSelector() {
  const [pick, setPick] = useState<'snapshot' | 'streaming' | 'multi'>('streaming');
  const opts = {
    snapshot: { name: 'Nightly snapshot', rpo: '24h', rto: '1-4h', cost: '$', desc: 'pg_dump → S3 → restore by hand. Cheap. Painful.' },
    streaming: { name: 'Streaming replica + PITR', rpo: '<1 min', rto: '5-30 min', cost: '$$', desc: 'Standby replica + WAL archived. Promote on failure. Standard for production SaaS.' },
    multi: { name: 'Multi-region active-active', rpo: '~0', rto: 'seconds', cost: '$$$$', desc: 'Two regions both serving writes. Conflict resolution. Compliance-grade.' },
  };
  const cur = opts[pick];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Database className="h-4 w-4" /> <h4 className="font-semibold">RPO / RTO selector</h4></div>
      <div className="mb-3 flex flex-wrap gap-2">
        {(['snapshot', 'streaming', 'multi'] as const).map((k) => (
          <button key={k} onClick={() => setPick(k)} className={cn('rounded-md border px-3 py-1.5 text-xs', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
            {opts[k].name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Stat label="Recovery Point Objective" value={cur.rpo} sub="data you can lose" />
        <Stat label="Recovery Time Objective" value={cur.rto} sub="time to restore" />
        <Stat label="Cost" value={cur.cost} />
        <Stat label="Verdict" value={pick === 'streaming' ? 'sweet spot' : pick === 'snapshot' ? 'side projects' : 'enterprise'} />
      </div>
      <p className="mt-3 text-sm text-ink-dim">{cur.desc}</p>
      <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
        ⚠ Test your restore quarterly. A backup that has never been restored is not a backup; it's a wish.
      </div>
    </Card>
  );
}

function ChaosExperiments() {
  const items = [
    { name: 'Kill a random pod', tool: 'kubectl delete pod', risk: 'low', teach: 'Are HPA + readiness probes correct?' },
    { name: 'Inject 200ms latency', tool: 'tc qdisc / Toxiproxy', risk: 'low', teach: 'Are timeouts and retries sane?' },
    { name: 'Drop the primary DB', tool: 'manual failover', risk: 'high', teach: 'Does app reconnect to replica?' },
    { name: 'Saturate CPU on one node', tool: 'stress-ng', risk: 'medium', teach: 'Does k8s evict properly?' },
    { name: 'Block egress to a 3rd party', tool: 'iptables', risk: 'medium', teach: 'Circuit breaker working?' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Chaos experiments to start with</h4>
      <div className="grid grid-cols-1 gap-2">
        {items.map((e) => (
          <div key={e.name} className="grid grid-cols-1 items-center gap-2 rounded-lg border border-white/5 bg-bg-soft/40 p-3 sm:grid-cols-[1.4fr_1.2fr_1fr_2fr]">
            <div className="text-sm font-medium">{e.name}</div>
            <div className="font-mono text-xs text-ink-dim">{e.tool}</div>
            <div className={cn('text-xs', e.risk === 'high' ? 'text-rose-300' : e.risk === 'medium' ? 'text-amber-300' : 'text-emerald-300')}>risk: {e.risk}</div>
            <div className="text-xs text-ink-dim">{e.teach}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">Game day in non-prod first. Page yourself, run the script, time how long until it self-heals or you intervene.</p>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'What\'s the difference between a mock and a stub?',
    options: [
      'No difference — same thing.',
      'A stub returns canned values; a mock additionally asserts on how it was called.',
      'A mock is fast; a stub is slow.',
      'Stubs only work in JavaScript.',
    ],
    answer: 1,
    explain: 'Mocks have expectations. The test fails if the SUT doesn\'t call the mock as specified. Stubs are passive value-providers.',
  },
  {
    q: 'You hit 100% coverage and ship. The next day production breaks. How is this possible?',
    options: [
      'Coverage was wrong.',
      'Coverage measures code executed, not behavior verified. Tests can run code without asserting it works.',
      'You needed E2E tests.',
      'TypeScript would have caught it.',
    ],
    answer: 1,
    explain: 'Coverage is a floor, not a ceiling. A test that calls a function and asserts nothing still adds coverage.',
  },
  {
    q: 'During a SEV1, your first action should be to...',
    options: [
      'Find and blame the engineer who pushed the bad code.',
      'Restore service — roll back, scale, fail over. Root-cause later.',
      'Write the postmortem.',
      'Open a chargeback dispute.',
    ],
    answer: 1,
    explain: 'Mitigate first, investigate second. Hours of root-cause analysis with users down is malpractice.',
  },
  {
    q: 'RPO of 1 hour means...',
    options: [
      'You will be down at most 1 hour.',
      'You can lose at most 1 hour of data on recovery.',
      'Your backups run every hour.',
      'Your replica lags by 1 hour.',
    ],
    answer: 1,
    explain: 'RPO = Recovery Point Objective = max acceptable data loss. RTO = Recovery Time Objective = max acceptable downtime.',
  },
  {
    q: 'Best target for contract testing between two services you own?',
    options: [
      'Heavy E2E tests through both services.',
      'Pure unit tests in each service.',
      'Consumer-driven contracts (Pact) so each side breaks the build before drift escapes.',
      'Manual QA.',
    ],
    answer: 2,
    explain: 'Contract tests catch interface drift cheaply, without spinning up the whole stack.',
  },
];
