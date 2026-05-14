import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, KeyRound, Inbox, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat, Steps } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { MermaidDiagram } from '../components/MermaidDiagram';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 5;

export default function Layer5() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="api" kicker="5.1" title="API Design">
        <TopicCard
          layerId={L}
          index={0}
          title="REST, GraphQL, gRPC, OpenAPI"
          description="The protocol isn't a taste choice — it's set by who consumes you and how much you control both ends. The contract is the product: the request shape, the response shape, and every error case."
        />
        <RestVsGraphql />
        <Steps
          steps={[
            { label: 'POST /payments' },
            { label: 'network drops the response' },
            { label: 'client retries' },
            { label: 'two charges', tone: 'fail' },
          ]}
          caption={
            <>
              <InlineCode>POST</InlineCode> isn't idempotent, so the retry isn't safe. Fix: an <InlineCode>Idempotency-Key</InlineCode>{' '}
              the server stores — a repeat key returns the first result instead of charging again. Every money-moving or
              email-sending <InlineCode>POST</InlineCode> needs one.
            </>
          }
        />
        <Steps
          steps={[
            { label: 'on page 2 (OFFSET 20)' },
            { label: 'a row is inserted at the top' },
            { label: 'page 3 (OFFSET 40)' },
            { label: 're-shows a row from page 2', tone: 'fail' },
          ]}
          caption={
            <>
              Offset counts rows; cursor/keyset anchors to a value, so inserts above the cursor don't shift the window — why every
              infinite-scroll feed uses keyset. (HTTP status semantics — safe/idempotent, 401 vs 403 — are L3's domain.)
            </>
          }
        />
        <Card>
          <Bullets
            items={[
              <>REST: resources as plural nouns, HTTP methods carry the verb; <InlineCode>PUT</InlineCode>/<InlineCode>DELETE</InlineCode> idempotent, <InlineCode>POST</InlineCode> not; version in the path.</>,
              <>GraphQL: client picks the fields — but every nested resolver is an N+1; needs <InlineCode>DataLoader</InlineCode> batching.</>,
              <>gRPC: Protobuf + codegen + HTTP/2 streaming — worth it only internal, service-to-service.</>,
              <>Pagination: cursor/keyset (O(1), stable under writes), not offset, for anything that scrolls.</>,
              <>OpenAPI: the machine-readable contract — generates clients, mocks, validation; document every error case.</>,
            ]}
          />
        </Card>
      </Section>

      <Section id="auth" kicker="5.2" title="Authentication & Authorization">
        <TopicCard
          layerId={L}
          index={1}
          title="Identity vs permission"
          description="AuthN answers 'who are you?'. AuthZ answers 'may you do this — to this specific row?'. Every protected route does both, and the second half is where real APIs break."
        />
        <JwtDecoder />
        <Steps
          steps={[
            { label: 'logged in as user A' },
            { label: 'GET /orders/123', tone: 'ok' },
            { label: 'GET /orders/124' },
            { label: 'order 124 belongs to user B' },
            { label: 'reads the whole table', tone: 'fail' },
          ]}
          caption={
            <>
              <strong className="text-rose-200">IDOR.</strong> "Authenticated" was checked; "authorized for <em>this</em> row" was
              not. The fix is one clause — <InlineCode>WHERE id = :id AND user_id = :caller</InlineCode>. Consistently the #1
              real-world API vulnerability; UUIDs over sequential ids slow enumeration but aren't the fix — the ownership check is.
            </>
          }
        />
        <Card>
          <Bullets
            items={[
              <>Passwords: a <em>slow</em>, memory-hard hash (<InlineCode>argon2id</InlineCode> or <InlineCode>bcrypt</InlineCode> 12+) with per-row salt — never a fast hash.</>,
              <>JWTs can't be revoked before <InlineCode>exp</InlineCode> — keep <InlineCode>exp</InlineCode> short + refresh token; store in <InlineCode>httpOnly</InlineCode> cookies, not <InlineCode>localStorage</InlineCode>.</>,
              <>Pin the verifying algorithm server-side — <InlineCode>alg: none</InlineCode> and algorithm confusion are forged-admin-token bugs.</>,
              <>OAuth 2.0: Authorization Code + PKCE for SPAs/mobile, Client Credentials for service-to-service; Implicit is dead.</>,
              <>AuthZ model: RBAC by default, ABAC for attribute-based, ReBAC for relationship-based — keep the check in <em>one</em> place.</>,
            ]}
          />
        </Card>
      </Section>

      <Section id="db" kicker="5.3" title="Databases — SQL & NoSQL">
        <TopicCard
          layerId={L}
          index={2}
          title="Pick the model that matches your access pattern"
          description="Postgres is the default — you almost always want transactions, joins, and constraints. Reach for NoSQL for a specific reason: a fixed access pattern, a write volume relational can't take, or genuinely document-shaped data."
        />
        <NPlusOneLab />
        <IndexDemo />
        <Steps
          steps={[
            { label: 'PR renames a column + code' },
            { label: 'rollout begins' },
            { label: 'old pods query the old name' },
            { label: 'new pods query the new name' },
            { label: 'half of traffic 500s', tone: 'fail' },
          ]}
          caption={
            <>
              Migrations must be additive and backwards-compatible: add a nullable column → write both → backfill in batches (never
              one giant <InlineCode>UPDATE</InlineCode>) → read new → drop old. Each step is safe while the previous version is still
              live. Rule of thumb: normalize until it hurts, denormalize until it works.
            </>
          }
        />
        <Card>
          <Bullets
            items={[
              <>Know your isolation level (Postgres = READ COMMITTED) — guard a read-then-write with a transaction + <InlineCode>FOR UPDATE</InlineCode> or a <InlineCode>version</InlineCode> column.</>,
              <>MVCC: an <InlineCode>UPDATE</InlineCode> leaves a dead tuple; a long-open transaction blocks <InlineCode>VACUUM</InlineCode> and bloats the table.</>,
              <>Index types: B-Tree (default), GIN (<InlineCode>jsonb</InlineCode>/array/full-text), GiST (geo); partial + covering indexes. Every index costs writes.</>,
              <>Scaling order: index → rewrite query → pool → read replicas → partition → shard. Most "we need scale" is a missing index.</>,
              <>Datastore: document (Mongo) for document-shaped data, key-value (Redis) for cache/sessions, wide-column for write throughput.</>,
            ]}
          />
        </Card>
        <MermaidDiagram
          chart={`erDiagram
            USER ||--o{ ORDER : places
            ORDER ||--|{ ORDER_ITEM : contains
            PRODUCT ||--o{ ORDER_ITEM : included_in
            USER {
              uuid id PK
              text email
              text password_hash
              timestamptz created_at
            }
            ORDER {
              uuid id PK
              uuid user_id FK
              text status
              numeric total
            }
            ORDER_ITEM {
              uuid id PK
              uuid order_id FK
              uuid product_id FK
              int qty
              numeric price_at_purchase
            }
            PRODUCT {
              uuid id PK
              text name
              numeric price
            }`}
          caption="A small e-commerce schema (PostgreSQL)"
        />
      </Section>

      <Section id="cache" kicker="5.4" title="Caching Strategies">
        <TopicCard
          layerId={L}
          index={3}
          title="Cache-aside, write-through, write-behind"
          description="Caches trade staleness for speed. The strategy you pick decides which failure mode you own — a stale read, a slow write, or a lost write."
        />
        <CacheAnimator />
        <Steps
          steps={[
            { label: 'a hot key expires' },
            { label: 'N requests miss at once' },
            { label: 'N identical expensive queries' },
            { label: 'the DB falls over', tone: 'fail' },
          ]}
          caption={
            <>
              <strong className="text-amber-200">Cache stampede.</strong> One slow query becomes <em>N</em>. Fix: a per-key lock
              (<InlineCode>SET key _ NX EX 10</InlineCode>) so only the winner recomputes, or refresh-ahead so the key never actually
              expires under load. Always TTL + jitter.
            </>
          }
        />
        <Steps
          steps={[
            { label: 'write DB' },
            { label: 'crash before updating cache' },
            { label: 'cache stale forever', tone: 'fail' },
          ]}
          caption={
            <>
              <strong className="text-rose-200">Dual-write inconsistency.</strong> Cache and DB have no shared transaction. This is
              why cache-aside <em>deletes</em> the key instead of updating it — a delete is idempotent and self-healing. Same shape as
              the L5.5 dual-write problem the outbox pattern solves. Also cache <em>absences</em> (negative caching) or every
              missing-id lookup hits the DB.
            </>
          }
        />
        <Card>
          <Bullets
            items={[
              <>Cache-aside: read-through; writes hit the DB and <em>delete</em> the key (don't update — a reader can repopulate stale).</>,
              <>Write-through: cache + DB in one path — never stale, slower writes.</>,
              <>Write-behind: cache now, flush async — fastest, but the unflushed buffer is real data only in Redis.</>,
              <>Every key needs a TTL <em>and</em> jitter — identical TTLs expire together and stampede the DB.</>,
            ]}
          />
        </Card>
      </Section>

      <Section id="mq" kicker="5.5" title="Message Queues & Event Streaming">
        <TopicCard
          layerId={L}
          index={4}
          title="Decouple producers from consumers"
          description="Reach for a queue to decouple producer from consumer, absorb a traffic spike, or fan out — not to replace a call that should just be a synchronous function. Crossing the boundary async means you've signed up for eventual consistency."
        />
        <KafkaDemo />
        <Card>
          <h4 className="mb-3 font-semibold">RabbitMQ vs Kafka — when each</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-orange-400/30 bg-orange-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-orange-300">RabbitMQ — work queue</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A job needs to be done once by one worker: resize an image, send a webhook, charge a card. Message is consumed and gone. Rich routing, per-message ACK, easy competing-consumers scaling.
              </p>
            </div>
            <div className="rounded-xl border border-violet-400/30 bg-violet-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-violet-300">Kafka — event log</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                An event many systems care about and may need to re-process: <InlineCode>OrderPlaced</InlineCode> feeds billing, analytics, and search, each as its own consumer group reading the same retained log at its own offset.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            The duplicate-processing bug is the one to internalize: at-least-once means "design every consumer to survive seeing the same message twice." It's the exact shape of the dual-write problem in 5.4 — the outbox is to events what cache-aside's delete is to cache entries: make the unsafe step self-healing.
          </p>
        </Card>
        <Card>
          <Bullets
            items={[
              <>RabbitMQ: a broker — exchanges route to queues, consumers ACK, a DLX catches poison messages. A work queue, not a log.</>,
              <>Kafka: an append-only log — partitions are parallelism; consumer groups track their own offset and can replay.</>,
              <>Same key → same partition: the <em>only</em> ordering guarantee. Choose the key for the ordering you need.</>,
              <>At-least-once by default — consumers <em>will</em> see duplicates; make them idempotent. Exactly-once is something you build.</>,
              <>Outbox: write the event to a table in the <em>same</em> transaction as the business row; a relay publishes it.</>,
            ]}
          />
        </Card>
      </Section>

      <Section id="micro" kicker="5.6" title="Microservices & Service Architecture">
        <TopicCard
          layerId={L}
          index={5}
          title="Start with a monolith"
          description="Splitting a service turns a local function call — synchronous, transactional, type-checked at compile time — into a network call: it can be slow, fail partially, or arrive twice. Split only at a real bounded-context seam with an independent scaling or deploy need."
        />
        <Steps
          steps={[
            { label: 'split too early, wrong seams' },
            { label: 'one feature touches 3 services' },
            { label: 'they share a database' },
            { label: 'must deploy in lockstep' },
            { label: 'one down → whole flow down', tone: 'fail' },
          ]}
          caption={
            <>
              <strong className="text-rose-200">The distributed monolith.</strong> Full distributed-systems tax — network failure,
              partial failure, eventual consistency, tracing — plus the lockstep coupling of a monolith. Strictly worse than the
              monolith you started with. Why "start with a monolith" isn't conservatism: extracting a service from a clean modular
              monolith is easy; merging mis-drawn services back is a rewrite. (CAP and planet-scale design are L7.)
            </>
          }
        />
        <Card>
          <Bullets
            items={[
              <>Split by bounded context, never by technical layer — a "DB service + API service" has all the cost, none of the benefit.</>,
              <>Sync (REST/gRPC) when the caller needs the answer; async (events) when it doesn't — the wrong choice couples uptime or forces polling.</>,
              <>Every cross-service call needs <em>timeout</em> + <em>retry-with-jitter</em> + <em>circuit breaker</em> + <em>bulkhead</em>.</>,
              <>No distributed transaction — a Saga is local transactions + compensating actions; orchestration vs choreography.</>,
              <>The cost: partial failure is normal, everything is eventually consistent — you need correlation ids + structured logs.</>,
            ]}
          />
        </Card>
        <CodePlayground
          mode="js"
          height={220}
          title="A tiny saga"
          initial={`// Booking trip = book flight + hotel + car. Compensate if any step fails.
async function bookTrip() {
  const compensations = [];
  try {
    const f = await book('flight');   compensations.unshift(() => cancel('flight', f));
    const h = await book('hotel');    compensations.unshift(() => cancel('hotel', h));
    const c = await book('car');      compensations.unshift(() => cancel('car', c));
    return { f, h, c };
  } catch (e) {
    for (const undo of compensations) await undo();
    throw e;
  }
}

async function book(svc) {
  if (svc === 'car') throw new Error('car svc down');
  console.log('booked', svc);
  return svc + '-' + Math.random().toString(36).slice(2,6);
}
async function cancel(svc, id) { console.log('compensated', svc, id); }

bookTrip().catch((e) => console.log('rolled back:', e.message));
`}
        />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 5 Quiz">
        <Quiz id="L5" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-rose-500/10 via-bg-card to-pink-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-rose-500 to-pink-500 text-white">L05</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Backend Development</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Correct, fast, secure, scalable</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Backend engineering is about data flow, failure modes, consistency, and operational cost — not just code that works today.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Server className="h-4 w-4 text-rose-400" />
          6 topics · 4 visualizers · 2 playgrounds · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function RestVsGraphql() {
  const [tab, setTab] = useState<'rest' | 'graphql' | 'grpc'>('rest');
  const samples = {
    rest: {
      req: `GET /api/v1/users/123/orders?cursor=eyJpZCI6NDV9 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJ...
Accept: application/json`,
      res: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    { "id": 46, "total": 24.99, "status": "shipped" },
    { "id": 47, "total": 9.50,  "status": "pending" }
  ],
  "next_cursor": "eyJpZCI6NDd9"
}`,
    },
    graphql: {
      req: `POST /graphql HTTP/1.1
Content-Type: application/json

{
  "query": "query($id: ID!) {
    user(id: $id) {
      email
      orders(first: 2) { id total status }
    }
  }",
  "variables": { "id": "123" }
}`,
      res: `{
  "data": {
    "user": {
      "email": "ada@example.com",
      "orders": [
        { "id": "46", "total": 24.99, "status": "SHIPPED" },
        { "id": "47", "total": 9.50,  "status": "PENDING" }
      ]
    }
  }
}`,
    },
    grpc: {
      req: `// orders.proto
service Orders {
  rpc List(ListRequest) returns (stream Order);
}

// client (TS)
const stream = client.list({ userId: '123' });
for await (const order of stream) {
  console.log(order);
}`,
      res: `// Wire format: Protocol Buffers
// Order { string id = 1; double total = 2; Status status = 3; }
// Each frame is a length-prefixed binary message.
// HTTP/2 streams give per-call multiplexing.`,
    },
  };

  return (
    <Card>
      <h4 className="mb-3 font-semibold">REST vs GraphQL vs gRPC</h4>
      <div className="mb-3 flex gap-2">
        {(['rest', 'graphql', 'grpc'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md border px-3 py-1.5 font-mono text-xs',
              tab === t ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim',
            )}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 text-[12px] leading-relaxed text-ink-dim">{samples[tab].req}</pre>
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 text-[12px] leading-relaxed text-ink-dim">{samples[tab].res}</pre>
      </div>
    </Card>
  );
}

