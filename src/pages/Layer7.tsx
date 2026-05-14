import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, Zap, Activity, RotateCcw } from 'lucide-react';
import { Section, TopicCard, InlineCode, Card, Stat, Steps, Compare } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 7;

export default function Layer7() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="design" kicker="7.1" title="System Design Principles">
        <TopicCard
          layerId={L}
          index={0}
          title="Scale, load balance, partition"
          description="Senior engineers estimate before they draw boxes. Back-of-envelope first: 1M req/day ≈ 11.5 req/s — that fits on one box, so don't design a distributed system for it. The numbers, not instinct, decide the architecture."
        />
        <Compare
          items={[
            {
              label: 'Vertical scaling — bigger box',
              tone: 'a',
              body: (
                <>
                  No code change, no distributed-systems tax — the right first move. But it's bounded by the largest instance you can
                  rent, and it stays a single failure domain. Don't distribute what fits on one machine.
                </>
              ),
            },
            {
              label: 'Horizontal scaling — more boxes',
              tone: 'b',
              body: (
                <>
                  Unbounded <em>only if</em> the service is stateless. The cost is everything that was free in-process — locks, ordering,
                  "read your own write" — now needs the network. You take on the distributed-systems tax the moment you cross this line.
                </>
              ),
            },
          ]}
        />
        <Compare
          items={[
            {
              label: 'L4 load balancer',
              tone: 'a',
              body: (
                <>
                  Routes by IP/port — fast, protocol-agnostic, no payload inspection. Can't do path routing or retries because it never
                  reads the HTTP request. The cheap, dumb hop.
                </>
              ),
            },
            {
              label: 'L7 load balancer',
              tone: 'b',
              body: (
                <>
                  Reads the HTTP request: route by path/header, terminate TLS, retry idempotent calls. A smarter hop — but slower and
                  more expensive for it.
                </>
              ),
            },
            {
              label: 'Either way — the LB is a SPOF',
              tone: 'warn',
              body: (
                <>
                  Whichever layer, the load balancer is now a single point of failure and a bandwidth chokepoint. It needs its own
                  redundancy or you've just moved the outage, not removed it.
                </>
              ),
            },
          ]}
        />
        <Compare
          items={[
            {
              label: 'Modulo hashing — hash % N',
              tone: 'fail',
              body: (
                <>
                  Reshuffles <em>every</em> key the moment <InlineCode>N</InlineCode> changes — add or drop one node and the whole cache
                  cold-starts. Fine until you ever resize the cluster, which you always do.
                </>
              ),
            },
            {
              label: 'Consistent hashing — the ring',
              tone: 'c',
              body: (
                <>
                  Keys and nodes both hash onto a ring; a key belongs to the next node clockwise, so adding/removing a node only remaps
                  ~1/N of keys. This is what L6 service meshes and sharded caches run under the hood.
                </>
              ),
            },
            {
              label: 'Virtual nodes — the fix for skew',
              tone: 'warn',
              body: (
                <>
                  Naive ring placement skews load — a few nodes own the big arcs. Real implementations give each physical node many ring
                  points (virtual nodes) so load evens out. The cost the ring quietly bills you.
                </>
              ),
            },
          ]}
        />
        <Compare
          items={[
            {
              label: 'CAP — the partition choice',
              tone: 'a',
              body: (
                <>
                  Under a network partition you pick C or A — you cannot have both, because the two sides can't coordinate. State which
                  side you're on <em>per data type</em>: a payment ledger is CP, a "last seen" timestamp is AP.
                </>
              ),
            },
            {
              label: 'PACELC — the honest version',
              tone: 'b',
              body: (
                <>
                  <em>Else</em>: with no partition at all, you still trade Latency vs Consistency. Every synchronous replica ack is
                  latency you chose to pay. CAP only describes the outage; PACELC describes the steady state too.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-3 font-semibold">Back-of-envelope estimation — the worked example</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            URL shortener, 100M new links/day. <strong>Writes:</strong> 100M / 86,400s ≈ <InlineCode>1,160 writes/s</InlineCode>. <strong>Reads:</strong> assume 10:1 read/write → <InlineCode>~11,600 reads/s</InlineCode>. <strong>Storage:</strong> 100M/day × 500 bytes × 365 × 5yr ≈ <InlineCode>~90 TB</InlineCode>. <strong>Bandwidth:</strong> 11,600 reads/s × 500 B ≈ 6 MB/s — trivial.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
            What the numbers <em>decide</em>: 1.2K writes/s fits one Postgres primary — no sharding yet. 90 TB does <em>not</em> fit one disk — so the design needs partitioned storage or object storage, and that shard key is the expensive-to-reverse decision. 11.6K reads/s wants a cache in front. You now know the shape of the system before drawing a single box. Skipping this step is how you end up with Kafka for 11 req/s.
          </p>
        </Card>
        <ConsistentHashingDemo />
        <LoadBalancerDemo />
        <CapTriangle />
      </Section>

      <Section id="security" kicker="7.2" title="Application Security Engineering">
        <TopicCard
          layerId={L}
          index={1}
          title="OWASP Top 10 thinking"
          description="Most breaches aren't novel — they're old categories: broken access control, injection, misconfiguration. Threat-model the feature: who is the attacker, what is the asset, where is the trust boundary. Validate at that boundary; trust internal calls."
        />
        <Card>
          <h4 className="mb-2 font-semibold">Broken access control — the #1 risk</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            "Authenticated" is not "authorized." The IDOR test: can user A fetch user B's object by changing the id in the URL? Every
            request must be authorized for <em>this specific resource</em>, server-side — never trust a hidden field, a client-set role,
            or "they can't see the button." The mechanism that fails: scoping the query <InlineCode>WHERE id = ?</InlineCode> instead of{' '}
            <InlineCode>WHERE id = ? AND owner_id = ?</InlineCode>.
          </p>
        </Card>
        <Card>
          <h4 className="mb-2 font-semibold">Injection — keep code and data on separate channels</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Parameterized queries always — the driver sends SQL and data on separate channels, so user input can never become code.
            String-concatenation is the bug; an ORM doesn't save you if you drop to raw SQL. Same discipline for shell, LDAP, and NoSQL
            operators (<InlineCode>{`{"$gt": ""}`}</InlineCode>).
          </p>
        </Card>
        <Compare
          items={[
            {
              label: 'XSS — injected script runs in the page',
              tone: 'warn',
              body: (
                <>
                  Output-encode by context — HTML body ≠ attribute ≠ JS ≠ URL, each has different escaping. A CSP header is
                  defense-in-depth so an injected script has no origin to run from. DOMPurify only when you must render user HTML; never{' '}
                  <InlineCode>innerHTML</InlineCode> of raw user input. React escapes by default —{' '}
                  <InlineCode>dangerouslySetInnerHTML</InlineCode> is the named hole.
                </>
              ),
            },
            {
              label: 'CSRF — forged request rides the cookie',
              tone: 'b',
              body: (
                <>
                  Different bug, don't conflate it with XSS. The browser auto-attaches the cookie to a forged cross-site request. Fix:{' '}
                  <InlineCode>SameSite</InlineCode> cookies + a CSRF token the attacker's page can't read — or just use bearer tokens,
                  which aren't auto-sent so aren't vulnerable. CSRF only exists because cookie auth is ambient.
                </>
              ),
            },
          ]}
        />
        <Steps
          steps={[
            { label: 'attacker controls a URL your server fetches' },
            { label: 'server requests 169.254.169.254' },
            { label: 'metadata endpoint returns IAM credentials' },
            { label: 'your server is now a proxy into the private network', tone: 'fail' },
          ]}
          caption={
            <>
              <strong className="text-rose-200">SSRF.</strong> Any URL the server fetches is an attack surface. Allowlist destinations;
              block link-local and cloud metadata (<InlineCode>169.254.169.254</InlineCode>, <InlineCode>127.0.0.0/8</InlineCode>) — that
              endpoint hands out IAM credentials. This was the root of the Capital One breach.
            </>
          }
        />
        <Card>
          <h4 className="mb-2 font-semibold">Crypto &amp; secrets — never roll your own</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Use AES-256-GCM (authenticated) for symmetric encryption, Argon2id/bcrypt for passwords — slow <em>by design</em>, so
            brute-force is expensive. Secrets belong in a rotatable secret manager — not in env vars in prod, never in the repo (git
            history is forever). Supply chain: lockfiles, pinned deps, CVE scanning — the dependency you didn't audit is still your
            attack surface.
          </p>
        </Card>
        <Compare
          items={[
            {
              label: 'Capital One (2019) — SSRF + metadata',
              tone: 'fail',
              body: (
                <>
                  A misconfigured WAF was tricked into making a request to <InlineCode>169.254.169.254</InlineCode>, the AWS metadata
                  endpoint. That returned the instance's IAM role credentials — which had over-broad S3 read. 100M+ records exfiltrated.
                  Two failures stacked: SSRF reachable, and the role far more privileged than the workload needed. Least privilege would
                  have capped the blast radius.
                </>
              ),
            },
            {
              label: 'Log4Shell (2021) — supply chain + injection',
              tone: 'warn',
              body: (
                <>
                  A logging library evaluated <InlineCode>{'${jndi:...}'}</InlineCode> strings in logged input — so logging an
                  attacker-controlled string executed remote code. Nobody chose that feature; it shipped transitively. The lesson: a
                  dependency's behavior is your attack surface, you need an SBOM to even know you're affected, and "just patch" assumes
                  you can enumerate where it's deployed.
                </>
              ),
            },
          ]}
        />
        <RateLimiterDemo />
        <SecurityChecklist />
      </Section>

      <Section id="event" kicker="7.3" title="Event-Driven Architecture & CQRS">
        <TopicCard
          layerId={L}
          index={2}
          title="Events as the source of truth"
          description="These patterns are not defaults — they each buy you something specific and bill you in simplicity. Reach for them for a named problem, not because the architecture diagram looks senior. Most CRUD should stay CRUD."
        />
        <Compare
          items={[
            {
              label: 'Event sourcing — what it buys',
              tone: 'c',
              body: (
                <>
                  Store the sequence of events as the truth; current state is a left-fold over the log. Upside: full audit trail for
                  free, temporal queries ("what did this look like last Tuesday"), and you can build a projection you didn't plan for by
                  replaying.
                </>
              ),
            },
            {
              label: 'Event sourcing — what it bills',
              tone: 'warn',
              body: (
                <>
                  There is no <InlineCode>UPDATE</InlineCode> — fixing bad data means a compensating event; schema evolution means
                  versioned events and upcasters forever; replay over millions of events is slow, so you need snapshots. Don't
                  event-source plain CRUD — you've added all that cost for an audit log a trigger would have given you.
                </>
              ),
            },
          ]}
        />
        <Compare
          items={[
            {
              label: 'CQRS — when it is justified',
              tone: 'c',
              body: (
                <>
                  Split the write model (commands, domain rules) from the read model (denormalized projections). Justified when read and
                  write loads or <em>shapes</em> genuinely diverge — a 100:1 read ratio, or reads that need a join shape the write model
                  shouldn't carry.
                </>
              ),
            },
            {
              label: 'CQRS — the tax you pay',
              tone: 'warn',
              body: (
                <>
                  The read side lags the write side, so the system is now eventually consistent — a user who just saved something may
                  not see it on reload. If reads and writes look alike, CQRS is two models to maintain for no gain.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Eventual consistency is the tax on every async boundary</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            The moment a write and its visible effect cross a queue, they're not atomic. The senior move is to make the UI and API{' '}
            <em>tell the truth</em> about it: return "processing," show optimistic state you can roll back, give the read model a
            version. The anti-pattern is an async boundary wearing a synchronous mask — the bug surfaces later as "sometimes the data
            isn't there."
          </p>
        </Card>
        <Steps
          steps={[
            { label: 'write business row + event to outbox', tone: 'ok' },
            { label: 'one atomic commit', tone: 'ok' },
            { label: 'a relay polls the outbox' },
            { label: 'publishes to the broker — at-least-once', tone: 'ok' },
          ]}
          caption={
            <>
              <strong>Outbox pattern.</strong> Publishing an event and committing the DB row are two systems with no shared transaction
              — crash between them and you've lost the event or sent it without its data (the dual-write problem). Fix: write the event
              to an <InlineCode>outbox</InlineCode> table in the <em>same</em> transaction as the business row; a relay polls and
              publishes. One atomic commit, then at-least-once delivery — so every consumer must still be idempotent. Same shape as
              L5.5's message-queue outbox.
            </>
          }
        />
        <Card>
          <h4 className="mb-2 font-semibold">Domain events vs integration events</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Domain events stay inside a bounded context; integration events cross it. A domain event can carry your internal model
            freely. An integration event is a public contract — leak your internal schema across the boundary and every consumer is now
            coupled to your refactors. Treat the cross-context event like a versioned API, because that's what it is.
          </p>
        </Card>
        <Compare
          items={[
            {
              label: 'Choreography — events, no conductor',
              tone: 'a',
              body: (
                <>
                  Each service reacts to events and emits its own. No central coordinator, so services stay decoupled and you add a
                  consumer without touching anyone. Cost: the end-to-end flow exists in no single place — debugging a stuck order means
                  tracing events across N services, and a cyclic reaction is easy to create by accident. Good for a few steps with loose
                  coupling.
                </>
              ),
            },
            {
              label: 'Orchestration — a saga coordinator',
              tone: 'b',
              body: (
                <>
                  One orchestrator owns the workflow: call payment, then inventory, then shipping — and run compensating actions if a
                  step fails. The flow is explicit and debuggable in one place. Cost: the orchestrator is a coupling point and can become
                  a god-service. Good when the workflow is long, has real failure-handling, or someone needs to <em>see</em> the process.
                </>
              ),
            },
            {
              label: 'Both are sagas — not transactions',
              tone: 'warn',
              body: (
                <>
                  Distributed transactions don't exist across services. Both options are a saga: a sequence of local transactions with
                  compensations, not a rollback. There is no atomic "undo," only "do the opposite."
                </>
              ),
            },
          ]}
        />
        <EventSourcingDemo />
      </Section>

      <Section id="perf" kicker="7.4" title="Performance Engineering">
        <TopicCard
          layerId={L}
          index={3}
          title="Profile first; optimize what's actually slow"
          description="Optimizing without a profile is guessing — and you will optimize the wrong thing, because intuition is consistently wrong about where time goes. Measure, find the one bottleneck, fix it, measure again. The second-worst thing is invisible until the worst is gone."
        />
        <Card>
          <h4 className="mb-2 font-semibold">Report P95/P99, never the average</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            The mean is a lie when latency is skewed (it always is): one 5s request and ninety-nine 50ms ones averages to ~100ms — a
            number no user experienced. P50=50ms / P99=4s means 1 in 100 requests is 80× slower — and on a page that makes 100 calls,
            nearly <em>every</em> page hits that tail at least once. Tail latency is the user experience.
          </p>
        </Card>
        <Compare
          items={[
            {
              label: 'Flame graph — CPU-bound',
              tone: 'a',
              body: <>Shows which call stack burns the cycles. Useless on a service that's 95% blocked on I/O — it'll just show you idle.</>,
            },
            {
              label: 'Heap profiler — memory',
              tone: 'b',
              body: <>Shows what's retained and why it isn't collected. The tool for leaks and growth, not for latency.</>,
            },
            {
              label: 'Distributed traces — I/O-bound',
              tone: 'c',
              body: (
                <>
                  Shows which remote call is the wait. And the DB is usually the bottleneck — slow-query log, N+1, missing index (see
                  L5). Match the profiler to the bottleneck or you measure the wrong thing.
                </>
              ),
            },
          ]}
        />
        <Steps
          steps={[
            { label: '20% of the work is serial' },
            { label: 'add more cores / workers' },
            { label: 'the parallel 80% speeds up' },
            { label: 'total speedup caps at 5× — forever', tone: 'fail' },
          ]}
          caption={
            <>
              <strong>Amdahl's Law.</strong> Speedup is capped by the serial fraction — if 20% can't parallelize, infinite cores still
              cap you at 5×. The practical consequence: adding workers to a serial bottleneck does <em>nothing</em>. Reduce the serial
              part first; only then does parallelism pay. This is why "just add more pods" often doesn't move P99.
            </>
          }
        />
        <Compare
          items={[
            {
              label: 'Event loop / async — Node',
              tone: 'a',
              body: (
                <>
                  For I/O-bound work — cheap to hold 10K idle connections. But one CPU-heavy handler blocks <em>everything</em>; a
                  CPU-bound task on the event loop is the classic mismatch.
                </>
              ),
            },
            {
              label: 'Goroutines — Go, M:N',
              tone: 'b',
              body: <>For mixed I/O + compute, scheduled across real OS threads. The middle ground that handles both without you picking.</>,
            },
            {
              label: 'OS threads',
              tone: 'c',
              body: (
                <>
                  For true CPU parallelism. Pick wrong and the model is the bottleneck — a CPU task on the event loop, or a million
                  blocking threads exhausting the scheduler.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Load test with a realistic traffic shape</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Use k6 or Locust, ramped gradually — a flat synthetic load misses the breaking point. You're hunting the knee: the
            concurrency level where latency goes non-linear because a pool (DB connections, threads, file descriptors) saturates. That
            number is your real capacity; the average throughput is not.
          </p>
        </Card>
        <Steps
          steps={[
            { label: 'list 50 orders with their customer — P99 1.8s' },
            { label: 'guess says "add a cache" or "scale up"' },
            { label: 'the trace shows 51 sequential DB queries — N+1', tone: 'fail' },
            { label: 'one join (or batched IN) — 51 round-trips → 1' },
            { label: 'P99 1.8s → 60ms; new bottleneck is JSON serialization', tone: 'ok' },
          ]}
          caption={
            <>
              <strong>A profile-driven fix.</strong> The app server was near-idle — all I/O wait. A cache would have masked the N+1 and
              rotted the moment data changed; scaling up would have paid for 51 round-trips faster. The profile pointed at the actual
              cost. <strong>Then measure again</strong> — JSON serialization was invisible behind the query cost until the query cost
              was gone.
            </>
          }
        />
        <LatencyHistogram />
        <CodePlayground
          mode="js"
          height={220}
          title="Tiny benchmark"
          initial={`// Compare reduce vs for-loop summing
function sumReduce(n) {
  return Array.from({length: n}, (_, i) => i).reduce((a, b) => a + b, 0);
}
function sumLoop(n) {
  let s = 0;
  for (let i = 0; i < n; i++) s += i;
  return s;
}

const N = 1_000_000;
let t = performance.now();
sumReduce(N);
console.log('reduce:', (performance.now() - t).toFixed(2), 'ms');

t = performance.now();
sumLoop(N);
console.log('loop:  ', (performance.now() - t).toFixed(2), 'ms');

// JIT will eventually optimize both, but reduce often loses on cold runs.`}
        />
      </Section>

      <Section id="next" kicker="What now" title="Where this roadmap takes you">
        <Steps
          steps={[
            { label: 'build a real project per layer' },
            { label: 'mock system-design interviews' },
            { label: 'contribute to open source in your stack' },
            { label: 'write technical posts' },
          ]}
          caption={
            <>
              <strong>Next milestones.</strong> Build a real project per layer — don't only read. Mock system-design interviews (URL
              shortener, Twitter feed, Netflix-style streaming, payment ledger). Contribute to open source in your primary stack — code
              review feedback is the fastest growth. Write technical posts — teaching forces you to find the holes in your
              understanding.
            </>
          }
        />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 7 Quiz">
        <Quiz id="L7" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-fuchsia-500/10 via-bg-card to-purple-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white">L07</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Advanced & Architecture</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Make better decisions at scale</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Senior engineers differentiate themselves by the systems they design — and the systems they choose <em>not</em> to design. This layer is the tooling for those calls.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Sparkles className="h-4 w-4 text-fuchsia-400" />
          4 topics · 5 visualizers · 1 playground · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function ConsistentHashingDemo() {
  const VNODES = 50;
  const [servers, setServers] = useState(['s1', 's2', 's3']);
  const [keys, setKeys] = useState(['user:42', 'session:ab12', 'order:9001', 'cart:7']);
  const [removed, setRemoved] = useState<string | null>(null);

  const ring = useMemo(() => {
    const r: { angle: number; server: string }[] = [];
    for (const s of servers) {
      for (let i = 0; i < VNODES; i++) {
        r.push({ angle: hashStr(`${s}#${i}`) % 360, server: s });
      }
    }
    return r.sort((a, b) => a.angle - b.angle);
  }, [servers]);

  const findOwner = (key: string): string => {
    const a = hashStr(key) % 360;
    for (const node of ring) if (node.angle >= a) return node.server;
    return ring[0]?.server ?? '';
  };

  const addServer = () => {
    const id = `s${servers.length + 1}`;
    setServers((s) => [...s, id]);
    setRemoved(null);
  };
  const removeServer = () => {
    if (servers.length <= 1) return;
    const last = servers[servers.length - 1];
    setRemoved(last);
    setServers((s) => s.slice(0, -1));
  };
  const reset = () => {
    setServers(['s1', 's2', 's3']);
    setRemoved(null);
  };

  const colors: Record<string, string> = { s1: '#6366f1', s2: '#22d3ee', s3: '#34d399', s4: '#f59e0b', s5: '#f43f5e', s6: '#a78bfa' };
  const center = 130;
  const radius = 110;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Consistent hashing ring</h4>
        <div className="flex gap-2">
          <button onClick={addServer} className="btn-ghost h-8 text-xs">+ server</button>
          <button onClick={removeServer} className="btn-ghost h-8 text-xs">− server</button>
          <button onClick={reset} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="grid place-items-center">
          <svg width="260" height="260" viewBox="0 0 260 260">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            {ring.map((n, i) => {
              const x = center + radius * Math.cos((n.angle - 90) * Math.PI / 180);
              const y = center + radius * Math.sin((n.angle - 90) * Math.PI / 180);
              return <circle key={i} cx={x} cy={y} r={2.5} fill={colors[n.server] || '#fff'} />;
            })}
            {keys.map((k, i) => {
              const a = hashStr(k) % 360;
              const x = center + (radius - 22) * Math.cos((a - 90) * Math.PI / 180);
              const y = center + (radius - 22) * Math.sin((a - 90) * Math.PI / 180);
              return (
                <g key={k}>
                  <circle cx={x} cy={y} r={6} fill="rgba(255,255,255,0.95)" />
                  <text x={x + 9} y={y + 3} fill="#9aa6b2" fontSize="9" fontFamily="ui-monospace">{k.split(':')[0]}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {servers.map((s) => (
              <span key={s} className="rounded-md border px-2 py-0.5 font-mono text-xs" style={{ borderColor: colors[s], color: colors[s] }}>{s}</span>
            ))}
            {removed && <span className="rounded-md border border-rose-400/50 px-2 py-0.5 font-mono text-xs text-rose-300 line-through">{removed}</span>}
          </div>
          <div className="space-y-1">
            {keys.map((k) => {
              const owner = findOwner(k);
              return (
                <div key={k} className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-bg-soft/40 px-3 py-1.5 font-mono text-xs">
                  <span>{k}</span>
                  <span style={{ color: colors[owner] }}>→ {owner}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-ink-dim">
            Add or remove a server: only the keys that mapped to <em>that</em> server move. Modulo hashing would shuffle all keys.
          </p>
          <input
            type="text"
            placeholder="add a key (e.g. user:99)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) {
                  setKeys((k) => [...k, v]);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
            className="input mt-2 font-mono text-xs"
          />
        </div>
      </div>
    </Card>
  );
}

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function LoadBalancerDemo() {
  const [algo, setAlgo] = useState<'round-robin' | 'least-conn' | 'ip-hash'>('round-robin');
  const [servers, setServers] = useState([
    { id: 'A', conns: 0, cpu: 0 },
    { id: 'B', conns: 0, cpu: 0 },
    { id: 'C', conns: 0, cpu: 0 },
  ]);
  const [rr, setRr] = useState(0);

  const send = (clientIp = `10.0.0.${Math.floor(Math.random() * 256)}`) => {
    let target = 0;
    if (algo === 'round-robin') {
      target = rr % servers.length;
      setRr((x) => x + 1);
    } else if (algo === 'least-conn') {
      target = servers.reduce((min, s, i) => (s.conns < servers[min].conns ? i : min), 0);
    } else {
      target = hashStr(clientIp) % servers.length;
    }
    setServers((arr) => arr.map((s, i) => (i === target ? { ...s, conns: s.conns + 1, cpu: Math.min(100, s.cpu + 8) } : s)));
    setTimeout(() => {
      setServers((arr) => arr.map((s, i) => (i === target ? { ...s, conns: Math.max(0, s.conns - 1), cpu: Math.max(0, s.cpu - 8) } : s)));
    }, 1500);
  };

  const reset = () => setServers(servers.map((s) => ({ ...s, conns: 0, cpu: 0 })));

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Load balancer algorithms</h4>
        <div className="flex gap-2">
          {(['round-robin', 'least-conn', 'ip-hash'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={cn('rounded-md border px-2 py-1 font-mono text-xs', algo === a ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {servers.map((s) => (
          <div key={s.id} className="rounded-xl border border-white/5 bg-bg-soft/40 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">srv-{s.id}</span>
              <span className={cn('h-2 w-2 rounded-full', s.cpu > 60 ? 'bg-rose-400' : s.cpu > 30 ? 'bg-amber-400' : 'bg-emerald-400')} />
            </div>
            <div className="mt-2 text-xs text-ink-dim">conn: {s.conns}</div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded bg-white/5">
              <motion.div animate={{ width: `${s.cpu}%` }} className="h-full bg-accent" />
            </div>
            <div className="mt-1 text-[10px] text-ink-faint">CPU {s.cpu}%</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => send()} className="btn-primary h-8 text-xs">send 1 request</button>
        <button onClick={() => Array.from({ length: 8 }).forEach(() => send())} className="btn-ghost h-8 text-xs">burst 8</button>
        <button onClick={reset} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
      </div>
    </Card>
  );
}

function CapTriangle() {
  const [pick, setPick] = useState<'CP' | 'AP' | 'CA' | null>(null);
  const opts = [
    { id: 'CP', title: 'CP — Consistency + Partition tolerance', ex: 'ZooKeeper, etcd, HBase, traditional RDBMS', drop: 'Availability — minority side rejects writes during partition.' },
    { id: 'AP', title: 'AP — Availability + Partition tolerance', ex: 'Cassandra, DynamoDB, CouchDB', drop: 'Consistency — different replicas may see stale data temporarily.' },
    { id: 'CA', title: 'CA — Consistency + Availability', ex: 'Single-node DB, master-only with no replicas', drop: 'Partition tolerance — and partitions WILL happen, so this is unrealistic at scale.' },
  ] as const;

  return (
    <Card>
      <h4 className="mb-3 font-semibold">CAP theorem</h4>
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => setPick(o.id)}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              pick === o.id ? 'border-accent bg-accent/10' : 'border-white/10 bg-white/5 hover:bg-white/10',
            )}
          >
            <div className="font-mono text-sm font-semibold">{o.id}</div>
            <div className="mt-1 text-xs text-ink-dim">{o.title.split('—')[1]}</div>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {pick && (
          <motion.div key={pick} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-xl border border-white/5 bg-bg-soft/40 p-4">
            <div className="font-semibold">{opts.find((o) => o.id === pick)!.title}</div>
            <div className="mt-1 text-sm text-ink-dim">Examples: {opts.find((o) => o.id === pick)!.ex}</div>
            <div className="mt-2 text-sm text-rose-300">Trade-off: {opts.find((o) => o.id === pick)!.drop}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function RateLimiterDemo() {
  const [bucket, setBucket] = useState(10);
  const [capacity] = useState(10);
  const [rate] = useState(2);
  const [log, setLog] = useState<{ ok: boolean; t: number }[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      setBucket((b) => Math.min(capacity, b + rate));
    }, 1000);
    return () => clearInterval(id);
  }, [capacity, rate]);

  const request = () => {
    setBucket((b) => {
      if (b > 0) {
        setLog((l) => [{ ok: true, t: Date.now() }, ...l].slice(0, 12));
        return b - 1;
      }
      setLog((l) => [{ ok: false, t: Date.now() }, ...l].slice(0, 12));
      return b;
    });
  };

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-amber-300" /> <h4 className="font-semibold">Token bucket rate limiter</h4></div>
      <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-dim">tokens</span>
          <div className="flex flex-1 gap-1">
            {Array.from({ length: capacity }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: i < bucket ? 1 : 0.2, scale: i < bucket ? 1 : 0.9 }}
                className={cn('h-6 flex-1 rounded', i < bucket ? 'bg-amber-400' : 'bg-white/10')}
              />
            ))}
          </div>
          <span className="font-mono text-xs">{bucket}/{capacity}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={request} className="btn-primary h-8 text-xs">send request (cost 1)</button>
          <button onClick={() => Array.from({ length: 5 }).forEach(() => request())} className="btn-ghost h-8 text-xs">burst 5</button>
        </div>
        <div className="mt-2 text-[11px] text-ink-faint">Refill rate: {rate} token/s · Capacity: {capacity}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {log.length === 0 && <span className="text-xs text-ink-faint">// no requests yet</span>}
        {log.map((l, i) => (
          <span key={i} className={cn('rounded border px-2 py-0.5 font-mono text-[10px]', l.ok ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/30 bg-rose-400/10 text-rose-300')}>
            {l.ok ? '200' : '429'}
          </span>
        ))}
      </div>
    </Card>
  );
}

function SecurityChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const items = [
    { k: 'iam', text: 'Every endpoint authorizes the specific resource (no IDOR).' },
    { k: 'sql', text: 'All DB queries are parameterized — no string concatenation with user input.' },
    { k: 'csp', text: 'Strict Content-Security-Policy header is set.' },
    { k: 'csrf', text: 'State-changing endpoints require SameSite cookies + CSRF token (or bearer tokens, not cookies).' },
    { k: 'ssrf', text: 'Outbound URLs are validated against an allowlist; metadata IPs blocked.' },
    { k: 'crypto', text: 'Argon2id (or bcrypt cost ≥ 12) for passwords. AES-GCM for symmetric secrets.' },
    { k: 'secrets', text: 'No secrets in env vars in prod — use Vault / Secrets Manager / KMS.' },
    { k: 'deps', text: 'Dependabot or Renovate is enabled and the lockfile is committed.' },
    { k: 'rl', text: 'Rate limits on every endpoint that costs money or hits a third party.' },
    { k: 'logs', text: 'No secrets / PII / tokens are written to logs.' },
  ];
  const total = items.length;
  const checked = items.filter((i) => done[i.k]).length;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-300" /> <h4 className="font-semibold">Security checklist</h4></div>
        <span className="text-xs text-ink-dim">{checked} / {total}</span>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <label key={it.k} className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/5 bg-bg-soft/30 p-3 hover:bg-white/5">
            <input
              type="checkbox"
              checked={!!done[it.k]}
              onChange={(e) => setDone({ ...done, [it.k]: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-emerald-500"
            />
            <span className={cn('text-sm', done[it.k] ? 'text-ink-faint line-through' : 'text-ink-dim')}>{it.text}</span>
          </label>
        ))}
      </div>
    </Card>
  );
}

function EventSourcingDemo() {
  type Event = { kind: 'OrderPlaced' | 'ItemAdded' | 'OrderPaid' | 'OrderShipped'; data: any };
  const [events, setEvents] = useState<Event[]>([
    { kind: 'OrderPlaced', data: { id: 1001, user: 'u-42' } },
    { kind: 'ItemAdded', data: { sku: 'A1', qty: 2, price: 12 } },
  ]);

  const projection = useMemo(() => {
    const state: any = { items: [] as any[], paid: false, shipped: false };
    for (const e of events) {
      if (e.kind === 'OrderPlaced') state.id = e.data.id;
      if (e.kind === 'ItemAdded') state.items.push(e.data);
      if (e.kind === 'OrderPaid') state.paid = true;
      if (e.kind === 'OrderShipped') state.shipped = true;
    }
    state.total = state.items.reduce((a: number, it: any) => a + it.qty * it.price, 0);
    return state;
  }, [events]);

  const append = (e: Event) => setEvents((arr) => [...arr, e]);

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Event sourcing & projection</h4>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Event log (append-only)</div>
          <div className="space-y-1">
            {events.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded border border-white/5 bg-bg-soft/40 px-3 py-1.5 font-mono text-[11px]"
              >
                <span className="text-accent-cyan">{e.kind}</span>
                <span className="ml-2 text-ink-dim">{JSON.stringify(e.data)}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => append({ kind: 'ItemAdded', data: { sku: 'B2', qty: 1, price: 35 } })} className="btn-ghost h-8 text-xs">+ ItemAdded</button>
            <button onClick={() => append({ kind: 'OrderPaid', data: { ts: Date.now() } })} className="btn-ghost h-8 text-xs">+ OrderPaid</button>
            <button onClick={() => append({ kind: 'OrderShipped', data: { tracking: 'AB1234' } })} className="btn-ghost h-8 text-xs">+ OrderShipped</button>
            <button onClick={() => setEvents(events.slice(0, 2))} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Projection (current state)</div>
          <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] text-ink-dim">
{JSON.stringify(projection, null, 2)}
          </pre>
          <p className="mt-2 text-[11px] text-ink-faint">
            The projection is rebuildable: replay all events from the start to recover. Add a new field to your view model? Just replay.
          </p>
        </div>
      </div>
    </Card>
  );
}

function LatencyHistogram() {
  const [scenario, setScenario] = useState<'good' | 'tail' | 'bimodal'>('tail');

  const buckets = useMemo(() => {
    const labels = ['<10', '20', '50', '100', '200', '500', '1s', '2s', '5s'];
    let counts: number[];
    if (scenario === 'good') counts = [800, 600, 200, 50, 10, 4, 1, 0, 0];
    else if (scenario === 'tail') counts = [600, 500, 300, 150, 80, 40, 20, 10, 5];
    else counts = [400, 350, 100, 60, 40, 200, 150, 60, 20];
    return labels.map((l, i) => ({ label: l, count: counts[i] }));
  }, [scenario]);

  const total = buckets.reduce((a, b) => a + b.count, 0);
  const cum = (() => {
    let acc = 0;
    return buckets.map((b) => { acc += b.count; return acc / total; });
  })();
  const p50 = pickAt(buckets, cum, 0.5);
  const p95 = pickAt(buckets, cum, 0.95);
  const p99 = pickAt(buckets, cum, 0.99);

  const max = Math.max(...buckets.map((b) => b.count));

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2"><Activity className="h-4 w-4" /> Latency histogram</h4>
        <div className="flex gap-2">
          {(['good', 'tail', 'bimodal'] as const).map((s) => (
            <button key={s} onClick={() => setScenario(s)} className={cn('rounded-md border px-2 py-1 font-mono text-xs', scenario === s ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex h-44 items-end gap-2 rounded-xl border border-white/5 bg-bg-soft/30 p-3">
        {buckets.map((b) => (
          <div key={b.label} className="flex flex-1 flex-col items-center justify-end gap-1">
            <motion.div animate={{ height: `${(b.count / max) * 100}%` }} className="w-full rounded bg-gradient-to-t from-accent to-accent-cyan" />
            <span className="font-mono text-[10px] text-ink-faint">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="P50" value={`${p50}`} sub="median" />
        <Stat label="P95" value={`${p95}`} />
        <Stat label="P99" value={`${p99}`} sub="tail latency" />
      </div>
      <p className="mt-2 text-xs text-ink-faint">A bimodal distribution often signals a code path with a slow fallback (cache miss, GC pause, cold start). Average hides it; P99 catches it.</p>
    </Card>
  );
}

function pickAt(buckets: { label: string; count: number }[], cum: number[], pct: number): string {
  for (let i = 0; i < cum.length; i++) {
    if (cum[i] >= pct) return buckets[i].label;
  }
  return buckets[buckets.length - 1].label;
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Consistent hashing\'s main advantage over modulo hashing is...',
    options: [
      'Faster lookup.',
      'Adding/removing a node moves only ~k/n keys instead of all of them.',
      'Better cache locality.',
      'Smaller memory.',
    ],
    answer: 1,
    explain: 'With modulo, hash(key) % n changes for every key when n changes. Consistent hashing only remaps keys near the changed node.',
  },
  {
    q: 'You see P50 = 50ms and P99 = 4s. What does this suggest?',
    options: [
      'Everything is fine; 99% of users are happy.',
      'A long tail — likely cache misses, GC pauses, or cold starts. Fix the slow path.',
      'Your sample is biased.',
      'Network latency.',
    ],
    answer: 1,
    explain: 'P99 = 4s on a 50ms median means 1 in 100 users sees an 80× slowdown. Profile the slow path.',
  },
  {
    q: 'In CAP, during a network partition, choosing AP means...',
    options: [
      'Reject writes to keep data consistent.',
      'Keep responding from each side; reconcile later.',
      'Refuse all reads.',
      'Shut down the cluster.',
    ],
    answer: 1,
    explain: 'AP systems (Cassandra, Dynamo) accept writes on both sides during a partition; reconcile via vector clocks / LWW / CRDTs after.',
  },
  {
    q: 'A token bucket allows N tokens capacity refilling at rate R. What kind of traffic does this allow?',
    options: [
      'Strictly steady traffic at rate R.',
      'Bursts of up to N requests, with sustained throughput of R/sec.',
      'Only one request at a time.',
      'Unlimited.',
    ],
    answer: 1,
    explain: 'You can spend the bucket all at once (burst N), but long-term throughput averages to R.',
  },
  {
    q: 'Event sourcing\'s most underrated benefit is...',
    options: [
      'Fastest writes.',
      'Smallest storage.',
      'You can rebuild any view by replaying the log — including views you didn\'t plan originally.',
      'Strong consistency.',
    ],
    answer: 2,
    explain: 'New report needed? Add a projection that consumes the same events from the start. The log is the source of truth.',
  },
];
