import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Activity, Sparkles, FileText, Scale, DollarSign, GitBranch, Beaker } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 13;

export default function Layer13() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="tracing" kicker="13.1" title="Distributed Tracing & Logs">
        <TopicCard
          layerId={L}
          index={0}
          title="Follow one request through ten services"
          description="A trace is a tree of spans, propagated via the W3C traceparent header. Tail-sampling keeps cost down by storing only interesting traces (errors, long-tail latency)."
        >
          <SpanTreeDemo />
        </TopicCard>
        <RedUseExplainer />
      </Section>

      <Section id="flags" kicker="13.2" title="Feature Flags & Gradual Rollouts">
        <TopicCard
          layerId={L}
          index={1}
          title="Decouple deploy from release"
          description="Ship code dark behind a flag. Ramp from 1% → 10% → 50% → 100% over hours or days. Kill the flag in seconds if metrics tank."
        >
          <FeatureFlagRollout />
          <FlagTypes />
        </TopicCard>
      </Section>

      <Section id="ab" kicker="13.3" title="A/B Testing & Statistical Significance">
        <TopicCard
          layerId={L}
          index={2}
          title="Don't ship lies as wins"
          description="A 5% conversion lift on 200 users is noise. Without sample-size math, every change looks great in retrospect. Pre-register the metric, the duration, and the threshold."
        >
          <AbCalculator />
        </TopicCard>
      </Section>

      <Section id="analytics" kicker="13.4" title="Analytics & Event Taxonomy">
        <TopicCard
          layerId={L}
          index={3}
          title="A schema for behavior"
          description="Inconsistent event names are why analytics queries become archaeology. Pick a verb-noun convention, define properties once, and never let raw events flow without a contract."
        >
          <EventTaxonomy />
        </TopicCard>
      </Section>

      <Section id="ai" kicker="13.5" title="AI / LLM Integration">
        <TopicCard
          layerId={L}
          index={4}
          title="Prompts, RAG, embeddings, cost"
          description="LLM features are now table-stakes. The work is in retrieval (RAG), structured output (function calling / JSON schemas), eval, and watching the cost meter."
        >
          <RagDiagram />
          <LlmCostCalculator />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={240}
          title="A tiny RAG prompt assembly"
          initial={`// 1. Embed the user's query (separate API call to /v1/embeddings)
const queryEmbedding = [0.12, -0.07, /* 1536 dims */];

// 2. Cosine-similarity against your vector DB → top K passages
const topK = [
  { id: 'doc:42#3', text: 'Refunds processed within 7 business days.', score: 0.91 },
  { id: 'doc:11#8', text: 'Subscriptions cancel at end of period.',   score: 0.84 },
];

// 3. Assemble the prompt with system instructions + retrieved context + user query
const prompt = [
  { role: 'system', content: 'You are a support assistant. Cite the doc IDs you used. If unsure, say so.' },
  { role: 'system', content: 'Context:\\n' + topK.map(c => '[' + c.id + '] ' + c.text).join('\\n') },
  { role: 'user', content: 'How long do refunds take?' },
];

console.log(JSON.stringify(prompt, null, 2));
console.log('\\nLLM answers using ONLY the retrieved context — fewer hallucinations.');`}
        />
      </Section>

      <Section id="finops" kicker="13.6" title="FinOps — Cloud Cost">
        <TopicCard
          layerId={L}
          index={5}
          title="Egress is the silent killer"
          description="Most surprise bills come from data transfer (cross-AZ, cross-region, internet egress). After that: idle resources, oversized instances, and untagged things nobody owns."
        >
          <CloudCostEstimator />
          <CostHabits />
        </TopicCard>
      </Section>

      <Section id="legal" kicker="13.7" title="Legal & Compliance Basics">
        <TopicCard
          layerId={L}
          index={6}
          title="GDPR · CCPA · cookie consent · ToS"
          description="Not legal advice — the practical engineer's checklist. The cost of getting this right is small; the cost of getting it wrong is fines and class actions."
        >
          <ComplianceChecklist />
        </TopicCard>
      </Section>

      <Section id="adr" kicker="13.8" title="Architecture Decision Records & Documentation">
        <TopicCard
          layerId={L}
          index={7}
          title="Future-you (and your hires) will thank you"
          description="An ADR is a one-page decision log: context, options, decision, consequences. Cheap to write, immensely valuable when someone asks 'why did we do this?' three years later."
        >
          <AdrTemplate />
          <DocsHierarchy />
        </TopicCard>
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 13 Quiz">
        <Quiz id="L13" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-purple-500/10 via-bg-card to-blue-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-purple-500 to-blue-500 text-white">L13</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Product Operations</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Run the product, not just the code</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Tracing that finds the slow span. Flags that ship behind a 1% canary. A/B tests that aren't lies.
          AI features without a runaway bill. Compliance without the panic. Decisions written down.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <BarChart3 className="h-4 w-4 text-purple-400" />
          8 topics · 9 visualizers · 1 playground · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