function JwtDecoder() {
  const [token, setToken] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MTIzIiwiZW1haWwiOiJhZGFAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.rJqM6t-l86gJtQJ1u5e9MBE3l8Qd3yrUe9-7g3cVvXY',
  );
  const parts = token.split('.');
  const decode = (s: string | undefined) => {
    if (!s) return null;
    try {
      const padded = s.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
      return JSON.parse(json);
    } catch {
      return null;
    }
  };
  const header = decode(parts[0]);
  const payload = decode(parts[1]);
  const exp = payload?.exp ? new Date(payload.exp * 1000) : null;
  const expired = exp ? exp.getTime() < Date.now() : false;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-amber-300" />
        <h4 className="font-semibold">JWT decoder</h4>
      </div>
      <textarea value={token} onChange={(e) => setToken(e.target.value)} className="input h-24 resize-none font-mono text-[11px]" />
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Block title="Header (alg, typ)" data={header} color="border-rose-400/30 bg-rose-400/5" />
        <Block title="Payload (claims)" data={payload} color="border-violet-400/30 bg-violet-400/5" />
        <div className={cn('rounded-xl border p-3', 'border-cyan-400/30 bg-cyan-400/5')}>
          <div className="text-xs uppercase tracking-widest text-ink-faint">Signature</div>
          <pre className="mt-1 overflow-x-auto break-all font-mono text-[11px] text-ink-dim">{parts[2]}</pre>
          <p className="mt-2 text-[11px] text-ink-faint">
            HMAC of <InlineCode>base64(header).base64(payload)</InlineCode> with the server's secret. The browser cannot verify it.
          </p>
        </div>
      </div>
      {exp && (
        <div className={cn('mt-3 rounded-lg border px-3 py-2 text-xs', expired ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200')}>
          {expired ? 'Token expired' : 'Token valid'} · expires {exp.toISOString()}
        </div>
      )}
    </Card>
  );
}

