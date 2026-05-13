import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, GitBranch, Database, Activity, AlertTriangle, Play, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 18;

export default function Layer18() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="goroutines" kicker="18.1" title="Goroutines & Channels (CSP)">
        <TopicCard
          layerId={L}
          index={0}
          title="Don't communicate by sharing memory; share memory by communicating"
          description="Goroutines are cheap (a few KB stack each). Channels are typed pipes. Together they implement Communicating Sequential Processes — concurrency that's easier to reason about than threads + locks."
        >
          <ConcurrencyPatternsPicker />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={260}
          title="Goroutine + channel patterns (pseudo-Go)"
          initial={`// FAN-OUT: many workers reading from one channel
// jobs := make(chan int, 100)
// results := make(chan int, 100)
//
// for w := 0; w < 8; w++ {
//   go func() {
//     for job := range jobs { results <- doWork(job) }
//   }()
// }
//
// for j := 1; j <= 100; j++ { jobs <- j }
// close(jobs)

// FAN-IN: merge multiple channels into one
// func merge(a, b <-chan int) <-chan int {
//   out := make(chan int)
//   go func() { for v := range a { out <- v }; ... ; close(out) }()
//   return out
// }

// PIPELINE: stages connected by channels
// nums := generate()        // chan int
// squared := square(nums)   // chan int
// for v := range squared { fmt.Println(v) }

console.log('Patterns above. Channels are the wire; goroutines are the workers.');`}
        />
      </Section>

      <Section id="context" kicker="18.2" title="context.Context — propagate cancellation everywhere">
        <TopicCard
          layerId={L}
          index={1}
          title="The first parameter, always"
          description="context.Context is how you propagate deadlines, cancellation, and request-scoped values through a call chain. The convention: first parameter, named ctx, never store in a struct."
        >
          <ContextChain />
        </TopicCard>
      </Section>

      <Section id="errors" kicker="18.3" title="Error handling — wrap, inspect, return">
        <TopicCard
          layerId={L}
          index={2}
          title="Errors are values, not exceptions"
          description="No try/catch. Errors are returned and checked. Wrap with %w to keep the chain inspectable; sentinel errors and typed errors give callers something to switch on."
        >
          <ErrorPatterns />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={260}
          title="Error wrapping & inspection (pseudo-Go)"
          initial={`// Define typed sentinels
// var ErrNotFound = errors.New("not found")
// var ErrConflict = errors.New("conflict")

// Wrap with %w to preserve chain
// func GetUser(ctx context.Context, id string) (*User, error) {
//   row, err := db.QueryRow(ctx, "SELECT ... WHERE id = $1", id)
//   if err == sql.ErrNoRows {
//     return nil, fmt.Errorf("get user %s: %w", id, ErrNotFound)
//   }
//   if err != nil {
//     return nil, fmt.Errorf("get user %s: %w", id, err)
//   }
//   return user, nil
// }

// Inspect at the boundary
// user, err := GetUser(ctx, id)
// switch {
//   case errors.Is(err, ErrNotFound): w.WriteHeader(404)
//   case errors.Is(err, ErrConflict): w.WriteHeader(409)
//   case err != nil:                  w.WriteHeader(500); log.Error(err)
//   default:                          json.NewEncoder(w).Encode(user)
// }

console.log('Wrapping = context. Sentinels = matchable. Typed errors = structured.');`}
        />
      </Section>

      <Section id="interfaces" kicker="18.4" title="Interfaces — small, implicit, accepted">
        <TopicCard
          layerId={L}
          index={3}
          title="Accept interfaces, return structs"
          description="Go interfaces are satisfied implicitly — no `implements` keyword. Define them where they're consumed, not where they're implemented. Smaller is better; <code>io.Reader</code> is one method and is everywhere."
        >
          <InterfaceDemo />
        </TopicCard>
      </Section>

      <Section id="generics" kicker="18.5" title="Generics (when they pay off)">
        <TopicCard
          layerId={L}
          index={4}
          title="Type parameters since Go 1.18"
          description="Don't generic-ify everything. Use type parameters when you'd otherwise reach for `interface{}` and lose type safety: collections, slices/maps utilities, generic algorithms."
        >
          <CodePlayground
            mode="js"
            height={220}
            title="When generics help (pseudo-Go)"
            initial={`// Map over a slice — used to need interface{} + reflect
// func Map[T, U any](s []T, f func(T) U) []U {
//   out := make([]U, len(s))
//   for i, v := range s { out[i] = f(v) }
//   return out
// }

// Constraints (built-in: any, comparable; or custom)
// type Number interface { ~int | ~int64 | ~float64 }
// func Sum[T Number](s []T) T {
//   var total T
//   for _, v := range s { total += v }
//   return total
// }

// Use sparingly. If a function is only useful for one type → don't generic-ify.

console.log('Generics: collections + algorithms. Skip for app code that has one type.');`}
          />
        </TopicCard>
      </Section>

      <Section id="layout" kicker="18.6" title="Project layout">
        <TopicCard
          layerId={L}
          index={5}
          title="The unofficial standard most teams converge on"
          description="Go has no enforced layout, but `cmd/`, `internal/`, `pkg/` is the convention. `internal/` is enforced by the compiler — packages there can't be imported externally."
        >
          <ProjectLayout />
        </TopicCard>
      </Section>

      <Section id="testing" kicker="18.7" title="Testing — table-driven, parallel, race">
        <TopicCard
          layerId={L}
          index={6}
          title="The stdlib testing package is enough"
          description="`go test` is built in. Table tests cover many cases concisely. `t.Parallel()` runs them concurrently. `-race` finds data races. `httptest` mocks HTTP without spinning real servers."
        >
          <CodePlayground
            mode="js"
            height={260}
            title="Table-driven test (pseudo-Go)"
            initial={`// func TestParseDuration(t *testing.T) {
//   cases := []struct {
//     name string
//     in   string
//     want time.Duration
//     err  error
//   }{
//     {"seconds",  "30s",  30 * time.Second, nil},
//     {"minutes",  "5m",   5 * time.Minute,  nil},
//     {"empty",    "",     0,                ErrEmpty},
//     {"invalid",  "abc",  0,                ErrInvalidUnit},
//   }
//   for _, tc := range cases {
//     t.Run(tc.name, func(t *testing.T) {
//       t.Parallel()
//       got, err := ParseDuration(tc.in)
//       if !errors.Is(err, tc.err) { t.Fatalf("err: got %v, want %v", err, tc.err) }
//       if got != tc.want { t.Errorf("got %v, want %v", got, tc.want) }
//     })
//   }
// }
//
// go test -race -run TestParseDuration ./...

console.log('Add cases as new lines. Each runs in parallel with -parallel N.');`}
          />
          <RaceDetectorDemo />
        </TopicCard>
      </Section>

      <Section id="http" kicker="18.8" title="HTTP frameworks">
        <TopicCard
          layerId={L}
          index={7}
          title="net/http stdlib · chi · gin · echo · fiber"
          description="The stdlib is great after Go 1.22 (ServeMux gained method+path matching). Reach for chi when you want middleware ergonomics. Gin/Echo are speed-focused. Fiber is fasthttp-based — different perf model."
        >
          <HttpFrameworkMatrix />
        </TopicCard>
      </Section>

      <Section id="db" kicker="18.9" title="Database access — sqlc wins">
        <TopicCard
          layerId={L}
          index={8}
          title="Write SQL → get type-safe Go code generated"
          description="sqlc reads your migrations + .sql query files and emits Go functions with typed params and result structs. Best of both worlds: real SQL + compile-time safety."
        >
          <SqlcWorkflow />
        </TopicCard>
      </Section>

      <Section id="profile" kicker="18.10" title="Profiling — pprof, trace, race">
        <TopicCard
          layerId={L}
          index={9}
          title="Built-in tools beat any APM for diagnosis"
          description="net/http/pprof gives you live CPU, heap, goroutine, block, mutex profiles via HTTP. `go tool trace` visualises scheduler events. `go test -race` finds data races."
        >
          <PprofGuide />
        </TopicCard>
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 18 Quiz">
        <Quiz id="L18" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-sky-500/10 via-bg-card to-blue-600/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-sky-500 to-blue-600 text-white">L18</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Go in Practice</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Boring code that runs forever</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Goroutines and channels. Context propagation. Errors as values. Small interfaces. sqlc for SQL. pprof for
          everything else. The Go discipline that produces services that don't surprise you at 2am.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Hexagon className="h-4 w-4 text-sky-400" />
          10 topics · 8 visualizers · 4 playgrounds · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function ConcurrencyPatternsPicker() {
  const [pick, setPick] = useState<'fanout' | 'fanin' | 'pipeline' | 'pool'>('fanout');
  const data = {
    fanout: {
      name: 'Fan-out',
      desc: 'One producer, many consumers. Distribute work across N workers.',
      use: 'CPU-bound batch processing, image resize, hash compute.',
      diagram: 'producer → [W1, W2, W3, W4] → results',
    },
    fanin: {
      name: 'Fan-in',
      desc: 'Many producers → one consumer. Merge multiple channels into one.',
      use: 'Aggregating events from multiple sources (Kafka partitions, watchers).',
      diagram: '[A, B, C] → merge → consumer',
    },
    pipeline: {
      name: 'Pipeline',
      desc: 'Stages connected by channels. Each stage transforms and forwards.',
      use: 'Data processing — read → parse → enrich → write.',
      diagram: 'src → parse → enrich → sink',
    },
    pool: {
      name: 'Worker pool',
      desc: 'Bounded set of workers reading from a job queue. Limits concurrency.',
      use: 'When unbounded goroutines would exhaust a downstream resource (DB pool).',
      diagram: 'jobs → [bounded pool of N] → done',
    },
  };
  const cur = data[pick];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Concurrency pattern picker</h4>
      <div className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(data) as Array<keyof typeof data>).map((k) => (
          <button key={k} onClick={() => setPick(k)} className={cn('rounded-md border px-3 py-1.5 text-xs', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
            {data[k].name}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
        <div className="text-base font-semibold">{cur.name}</div>
        <p className="mt-1 text-sm text-ink-dim">{cur.desc}</p>
        <p className="mt-2 text-xs text-ink-faint"><strong className="text-ink-dim">When:</strong> {cur.use}</p>
        <pre className="mt-3 rounded-lg border border-white/5 bg-black/40 p-3 text-center font-mono text-xs text-accent-cyan">{cur.diagram}</pre>
      </div>
    </Card>
  );
}

function ContextChain() {
  const layers = [
    { name: 'HTTP handler', detail: 'ctx := r.Context() — request-scoped, cancelled when client disconnects' },
    { name: 'Service layer', detail: 'ctx, cancel := context.WithTimeout(ctx, 2 * time.Second); defer cancel()' },
    { name: 'Repository', detail: 'db.QueryContext(ctx, "SELECT ...") — DB cancels query if ctx times out' },
    { name: 'External call', detail: 'http.NewRequestWithContext(ctx, ...) — propagates the same deadline' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">context.Context propagation</h4>
      <div className="space-y-1">
        {layers.map((l, i) => (
          <div key={l.name} className="rounded-lg border border-white/5 bg-bg-soft/40 px-3 py-2 text-sm" style={{ marginLeft: `${i * 14}px` }}>
            <span className="font-mono text-xs text-accent-cyan">↓ {l.name}</span>
            <pre className="mt-1 font-mono text-[11.5px] text-ink-dim">{l.detail}</pre>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-3">
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3 text-xs"><div className="text-xs uppercase tracking-widest text-emerald-300">Do</div><ul className="mt-1 space-y-0.5 text-ink-dim"><li>• <InlineCode>ctx</InlineCode> as first param</li><li>• Always check <InlineCode>ctx.Done()</InlineCode> in long loops</li><li>• <InlineCode>defer cancel()</InlineCode> after WithTimeout</li></ul></div>
        <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-3 text-xs"><div className="text-xs uppercase tracking-widest text-rose-300">Don't</div><ul className="mt-1 space-y-0.5 text-ink-dim"><li>• Store ctx in a struct field</li><li>• Pass <InlineCode>nil</InlineCode> — use <InlineCode>context.TODO()</InlineCode> if unsure</li><li>• Stuff arbitrary data into ctx values</li></ul></div>
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-xs"><div className="text-xs uppercase tracking-widest text-amber-300">When ctx is cancelled</div><ul className="mt-1 space-y-0.5 text-ink-dim"><li>• <InlineCode>ctx.Err() != nil</InlineCode></li><li>• DB queries return immediately</li><li>• <InlineCode>http.Request</InlineCode> is aborted</li></ul></div>
      </div>
    </Card>
  );
}

function ErrorPatterns() {
  const items = [
    { tag: 'Sentinel', code: 'var ErrNotFound = errors.New("not found")', use: 'Caller switches on identity: errors.Is(err, ErrNotFound)' },
    { tag: 'Wrap with %w', code: 'fmt.Errorf("get user %s: %w", id, err)', use: 'Adds context AND keeps the chain inspectable' },
    { tag: 'Typed error', code: 'type ValidationError struct { Field, Msg string }', use: 'Carries structured fields; check with errors.As' },
    { tag: 'Multi-error', code: 'errors.Join(err1, err2, err3)', use: 'Combine multiple failures (Go 1.20+)' },
    { tag: 'errors.Is', code: 'if errors.Is(err, context.Canceled) { ... }', use: 'Walks the wrap chain looking for a sentinel' },
    { tag: 'errors.As', code: 'var ve *ValidationError; if errors.As(err, &ve) { ... }', use: 'Walks chain looking for a typed error' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Error patterns reference</h4>
      <div className="grid grid-cols-1 gap-2">
        {items.map((it) => (
          <div key={it.tag} className="rounded-lg border border-white/5 bg-bg-soft/40 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-accent-cyan">{it.tag}</span>
              <span className="text-[10px] text-ink-faint">{it.use}</span>
            </div>
            <pre className="mt-1 font-mono text-[12px] text-ink-dim">{it.code}</pre>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Rule: every error gets context as you bubble up. Don't <InlineCode>return err</InlineCode> bare from N layers — wrap once per layer with what you knew.
      </p>
    </Card>
  );
}

function InterfaceDemo() {
  return (
    <Card>
      <h4 className="mb-3 font-semibold">"Accept interfaces, return structs"</h4>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-rose-300">Less Go-like</div>
          <pre className="overflow-x-auto rounded-xl border border-rose-400/30 bg-rose-400/5 p-3 font-mono text-[12px] leading-5 text-ink-dim">{`// Interface defined where implemented;
// fat interface; concrete return.

package storage

type UserStorage interface {
  Get(id string) (User, error)
  Put(u User) error
  Delete(id string) error
  List() ([]User, error)
  // ... 12 more methods
}

func NewPostgres() UserStorage { ... }`}</pre>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-emerald-300">Idiomatic Go</div>
          <pre className="overflow-x-auto rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3 font-mono text-[12px] leading-5 text-ink-dim">{`// Interface declared by the consumer,
// only the methods THIS function needs.

package billing

type userGetter interface {
  GetUser(ctx context.Context, id string) (User, error)
}

func ChargeUser(ctx context.Context,
  ug userGetter, amount int) error { ... }

// storage package returns concrete *PgStorage —
// callers wrap it with whatever interface they need.`}</pre>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Small interfaces near the consumer are testable, decoupled, and never grow. Big interfaces near the implementation tightly couple everyone to one shape.</p>
    </Card>
  );
}

function ProjectLayout() {
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Conventional Go project layout</h4>
      <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-6 text-ink-dim">{`my-service/
├── go.mod                           # module name + deps
├── go.sum                           # checksums (commit it)
├── cmd/
│   ├── server/main.go               # entry: HTTP API
│   └── worker/main.go               # entry: background jobs
├── internal/                        # compiler-enforced private
│   ├── domain/                      # entities, value objects (no deps)
│   ├── usecase/                     # business logic (depends on domain)
│   ├── delivery/
│   │   ├── http/                    # handlers, routes
│   │   └── grpc/                    # gRPC servers
│   ├── repository/                  # data access (sqlc-generated + wrappers)
│   └── pkg/                         # internal shared utils
├── pkg/                             # public, importable by others
│   └── client/                      # Go SDK others can import
├── api/                             # OpenAPI / proto definitions
├── migrations/                      # golang-migrate / sqlc
├── scripts/                         # dev tooling
├── deploy/                          # Dockerfile, k8s manifests, terraform
├── docs/                            # ADRs, runbooks
└── Makefile                         # standard targets: test, lint, build, run`}</pre>
      <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-bg-soft/40 p-3 text-xs"><div className="font-medium">internal/</div><div className="mt-1 text-ink-dim">Compiler refuses imports from outside the module. Use this aggressively — it stops accidental coupling.</div></div>
        <div className="rounded-lg border border-white/5 bg-bg-soft/40 p-3 text-xs"><div className="font-medium">cmd/&lt;binary&gt;/main.go</div><div className="mt-1 text-ink-dim">Each binary gets its own folder. main.go wires dependencies and calls into internal/.</div></div>
      </div>
    </Card>
  );
}

function RaceDetectorDemo() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [found, setFound] = useState(false);

  useEffect(() => {
    if (!running) return;
    setProgress(0);
    setFound(false);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setFound(true);
          setRunning(false);
          return 100;
        }
        return p + 8;
      });
    }, 80);
    return () => clearInterval(id);
  }, [running]);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-300" /> -race detector</h4>
        <button onClick={() => setRunning(true)} className="btn-primary h-8 text-xs"><Play className="h-3 w-3" /> go test -race ./...</button>
      </div>
      <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4 font-mono text-[12px]">
        <div className="text-ink-dim">{'$'} go test -race -run TestCounter ./internal/...</div>
        {progress > 0 && <div className="text-ink-dim">running tests...</div>}
        <div className="mt-1 h-1.5 overflow-hidden rounded bg-white/5">
          <motion.div animate={{ width: `${progress}%` }} className="h-full bg-cyan-400" />
        </div>
        {found && (
          <div className="mt-3 text-rose-300">
            ==================<br />
            WARNING: DATA RACE<br />
            Read at 0x00c0000a8030 by goroutine 7:<br />
            {'  '}main.(*Counter).Value(...)<br />
            {'  '}    counter.go:18<br />
            <br />
            Previous write at 0x00c0000a8030 by goroutine 8:<br />
            {'  '}main.(*Counter).Inc(...)<br />
            {'  '}    counter.go:14<br />
            ==================<br />
            <span className="text-rose-200">FAIL · counter_test.go · -race detected 1 race</span>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-faint">The race detector instruments every memory access. Slow (~10× CPU + 5-10× memory) — run on CI, not in prod.</p>
    </Card>
  );
}

function HttpFrameworkMatrix() {
  const rows = [
    { name: 'net/http (stdlib, 1.22+)', perf: 'high',     middleware: 'manual', notes: '1.22 added method+path patterns; many teams stay here', when: 'Default for new services' },
    { name: 'chi',     perf: 'high',     middleware: 'first-class',  notes: 'Idiomatic, compatible with net/http handlers', when: 'You want middleware ergonomics on stdlib' },
    { name: 'gin',     perf: 'higher',   middleware: 'good',         notes: 'Familiar API, fast, mature', when: 'Bigger apps, want batteries' },
    { name: 'echo',    perf: 'higher',   middleware: 'good',         notes: 'Similar to gin; cleaner API some prefer', when: 'Same as gin, taste' },
    { name: 'fiber',   perf: 'highest',  middleware: 'good',         notes: 'Built on fasthttp — NOT compatible with net/http handlers', when: 'Pure perf, you accept ecosystem trade-off' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">HTTP framework comparator</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Framework</th><th className="px-4 py-2 text-left">Perf</th><th className="px-4 py-2 text-left">Middleware</th><th className="px-4 py-2 text-left">Notes</th><th className="px-4 py-2 text-left">When</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-ink-dim">{r.perf}</td>
                <td className="px-4 py-2 text-ink-dim">{r.middleware}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.notes}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">2026 default for new Go services: <strong className="text-ink">net/http (1.22+)</strong>, with <strong className="text-ink">chi</strong> if you want richer middleware. Skip ORMs you can; <strong className="text-ink">sqlc</strong> + plain SQL beats them all.</p>
    </Card>
  );
}

function SqlcWorkflow() {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Database className="h-4 w-4" /> <h4 className="font-semibold">sqlc workflow — write SQL, get Go</h4></div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-cyan-300">1. queries.sql</div>
          <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[11.5px] leading-5 text-ink-dim">{`-- name: GetUser :one
SELECT id, email, created_at
FROM users
WHERE id = $1;

-- name: ListUsers :many
SELECT id, email
FROM users
WHERE created_at > $1
ORDER BY created_at DESC
LIMIT $2;

-- name: CreateUser :one
INSERT INTO users (email)
VALUES ($1)
RETURNING id, email, created_at;`}</pre>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-amber-300">2. sqlc generate</div>
          <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-3 text-xs text-ink-dim">
            <div>$ sqlc generate</div>
            <div className="mt-1 text-ink-faint">Reads <InlineCode>schema.sql</InlineCode> + <InlineCode>queries.sql</InlineCode>. Generates typed Go.</div>
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-emerald-300">3. generated.go (use it)</div>
          <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[11.5px] leading-5 text-ink-dim">{`q := store.New(db)

u, err := q.GetUser(ctx, "u-42")
if err != nil { return err }

users, err := q.ListUsers(ctx,
  store.ListUsersParams{
    CreatedAt: lastWeek,
    Limit: 50,
  })

new, err := q.CreateUser(ctx, "ada@x.com")`}</pre>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Real SQL (you can EXPLAIN it). Real types (compiler catches bad params). No ORM mystery.</p>
    </Card>
  );
}

function PprofGuide() {
  const items = [
    { kind: 'CPU', path: '/debug/pprof/profile?seconds=30', use: 'Find hot functions; flame graph' },
    { kind: 'Heap', path: '/debug/pprof/heap', use: 'Memory leaks, allocation hotspots' },
    { kind: 'Goroutine', path: '/debug/pprof/goroutine', use: 'Stuck/leaked goroutines' },
    { kind: 'Block', path: '/debug/pprof/block', use: 'Why goroutines are blocking on channels/locks' },
    { kind: 'Mutex', path: '/debug/pprof/mutex', use: 'Lock contention hotspots' },
    { kind: 'Trace', path: '/debug/pprof/trace?seconds=5', use: 'Scheduler events; visualise with go tool trace' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4" /> <h4 className="font-semibold">pprof endpoints</h4></div>
      <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[12px] text-ink-dim">{`import _ "net/http/pprof"   // side-effect: registers handlers
go http.ListenAndServe("localhost:6060", nil)

# Then:
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
(pprof) top
(pprof) list <funcName>
(pprof) web        # opens flame graph in browser`}</pre>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((p) => (
          <div key={p.kind} className="rounded-lg border border-white/5 bg-bg-soft/40 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-accent-cyan">{p.kind}</span>
              <span className="text-[11px] text-ink-faint">{p.path}</span>
            </div>
            <div className="mt-1 text-xs text-ink-dim">{p.use}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">Expose pprof on a private port (not your public API). Or behind auth. Free goroutine + heap insight no APM gives you.</p>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Idiomatic Go advice on interfaces:',
    options: [
      'Define one big interface per module.',
      'Accept interfaces, return structs.',
      'Always use interface{} for flexibility.',
      'Place interfaces in a dedicated /interfaces package.',
    ],
    answer: 1,
    explain: 'Small interfaces declared by the consumer (right where they\'re needed) keep code decoupled.',
  },
  {
    q: 'You wrap an error with `fmt.Errorf("get user %s: %w", id, err)`. What do you gain?',
    options: [
      'A new error with no relation to the original.',
      'Context (the failed operation) PLUS the chain so callers can errors.Is/As.',
      'A logged stack trace.',
      'A panic.',
    ],
    answer: 1,
    explain: '%w preserves the chain. %v / %s would lose it — callers couldn\'t match against sentinels or types.',
  },
  {
    q: 'Why does context.Context propagate as the first argument?',
    options: [
      'Convention only.',
      'It carries cancellation, deadlines, and values down the call chain — every blocking call should respect it.',
      'For logging.',
      'It\'s required by the compiler.',
    ],
    answer: 1,
    explain: 'When a request is cancelled (client disconnects, deadline exceeded), every downstream call needs to bail. Passing ctx makes that automatic.',
  },
  {
    q: 'Best Go DB pattern for typed SQL access?',
    options: [
      'GORM with reflection.',
      'sqlc — write .sql files, generate typed Go.',
      'Plain database/sql with manual scanning.',
      'ent code generator.',
    ],
    answer: 1,
    explain: 'sqlc lets you write real SQL (EXPLAIN-able, optimisable) and generates typed Go. ORMs hide SQL; database/sql is verbose. ent works but generates a lot.',
  },
  {
    q: 'You suspect a goroutine leak. Best tool?',
    options: [
      'go test -race',
      'pprof goroutine profile (/debug/pprof/goroutine?debug=2)',
      'go vet',
      'Add print statements',
    ],
    answer: 1,
    explain: 'Goroutine profile shows all live goroutines and their stack traces. Easy to spot ones piling up at the same line.',
  },
];
