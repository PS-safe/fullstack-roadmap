import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Workflow, Bug, Boxes as BoxesIcon, AlertTriangle, Play, Pause, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 16;

export default function Layer16() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="streams" kicker="16.1" title="Streams (the killer feature)">
        <TopicCard
          layerId={L}
          index={0}
          title="Process data of any size with constant memory"
          description="Streams flow chunks through pipelines: Readable → Transform → Writable. Backpressure pauses upstream when downstream is slow. Unzipping a 10 GB file uses kilobytes of RAM."
        >
          <Bullets
            items={[
              <>Backpressure is not magic — it's a return value. <InlineCode>writable.write(chunk)</InlineCode> returns <InlineCode>false</InlineCode> when its internal buffer crosses <InlineCode>highWaterMark</InlineCode> (16 KB for byte streams, 16 objects for object mode). The Readable feeding it must then stop calling <InlineCode>.write()</InlineCode> and wait for the <InlineCode>'drain'</InlineCode> event. <InlineCode>pipe()</InlineCode>/<InlineCode>pipeline()</InlineCode> wire that handshake for you — that's the entire point of using them.</>,
              <>Use <InlineCode>{'stream/promises'}</InlineCode> <InlineCode>pipeline()</InlineCode>, never raw <InlineCode>.pipe()</InlineCode> chains. On a downstream error <InlineCode>pipeline</InlineCode> destroys <em>every</em> stream and rejects; <InlineCode>.pipe()</InlineCode> leaves the source open and still flowing — a leaked file descriptor / socket per failed request.</>,
              <>The moment you do <InlineCode>{"for await (const row of stream) results.push(row)"}</InlineCode> or <InlineCode>{"stream.on('data', ...)"}</InlineCode> into an array, you have deleted the constant-memory guarantee — you rebuilt the unbounded buffer streams exist to prevent. If you must collect, bound it (batch of N, then flush).</>,
              <>Transform streams are the unit of composition: <InlineCode>{'transform(chunk, enc, cb)'}</InlineCode> in, <InlineCode>{'this.push()'}</InlineCode> out. The exact same pipeline shape works for files, HTTP req/res, TCP sockets, a Postgres cursor, an S3 body — async iterables and Web Streams (<InlineCode>{'ReadableStream'}</InlineCode>) interop via <InlineCode>{'Readable.fromWeb / .toWeb'}</InlineCode>.</>,
              <>Failure mode that hides: an <InlineCode>objectMode</InlineCode> stream with a slow consumer and a fast producer that <em>ignores</em> the <InlineCode>false</InlineCode> return. Memory climbs steadily, no error, no crash until the OOM killer — because each buffered object can be arbitrarily large, <InlineCode>highWaterMark</InlineCode>'s "16" stops meaning anything.</>,
            ]}
          />
          <StreamsAnimator />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={240}
          title="Streams: gzip + parse + filter, no buffers"
          initial={`// const { pipeline } = require('node:stream/promises');
// const { createReadStream, createWriteStream } = require('node:fs');
// const { createGunzip } = require('node:zlib');
// const csv = require('csv-parser');

// await pipeline(
//   createReadStream('access.log.gz'),
//   createGunzip(),                       // bytes → bytes
//   csv(),                                // bytes → objects
//   filterByStatus(500),                  // objects → objects
//   serializeJsonl(),                     // objects → bytes
//   createWriteStream('errors.jsonl'),
// );

// Memory: ~64 KB chunk regardless of file size.
// Backpressure: csv() stops pulling when filterByStatus is slow.

console.log('Streams in pseudo-code above. Same shape works for HTTP req/res, S3, Kafka.');`}
        />
      </Section>

      <Section id="loop" kicker="16.2" title="The Node Event Loop (libuv detail)">
        <TopicCard
          layerId={L}
          index={1}
          title="Six phases, two queues"
          description="Each turn of the loop walks through six phases (timers → pending → idle → poll → check → close). Microtasks (process.nextTick, Promises) drain between every phase, not just at the end."
        >
          <Bullets
            items={[
              <>The loop is a scheduler you can starve. A synchronous CPU loop in one request handler blocks <em>every</em> connection, every timer, every I/O callback — not just the slow request. The fix is a worker, not a smaller loop (see 16.3).</>,
              <>Microtasks drain to empty between <em>every</em> phase, not once at the end. <InlineCode>process.nextTick</InlineCode> runs before Promise callbacks — and a recursive <InlineCode>nextTick</InlineCode> never lets the loop reach the poll phase, so I/O is starved forever while the process pegs a core. Promises are slightly safer (they yield to the next microtask checkpoint) but a tight Promise chain stalls the same way.</>,
              <><InlineCode>setImmediate</InlineCode> vs <InlineCode>setTimeout(fn, 0)</InlineCode> is decided by <em>where you call it</em>. Inside an I/O callback (you're in the poll phase) <InlineCode>setImmediate</InlineCode> fires this same turn — the very next phase is <strong>check</strong>. <InlineCode>setTimeout(0)</InlineCode> waits for the <strong>timers</strong> phase of the next turn. So to "yield after I/O and resume soon," reach for <InlineCode>setImmediate</InlineCode>. (At top level, the order is non-deterministic — it depends on how fast the loop reaches each phase.)</>,
              <>"Async" only means non-blocking if the work is actually I/O. <InlineCode>fs.readFileSync</InlineCode>, <InlineCode>JSON.parse</InlineCode> on a 40 MB payload, <InlineCode>crypto.pbkdf2Sync</InlineCode>, a regex with catastrophic backtracking — all run <em>on</em> the loop thread and block it. <InlineCode>crypto.pbkdf2</InlineCode> (async) is different: it runs on the libuv threadpool.</>,
              <>The libuv threadpool (default 4 threads, <InlineCode>UV_THREADPOOL_SIZE</InlineCode>) handles <InlineCode>fs.*</InlineCode>, DNS <InlineCode>lookup</InlineCode>, and async crypto/zlib. Network sockets do <em>not</em> use it — they use the OS event mechanism (epoll/kqueue) directly. So 5 concurrent file reads serialize behind 4 threads; 5000 concurrent HTTP requests do not.</>,
            ]}
          />
          <NodeEventLoopDiagram />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">Event-loop failures worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Loop stall (the "Node is slow" myth)</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                p50 latency is 2 ms, p99 is 900 ms. Not the DB — a synchronous hot path (template render, big <InlineCode>JSON.parse</InlineCode>, sync hash) blocks the loop for tens of ms each call. Every request queued behind it eats that delay.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Detect: monitor event-loop lag (<InlineCode>perf_hooks.monitorEventLoopDelay</InlineCode>) and alert on it like you alert on CPU. Fix: move the work to a worker, or chunk it with <InlineCode>setImmediate</InlineCode> so the loop breathes between slices.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">nextTick starvation</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A recursive <InlineCode>process.nextTick</InlineCode> (or an unbounded Promise loop) re-queues a microtask faster than the loop can drain it. The loop never reaches the poll phase — no new connections accepted, no timers fire, health check times out, orchestrator kills the "healthy" pod.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Why it's sneaky: CPU is 100% but there's no error and no stack to blame. Break recursion with <InlineCode>setImmediate</InlineCode> instead of <InlineCode>nextTick</InlineCode> when you genuinely need to defer in a loop.
              </p>
            </div>
          </div>
        </Card>
      </Section>

      <Section id="workers" kicker="16.3" title="Cluster · Worker Threads · Child Process">
        <TopicCard
          layerId={L}
          index={2}
          title="Three ways to escape single-threaded JS"
          description="Use worker_threads for CPU-bound JS. Use cluster for HTTP scaling on multi-core. Use child_process for shelling out or running other binaries."
        >
          <Bullets
            items={[
              <>The decision is by <em>job</em>, not preference: CPU-bound <strong>JS</strong> → <InlineCode>worker_threads</InlineCode>; HTTP throughput across cores → <InlineCode>cluster</InlineCode> (or just run N containers behind a load balancer — usually simpler); run a <strong>non-JS</strong> binary or need real isolation → <InlineCode>child_process</InlineCode>. Substituting one for another is the classic mistake — <InlineCode>child_process</InlineCode> for CPU-bound JS pays process-spawn + IPC cost for nothing; <InlineCode>cluster</InlineCode> expecting shared in-memory state silently gives each worker its own copy.</>,
              <><InlineCode>postMessage</InlineCode> uses the structured-clone algorithm — it <em>deep-copies</em> the object across the thread boundary. Sending a 50 MB parsed buffer copies 50 MB and blocks both threads while it serializes. Two escapes: pass an <InlineCode>ArrayBuffer</InlineCode> in the transfer list (ownership moves, zero-copy, but the sender loses access), or back the data with <InlineCode>SharedArrayBuffer</InlineCode> so both threads see the same memory.</>,
              <><InlineCode>SharedArrayBuffer</InlineCode> earns its keep only when threads need to <em>both</em> touch the same large mutable buffer repeatedly (image pipeline, simulation, a parsed dataset queried by many workers). It buys you data races too — coordinate with <InlineCode>Atomics.wait/notify</InlineCode>. For request/response work, plain <InlineCode>postMessage</InlineCode> copies are fine; don't reach for shared memory to "optimize" a hash-once worker.</>,
              <>Workers aren't free — each is a fresh V8 isolate (~a few MB heap + startup time). For frequent small tasks, pool them (e.g. <InlineCode>piscina</InlineCode>) and reuse; spawning one per request just moves the bottleneck to thread creation.</>,
              <><InlineCode>cluster</InlineCode> gives zero shared-memory bugs because there's zero shared memory — every worker is a full process. That's also the cost: a session cache, a rate-limit counter, an in-memory queue must move to Redis or the DB, or each core enforces its own limit independently.</>,
            ]}
          />
          <WorkersPicker />
        </TopicCard>
      </Section>

      <Section id="esm" kicker="16.4" title="ESM ↔ CommonJS">
        <TopicCard
          layerId={L}
          index={3}
          title="The interop pain you cannot avoid"
          description="Half the ecosystem is ESM, half is CJS. Top-level await, default exports, __dirname, dynamic require — every team hits these traps."
        >
          <Bullets
            items={[
              <><strong><InlineCode>ERR_REQUIRE_ESM</InlineCode></strong> — CJS code did <InlineCode>require()</InlineCode> on an ESM-only package (common since libraries like <InlineCode>chalk</InlineCode>, <InlineCode>node-fetch</InlineCode>, <InlineCode>execa</InlineCode> went ESM-only). Fix: <InlineCode>const x = await import('pkg')</InlineCode> — but that forces the call site async. The real fix is to migrate the file to ESM. (Node 22+ can <InlineCode>require()</InlineCode> a synchronous ESM graph, but don't rely on it across versions.)</>,
              <><strong><InlineCode>ReferenceError: __dirname is not defined</InlineCode></strong> — ESM has no <InlineCode>__dirname</InlineCode>/<InlineCode>__filename</InlineCode>. One-line fix: <InlineCode>{"const __dirname = path.dirname(fileURLToPath(import.meta.url))"}</InlineCode>. (Node 20.11+ also exposes <InlineCode>import.meta.dirname</InlineCode> directly.)</>,
              <><strong>"x is not a function" after importing a CJS module</strong> — a CJS <InlineCode>module.exports = fn</InlineCode> lands as the ESM <em>default</em> import, and named exports are best-effort statically analyzed. Fix: <InlineCode>import pkg from 'cjs-lib'</InlineCode> then destructure, not <InlineCode>{"import { thing }"}</InlineCode> — or check the package's <InlineCode>exports</InlineCode> map.</>,
              <><strong><InlineCode>ERR_UNSUPPORTED_DIR_IMPORT</InlineCode> / unresolved relative import</strong> — ESM does no extension guessing and no directory-index resolution. <InlineCode>import './utils'</InlineCode> fails; you must write <InlineCode>import './utils/index.js'</InlineCode> — the <InlineCode>.js</InlineCode> literally, even when the source is <InlineCode>.ts</InlineCode>. This is the single biggest friction porting a TS codebase to ESM.</>,
              <>Top-level <InlineCode>await</InlineCode> is ESM-only — convenient, but it <em>blocks the importing module's evaluation</em>. A slow TLA in a shared module delays everything downstream of it. The <InlineCode>"type"</InlineCode> field in <InlineCode>package.json</InlineCode> is the switch: <InlineCode>"module"</InlineCode> makes <InlineCode>.js</InlineCode> ESM, absent/<InlineCode>"commonjs"</InlineCode> makes it CJS; <InlineCode>.mjs</InlineCode>/<InlineCode>.cjs</InlineCode> override per-file.</>,
            ]}
          />
          <EsmCjsMatrix />
        </TopicCard>
      </Section>

      <Section id="pkg" kicker="16.5" title="Package managers: npm · pnpm · Yarn · Bun">
        <TopicCard
          layerId={L}
          index={4}
          title="They all install — they don't all install the same"
          description="pnpm is the modern default for workspaces and disk efficiency. Bun is fastest. npm ships with Node and is fine for small projects. Yarn berry has a steep learning curve."
        >
          <Bullets
            items={[
              <><strong>pnpm's edge is the layout, not just speed.</strong> It keeps one content-addressed store on disk and hardlinks packages into each project — ten projects on <InlineCode>react@18.2</InlineCode> store it once. And its <InlineCode>node_modules</InlineCode> is a symlinked tree where a package can only <InlineCode>require</InlineCode> what it actually declared.</>,
              <><strong>That strictness kills "phantom dependencies."</strong> With npm's flat hoisting, your code can <InlineCode>import 'lodash'</InlineCode> even though <em>a dependency</em> pulled it in — it works locally, then breaks the day that transitive dep drops lodash. pnpm makes that an error at install/build time, where it's cheap to fix.</>,
              <><strong>The lockfile is what actually pins versions — not the range in <InlineCode>package.json</InlineCode>.</strong> <InlineCode>^1.2.3</InlineCode> is a <em>range</em>; the lockfile records the exact tree that resolved last time. Commit it always, and use <InlineCode>npm ci</InlineCode> / <InlineCode>pnpm install --frozen-lockfile</InlineCode> in CI so a build can't silently float to a new version.</>,
              <><InlineCode>^</InlineCode> bites everyone exactly once: a "patch" release of a transitive dep ships a regression, your range happily accepts it, and a build that passed yesterday fails today with no code change. The lockfile is the seatbelt — but only if it's committed and CI respects it.</>,
              <><strong>Pick by commitment level.</strong> npm: ships with Node, fine for small projects and OSS libs. pnpm: the 2026 default for anything with a workspace. Bun: fastest, but you're adopting the Bun <em>runtime</em>'s ecosystem, not just its installer. Yarn Berry (PnP, zero-installs): large monorepos with a team patient enough for the PnP resolution model.</>,
            ]}
          />
          <PkgManagerCompare />
          <SemverBox />
        </TopicCard>
      </Section>

      <Section id="frameworks" kicker="16.6" title="HTTP frameworks: Express · Fastify · Hono · NestJS">
        <TopicCard
          layerId={L}
          index={5}
          title="Pick the smallest one that fits"
          description="Express is everywhere but slow. Fastify is the modern Express. Hono is edge-first and tiny. NestJS is opinionated and TypeScript-native. Native fetch + node:http is sometimes enough."
        >
          <Bullets
            items={[
              <><strong>Fastify is the default for a new Node HTTP service.</strong> The reason isn't raw speed — it's the schema. You declare a JSON Schema per route; Fastify validates the request <em>and</em> compiles a fast serializer for the response from it. That's validation, OpenAPI docs, and TS types from one source instead of three drifting copies.</>,
              <><strong>Express's real cost in 2026 is the type story, not the throughput.</strong> Types are bolt-on (<InlineCode>@types/express</InlineCode>), <InlineCode>req.body</InlineCode> is <InlineCode>any</InlineCode>, and Express ≤4 silently swallows a rejected promise from an <InlineCode>async</InlineCode> handler — the request just hangs until timeout. Express 5 awaits handlers, but the ecosystem still assumes 4. New code only if a specific middleware demands it.</>,
              <><strong>Hono vs Fastify is a runtime question, not a feature question.</strong> Hono is built on Web Standard APIs (<InlineCode>Request</InlineCode>/<InlineCode>Response</InlineCode>), so the same code runs on Cloudflare Workers, Deno, Bun, and Node. Pick Hono when you deploy to the edge or want runtime portability; pick Fastify when you're committed to the Node runtime and want its mature plugin ecosystem (auth, rate-limit, swagger).</>,
              <><strong>NestJS buys structure, and structure has a price.</strong> Modules + DI + decorators pay off when a large team needs enforced conventions and the app is genuinely layered. On a solo project it's mostly boilerplate and a steeper stack trace. Reach for it because the <em>team</em> benefits, not because it looks "enterprise."</>,
              <><strong><InlineCode>node:http</InlineCode> is a real choice for tiny things</strong> — a health-check sidecar, a webhook receiver, a metrics endpoint. No dependency to audit or upgrade. <strong>tRPC</strong> on top of Fastify/Hono erases the client/server schema boundary entirely — best when one TS monorepo owns both ends.</>,
            ]}
          />
          <FrameworkMatrix />
        </TopicCard>
      </Section>

      <Section id="orm" kicker="16.7" title="ORMs: Prisma · Drizzle · Kysely · TypeORM">
        <TopicCard
          layerId={L}
          index={6}
          title="Pick the lowest level you can stand"
          description="Drizzle and Kysely are SQL-first with type safety. Prisma is best DX but generates code and abstracts SQL. TypeORM is older and divisive. Plain SQL with a tiny type-helper is also fine."
        >
          <Bullets
            items={[
              <>The axis that decides it: <strong>how much does the tool stand between you and the SQL?</strong> Kysely &lt; Drizzle &lt; Prisma. Coming from Go's <InlineCode>sqlc</InlineCode>, you already think in SQL — Drizzle or Kysely will feel native; Prisma's fluent API will feel like a layer you have to reverse-engineer when a query is slow.</>,
              <><strong>Prisma's cost is the abstraction, paid at debug time.</strong> Its DX is genuinely the best — autocomplete, relations, migrations. But you can't see the SQL without <InlineCode>log: ['query']</InlineCode>, and its relation loading historically issued multiple round-trips (the N+1 you didn't write). It also runs a separate query engine and has real edge-runtime limits. Pick it when DX dominates and the team isn't SQL-fluent.</>,
              <><strong>Drizzle is the modern default for new projects.</strong> It's a thin typed SQL builder — the query you write is the SQL that runs, types are inferred from the schema you define in TS, the bundle is small, and it works on edge runtimes. The trade-off: less hand-holding than Prisma, and migrations (<InlineCode>drizzle-kit</InlineCode>) are younger and less polished.</>,
              <><strong>Kysely is a query builder, not an ORM</strong> — no schema DSL, no migration engine of its own, no entities. Just fully type-safe SQL. Pick it when you want SQL with types and <em>nothing else</em>; pair it with a standalone migration tool.</>,
              <><strong>The trap common to all of them: connection pooling under serverless.</strong> Each lambda/edge instance opens its own pool; 200 concurrent invocations = 200× the connections, and Postgres falls over at <InlineCode>max_connections</InlineCode>. The fix is a proxy (PgBouncer, Prisma Accelerate, Neon's pooler), not a bigger DB — this is an L6/L7 deployment concern the ORM choice surfaces.</>,
              <>TypeORM/Sequelize are maintenance-mode picks — decorators need <InlineCode>experimentalDecorators</InlineCode>, types feel bolted on. <strong><InlineCode>sql</InlineCode> + <InlineCode>zod</InlineCode></strong> (plain strings, parsed at runtime) is a legitimate floor, not a fallback — closest to the <InlineCode>sqlc</InlineCode> philosophy.</>,
            ]}
          />
          <OrmMatrix />
        </TopicCard>
      </Section>

      <Section id="errors" kicker="16.8" title="Error handling patterns">
        <TopicCard
          layerId={L}
          index={7}
          title="Async errors are easy to lose"
          description="Unhandled rejections silently kill processes. Errors thrown inside setTimeout don't bubble. Always wrap async handlers; catch at boundaries; never swallow."
        >
          <Bullets
            items={[
              <>An unhandled rejection means your process is in an <em>unknown</em> state — a step you assumed completed didn't. Subscribe to <InlineCode>process.on('unhandledRejection')</InlineCode> and <InlineCode>uncaughtException</InlineCode>, log with full context, then <strong>exit</strong> and let the supervisor restart clean. Continuing is how a single lost <InlineCode>await</InlineCode> becomes corrupted data an hour later.</>,
              <>Errors thrown inside <InlineCode>setTimeout</InlineCode>/<InlineCode>setImmediate</InlineCode> callbacks do <strong>not</strong> bubble to the surrounding <InlineCode>try/catch</InlineCode> — the callback runs on a fresh stack in a later loop phase, the <InlineCode>try</InlineCode> is long gone. Wrap the callback body itself, or it goes straight to <InlineCode>uncaughtException</InlineCode>.</>,
              <>Express ≤4 doesn't catch a rejected promise from an <InlineCode>async</InlineCode> handler — the response just hangs until the client times out. Wrap: <InlineCode>{'(req, res, next) => fn(req, res).catch(next)'}</InlineCode>, or use <InlineCode>express-async-handler</InlineCode>. Fastify and Express 5 await handlers natively, so the wrapper isn't needed there.</>,
              <><InlineCode>Promise.all</InlineCode> rejects on the <em>first</em> failure and abandons the rest — the other promises still run, but their results (and errors) are lost. When every result matters, use <InlineCode>Promise.allSettled</InlineCode>, collect the <InlineCode>rejected</InlineCode> reasons, and throw an <InlineCode>AggregateError</InlineCode> so you see all failures, not just the fastest one.</>,
              <>Never <InlineCode>{"catch (e) { console.log('error') }"}</InlineCode> — that discards the stack and the cause, leaving an undebuggable production log line. Rethrow with context: <InlineCode>{"throw new Error('charge failed for ' + id, { cause: e })"}</InlineCode>. The <InlineCode>cause</InlineCode> chain preserves the original stack.</>,
              <>Custom error classes carry HTTP status (<InlineCode>{'class HttpError extends Error { status: number }'}</InlineCode>) so one error-handling middleware at the boundary maps any thrown error to the right response — domain code throws, the boundary translates.</>,
            ]}
          />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={240}
          title="Async error patterns"
          initial={`// 1. Don't swallow errors
async function badFetch(url) {
  try {
    return await fetch(url);
  } catch (e) {
    console.log('error');     // ← ate the error context. avoid.
    return null;
  }
}

// 2. Wrap + rethrow with context
async function goodFetch(url) {
  try {
    return await fetch(url);
  } catch (cause) {
    throw new Error('fetch failed: ' + url, { cause });
  }
}

// 3. AggregateError for parallel failures
async function fetchAll(urls) {
  const results = await Promise.allSettled(urls.map(u => fetch(u)));
  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason);
  if (errors.length) throw new AggregateError(errors, errors.length + ' fetches failed');
  return results.map(r => r.value);
}

console.log('Patterns above. Always wrap async; never silently catch.');`}
        />
      </Section>

      <Section id="debug" kicker="16.9" title="Debugging & Production Ops">
        <TopicCard
          layerId={L}
          index={8}
          title="--inspect, heap snapshots, graceful shutdown"
          description="Connect Chrome DevTools to a running Node process. Snapshot the heap to find leaks. Always handle SIGTERM and drain in-flight requests."
        >
          <Bullets
            items={[
              <><strong>Graceful shutdown is not optional — it's what makes a deploy invisible.</strong> On <InlineCode>SIGTERM</InlineCode>: stop accepting new connections (<InlineCode>server.close()</InlineCode>), let in-flight requests finish, close the DB pool and queue consumers, <em>then</em> <InlineCode>process.exit(0)</InlineCode>. Skip it and every rolling deploy resets live connections mid-request. The orchestrator gives you a grace window (~30 s) then <InlineCode>SIGKILL</InlineCode>s you — so also set a hard timeout so a stuck request can't hang the shutdown.</>,
              <><strong>Find a leak by diffing, not staring.</strong> Take a heap snapshot, exercise the suspected path, take a second snapshot, use DevTools' "Comparison" view — the objects with positive retained-size delta are your leak. The usual culprits: an unbounded <InlineCode>Map</InlineCode>/array used as a cache, listeners added per-request and never removed, closures holding a big buffer alive.</>,
              <><strong>"It's slow" splits into two different tools.</strong> CPU-bound (loop pegged) → <InlineCode>--cpu-prof</InlineCode> or a flame graph (<InlineCode>clinic flame</InlineCode>, <InlineCode>0x</InlineCode>) to find the hot function. Latency with idle CPU → it's I/O wait or event-loop lag; measure <InlineCode>monitorEventLoopDelay</InlineCode> and check downstream call timings. Profiling the wrong axis wastes the afternoon.</>,
              <><InlineCode>NODE_OPTIONS="--enable-source-maps"</InlineCode> makes stack traces point at your <InlineCode>.ts</InlineCode> source instead of transpiled <InlineCode>.js</InlineCode> with useless line numbers. Cheap, set it everywhere.</>,
              <>A process manager (systemd, PM2) handles restart, log rotation, and env — but it does <strong>not</strong> replace the <InlineCode>SIGTERM</InlineCode> handler <em>inside</em> the app. The supervisor restarts you; only your code can drain cleanly first.</>,
            ]}
          />
          <DebugCheats />
        </TopicCard>
      </Section>

      <Section id="mono" kicker="16.10" title="Monorepos">
        <TopicCard
          layerId={L}
          index={9}
          title="pnpm workspaces · Turborepo · Nx · Moon"
          description="Monorepos let you share types and atomic refactors across packages. Cache builds with Turborepo. Don't reach for Nx until you have ≥ 5 packages."
        >
          <Bullets
            items={[
              <>The real win is the <strong>shared <InlineCode>packages/shared</InlineCode> for types and validators</strong>: the API and the web client import the <em>same</em> Zod schema, so a breaking field change is a compile error in the same PR — not a runtime 500 discovered after the published-package version drifted. That feedback loop is the reason to adopt a monorepo at all.</>,
              <><strong>pnpm workspaces is the floor; Turborepo is the build-cache layer on top.</strong> Turbo hashes each task's inputs (source, deps, env) and skips the task entirely on a cache hit — local <em>and</em> remote — so a PR touching only <InlineCode>apps/web</InlineCode> doesn't rebuild and retest <InlineCode>apps/api</InlineCode>. That's the difference between a 6-minute and a 20-second CI run.</>,
              <><strong>Don't reach for Nx until ≥5 packages and you feel the pain.</strong> Nx adds a project graph, generators, and plugins — powerful, but it's a framework you now also maintain. On a solo project pnpm + Turbo covers it; Nx earns its complexity at team scale.</>,
              <><strong>The cost is boundary discipline.</strong> Nothing stops <InlineCode>apps/api</InlineCode> from deep-importing a file inside <InlineCode>apps/web</InlineCode>, and once it does, the two "packages" are one tangle that can't be built or deployed independently. Enforce it with lint rules (<InlineCode>no-restricted-imports</InlineCode>) or Nx's module boundaries — convention alone won't hold.</>,
              <>Secondary costs to plan for: CI must understand and restore the Turbo cache or you lose the whole benefit, and the IDE / TS server slows once you have hundreds of packages — a watchful <InlineCode>tsconfig</InlineCode> project-references setup matters at that point.</>,
            ]}
          />
          <MonorepoLayout />
        </TopicCard>
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 16 Quiz">
        <Quiz id="L16" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-green-600/10 via-bg-card to-emerald-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-green-600 to-emerald-500 text-white">L16</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Node.js in Practice</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">From "it runs" to "it runs in production"</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Streams. Workers. Frameworks compared. ORMs compared. The ESM/CJS interop that bites every team. Error patterns
          that don't lose stack traces. The recipe to ship a Node service alone.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Package className="h-4 w-4 text-emerald-400" />
          10 topics · 9 visualizers · 2 playgrounds · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function StreamsAnimator() {
  const STAGES = ['Source\n(file/HTTP)', 'gunzip', 'csv parse', 'filter', 'gzip', 'Sink\n(S3/file)'];
  const [chunks, setChunks] = useState<{ id: number; pos: number; size: number }[]>([]);
  const [running, setRunning] = useState(false);
  const idRef = useRef(0);
  const slow = useRef(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setChunks((cs) => {
        const moved = cs
          .map((c) => {
            const max = STAGES.length - 1;
            const speed = slow.current && c.pos >= 2 && c.pos < 4 ? 0.05 : 0.18;
            return { ...c, pos: Math.min(max, c.pos + speed) };
          })
          .filter((c) => c.pos < STAGES.length - 1 + 0.3);
        const tooMany = moved.filter((c) => c.pos >= 2 && c.pos < 4).length;
        if (Math.random() < 0.5 && tooMany < 5) {
          moved.push({ id: ++idRef.current, pos: 0, size: 30 + Math.random() * 30 });
        }
        return moved;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2"><Workflow className="h-4 w-4" /> Stream pipeline + backpressure</h4>
        <div className="flex gap-2">
          <button onClick={() => setRunning((r) => !r)} className="btn-primary h-8 text-xs">
            {running ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Run</>}
          </button>
          <button
            onMouseDown={() => (slow.current = true)}
            onMouseUp={() => (slow.current = false)}
            onMouseLeave={() => (slow.current = false)}
            className="btn-ghost h-8 text-xs"
          >
            Hold: slow consumer
          </button>
          <button onClick={() => { setChunks([]); idRef.current = 0; }} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="rounded-xl border border-white/5 bg-bg-soft/30 p-4">
        <div className="grid grid-cols-6 gap-2 text-center text-[11px] text-ink-faint">
          {STAGES.map((s) => (
            <div key={s} className="rounded border border-white/10 bg-white/5 px-2 py-1.5 font-mono">{s}</div>
          ))}
        </div>
        <div className="relative mt-2 h-12">
          {chunks.map((c) => (
            <motion.div
              key={c.id}
              animate={{ left: `${(c.pos / (STAGES.length - 1)) * 100}%`, width: `${c.size / 4}%` }}
              transition={{ duration: 0.12, ease: 'linear' }}
              className="absolute top-1 h-10 -translate-x-1/2 rounded bg-emerald-400/40 ring-1 ring-emerald-400/60"
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-ink-dim">
          <span>chunks in flight: {chunks.length}</span>
          <span>{slow.current ? 'consumer slow → backpressure piles up here' : 'flowing'}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Hold "slow consumer" — chunks pile up in stage 3-4. In real Node streams, backpressure pauses the source until the buffer drains. <strong className="text-ink-dim">Memory stays bounded.</strong></p>
    </Card>
  );
}

function NodeEventLoopDiagram() {
  const phases = [
    { name: 'timers', detail: 'setTimeout, setInterval callbacks' },
    { name: 'pending callbacks', detail: 'I/O callbacks deferred' },
    { name: 'idle / prepare', detail: 'internal use' },
    { name: 'poll', detail: 'fetch new I/O events; execute their callbacks' },
    { name: 'check', detail: 'setImmediate callbacks' },
    { name: 'close callbacks', detail: 'socket.on(\'close\'), etc.' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">libuv event loop phases</h4>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {phases.map((p, i) => (
          <motion.div
            key={p.name}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, delay: i * 0.2, repeat: Infinity }}
            className="rounded-xl border border-white/10 bg-bg-soft/40 p-2.5 text-center"
          >
            <div className="font-mono text-[11px] uppercase tracking-widest text-accent-cyan">{p.name}</div>
            <div className="mt-1 text-[10px] text-ink-dim">{p.detail}</div>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-3 text-xs text-ink-dim">
          <div className="font-medium text-rose-200">Microtasks (between every phase)</div>
          <ul className="mt-1 space-y-0.5">
            <li>• <InlineCode>process.nextTick</InlineCode> — runs first, before Promises</li>
            <li>• Promise <InlineCode>.then / catch / finally</InlineCode>, <InlineCode>queueMicrotask</InlineCode></li>
            <li>• Drain <em>fully</em> before next phase</li>
          </ul>
        </div>
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-ink-dim">
          <div className="font-medium text-amber-200">Common gotcha: setImmediate vs setTimeout(0)</div>
          <p className="mt-1">In an I/O callback, setImmediate fires <em>this</em> tick (check phase). setTimeout(0) waits for next loop turn (timers phase) — usually slightly later.</p>
        </div>
      </div>
    </Card>
  );
}

function WorkersPicker() {
  const [pick, setPick] = useState<'cluster' | 'worker' | 'child'>('worker');
  const data = {
    cluster: {
      title: 'cluster',
      use: 'Scale HTTP across CPU cores. Each worker is a full Node process; primary distributes connections.',
      sample: `const cluster = require('node:cluster');
const os = require('node:os');

if (cluster.isPrimary) {
  for (let i = 0; i < os.cpus().length; i++) cluster.fork();
} else {
  require('./server');   // each worker runs the server
}`,
      pros: ['Zero shared-memory bugs', 'Built-in load balancing'],
      cons: ['Heavy: full process per core', 'No shared state — use Redis if needed'],
    },
    worker: {
      title: 'worker_threads',
      use: 'Run CPU-bound JS off the main loop without blocking. Lighter than child processes.',
      sample: `const { Worker } = require('node:worker_threads');

const worker = new Worker('./hash-heavy.js', { workerData: { input } });
worker.on('message', (out) => console.log('result:', out));`,
      pros: ['Shares memory via SharedArrayBuffer', 'Cheaper than child_process'],
      cons: ['Still one V8 instance per worker', 'Communication via postMessage is slow for big objects'],
    },
    child: {
      title: 'child_process',
      use: 'Spawn other binaries (ffmpeg, python, git) or untrusted JS in isolation.',
      sample: `const { spawn } = require('node:child_process');

const ff = spawn('ffmpeg', ['-i', input, '-c:v', 'libx264', output]);
ff.stderr.on('data', (chunk) => process.stderr.write(chunk));`,
      pros: ['Run anything, not just JS', 'Full process isolation (security)'],
      cons: ['Highest cost', 'IPC over stdio or unix socket'],
    },
  };
  const cur = data[pick];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Concurrency primitive picker</h4>
      <div className="mb-3 flex gap-2">
        {(['cluster', 'worker', 'child'] as const).map((k) => (
          <button key={k} onClick={() => setPick(k)} className={cn('rounded-md border px-3 py-1.5 font-mono text-xs', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
            {data[k].title}
          </button>
        ))}
      </div>
      <p className="text-sm text-ink-dim">{cur.use}</p>
      <pre className="mt-3 overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-5 text-ink-dim">{cur.sample}</pre>
      <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3"><div className="text-xs uppercase tracking-widest text-emerald-300">Pros</div><ul className="mt-1 space-y-0.5 text-xs text-ink-dim">{cur.pros.map((p) => <li key={p}>+ {p}</li>)}</ul></div>
        <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-3"><div className="text-xs uppercase tracking-widest text-rose-300">Cons</div><ul className="mt-1 space-y-0.5 text-xs text-ink-dim">{cur.cons.map((p) => <li key={p}>− {p}</li>)}</ul></div>
      </div>
    </Card>
  );
}

function EsmCjsMatrix() {
  const rows = [
    { topic: 'File extension', esm: '.mjs · or .js + "type":"module"', cjs: '.cjs · or .js without "type"' },
    { topic: 'Import style', esm: 'import x from "y"', cjs: 'const x = require("y")' },
    { topic: 'Top-level await', esm: '✓ supported', cjs: '✗ not supported' },
    { topic: '__dirname / __filename', esm: '✗ — use import.meta.url + fileURLToPath', cjs: '✓ available' },
    { topic: 'Dynamic import of CJS from ESM', esm: '✓ via await import("cjs-module")', cjs: '✗ require ESM' },
    { topic: 'Loading ESM from CJS', esm: 'must await import()', cjs: 'cannot require() ESM directly' },
    { topic: 'Default export shape', esm: 'import x from ... gets the default', cjs: 'module.exports = x → import { default as x }' },
    { topic: 'JSON imports', esm: 'import x from "./x.json" with { type: "json" }', cjs: 'require("./x.json")' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">ESM vs CJS — interop quick reference</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Topic</th><th className="px-4 py-2 text-left">ESM</th><th className="px-4 py-2 text-left">CommonJS</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.topic} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.topic}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-dim">{r.esm}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-dim">{r.cjs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">2026 advice: write ESM in new code. Set <InlineCode>"type": "module"</InlineCode>. Use <InlineCode>tsx</InlineCode> or <InlineCode>node --experimental-strip-types</InlineCode> to skip the build for dev.</p>
    </Card>
  );
}

function PkgManagerCompare() {
  const rows = [
    { name: 'npm',  install: 'medium', diskShared: 'no', workspaces: 'ok',     extras: 'ships with Node',                pick: 'small projects, OSS libs' },
    { name: 'pnpm', install: 'fast',   diskShared: 'YES — content-addressed store', workspaces: 'great', extras: 'strictest by default', pick: 'monorepos, default 2026' },
    { name: 'Yarn (Berry)', install: 'fast', diskShared: 'optional (PnP)', workspaces: 'great', extras: 'plug\'n\'play, zero-installs', pick: 'large monorepos with patient teams' },
    { name: 'Bun',  install: 'fastest', diskShared: 'partial', workspaces: 'good', extras: 'runtime + bundler + test runner', pick: 'bleeding edge, Bun runtime' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Package manager comparator</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr>
              <th className="px-4 py-2 text-left">Tool</th>
              <th className="px-4 py-2 text-left">Install speed</th>
              <th className="px-4 py-2 text-left">Disk-shared</th>
              <th className="px-4 py-2 text-left">Workspaces</th>
              <th className="px-4 py-2 text-left">Extras</th>
              <th className="px-4 py-2 text-left">When to pick</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-ink-dim">{r.install}</td>
                <td className="px-4 py-2 text-ink-dim">{r.diskShared}</td>
                <td className="px-4 py-2 text-ink-dim">{r.workspaces}</td>
                <td className="px-4 py-2 text-ink-dim">{r.extras}</td>
                <td className="px-4 py-2 text-ink-dim">{r.pick}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SemverBox() {
  const examples = [
    { spec: '"1.2.3"',   matches: 'exactly 1.2.3', use: 'reproducible builds via lockfile (real safety)' },
    { spec: '"^1.2.3"',  matches: '≥ 1.2.3 < 2.0.0', use: 'default; minor + patch updates allowed' },
    { spec: '"~1.2.3"',  matches: '≥ 1.2.3 < 1.3.0', use: 'patch only — paranoid' },
    { spec: '">=1.2.3"', matches: 'any 1.2.3 or higher (incl. v2!)', use: 'almost never what you want' },
    { spec: '"latest"',  matches: 'literal latest', use: 'never in production' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Semver ranges (caret bites everyone once)</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Spec</th><th className="px-4 py-2 text-left">Matches</th><th className="px-4 py-2 text-left">When to use</th></tr>
          </thead>
          <tbody>
            {examples.map((e) => (
              <tr key={e.spec} className="border-t border-white/5">
                <td className="px-4 py-2 font-mono text-accent-cyan">{e.spec}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-dim">{e.matches}</td>
                <td className="px-4 py-2 text-ink-dim">{e.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Lockfile (<InlineCode>package-lock.json</InlineCode> / <InlineCode>pnpm-lock.yaml</InlineCode>) is what actually pins versions. Always commit it. Always.</p>
    </Card>
  );
}

function FrameworkMatrix() {
  const rows = [
    { name: 'node:http (stdlib)', perf: 'highest', dx: 'low',    types: 'manual', features: 'whatever you build', pick: 'tiny services, sidecars' },
    { name: 'Express',            perf: 'low',     dx: 'medium', types: 'add-on', features: 'massive middleware ecosystem', pick: 'maintenance / legacy' },
    { name: 'Fastify',            perf: 'high',    dx: 'high',   types: 'first-class', features: 'schema-first JSON, plugin system, logger built in', pick: 'new HTTP services in Node' },
    { name: 'Hono',               perf: 'highest', dx: 'high',   types: 'first-class', features: 'tiny, edge-runtime ready (CF, Deno, Bun, Node)', pick: 'edge / serverless / multi-runtime' },
    { name: 'NestJS',             perf: 'medium',  dx: 'high',   types: 'first-class', features: 'modules, DI, decorators (Angular-style)', pick: 'large team / OO / heavy convention' },
    { name: 'tRPC + Fastify/Hono', perf: 'high',   dx: 'highest', types: 'first-class', features: 'end-to-end types, no schema needed', pick: 'TS monorepo with own client' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">HTTP framework comparator</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr>
              <th className="px-4 py-2 text-left">Framework</th>
              <th className="px-4 py-2 text-left">Perf</th>
              <th className="px-4 py-2 text-left">DX</th>
              <th className="px-4 py-2 text-left">TS</th>
              <th className="px-4 py-2 text-left">Notable</th>
              <th className="px-4 py-2 text-left">Pick when</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-ink-dim">{r.perf}</td>
                <td className="px-4 py-2 text-ink-dim">{r.dx}</td>
                <td className="px-4 py-2 text-ink-dim">{r.types}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.features}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.pick}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function OrmMatrix() {
  const rows = [
    { name: 'Drizzle',   style: 'SQL builder, types from schema',    migrate: 'drizzle-kit',  edge: '✓',  notes: 'Most SQL-like. Bundles small. Modern default.' },
    { name: 'Kysely',    style: 'Pure type-safe query builder',      migrate: 'kysely-codegen', edge: '✓', notes: 'Closest to SQL syntax. No runtime ORM. Loved by purists.' },
    { name: 'Prisma',    style: 'Schema DSL, generates client',      migrate: 'prisma migrate', edge: 'partial', notes: 'Best DX. Queries via fluent API. Edge has limits.' },
    { name: 'TypeORM',   style: 'Decorators + active record',        migrate: 'typeorm migration', edge: '✗', notes: 'Older. Decorators mean experimental flag in TS.' },
    { name: 'Sequelize', style: 'Models + finders',                  migrate: 'sequelize-cli', edge: '✗', notes: 'Mature, JS-first. Types added later — feel bolted-on.' },
    { name: 'sql + zod', style: 'Plain SQL strings + runtime parse', migrate: 'manual / node-pg-migrate', edge: '✓', notes: 'Lowest level. Closest to Go\'s sqlc philosophy.' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">ORM / SQL builder comparator</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr>
              <th className="px-4 py-2 text-left">Tool</th>
              <th className="px-4 py-2 text-left">Style</th>
              <th className="px-4 py-2 text-left">Migrations</th>
              <th className="px-4 py-2 text-left">Edge runtime</th>
              <th className="px-4 py-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.style}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-dim">{r.migrate}</td>
                <td className="px-4 py-2 text-ink-dim">{r.edge}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Default in 2026: <strong className="text-ink">Drizzle</strong> for new projects, <strong className="text-ink">Prisma</strong> if DX dominates, <strong className="text-ink">Kysely</strong> when you want raw SQL with types.</p>
    </Card>
  );
}

function DebugCheats() {
  const items = [
    { cmd: 'node --inspect server.js', what: 'Open chrome://inspect — full DevTools attached' },
    { cmd: 'node --inspect-brk server.js', what: 'Same but pauses on first line — set breakpoints first' },
    { cmd: 'node --heap-prof server.js', what: 'Sample heap allocations to file (load in DevTools Memory tab)' },
    { cmd: 'node --cpu-prof server.js', what: 'Sample CPU to .cpuprofile (load in DevTools Performance tab)' },
    { cmd: 'NODE_OPTIONS="--enable-source-maps" node …', what: 'Stack traces point at .ts source, not transpiled .js' },
    { cmd: 'PM2 / supervisor / systemd', what: 'Auto-restart, log rotation, env management' },
    { cmd: 'process.on("SIGTERM", drainAndExit)', what: 'Stop accepting, finish in-flight, close DB pool, exit cleanly' },
    { cmd: 'clinic.js / 0x', what: 'Flame graphs without manual sampling' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Bug className="h-4 w-4" /> <h4 className="font-semibold">Debug + production cheats</h4></div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.cmd} className="rounded-lg border border-white/5 bg-bg-soft/40 p-3">
            <pre className="overflow-x-auto font-mono text-xs text-accent-cyan">{it.cmd}</pre>
            <div className="mt-1 text-xs text-ink-dim">{it.what}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MonorepoLayout() {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><BoxesIcon className="h-4 w-4" /> <h4 className="font-semibold">pnpm + Turborepo layout</h4></div>
      <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-6 text-ink-dim">{`my-app/
├── pnpm-workspace.yaml      # packages: ['apps/*', 'packages/*']
├── turbo.json               # cache + pipeline
├── tsconfig.base.json       # shared TS config
├── apps/
│   ├── web/                 # Next.js
│   ├── api/                 # Fastify
│   └── worker/              # background jobs
└── packages/
    ├── ui/                  # shared React components
    ├── db/                  # Drizzle schema + client
    ├── shared/              # types, utils, validators (Zod)
    └── config/              # eslint, tsconfig, prettier presets`}</pre>
      <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3 text-sm"><div className="text-xs uppercase tracking-widest text-emerald-300">Wins</div><ul className="mt-1 text-xs text-ink-dim space-y-0.5"><li>+ Atomic refactor across api + web</li><li>+ Shared types — no published-package version drift</li><li>+ Turbo caches builds — green PR in seconds</li></ul></div>
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-sm"><div className="text-xs uppercase tracking-widest text-amber-300">Costs</div><ul className="mt-1 text-xs text-ink-dim space-y-0.5"><li>− Boundary discipline — easy to cross-import</li><li>− CI must understand the cache</li><li>− IDE can be slow with hundreds of packages</li></ul></div>
      </div>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'You\'re streaming a 50 GB CSV through gunzip → parse → filter → S3. Memory usage?',
    options: ['~50 GB', '~5 GB', '~50 MB', '~64 KB per chunk, regardless of file size'],
    answer: 3,
    explain: 'That\'s the point of streams. Backpressure keeps each stage\'s buffer small (default ~16 KB).',
  },
  {
    q: 'Heavy CPU work is starving your HTTP handlers. Best move?',
    options: [
      'Add more setTimeouts.',
      'Use child_process for everything.',
      'Move the CPU work to a worker_thread (or pool).',
      'Increase --max-old-space-size.',
    ],
    answer: 2,
    explain: 'Workers run JS on a separate thread, freeing the main loop for I/O. Cluster duplicates entire processes; child_process is for non-JS binaries.',
  },
  {
    q: 'You set <code>"react": "^18.2.0"</code> in package.json. Which versions can install?',
    options: ['Exactly 18.2.0', '18.2.0 – 18.2.x', '18.2.0 – 18.x.x (any minor or patch ≥ 18.2.0)', '18.2.0 – 19.x.x'],
    answer: 2,
    explain: 'Caret allows minor and patch upgrades up to but not including the next major.',
  },
  {
    q: 'In ESM, how do you get __dirname?',
    options: [
      'It\'s available globally.',
      'import { __dirname } from "node:path"',
      'fileURLToPath(import.meta.url) + path.dirname',
      'process.cwd()',
    ],
    answer: 2,
    explain: 'ESM has no __dirname. Use import.meta.url + node:url\'s fileURLToPath, then path.dirname.',
  },
  {
    q: 'Best modern default for a new TypeScript HTTP service?',
    options: ['Express + body-parser', 'Fastify or Hono with first-class types', 'Raw node:http', 'NestJS with all decorators'],
    answer: 1,
    explain: 'Fastify and Hono ship with native TS, schema validation, and far better perf than Express. NestJS only when you want heavy convention.',
  },
];