function Block({ title, data, color }: { title: string; data: unknown; color: string }) {
  return (
    <div className={cn('rounded-xl border p-3', color)}>
      <div className="text-xs uppercase tracking-widest text-ink-faint">{title}</div>
      <pre className="mt-1 overflow-x-auto font-mono text-[11px] text-ink-dim">{data ? JSON.stringify(data, null, 2) : '(could not parse)'}</pre>
    </div>
  );
}

function IndexDemo() {
  const [withIndex, setWithIndex] = useState(true);
  const [needle, setNeedle] = useState('alice@x.com');
  const total = 1_000_000;
  const compares = withIndex ? Math.ceil(Math.log2(total)) : Math.floor(total / 2);
  const ms = withIndex ? 0.4 : 800;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">EXPLAIN ANALYZE — with vs without an index</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-dim">Index</span>
          <button
            onClick={() => setWithIndex((b) => !b)}
            className={cn('relative h-6 w-12 rounded-full border', withIndex ? 'border-emerald-400/40 bg-emerald-400/30' : 'border-rose-400/40 bg-rose-400/30')}
          >
            <motion.div animate={{ x: withIndex ? 24 : 0 }} className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white" />
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4 font-mono text-[12px] leading-5">
        <div className="text-accent-cyan">EXPLAIN ANALYZE</div>
        <div>SELECT * FROM users WHERE email = '<input className="border-b border-dashed border-white/20 bg-transparent text-ink outline-none" value={needle} onChange={(e) => setNeedle(e.target.value)} />';</div>
        <div className="mt-3 space-y-1 text-ink-dim">
          {withIndex ? (
            <>
              <div>{'->'} Index Scan using <span className="text-emerald-300">users_email_idx</span> on users  (cost=0.42..8.43 rows=1)</div>
              <div className="text-ink-faint">  Index Cond: (email = '{needle}')</div>
              <div className="text-ink-faint">  Buffers: shared hit=4</div>
              <div className="text-emerald-300">Planning Time: 0.10 ms · Execution Time: {ms.toFixed(2)} ms</div>
            </>
          ) : (
            <>
              <div>{'->'} Seq Scan on users  (cost=0.00..21000.00 rows=1)</div>
              <div className="text-ink-faint">  Filter: (email = '{needle}')</div>
              <div className="text-ink-faint">  Rows Removed by Filter: {(total - 1).toLocaleString()}</div>
              <div className="text-rose-300">Planning Time: 0.10 ms · Execution Time: {ms} ms</div>
            </>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Rows scanned" value={withIndex ? '~20' : total.toLocaleString()} />
        <Stat label="Comparisons" value={compares.toLocaleString()} sub={withIndex ? 'O(log n)' : 'O(n)'} />
        <Stat label="Speedup" value={`${(800 / 0.4).toFixed(0)}×`} sub="approximate" />
      </div>
    </Card>
  );
}

type CacheLog = { kind: 'hit' | 'miss' | 'write' | 'evict' | 'flush'; text: string };

function CacheAnimator() {
  const [strategy, setStrategy] = useState<'aside' | 'through' | 'behind'>('aside');
  const [cache, setCache] = useState<Record<string, string>>({});
  const [db, setDb] = useState<Record<string, string>>({ a: '1', b: '2', c: '3' });
  const [log, setLog] = useState<CacheLog[]>([]);
  const [pending, setPending] = useState<{ k: string; v: string }[]>([]);

  const reset = () => {
    setCache({});
    setDb({ a: '1', b: '2', c: '3' });
    setLog([]);
    setPending([]);
  };

  const read = (k: string) => {
    if (cache[k] !== undefined) {
      setLog((l) => [...l, { kind: 'hit', text: `read(${k}) → cache HIT (${cache[k]})` }]);
      return;
    }
    if (db[k] !== undefined) {
      setLog((l) => [...l, { kind: 'miss', text: `read(${k}) → cache MISS, DB returns ${db[k]}; populate cache` }]);
      setCache((c) => ({ ...c, [k]: db[k] }));
    } else {
      setLog((l) => [...l, { kind: 'miss', text: `read(${k}) → not in DB` }]);
    }
  };

  const write = (k: string, v: string) => {
    if (strategy === 'aside') {
      setLog((l) => [...l, { kind: 'write', text: `write(${k}, ${v}) → DB updated; cache invalidated` }]);
      setDb((d) => ({ ...d, [k]: v }));
      setCache((c) => {
        const next = { ...c };
        delete next[k];
        return next;
      });
    } else if (strategy === 'through') {
      setLog((l) => [...l, { kind: 'write', text: `write(${k}, ${v}) → cache + DB synchronously` }]);
      setCache((c) => ({ ...c, [k]: v }));
      setDb((d) => ({ ...d, [k]: v }));
    } else {
      setLog((l) => [...l, { kind: 'write', text: `write(${k}, ${v}) → cache; DB queued (async)` }]);
      setCache((c) => ({ ...c, [k]: v }));
      setPending((p) => [...p, { k, v }]);
    }
  };

  const flush = () => {
    if (pending.length === 0) return;
    setDb((d) => {
      const next = { ...d };
      for (const { k, v } of pending) next[k] = v;
      return next;
    });
    setLog((l) => [...l, { kind: 'flush', text: `async writer flushed ${pending.length} pending writes to DB` }]);
    setPending([]);
  };

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-semibold">Cache strategy animator</h4>
        <div className="flex gap-2">
          {(['aside', 'through', 'behind'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStrategy(s); reset(); }}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs',
                strategy === s ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim',
              )}
            >
              {s === 'aside' ? 'cache-aside' : s === 'through' ? 'write-through' : 'write-behind'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Box title="Cache (Redis)" data={cache} color="border-cyan-400/30 bg-cyan-400/5" />
        <Box title="Database" data={db} color="border-emerald-400/30 bg-emerald-400/5" />
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Operations</div>
          <div className="flex flex-wrap gap-2">
            {['a', 'b', 'c', 'x'].map((k) => (
              <button key={k} onClick={() => read(k)} className="btn-ghost h-8 text-xs">read({k})</button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              ['a', '99'], ['b', '88'], ['x', '42'],
            ].map(([k, v]) => (
              <button key={k} onClick={() => write(k, v)} className="btn-ghost h-8 text-xs">write({k}, {v})</button>
            ))}
          </div>
          {strategy === 'behind' && (
            <button onClick={flush} className="btn-primary mt-2 h-8 w-full text-xs" disabled={!pending.length}>
              flush async writes ({pending.length})
            </button>
          )}
          <button onClick={reset} className="btn-ghost mt-2 h-8 w-full text-xs"><RotateCcw className="h-3 w-3" /> Reset</button>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">Log</div>
        <div className="h-32 overflow-y-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[12px]">
          {log.length === 0 ? <div className="text-ink-faint">// no operations yet</div> : log.map((l, i) => (
            <div key={i} className={cn(l.kind === 'hit' && 'text-emerald-300', l.kind === 'miss' && 'text-amber-300', l.kind === 'write' && 'text-cyan-300', l.kind === 'flush' && 'text-violet-300')}>
              {l.text}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Box({ title, data, color }: { title: string; data: Record<string, string>; color: string }) {
  return (
    <div className={cn('rounded-xl border p-3', color)}>
      <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">{title}</div>
      <div className="space-y-1 font-mono text-xs">
        {Object.entries(data).length === 0 ? (
          <div className="text-ink-faint">(empty)</div>
        ) : (
          Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-2 rounded bg-white/5 px-2 py-1">
              <span className="text-ink-dim">{k}</span>
              <span className="text-ink">{v}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function KafkaDemo() {
  const PARTITIONS = 3;
  const [partitions, setPartitions] = useState<{ msgs: { key: string; value: string }[]; offset: number }[]>(
    Array.from({ length: PARTITIONS }, () => ({ msgs: [], offset: 0 })),
  );
  const [consumers, setConsumers] = useState<{ id: string; partition: number }[]>([
    { id: 'C1', partition: 0 },
    { id: 'C2', partition: 1 },
    { id: 'C3', partition: 2 },
  ]);

  const produce = (key: string, value: string) => {
    const p = Math.abs(hashStr(key)) % PARTITIONS;
    setPartitions((arr) => arr.map((part, i) => (i === p ? { ...part, msgs: [...part.msgs, { key, value }] } : part)));
  };

  const consume = (consumerIdx: number) => {
    const c = consumers[consumerIdx];
    const part = partitions[c.partition];
    if (part.offset >= part.msgs.length) return;
    setPartitions((arr) => arr.map((p, i) => (i === c.partition ? { ...p, offset: p.offset + 1 } : p)));
  };

  const reset = () => {
    setPartitions(Array.from({ length: PARTITIONS }, () => ({ msgs: [], offset: 0 })));
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2"><Inbox className="h-4 w-4" /> Kafka topic & consumer group</h4>
        <button onClick={reset} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /> Reset</button>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          { k: 'user-1', v: 'order placed' },
          { k: 'user-2', v: 'login' },
          { k: 'user-1', v: 'payment ok' },
          { k: 'user-7', v: 'signup' },
          { k: 'user-3', v: 'logout' },
        ].map((m, i) => (
          <button key={i} onClick={() => produce(m.k, m.v)} className="btn-ghost h-8 text-xs">
            produce({m.k}, "{m.v}")
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {partitions.map((p, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-bg-soft/40 p-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-mono uppercase text-ink-faint">partition {i}</span>
              <span className="text-ink-dim">offset {p.offset} / {p.msgs.length}</span>
            </div>
            <div className="space-y-1">
              <AnimatePresence>
                {p.msgs.map((m, j) => (
                  <motion.div
                    key={j}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded border px-2 py-1 font-mono text-[11px]',
                      j < p.offset ? 'border-white/5 bg-white/[0.02] text-ink-faint line-through' : 'border-accent/30 bg-accent/10 text-ink',
                    )}
                  >
                    <span>{m.key}</span>
                    <span className="text-ink-dim">{m.value}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button
              onClick={() => consume(i)}
              disabled={p.offset >= p.msgs.length}
              className="btn-primary mt-2 h-7 w-full text-xs"
            >
              {consumers[i].id} consume
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">Same key always lands in the same partition (ordering guarantee). Each partition is consumed by exactly one consumer in the group.</p>
    </Card>
  );
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function NPlusOneLab() {
  const ORDERS = 50;
  const [mode, setMode] = useState<'naive' | 'join'>('naive');
  const queries = mode === 'naive' ? 1 + ORDERS : 1;
  const ms = mode === 'naive' ? 1 + ORDERS : 3;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-semibold">N+1 vs JOIN — load 50 orders with their user</h4>
        <div className="flex gap-2">
          {(['naive', 'join'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs',
                mode === m ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim',
              )}
            >
              {m === 'naive' ? 'N+1 (loop)' : 'JOIN (batched)'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/5 bg-bg-soft/40 p-3">
        {Array.from({ length: queries }).map((_, i) => (
          <motion.span
            key={`${mode}-${i}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.014, 0.7), duration: 0.15 }}
            className={cn(
              'h-3.5 w-3.5 rounded-sm',
              i === 0 ? 'bg-accent' : mode === 'naive' ? 'bg-rose-400/70' : 'bg-emerald-400/70',
            )}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="DB queries" value={queries} sub={mode === 'naive' ? '1 + 50 round trips' : 'one batched query'} />
        <Stat label="~Latency" value={`${ms} ms`} sub={mode === 'naive' ? 'per-row round trips' : 'single round trip'} />
        <Stat label="Speedup" value={`${Math.round((1 + ORDERS) / 3)}×`} sub="JOIN vs N+1" />
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">
        Each square is one round trip to the database. The N+1 loop fires a query per order; a <InlineCode>JOIN</InlineCode> — or a
        batched <InlineCode>{`WHERE id IN (...)`}</InlineCode> — collapses it to one. Fast on a 10-row dev DB, times out in prod.
        Catch it with a test that asserts query count, not just correctness.
      </p>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'A 401 vs 403 distinction in REST APIs:',
    options: [
      'Both mean unauthorized — interchangeable.',
      '401 = no/invalid credentials; 403 = authenticated but not allowed.',
      '401 = browser-only; 403 = API-only.',
      '403 = legacy of 401.',
    ],
    answer: 1,
    explain: '401 means we don\'t know who you are. 403 means we know, and you cannot access this resource.',
  },
  {
    q: 'You add an index on users(email). What changes?',
    options: [
      'Reads on email get faster, writes might get slightly slower.',
      'All reads get faster.',
      'Writes get faster.',
      'Database storage is unaffected.',
    ],
    answer: 0,
    explain: 'Indexes accelerate matching reads; they cost extra writes (index update) and disk space.',
  },
  {
    q: 'In cache-aside, what happens on a write?',
    options: [
      'Write to cache only.',
      'Write to DB; cache is invalidated or updated.',
      'Write to both atomically.',
      'Write to cache; DB later.',
    ],
    answer: 1,
    explain: 'Cache-aside writes go to the source of truth (DB). The cached entry is invalidated so the next read repopulates it.',
  },
  {
    q: 'Same key always goes to the same Kafka partition because...',
    options: [
      'Kafka uses round-robin.',
      'The partitioner hashes the key modulo the partition count.',
      'Producers pin keys to partitions manually.',
      'Brokers route by consumer.',
    ],
    answer: 1,
    explain: 'Hash-based partitioning preserves per-key ordering — a property your consumer can rely on.',
  },
  {
    q: 'Outbox pattern guarantees what?',
    options: [
      'Lower latency than direct publishing.',
      'Atomic publish + DB write so events aren\'t lost or duplicated.',
      'Exactly-once cross-region replication.',
      'Faster consumers.',
    ],
    answer: 1,
    explain: 'You write the event to an outbox table in the same DB transaction as your business data. A relay reads & publishes — no dual-write inconsistency.',
  },
];