type Span = { name: string; service: string; start: number; dur: number; depth: number; status?: 'ok' | 'err' };

function SpanTreeDemo() {
  const spans: Span[] = [
    { name: 'POST /api/checkout', service: 'gateway', start: 0, dur: 480, depth: 0 },
    { name: 'auth.verify_token', service: 'auth', start: 5, dur: 12, depth: 1 },
    { name: 'orders.create', service: 'orders', start: 20, dur: 410, depth: 1 },
    { name: 'db.insert (orders)', service: 'orders', start: 30, dur: 28, depth: 2 },
    { name: 'payments.charge', service: 'payments', start: 70, dur: 320, depth: 2 },
    { name: 'stripe.api', service: 'payments', start: 80, dur: 290, depth: 3, status: 'err' },
    { name: 'inventory.reserve', service: 'inventory', start: 400, dur: 40, depth: 2 },
    { name: 'queue.publish', service: 'orders', start: 445, dur: 25, depth: 2 },
  ];
  const total = Math.max(...spans.map((s) => s.start + s.dur));
  const colors: Record<string, string> = { gateway: 'bg-violet-400', auth: 'bg-cyan-400', orders: 'bg-emerald-400', payments: 'bg-amber-400', inventory: 'bg-blue-400' };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Distributed trace (one request)</h4>
        <span className="text-xs text-ink-faint">total {total} ms · trace_id: 7f2a...91e</span>
      </div>
      <div className="space-y-1">
        {spans.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_2fr] items-center gap-2">
            <div className="flex items-center gap-2 text-xs" style={{ paddingLeft: `${s.depth * 14}px` }}>
              <span className={cn('h-2 w-2 rounded-full', colors[s.service] || 'bg-white')} />
              <span className="truncate font-mono">{s.name}</span>
            </div>
            <div className="relative h-5 rounded bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(s.dur / total) * 100}%` }}
                viewport={{ once: true }}
                style={{ left: `${(s.start / total) * 100}%` }}
                className={cn('absolute top-0 h-full rounded', s.status === 'err' ? 'bg-rose-400' : colors[s.service])}
                title={`${s.service} · ${s.dur}ms`}
              />
              <span className="absolute right-1 top-0 h-full text-[10px] leading-5 text-ink-faint">{s.dur}ms</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        The red span (<span className="text-rose-300">stripe.api 290ms</span>) dominates and errored — that's where you investigate. Without tracing you'd be guessing.
      </p>
    </Card>
  );
}

function RedUseExplainer() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card>
        <div className="mb-2 flex items-center gap-2"><Activity className="h-4 w-4" /> <h4 className="font-semibold">RED — for services</h4></div>
        <ul className="space-y-1 text-sm text-ink-dim">
          <li>• <strong className="text-ink">R</strong>ate — requests per second</li>
          <li>• <strong className="text-ink">E</strong>rrors — failed requests</li>
          <li>• <strong className="text-ink">D</strong>uration — latency distribution (P50/P95/P99)</li>
        </ul>
        <p className="mt-2 text-xs text-ink-faint">Ship these three for every endpoint. PromQL: <InlineCode>rate(http_requests_total[1m])</InlineCode>, <InlineCode>histogram_quantile(0.99, ...)</InlineCode>.</p>
      </Card>
      <Card>
        <div className="mb-2 flex items-center gap-2"><Activity className="h-4 w-4" /> <h4 className="font-semibold">USE — for resources</h4></div>
        <ul className="space-y-1 text-sm text-ink-dim">
          <li>• <strong className="text-ink">U</strong>tilization — % time the resource was busy</li>
          <li>• <strong className="text-ink">S</strong>aturation — how queued/overcommitted</li>
          <li>• <strong className="text-ink">E</strong>rrors — error count from the resource</li>
        </ul>
        <p className="mt-2 text-xs text-ink-faint">For CPU, disk, network, DB connection pool. RED is for what your users feel; USE is for what's beneath.</p>
      </Card>
    </div>
  );
}

