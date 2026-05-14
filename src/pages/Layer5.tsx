import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, KeyRound, Inbox, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
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
        >
          <Bullets
            items={[
              <>REST: resources as plural nouns, HTTP methods carry the verb (<InlineCode>GET/POST/PUT/PATCH/DELETE</InlineCode>) — a path like <InlineCode>/getUser</InlineCode> means you've thrown away the method's semantics. <InlineCode>PUT</InlineCode> and <InlineCode>DELETE</InlineCode> are idempotent, <InlineCode>POST</InlineCode> is not — clients and proxies retry on that assumption. Version in the path (<InlineCode>/v1</InlineCode>) so a breaking change is a new namespace, not a silent client break.</>,
              <>GraphQL: one endpoint, client picks the fields, so over/under-fetching goes away — but every nested resolver that hits the DB is an N+1 waiting to happen. <InlineCode>{`user → orders → items`}</InlineCode> on 50 users is 1 + 50 + 2500 queries without batching. <InlineCode>DataLoader</InlineCode> coalesces a tick's worth of loads into one <InlineCode>{`IN (...)`}</InlineCode>. A GraphQL API with no DataLoader melts under its own flexibility.</>,
              <>gRPC: Protobuf contract + codegen + HTTP/2 streaming. Worth it only when you control both ends — the binary wire format and generated stubs are a cost a browser or third party can't pay. Internal service-to-service is the sweet spot.</>,
              <>Pagination: offset (<InlineCode>LIMIT 20 OFFSET 10000</InlineCode>) makes the DB walk and discard 10k rows — and a row inserted mid-scroll shifts every page, so the user sees a duplicate or skips a row. Cursor/keyset (<InlineCode>WHERE id {'>'} :last_id ORDER BY id LIMIT 20</InlineCode>) is O(1) on an indexed column and stable under concurrent writes. Offset only for small, static, jump-to-page-N admin tables.</>,
              <>OpenAPI is the machine-readable contract — it generates clients, mocks, and request validation, so the spec and the running code can't drift. Document every error case, not just the 200; an undocumented 422 shape is a client bug you shipped.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">API failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Non-idempotent retry</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Client <InlineCode>POST /payments</InlineCode>, network drops the response, client retries — now there are two charges. <InlineCode>POST</InlineCode> isn't idempotent, so the retry isn't safe.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: an <InlineCode>Idempotency-Key</InlineCode> header the server stores; a repeat key returns the first result instead of acting again. Every money-moving or email-sending <InlineCode>POST</InlineCode> needs one.
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Offset pagination drift</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                User is on page 2 (<InlineCode>OFFSET 20</InlineCode>). A new row is inserted at the top. Page 3 (<InlineCode>OFFSET 40</InlineCode>) now re-shows the row that slid down from page 2.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Cursor pagination anchors to a value, not a count, so inserts above the cursor don't shift the window. This is why every infinite-scroll feed uses keyset.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            HTTP status semantics (which method is safe/idempotent, what 401 vs 403 vs 422 mean on the wire) are L3's domain — API design is about the resource model and contract <em>on top of</em> that transport.
          </p>
        </Card>
        <RestVsGraphql />
      </Section>

      <Section id="auth" kicker="5.2" title="Authentication & Authorization">
        <TopicCard
          layerId={L}
          index={1}
          title="Identity vs permission"
          description="AuthN answers 'who are you?'. AuthZ answers 'may you do this — to this specific row?'. Every protected route does both, and the second half is where real APIs break."
        >
          <Bullets
            items={[
              <>Passwords get a <em>slow</em> hash on purpose: <InlineCode>argon2id</InlineCode> (or <InlineCode>bcrypt</InlineCode> cost 12+) is memory-hard, so an attacker with a stolen DB can't GPU-grind billions of guesses per second. MD5/SHA1 are fast hashes — a fast hash on a password is a leaked password. Per-row salt is built in; it stops one rainbow table from cracking the whole table.</>,
              <>JWTs can't be revoked before <InlineCode>exp</InlineCode> — the server holds no state to invalidate. So keep <InlineCode>exp</InlineCode> short and pair with a refresh token, or keep a server-side session/denylist and accept the lookup. Store in <InlineCode>httpOnly + Secure + SameSite</InlineCode> cookies: <InlineCode>localStorage</InlineCode> is readable by any XSS payload on the page, and a stolen token is a valid login until it expires.</>,
              <>Pin the verifying algorithm server-side. <InlineCode>alg: none</InlineCode> tells a naive library to skip signature checks entirely; algorithm confusion feeds an RS256 public key as an HS256 <em>secret</em> so the attacker signs their own tokens. Both are forged-admin-token bugs — never trust the algorithm the token names.</>,
              <>OAuth 2.0: Authorization Code + PKCE for SPAs/mobile — PKCE binds the code to the client that requested it, so an intercepted code is useless. Client Credentials for service-to-service. The Implicit flow leaked tokens in the URL and is dead; don't use it.</>,
              <>Authorization model: RBAC (roles) for most apps; ABAC when access depends on attributes (region, time, ownership); ReBAC (Zanzibar-style relationship graph) when it depends on "is X related to Y". Keep the check in <em>one</em> place — middleware or a policy module. Scattered per-handler <InlineCode>if</InlineCode>s are how one handler ends up missing the check.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The vulnerability worth memorizing: IDOR</h4>
          <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Insecure Direct Object Reference</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
              The handler for <InlineCode>GET /orders/123</InlineCode> checks the caller is logged in, loads order 123, returns it. The caller is logged in — as user A. Order 123 belongs to user B. The attacker just increments the id: <InlineCode>/orders/124</InlineCode>, <InlineCode>/orders/125</InlineCode>… and reads the whole table.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
              "Authenticated" was checked; "authorized for <em>this</em> resource" was not. The fix is one clause — <InlineCode>WHERE id = :id AND user_id = :caller</InlineCode> — or an explicit ownership check before returning. This is consistently the #1 real-world API vulnerability, and a 401-vs-403 mindset hides it: the caller has a valid 200-worthy session, the bug is in the row-level check.
            </p>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Use UUIDs over sequential ids so resources aren't trivially enumerable — but that's defense in depth, not the fix. The ownership check is the fix; an unguessable id without it just slows the attacker down.
          </p>
        </Card>
        <JwtDecoder />
      </Section>

      <Section id="db" kicker="5.3" title="Databases — SQL & NoSQL">
        <TopicCard
          layerId={L}
          index={2}
          title="Pick the model that matches your access pattern"
          description="Postgres is the default — you almost always want transactions, joins, and constraints. Reach for NoSQL for a specific reason: a fixed access pattern, a write volume relational can't take, or genuinely document-shaped data."
        >
          <Bullets
            items={[
              <>Know your default isolation level — Postgres is READ COMMITTED, which still allows lost updates across a read-then-write. A balance read in request A and a write in request B interleave and one update vanishes. Fix with a transaction + <InlineCode>SELECT ... FOR UPDATE</InlineCode>, or an optimistic <InlineCode>version</InlineCode> column. SERIALIZABLE removes the anomaly but adds serialization failures you must retry.</>,
              <>MVCC is why Postgres readers never block writers: an <InlineCode>UPDATE</InlineCode> writes a new row version and leaves the old one as a dead tuple. A long-running transaction holds a snapshot, so <InlineCode>VACUUM</InlineCode> can't reclaim those tuples — the table and its indexes bloat, and scans get slower even though the live row count hasn't changed. One forgotten open transaction can bloat a hot table for hours.</>,
              <><InlineCode>EXPLAIN ANALYZE</InlineCode> shows the real plan, not the guess. A <em>Seq Scan</em> on a large table in a request path is a bug: <InlineCode>cost=0..21000 rows=1</InlineCode> means it read a million rows to return one. Add the index and it becomes an <em>Index Scan</em>, <InlineCode>cost=0.42..8.43</InlineCode> — O(log n) instead of O(n). A new hot query path gets its index in the <em>same</em> PR.</>,
              <>Index types match the query: B-Tree for equality and range (the default), GIN for <InlineCode>jsonb</InlineCode>/full-text/array containment, GiST for geo/range overlap. Partial indexes (<InlineCode>WHERE status = 'active'</InlineCode>) stay small; covering indexes (<InlineCode>INCLUDE</InlineCode>) let a query be served index-only with no heap fetch. Indexes aren't free — every one is extra work on every write and more disk.</>,
              <>Scaling order: index → rewrite the query → connection pooling (PgBouncer — Postgres connections are processes, a few hundred is the practical ceiling) → read replicas (you've now accepted replication lag and stale reads) → partitioning → sharding (Citus, Vitess). Don't shard before you've indexed; most "we need to scale" is a missing index.</>,
              <>Datastore choice: document (MongoDB) when data is genuinely document-shaped — the shard key is permanent, get it right. Key-value (Redis) for cache, sessions, rate-limit counters, leaderboards — not a source of truth unless you've accepted the durability tradeoff. Wide-column (Cassandra/Dynamo) for massive write throughput with known query patterns, modeling a table per query.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">Two database failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">The N+1 query</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Load 50 orders, then loop and fetch each order's user: 1 + 50 round trips. Each is fast in isolation, so it passes review and looks fine on a 10-row dev DB — then the list page times out in production.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: one <InlineCode>{`JOIN`}</InlineCode>, or batch the ids into a single <InlineCode>{`WHERE user_id IN (...)`}</InlineCode>. The same shape as the GraphQL DataLoader problem in 5.1. Catch it with a test that asserts query count, not just correctness.
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">The simultaneous-deploy migration</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A PR renames a column and updates the code in one shot. During rollout, old pods query the old name and new pods the new name — half your traffic 500s until the deploy finishes.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Migrations are additive and backwards-compatible: add nullable column → write both → backfill in batches (never one giant <InlineCode>UPDATE</InlineCode> — it locks the table and bloats it) → read new → drop old. Each step is safe to run while the previous version is still live.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Rule of thumb: normalize until it hurts, denormalize until it works. 3NF by default; denormalize deliberately for a <em>measured</em> read-heavy path, and own the consistency cost — a copied value is a value that can go stale.
          </p>
        </Card>
        <IndexDemo />
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
        >
          <Bullets
            items={[
              <>Cache-aside (lazy): read checks cache → miss → load DB → populate. Writes hit the DB and <em>delete</em> the key (don't update it — a concurrent reader can repopulate stale and win the race). Failure mode: cold start, every key missing at once.</>,
              <>Write-through: write cache + DB in the same path. Cache is never stale, but you pay the DB write latency on every write and still cache data nobody reads.</>,
              <>Write-behind: write cache, ack, flush to DB async. Lowest write latency — but the unflushed buffer is <strong>real data that only exists in Redis</strong>. Crash before flush = silent loss. Only acceptable when the write is reconstructable or loss-tolerant (view counts, not orders).</>,
              <>Every key needs a TTL <em>and</em> jitter (<InlineCode>ttl + rand(0, ttl/4)</InlineCode>). Identical TTLs set during a deploy all expire in the same second → synchronized stampede on the DB.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The two failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Cache stampede (dogpile)</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A hot key expires. The next <em>N</em> concurrent requests all miss, all run the same expensive query, all write the same value back. One slow query becomes <em>N</em> slow queries — the DB can fall over from a <em>cache</em> event.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: a per-key lock (<InlineCode>SET key _ NX EX 10</InlineCode>) so only the winner recomputes and the rest wait or serve stale. Or refresh-ahead — a background job re-warms the key <em>before</em> the TTL hits, so it never actually expires under load.
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Dual-write inconsistency</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Cache and DB are two systems with no shared transaction. Write DB then update cache: crash between them = stale cache forever. Update cache then DB: a concurrent reader can write the <em>old</em> DB value over your fresh cache entry.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Why cache-aside <em>deletes</em> instead of updates: a delete is idempotent and self-healing — worst case the next read just re-fetches. This is the same shape as the L5.5 dual-write problem the outbox pattern solves.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">
            <strong>Negative caching:</strong> cache the <em>absence</em> of a row too (a short-TTL tombstone). Without it, every request for a non-existent id — common in credential-stuffing or scraping — is a guaranteed cache miss that always hits the DB. The cache only protects you on the happy path otherwise.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">
            Default to cache-aside + short TTL + jitter. Reach for write-through only when a stale read is unacceptable; reach for write-behind only when the write is cheap to lose. As the standards put it: prefer short TTLs over clever invalidation you'll get wrong.
          </p>
        </Card>
        <CacheAnimator />
      </Section>

      <Section id="mq" kicker="5.5" title="Message Queues & Event Streaming">
        <TopicCard
          layerId={L}
          index={4}
          title="Decouple producers from consumers"
          description="Reach for a queue to decouple producer from consumer, absorb a traffic spike, or fan out — not to replace a call that should just be a synchronous function. Crossing the boundary async means you've signed up for eventual consistency."
        >
          <Bullets
            items={[
              <>RabbitMQ is a broker: exchanges (direct/topic/fanout) route to queues, a consumer ACKs to remove a message, a nack or timeout requeues it, and a dead-letter exchange catches what keeps failing so one poison message doesn't loop forever. The message is gone once ACKed — it's a work queue, not a log. Best for task distribution and routing.</>,
              <>Kafka is an append-only log: messages stay for a retention window, so a consumer group tracks its own <em>offset</em> and can replay from any point. Partitions are the unit of parallelism — one partition is consumed by exactly one consumer in a group, so more consumers than partitions just idle. Best for event sourcing, replay, and multiple independent consumer groups off the same stream.</>,
              <>Same key → same partition (hash of key mod partition count), which is the <em>only</em> ordering guarantee Kafka gives you — per key, per partition. Across partitions there is no global order. Choose the key for the ordering you actually need (e.g. <InlineCode>user_id</InlineCode> so one user's events stay in sequence).</>,
              <>Delivery is at-least-once by default: the broker redelivers if the ACK is lost, so a consumer <em>will</em> see duplicates. A non-idempotent consumer that "send email on OrderPlaced" sends the email twice. Exactly-once is a property you build — a dedup table keyed by message/event id, or an idempotency key checked before the side effect — not a checkbox you tick.</>,
              <>Outbox pattern: publishing to the broker and writing to your DB are two systems with no shared transaction — crash between them and the event is lost or sent without the data. Instead write the event to an <InlineCode>outbox</InlineCode> table in the <em>same</em> transaction as the business row; a separate relay polls the table and publishes. One atomic commit, then at-least-once delivery downstream.</>,
            ]}
          />
        </TopicCard>
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
        <KafkaDemo />
      </Section>

      <Section id="micro" kicker="5.6" title="Microservices & Service Architecture">
        <TopicCard
          layerId={L}
          index={5}
          title="Start with a monolith"
          description="Splitting a service turns a local function call — synchronous, transactional, type-checked at compile time — into a network call: it can be slow, fail partially, or arrive twice. Split only at a real bounded-context seam with an independent scaling or deploy need."
        >
          <Bullets
            items={[
              <>Split by bounded context (DDD), never by technical layer. A "database service" + "API service" + "logic service" gives you all the network failure of microservices and none of the independent-deploy benefit — every feature still touches all three. A real seam is a domain that owns its data and can deploy and scale alone.</>,
              <>Sync (REST/gRPC) when the caller needs the answer to continue — a price lookup. Async (events) when it doesn't — "order placed" can let billing and email catch up later. Picking sync for a workflow couples two services' uptime: if billing is down, checkout is down. Picking async for a query forces the caller to poll or block.</>,
              <>Every cross-service call needs a <em>timeout</em> (an unbounded wait is how one slow service hangs every caller), a <em>retry with jitter</em> (a fixed retry interval synchronizes every client into a thundering herd the instant the service recovers), a <em>circuit breaker</em> (stop calling a service that's clearly down so it can recover instead of being hammered), and a <em>bulkhead</em> (isolate the thread/connection pool per dependency so one slow dependency can't exhaust the whole pool).</>,
              <>There's no distributed transaction across services — no shared <InlineCode>COMMIT</InlineCode>. A Saga is a sequence of local transactions, each emitting an event for the next; if step 3 fails, you run <em>compensating</em> actions to undo steps 1–2. Orchestration: one coordinator drives the steps (easier to see and debug). Choreography: services react to each other's events (looser coupling, but the flow is implicit and hard to trace).</>,
              <>The cost you sign up for: partial failure is now normal, every state change is eventually consistent, and a single request fans out across services — so you need a correlation id propagated through every call and structured logs, or a production bug is unobservable.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The failure mode worth memorizing: the distributed monolith</h4>
          <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Microservices with monolith coupling</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
              The team split too early, on the wrong seams. Now every feature change touches three services that must deploy together, they share a database so a schema change breaks all of them, and a request hops synchronously through all three so any one being down takes the whole flow down.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
              You've paid the full distributed-systems tax — network failure, partial failure, eventual consistency, distributed tracing — and kept the coupling of a monolith. It's strictly worse than the monolith you started with: the same lockstep deploys, plus the network in between.
            </p>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            This is why "start with a monolith" isn't conservatism — extracting a service from a clean modular monolith is straightforward; merging mis-drawn services back is a rewrite. CAP and system design at planet scale are L7's job; L5 is the boundary decision: is this a real seam, or a function call you're about to put a network inside?
          </p>
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
