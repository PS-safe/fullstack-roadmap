import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, Zap, Activity, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
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
          description="Senior engineers design before they code. Know your QPS, latency budget, and consistency needs before drawing boxes."
        >
          <Bullets
            items={[
              <>Vertical (bigger box) is simple but bounded; horizontal scales without limit if state is managed correctly.</>,
              <>L4 vs L7 load balancing: L4 (TCP) is fast, L7 (HTTP) routes by path/header/method.</>,
              <>Consistent hashing minimizes remapping when nodes are added or removed.</>,
              <>CAP: in a partition, choose Consistency or Availability. PACELC adds: even without a partition, choose Latency or Consistency.</>,
            ]}
          />
        </TopicCard>
        <ConsistentHashingDemo />
        <LoadBalancerDemo />
        <CapTriangle />
      </Section>

      <Section id="security" kicker="7.2" title="Application Security Engineering">
        <TopicCard
          layerId={L}
          index={1}
          title="OWASP Top 10 thinking"
          description="Most breaches are old categories: broken access control, injection, misconfigured cloud. Threat-model every endpoint."
        >
          <Bullets
            items={[
              <>SQLi: parameterized queries, never string-concat user input.</>,
              <>XSS: CSP header + output encoding + DOMPurify for rich text.</>,
              <>CSRF: SameSite=Lax cookies + double-submit token pattern.</>,
              <>SSRF: validate URLs, block <InlineCode>169.254.169.254</InlineCode> (cloud metadata) and <InlineCode>127.0.0.0/8</InlineCode>.</>,
              <>Crypto: AES-256-GCM, RSA-4096 / ECDSA P-256, Argon2id for passwords. Never roll your own.</>,
            ]}
          />
        </TopicCard>
        <RateLimiterDemo />
        <SecurityChecklist />
      </Section>

      <Section id="event" kicker="7.3" title="Event-Driven Architecture & CQRS">
        <TopicCard
          layerId={L}
          index={2}
          title="Events as the source of truth"
          description="Event sourcing rebuilds state by replaying the log. CQRS separates the write model (commands) from the read model (projections), letting each scale independently."
        >
          <Bullets
            items={[
              <>Event sourcing gives you full audit log, time travel, and projection rebuilds.</>,
              <>CQRS: command handlers are domain-rich; query side is denormalized for fast reads.</>,
              <>Outbox pattern guarantees the event publish happens iff the DB write committed.</>,
              <>Domain events stay within a bounded context; integration events cross contexts.</>,
            ]}
          />
        </TopicCard>
        <EventSourcingDemo />
      </Section>

      <Section id="perf" kicker="7.4" title="Performance Engineering">
        <TopicCard
          layerId={L}
          index={3}
          title="Profile first; optimize what's actually slow"
          description="Intuition is wrong about perf. Flame graphs, latency histograms, and load tests show where the time really goes."
        >
          <Bullets
            items={[
              <>Always measure P95/P99 — averages hide the tail.</>,
              <>Amdahl's Law: speedup is bounded by the serial fraction. Optimize the longest pole first.</>,
              <>Concurrency models: threads (heavy), event loop (Node — single-threaded async I/O), goroutines (M:N), actors (message-passing).</>,
              <>k6 / Locust for load testing; ramp slowly to find the breaking point, not just the average.</>,
            ]}
          />
        </TopicCard>
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
        <Card>
          <h4 className="mb-2 font-semibold">Next milestones</h4>
          <Bullets
            items={[
              <>Build a real project per layer — don't only read.</>,
              <>Mock system-design interviews (URL shortener, Twitter feed, Netflix-style streaming, payment ledger).</>,
              <>Contribute to open source in your primary stack — code review feedback is the fastest growth.</>,
              <>Write technical posts — teaching forces you to find the holes in your understanding.</>,
            ]}
          />
        </Card>
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