function FeatureFlagRollout() {
  const [pct, setPct] = useState(5);
  const [variant, setVariant] = useState<'on' | 'off'>('off');
  const users = Array.from({ length: 100 });

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2"><GitBranch className="h-4 w-4" /> Gradual rollout</h4>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-ink-dim">on for {pct}% of users</span>
          <input type="range" min={0} max={100} value={pct} onChange={(e) => setPct(parseInt(e.target.value))} className="w-32" />
        </div>
      </div>
      <div className="grid grid-cols-10 gap-1 sm:grid-cols-20">
        {users.map((_, i) => {
          const on = i < pct;
          return (
            <div key={i} className={cn('h-5 rounded-sm', on ? 'bg-accent' : 'bg-white/5')} title={`user ${i + 1}`} />
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-dim">your view:</span>
        {(['off', 'on'] as const).map((v) => (
          <button key={v} onClick={() => setVariant(v)} className={cn('rounded-md border px-2 py-1 font-mono text-xs', variant === v ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
            variant: {v}
          </button>
        ))}
      </div>
      <pre className="mt-3 overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[12px] leading-5 text-ink-dim">{`if (flags.isEnabled('new-checkout', { userId: user.id })) {
  return <NewCheckout />;
}
return <OldCheckout />;`}</pre>
      <p className="mt-3 text-xs text-ink-faint">Hashing user IDs into buckets means a user always sees the same variant. Bump the % gradually; kill the flag in seconds if RED metrics drift.</p>
    </Card>
  );
}

function FlagTypes() {
  const items = [
    { type: 'Release', life: 'days', purpose: 'Hide unfinished work in main', remove: 'Yes — after launch' },
    { type: 'Experiment', life: 'weeks', purpose: 'A/B variants', remove: 'Yes — after decision' },
    { type: 'Ops / Kill switch', life: 'forever', purpose: 'Disable features under load', remove: 'No — keep' },
    { type: 'Permission / Entitlement', life: 'forever', purpose: 'Pricing tiers, beta access', remove: 'No' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Four kinds of flags (don't mix them)</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-left">Lifetime</th><th className="px-4 py-2 text-left">Purpose</th><th className="px-4 py-2 text-left">Remove?</th></tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.type} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{it.type}</td>
                <td className="px-4 py-2 text-ink-dim">{it.life}</td>
                <td className="px-4 py-2 text-ink-dim">{it.purpose}</td>
                <td className="px-4 py-2 font-mono text-ink-dim">{it.remove}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AbCalculator() {
  const [n, setN] = useState(2000);
  const [a, setA] = useState(10);
  const [b, setB] = useState(12);

  const successA = Math.round(n * a / 100);
  const successB = Math.round(n * b / 100);
  const pA = successA / n;
  const pB = successB / n;

  // Two-proportion z-test (rough)
  const pPool = (successA + successB) / (2 * n);
  const se = Math.sqrt(pPool * (1 - pPool) * (2 / n));
  const z = se > 0 ? (pB - pA) / se : 0;
  // Two-tailed p-value approximation
  const pVal = se > 0 ? 2 * (1 - normalCdf(Math.abs(z))) : 1;

  // Sample size needed for 80% power, alpha=0.05, MDE = current diff
  const mde = Math.abs(b - a) / 100;
  const requiredN = mde > 0 ? Math.ceil(16 * pPool * (1 - pPool) / (mde * mde)) : Infinity;

  const significant = pVal < 0.05;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Beaker className="h-4 w-4" /> <h4 className="font-semibold">A/B significance calculator</h4></div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Slider label="N per variant" value={n} setValue={setN} min={100} max={50000} />
        <Slider label="Conversion A (%)" value={a} setValue={setA} min={1} max={50} />
        <Slider label="Conversion B (%)" value={b} setValue={setB} min={1} max={50} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Lift" value={`${((pB - pA) / pA * 100).toFixed(1)}%`} />
        <Stat label="z-score" value={z.toFixed(2)} />
        <Stat label="p-value" value={isFinite(pVal) ? pVal.toFixed(4) : '—'} sub={significant ? 'significant ✓' : 'not significant'} />
        <Stat label="N needed for 80% power" value={requiredN === Infinity ? '∞' : requiredN.toLocaleString()} />
      </div>
      <div className={cn('mt-3 rounded-lg border px-3 py-2 text-sm', significant ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200')}>
        {significant
          ? `Result is statistically significant (α = 0.05). Variant B converts at ${(pB * 100).toFixed(1)}% vs A at ${(pA * 100).toFixed(1)}%.`
          : `Not significant yet. Either run longer (~${requiredN.toLocaleString()} per variant) or accept the data is noisy.`}
      </div>
      <p className="mt-3 text-xs text-ink-faint">Pre-register the metric, the duration, and the threshold before you start. Otherwise you're hunting for any cut that looks good (p-hacking).</p>
    </Card>
  );
}

function normalCdf(z: number): number {
  // Abramowitz & Stegun approximation
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return 1 - p;
}

function Slider({ label, value, setValue, min, max }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-ink-dim">{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => setValue(parseInt(e.target.value))} className="w-full" />
    </div>
  );
}

function EventTaxonomy() {
  const events = [
    { name: 'signup_completed', when: 'after email verified', props: 'plan, source, referral' },
    { name: 'subscription_started', when: 'first successful charge', props: 'plan, mrr_cents, currency' },
    { name: 'feature_used', when: 'each meaningful action', props: 'feature_id, context' },
    { name: 'checkout_failed', when: 'payment declined', props: 'reason_code, amount_cents' },
    { name: 'session_started', when: 'tab opened', props: 'utm_source, utm_medium, utm_campaign' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Event naming convention: <InlineCode>{`{noun}_{past_verb}`}</InlineCode></h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Event</th><th className="px-4 py-2 text-left">Fired when</th><th className="px-4 py-2 text-left">Properties</th></tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-mono text-emerald-300">{e.name}</td>
                <td className="px-4 py-2 text-ink-dim">{e.when}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-dim">{e.props}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 space-y-1 text-xs text-ink-dim">
        <li>• Past-tense verbs (<InlineCode>signup_completed</InlineCode>) — events describe things that <em>happened</em>.</li>
        <li>• <InlineCode>snake_case</InlineCode> consistently. Pick one and never mix.</li>
        <li>• Identify users on signup with a stable ID — not the email (it changes).</li>
        <li>• Track <InlineCode>$identify</InlineCode> + <InlineCode>$group</InlineCode> for B2B (org_id).</li>
        <li>• Schema-first: validate event shape before sending. Wrong schemas are unfixable in retrospect.</li>
      </ul>
    </Card>
  );
}

function RagDiagram() {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4" /> <h4 className="font-semibold">Retrieval-Augmented Generation (RAG)</h4></div>
      <svg viewBox="0 0 600 220" className="w-full">
        {[
          { x: 20, y: 90, w: 110, h: 50, label: 'User query', color: '#6366f1' },
          { x: 165, y: 30, w: 130, h: 50, label: 'Embed → vector', color: '#22d3ee' },
          { x: 165, y: 140, w: 130, h: 50, label: 'Vector DB\n(pgvector / Pinecone)', color: '#34d399' },
          { x: 330, y: 90, w: 130, h: 50, label: 'Top-K passages', color: '#a78bfa' },
          { x: 490, y: 90, w: 100, h: 50, label: 'LLM\n(answer + cite)', color: '#f59e0b' },
        ].map((b) => (
          <g key={b.label}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="10" fill={b.color + '22'} stroke={b.color} />
            {b.label.split('\n').map((line, i) => (
              <text key={i} x={b.x + b.w / 2} y={b.y + 22 + i * 14} textAnchor="middle" fill="white" fontSize="11">{line}</text>
            ))}
          </g>
        ))}
        <line x1="130" y1="115" x2="165" y2="55" stroke="rgba(255,255,255,0.2)" />
        <line x1="295" y1="55" x2="330" y2="115" stroke="rgba(255,255,255,0.2)" />
        <line x1="295" y1="165" x2="330" y2="115" stroke="rgba(255,255,255,0.2)" />
        <line x1="460" y1="115" x2="490" y2="115" stroke="rgba(255,255,255,0.2)" />
      </svg>
      <p className="mt-3 text-xs text-ink-dim">
        RAG grounds the LLM in your data. Cheaper than fine-tuning, easier to update (just change the index), and the model can cite sources — fewer hallucinations.
      </p>
    </Card>
  );
}

function LlmCostCalculator() {
  const [model, setModel] = useState<'haiku' | 'sonnet' | 'opus'>('sonnet');
  const [inTok, setInTok] = useState(2000);
  const [outTok, setOutTok] = useState(500);
  const [requests, setRequests] = useState(10000);
  const [cacheHit, setCacheHit] = useState(50);

  // Indicative pricing — directionally accurate, check live pricing for production
  const prices = {
    haiku:  { in: 1,    out: 5,   cachedIn: 0.10 },
    sonnet: { in: 3,    out: 15,  cachedIn: 0.30 },
    opus:   { in: 15,   out: 75,  cachedIn: 1.50 },
  } as const;
  const p = prices[model];

  const cacheableTokens = inTok * (cacheHit / 100);
  const fullTokens = inTok - cacheableTokens;
  const inputCost = (fullTokens * p.in + cacheableTokens * p.cachedIn) / 1_000_000;
  const outputCost = (outTok * p.out) / 1_000_000;
  const perReq = inputCost + outputCost;
  const monthly = perReq * requests;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4" /> <h4 className="font-semibold">LLM cost estimator</h4></div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <div>
            <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">Model</div>
            <div className="flex gap-1.5">
              {(['haiku', 'sonnet', 'opus'] as const).map((m) => (
                <button key={m} onClick={() => setModel(m)} className={cn('flex-1 rounded-md border px-2 py-1 text-xs', model === m ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <Slider label="Input tokens / request" value={inTok} setValue={setInTok} min={100} max={50000} />
          <Slider label="Output tokens / request" value={outTok} setValue={setOutTok} min={50} max={4000} />
          <Slider label="Requests / month" value={requests} setValue={setRequests} min={100} max={1_000_000} />
          <Slider label="Cache hit rate (%)" value={cacheHit} setValue={setCacheHit} min={0} max={100} />
        </div>
        <div className="space-y-2">
          <Stat label="Cost per request" value={`$${perReq.toFixed(4)}`} />
          <Stat label="Monthly cost" value={`$${monthly.toFixed(0)}`} sub={`${requests.toLocaleString()} req/mo`} />
          <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-3 text-xs text-ink-dim">
            <div className="font-semibold text-ink">Cost knobs</div>
            <ul className="mt-1 space-y-1">
              <li>• Use the smallest model that hits quality (Haiku &lt; Sonnet &lt; Opus).</li>
              <li>• Prompt cache the system + retrieved-context portions (huge savings).</li>
              <li>• Cap output tokens — most answers don't need 4k.</li>
              <li>• Batch where you can; retry with backoff.</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CloudCostEstimator() {
  const [compute, setCompute] = useState(200);
  const [storage, setStorage] = useState(40);
  const [egress, setEgress] = useState(150);
  const [observability, setObservability] = useState(80);
  const [thirdParty, setThirdParty] = useState(120);

  const total = compute + storage + egress + observability + thirdParty;
  const items = [
    { label: 'Compute (VMs / containers)', v: compute, c: 'bg-cyan-400' },
    { label: 'Storage (DB, object)', v: storage, c: 'bg-emerald-400' },
    { label: 'Egress / data transfer', v: egress, c: 'bg-rose-400' },
    { label: 'Observability (logs, APM)', v: observability, c: 'bg-amber-400' },
    { label: '3rd party SaaS (auth, email, monitoring)', v: thirdParty, c: 'bg-violet-400' },
  ];

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Monthly cloud cost — where it goes</h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
        <div className="space-y-2">
          <Slider label="Compute ($)" value={compute} setValue={setCompute} min={0} max={2000} />
          <Slider label="Storage ($)" value={storage} setValue={setStorage} min={0} max={1000} />
          <Slider label="Egress ($)" value={egress} setValue={setEgress} min={0} max={3000} />
          <Slider label="Observability ($)" value={observability} setValue={setObservability} min={0} max={1500} />
          <Slider label="3rd party SaaS ($)" value={thirdParty} setValue={setThirdParty} min={0} max={2000} />
        </div>
        <div>
          <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4 text-center">
            <div className="text-xs uppercase tracking-widest text-ink-faint">Monthly</div>
            <div className="mt-1 text-3xl font-semibold">${total.toLocaleString()}</div>
          </div>
          <div className="mt-3 space-y-1">
            {items.map((it) => (
              <div key={it.label} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-dim">{it.label}</span>
                  <span className="font-mono">{Math.round(it.v / total * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded bg-white/5">
                  <div className={cn('h-full', it.c)} style={{ width: `${(it.v / total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CostHabits() {
  const items = [
    { tip: 'Tag every resource with Owner + Environment + Project. Untagged = orphaned.' },
    { tip: 'Run a weekly "leftovers" report — unattached EBS volumes, idle ELBs, snapshots > 30 days.' },
    { tip: 'Use spot/preemptible for stateless workers; reserved/savings plans for steady baseline.' },
    { tip: 'Set up a billing alert at 50%, 80%, 100% of budget. Cheap; saves heart attacks.' },
    { tip: 'Compress logs before shipping. Sample DEBUG. Store INFO+ in cheap tier; ERROR+ in hot tier.' },
    { tip: 'CDN everything cacheable — egress from origin is the most expensive byte you serve.' },
    { tip: 'Use S3 Intelligent-Tiering or lifecycle policies. Most analytics data goes cold quickly.' },
    { tip: 'Watch NAT gateway egress. Cross-AZ traffic is billed. VPC endpoints fix the worst of it.' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">FinOps habits</h4>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg border border-white/5 bg-bg-soft/40 p-3 text-sm text-ink-dim">{it.tip}</li>
        ))}
      </ul>
    </Card>
  );
}

function ComplianceChecklist() {
  const items = [
    { law: 'GDPR / UK GDPR', items: ['Lawful basis documented (consent / legitimate interest / contract)', 'Cookie banner with granular consent (not just "OK")', 'DPA with each sub-processor (Stripe, Postmark, etc.)', 'Subject access requests (SAR) within 30 days', 'Right to erasure (data deletion endpoint)', 'Data breach notification within 72 hours'] },
    { law: 'CCPA / CPRA (California)', items: ['"Do Not Sell My Personal Information" link in footer', 'Privacy policy with categories of data collected + sold/shared', '12-month retention disclosure', 'Verifiable consumer requests'] },
    { law: 'Cross-cutting basics', items: ['Privacy policy + Terms of Service published', 'Cookie consent before non-essential cookies fire', 'Encryption in transit (TLS) AND at rest (DB)', 'Audit log of admin actions', 'Vendor list + risk review for SaaS sub-processors'] },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Scale className="h-4 w-4" /> <h4 className="font-semibold">Compliance starter checklist (not legal advice)</h4></div>
      <div className="space-y-3">
        {items.map((g) => (
          <div key={g.law}>
            <div className="text-sm font-semibold">{g.law}</div>
            <ul className="mt-1 space-y-1">
              {g.items.map((it) => (
                <li key={it} className="rounded-lg border border-white/5 bg-bg-soft/30 px-3 py-1.5 text-sm text-ink-dim">{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AdrTemplate() {
  const adr = `# ADR-007: Use PostgreSQL + pgvector for embeddings storage

Status: Accepted · Date: 2026-04-12 · Deciders: Ada, Lin

## Context
We need vector storage for the RAG feature. Expected scale: 5M vectors, 1536 dims.
Current stack already includes Postgres for OLTP. New AI feature shipping in 4 weeks.

## Options considered
1. Pinecone — managed, fast, $70/mo at our scale, but new vendor relationship.
2. Weaviate self-hosted — flexible, but new infra to operate.
3. Postgres + pgvector — already operating Postgres, no new vendor, slightly slower.

## Decision
Postgres + pgvector. We already operate Postgres at high reliability. The latency
delta vs Pinecone is acceptable (<100ms P95) at our scale. Re-evaluate at 50M vectors.

## Consequences
+ No new vendor, no new infra, no new auth
+ Same backups, same observability
− Vector queries compete with OLTP for connection pool — needs read replica
− HNSW index build is slow on large initial load; do offline first time

## Revisit if
- Vector count > 50M
- P95 query latency > 200ms
- We need cross-tenant similarity search at scale`;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> <h4 className="font-semibold">ADR (Architecture Decision Record) template</h4></div>
      <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-5 text-ink-dim">{adr}</pre>
      <p className="mt-3 text-xs text-ink-faint">One markdown file per decision in <InlineCode>/docs/adr/</InlineCode>. Numbered, never deleted (mark superseded). Read top to bottom = your team's reasoning history.</p>
    </Card>
  );
}

function DocsHierarchy() {
  const docs = [
    { name: 'README.md', who: 'New visitors', what: 'What this is, who it\'s for, how to run locally in 5 commands.' },
    { name: 'CONTRIBUTING.md', who: 'External contributors', what: 'How to set up, branch, PR, test, release.' },
    { name: '/docs/adr/', who: 'Future you + senior hires', what: 'Architecture decision records.' },
    { name: '/docs/runbooks/', who: 'On-call', what: 'For each alert: what it means, how to diagnose, how to mitigate.' },
    { name: '/docs/playbooks/', who: 'Team', what: 'Recurring procedures: deploys, rotations, incidents, postmortems.' },
    { name: 'API docs (OpenAPI)', who: 'Integrators', what: 'Generated from code. Versioned. Always live.' },
    { name: 'CHANGELOG.md', who: 'Users', what: 'Human summary of releases. Conventional commits feed it.' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Docs that survive turnover</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Doc</th><th className="px-4 py-2 text-left">Audience</th><th className="px-4 py-2 text-left">Contains</th></tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-mono text-accent-cyan">{d.name}</td>
                <td className="px-4 py-2 text-ink-dim">{d.who}</td>
                <td className="px-4 py-2 text-ink-dim">{d.what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'A trace shows the slow span is in payment.charge (290ms, errored). What\'s the right next step?',
    options: [
      'Add more retries everywhere.',
      'Look at logs and metrics for the payment service around that time, and at the dependency it called.',
      'Switch to a different payment provider.',
      'Increase the global timeout.',
    ],
    answer: 1,
    explain: 'Tracing told you WHERE. Logs and metrics tell you WHY. Walk down the chain from the failed span.',
  },
  {
    q: 'Your A/B test shows variant B converts 12% vs A at 10% on 200 users each. Verdict?',
    options: [
      'Ship B — clear win.',
      'Sample is too small; the difference is well within noise. Run longer.',
      'Ship A — risk-averse.',
      'A is statistically better.',
    ],
    answer: 1,
    explain: 'A 2pp delta on 200 users is not significant. Compute required sample size up front.',
  },
  {
    q: 'A surprise $4,000 cloud bill — most likely culprit?',
    options: [
      'Compute',
      'Storage',
      'Data transfer / egress (cross-AZ, cross-region, internet)',
      'DNS queries',
    ],
    answer: 2,
    explain: 'Surprise bills almost always come from egress. Audit cross-AZ chatter, NAT gateway throughput, and unbatched API calls.',
  },
  {
    q: 'You add a feature flag to ship behind a 1% canary. Two weeks later the launch is over. What now?',
    options: [
      'Leave the flag — might want to roll back later.',
      'Remove the flag and the dead branch — release flags should not become permanent.',
      'Move it to ops/kill-switch type.',
      'Convert it to a permission flag.',
    ],
    answer: 1,
    explain: 'Dead release flags are a maintenance tax and a foot-gun. Plan removal as part of "definition of done".',
  },
  {
    q: 'Best primary defence against LLM hallucinations in a Q&A product?',
    options: [
      'Lower the temperature.',
      'Use a bigger model.',
      'Retrieval-Augmented Generation: ground answers in trusted sources, ask the model to cite.',
      'Add more system prompts.',
    ],
    answer: 2,
    explain: 'RAG anchors answers to your documents and lets you cite sources. Model size and temperature help only at the margin.',
  },
];
