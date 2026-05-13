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
          <NodeEventLoopDiagram />
        </TopicCard>
      </Section>

      <Section id="workers" kicker="16.3" title="Cluster · Worker Threads · Child Process">
        <TopicCard
          layerId={L}
          index={2}
          title="Three ways to escape single-threaded JS"
          description="Use worker_threads for CPU-bound JS. Use cluster for HTTP scaling on multi-core. Use child_process for shelling out or running other binaries."
        >
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
              <>Subscribe to <InlineCode>process.on('unhandledRejection')</InlineCode> and <InlineCode>uncaughtException</InlineCode> — log + exit, don't continue.</>,
              <>Wrap Express handlers: <InlineCode>{'app.get("/x", (req, res, next) => fn(req).catch(next))'}</InlineCode> — or use express-async-handler.</>,
              <>Use <InlineCode>{'AggregateError'}</InlineCode> for parallel failures (<InlineCode>{'Promise.allSettled'}</InlineCode>).</>,
              <>Custom error classes carry HTTP status: <InlineCode>{'class HttpError extends Error { status: number }'}</InlineCode>.</>,
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
