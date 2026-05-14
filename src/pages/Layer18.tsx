import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, GitBranch, Database, Activity, AlertTriangle, Play, RotateCcw } from 'lucide-react';
import { Section, TopicCard, InlineCode, Card, Stat, Steps, Compare } from '../components/UI';
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
          description="Goroutines are cheap (a few KB stack each, grown on demand). Channels are typed pipes. Together they implement Communicating Sequential Processes — concurrency that's easier to reason about than threads + locks."
        />
        <ConcurrencyPatternsPicker />
        <Card>
          <h4 className="mb-2 font-semibold">Every goroutine needs a known exit</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            The launcher owns the lifetime — pass a <InlineCode>ctx</InlineCode>, <InlineCode>close</InlineCode> the jobs channel, or
            join with <InlineCode>sync.WaitGroup</InlineCode> / <InlineCode>errgroup</InlineCode>. A goroutine blocked forever on a
            channel nobody closes isn't an error you see — it's a slow memory leak the goroutine profile catches.
          </p>
        </Card>
        <Card>
          <h4 className="mb-2 font-semibold">The sender closes — never the receiver, never twice</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Closing a closed channel panics; sending on a closed channel panics — so the <em>sender</em> closes, exactly once.{' '}
            <InlineCode>range</InlineCode> over a channel ends when it's closed — that's the clean shutdown signal for a pipeline
            stage.
          </p>
        </Card>
        <Compare
          items={[
            {
              label: 'Unbuffered channel',
              tone: 'a',
              body: (
                <>
                  A synchronization point: the send blocks until a receiver is ready — a direct handoff. Use it when you want the
                  producer to feel backpressure the instant the consumer falls behind.
                </>
              ),
            },
            {
              label: 'Buffered channel',
              tone: 'warn',
              body: (
                <>
                  A queue with a fixed bound. A large buffer doesn't fix a race — it just delays it and hides the backpressure you
                  needed to feel. Size the buffer to a real reason (smoothing a known burst), not to make a deadlock go away.
                </>
              ),
            },
          ]}
        />
        <Compare
          items={[
            {
              label: 'Channel — pass ownership of work',
              tone: 'c',
              body: (
                <>
                  Reach for a channel when you're passing ownership of a <em>flow of work</em> — jobs to workers, results back, a
                  pipeline stage feeding the next. The channel <em>is</em> the synchronization; nobody else touches the value once
                  it's sent.
                </>
              ),
            },
            {
              label: 'Mutex — guard shared state',
              tone: 'b',
              body: (
                <>
                  Reach for a mutex only when the shared thing is genuinely shared <em>state</em> — a counter, an in-memory cache.
                  Wrong tool either way: a mutex around a work queue, or a channel used as a lock.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Pick the concurrency pattern deliberately</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            <strong>Fan-out</strong> — one producer, N workers: CPU-bound batch. <strong>Fan-in</strong> — merge N channels into one:
            aggregating sources. <strong>Pipeline</strong> — stages joined by channels: read→parse→enrich→write.{' '}
            <strong>Worker pool</strong> — bounded workers on a job queue, when unbounded goroutines would exhaust a downstream
            resource like the DB pool. (The picker above walks each one.)
          </p>
        </Card>
        <Card>
          <h4 className="mb-3 font-semibold">Goroutine leaks worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Leaked on a blocked send</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A goroutine does <InlineCode>results &lt;- v</InlineCode> on an unbuffered channel, but the caller already returned (timeout, early error) and nobody will ever receive. The goroutine is parked forever — its stack, its closure captures, never freed. Classic on a request that times out while a fan-out is still running.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: <InlineCode>select &#123; case results &lt;- v: case &lt;-ctx.Done(): return &#125;</InlineCode> — the send becomes cancellable.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Leaked on a never-closed channel</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A pipeline stage does <InlineCode>for v := range in</InlineCode>, but the producer hits an error and returns without <InlineCode>close(in)</InlineCode>. The stage blocks on <InlineCode>range</InlineCode> forever. The symptom: goroutine count climbs flat-line under load and never comes down.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: <InlineCode>defer close(out)</InlineCode> in the producer so <em>every</em> exit path — success or error — closes the channel.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Both are invisible until <InlineCode>/debug/pprof/goroutine?debug=2</InlineCode> shows hundreds of goroutines stuck on the same line. The bound on concurrency is also the bound on the blast radius — that's why the worker pool exists.
          </p>
        </Card>
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
        />
        <ContextChain />
        <Steps
          steps={[
            { label: 'ctx, cancel := WithTimeout(ctx, 2s)' },
            { label: 'forget defer cancel()' },
            { label: 'function returns on the happy path' },
            { label: 'timer goroutine lives until the deadline fires', tone: 'fail' },
          ]}
          caption={
            <>
              <InlineCode>context.WithTimeout</InlineCode> / <InlineCode>WithCancel</InlineCode> return a <InlineCode>cancel</InlineCode>{' '}
              func — <InlineCode>defer cancel()</InlineCode> <strong>immediately</strong>, on every path including success. Skipping it
              leaks the timer goroutine until the deadline fires; <InlineCode>go vet</InlineCode> flags the lost cancel for exactly
              this reason.
            </>
          }
        />
        <Steps
          steps={[
            { label: 'client disconnects, ctx cancelled' },
            { label: 'handler threads ctx down', tone: 'ok' },
            { label: 'a middle function ignores its ctx' },
            { label: 'everything below keeps running after the client hung up', tone: 'fail' },
          ]}
          caption={
            <>
              Cancellation only propagates if you <em>thread</em> <InlineCode>ctx</InlineCode> through. Every blocking call must take it
              — <InlineCode>db.QueryContext</InlineCode>, <InlineCode>http.NewRequestWithContext</InlineCode>,{' '}
              <InlineCode>select &#123; case &lt;-ctx.Done(): &#125;</InlineCode> in a long loop. A function that ignores its{' '}
              <InlineCode>ctx</InlineCode> is a cancellation dead-end.
            </>
          }
        />
        <Card>
          <h4 className="mb-2 font-semibold">Never store a Context in a struct field</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            It's request-scoped; a struct outlives the request. The one <InlineCode>ctx</InlineCode> pinned in a long-lived struct
            ends up shared across requests — a cancelled one aborts unrelated work, a live one never frees. Pass it as the first
            argument every call, don't stash it.
          </p>
        </Card>
        <Card>
          <h4 className="mb-2 font-semibold">nil, TODO(), and ctx.Value</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Never pass <InlineCode>nil</InlineCode> — use <InlineCode>context.TODO()</InlineCode> when you genuinely don't have one
            yet. <InlineCode>ctx.Value</InlineCode> is for request-scoped values (trace ID, auth subject), not a back door for normal
            arguments — it's untyped and invisible to the compiler.
          </p>
        </Card>
        <Compare
          items={[
            {
              label: 'DeadlineExceeded → 504',
              tone: 'warn',
              body: (
                <>
                  The timeout fired — the work genuinely ran out of time. <InlineCode>ctx.Err()</InlineCode> returns{' '}
                  <InlineCode>context.DeadlineExceeded</InlineCode>; in-flight DB queries return immediately. Surface it as a 504 and
                  log it — something downstream is too slow.
                </>
              ),
            },
            {
              label: 'Canceled → usually not an error',
              tone: 'a',
              body: (
                <>
                  The client hung up. <InlineCode>ctx.Err()</InlineCode> returns <InlineCode>context.Canceled</InlineCode>, the{' '}
                  <InlineCode>http.Request</InlineCode> aborts. Distinguish it at the boundary — a client cancel usually isn't worth
                  logging as an error at all, just stop work and move on.
                </>
              ),
            },
          ]}
        />
      </Section>

      <Section id="errors" kicker="18.3" title="Error handling — wrap, inspect, return">
        <TopicCard
          layerId={L}
          index={2}
          title="Errors are values, not exceptions"
          description="No try/catch. Errors are returned and checked. Wrap with %w to keep the chain inspectable; sentinel errors and typed errors give callers something to switch on."
        />
        <ErrorPatterns />
        <Steps
          steps={[
            { label: 'inner layer returns ErrNotFound' },
            { label: 'middle layer wraps with %v instead of %w' },
            { label: 'chain flattened to a plain string' },
            { label: 'handler errors.Is(err, ErrNotFound) silently returns false', tone: 'fail' },
          ]}
          caption={
            <>
              <strong>Wrap with <InlineCode>%w</InlineCode>, once per layer</strong>, with what you knew there:{' '}
              <InlineCode>fmt.Errorf("get user %s: %w", id, err)</InlineCode>. <InlineCode>%w</InlineCode> keeps the chain
              inspectable; <InlineCode>%v</InlineCode>/<InlineCode>%s</InlineCode> flatten it to a string. The failure is invisible —
              the code compiles, the message looks fine, the match just stops working.
            </>
          }
        />
        <Compare
          items={[
            {
              label: 'Sentinel error',
              tone: 'a',
              body: (
                <>
                  <InlineCode>var ErrNotFound = errors.New(...)</InlineCode> — for callers that switch on <em>identity</em>. Match
                  with <InlineCode>errors.Is</InlineCode>, which walks the wrap chain looking for that exact value.
                </>
              ),
            },
            {
              label: 'Typed error',
              tone: 'b',
              body: (
                <>
                  <InlineCode>type ValidationError struct&#123;...&#125;</InlineCode> — carries <em>structured fields</em>. Match
                  with <InlineCode>errors.As</InlineCode> and read the fields off the recovered value.
                </>
              ),
            },
            {
              label: 'Joined errors',
              tone: 'c',
              body: (
                <>
                  <InlineCode>errors.Join</InlineCode> (Go 1.20+) combines multiple failures into one — and{' '}
                  <InlineCode>errors.Is</InlineCode>/<InlineCode>As</InlineCode> still match against any branch of the join.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Inspect at the boundary, not the middle</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            The HTTP handler does the{' '}
            <InlineCode>switch &#123; case errors.Is(err, ErrNotFound): 404 ... &#125;</InlineCode>; inner layers just wrap and
            return. An inner layer that branches on a sentinel has reached past its job and coupled itself to a specific failure.
          </p>
        </Card>
        <Card>
          <h4 className="mb-2 font-semibold">Wrap once — not zero times, not five</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Don't <InlineCode>return err</InlineCode> bare through five layers — the final message is a context-free{' '}
            <InlineCode>"sql: no rows"</InlineCode> with no trail of <em>which</em> query for <em>which</em> id. But don't
            double-wrap either: wrap once where you add information, pass through where you don't.
          </p>
        </Card>
        <Card>
          <h4 className="mb-2 font-semibold">panic is for bugs, not control flow</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            <InlineCode>panic</InlineCode> is for programmer bugs and unrecoverable startup failure, never control flow. A handler
            should <InlineCode>recover</InlineCode> at the top so one bad request doesn't take the whole process down — but
            recovering and continuing as if nothing happened just hides the bug.
          </p>
        </Card>
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
        />
        <InterfaceDemo />
        <Compare
          items={[
            {
              label: 'Return the concrete type',
              tone: 'c',
              body: (
                <>
                  A constructor returns <InlineCode>*PgStorage</InlineCode>, not some <InlineCode>Storage</InlineCode> interface —
                  callers wrap it in whatever interface <em>they</em> need. Returning an interface throws away methods the caller
                  might want and pre-decides an abstraction nobody asked for.
                </>
              ),
            },
            {
              label: 'Accept the interface — at the consumer',
              tone: 'a',
              body: (
                <>
                  The <InlineCode>billing</InlineCode> package defines the one-method <InlineCode>userGetter</InlineCode> it uses; the{' '}
                  <InlineCode>storage</InlineCode> package doesn't know <InlineCode>billing</InlineCode> exists. Interface near the
                  implementation = every consumer coupled to one shape, and the import arrow points the wrong way.
                </>
              ),
            },
          ]}
        />
        <Compare
          items={[
            {
              label: 'Small interface — io.Reader',
              tone: 'a',
              body: (
                <>
                  One method, implemented by files, sockets, buffers, gzip. Easy to satisfy, easy to fake — it's everywhere because
                  it asks for almost nothing.
                </>
              ),
            },
            {
              label: '12-method UserStorage — fake abstraction',
              tone: 'fail',
              body: (
                <>
                  Nothing else will ever implement it, and faking it in a test means stubbing 12 methods to exercise one. A big
                  interface near the implementation isn't an abstraction — it's the concrete type with extra ceremony.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Don't pre-declare interfaces "for flexibility"</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Implicit satisfaction means you can add an interface later with zero edits to the implementation. So add one when a
            second implementation or a test fake actually appears — until then it's indirection with no payoff. The interface earns
            its place by being needed, not by being anticipated.
          </p>
        </Card>
        <Steps
          steps={[
            { label: 'func returns *MyError' },
            { label: 'on success it returns a nil *MyError' },
            { label: 'caller assigns it to an error variable' },
            { label: 'err != nil is true — the interface holds a type', tone: 'fail' },
          ]}
          caption={
            <>
              The <strong>typed-nil trap</strong>: a <InlineCode>nil *MyError</InlineCode> stored in an <InlineCode>error</InlineCode>{' '}
              interface is <em>not</em> <InlineCode>== nil</InlineCode> — the interface holds a (type, value) pair and the type is
              non-nil. Return the bare <InlineCode>error</InlineCode> type, never a concrete error pointer that might be nil.
            </>
          }
        />
      </Section>

      <Section id="generics" kicker="18.5" title="Generics (when they pay off)">
        <TopicCard
          layerId={L}
          index={4}
          title="Type parameters since Go 1.18"
          description="Don't generic-ify everything. Use type parameters when you'd otherwise reach for `interface{}` and lose type safety: collections, slices/maps utilities, generic algorithms."
        />
        <Compare
          items={[
            {
              label: 'Use generics — library / utility code',
              tone: 'c',
              body: (
                <>
                  Reach for generics when the alternative is <InlineCode>interface&#123;&#125;</InlineCode> + a type assertion or
                  reflection — generic containers, slice/map utilities (<InlineCode>Map</InlineCode>, <InlineCode>Filter</InlineCode>,{' '}
                  <InlineCode>Keys</InlineCode>), generic algorithms. There the type parameter buys real compile-time safety the
                  empty interface threw away.
                </>
              ),
            },
            {
              label: "Don't — app / service code",
              tone: 'fail',
              body: (
                <>
                  If a function only ever serves one concrete type — a handler, a use-case — a type parameter adds noise and zero
                  safety. Generics earn their place in library/utility code, not in the service layer.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Constraints — and the ~ operator</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            <InlineCode>any</InlineCode> and <InlineCode>comparable</InlineCode> are built in; define custom ones (
            <InlineCode>type Number interface &#123; ~int | ~float64 &#125;</InlineCode>) for a set of underlying types. The{' '}
            <InlineCode>~</InlineCode> means "any type whose underlying type is this" — so a <InlineCode>type Celsius float64</InlineCode>{' '}
            still satisfies it.
          </p>
        </Card>
        <Card>
          <h4 className="mb-2 font-semibold">A type parameter is not an interface value</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            You can't switch on the concrete type inside the generic function — only use what the constraint guarantees. When you
            actually need per-type behaviour, that's an interface's job, not generics'.
          </p>
        </Card>
        <Card>
          <h4 className="mb-2 font-semibold">Methods can't have type parameters</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Only functions and types can — method sets cannot. A common wall: you want a generic <em>method</em> on a non-generic
            type and the compiler says no. The fix is usually a package-level generic function taking the receiver as an argument.
          </p>
        </Card>
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
      </Section>

      <Section id="layout" kicker="18.6" title="Project layout">
        <TopicCard
          layerId={L}
          index={5}
          title="The unofficial standard most teams converge on"
          description="Go has no enforced layout, but `cmd/`, `internal/`, `pkg/` is the convention. `internal/` is enforced by the compiler — packages there can't be imported externally."
        />
        <ProjectLayout />
        <Compare
          items={[
            {
              label: 'cmd/<binary>/main.go',
              tone: 'a',
              body: (
                <>
                  One folder per binary. <InlineCode>main</InlineCode> only wires dependencies — open DB, build router, read config —
                  and calls into <InlineCode>internal/</InlineCode>. Logic in <InlineCode>main</InlineCode> is logic you can't test
                  and can't reuse from a second binary.
                </>
              ),
            },
            {
              label: 'internal/ — compiler-enforced privacy',
              tone: 'c',
              body: (
                <>
                  Packages under it cannot be imported from outside the module — the compiler refuses. Use it aggressively: it stops
                  accidental coupling before code review can, and it's free. The default home for a package is{' '}
                  <InlineCode>internal/</InlineCode>; moving it out is a deliberate decision.
                </>
              ),
            },
            {
              label: 'pkg/ — only what others import',
              tone: 'warn',
              body: (
                <>
                  <em>Only</em> for code you genuinely want others to import — a client SDK, a stable shared library. If nothing
                  external imports it, it belongs in <InlineCode>internal/</InlineCode>. A <InlineCode>pkg/</InlineCode> full of
                  internal helpers is just <InlineCode>internal/</InlineCode> with the guard rail removed.
                </>
              ),
            },
          ]}
        />
        <Steps
          steps={[
            { label: 'domain (no deps)' },
            { label: 'usecase imports domain' },
            { label: 'delivery / repository import usecase' },
            { label: 'domain imports repository → import cycle, build fails', tone: 'fail' },
          ]}
          caption={
            <>
              <strong>Layer packages by dependency direction</strong> — imports point inward. The day <InlineCode>domain</InlineCode>{' '}
              imports <InlineCode>repository</InlineCode> you have a cycle, and Go refuses to compile import cycles — that constraint
              is doing you a favour, catching a layering mistake at build time.
            </>
          }
        />
        <Card>
          <h4 className="mb-2 font-semibold">go.sum, package naming, no utils grab-bag</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Commit <InlineCode>go.sum</InlineCode> — it's the checksum lockfile, not a generated artifact. Package name = directory
            name; one package per directory. Avoid a <InlineCode>utils</InlineCode> grab-bag — it becomes a dependency magnet
            everything imports, and it never has a coherent reason to change.
          </p>
        </Card>
      </Section>

      <Section id="testing" kicker="18.7" title="Testing — table-driven, parallel, race">
        <TopicCard
          layerId={L}
          index={6}
          title="The stdlib testing package is enough"
          description="`go test` is built in. Table tests cover many cases concisely. `t.Parallel()` runs them concurrently. `-race` finds data races. `httptest` mocks HTTP without spinning real servers."
        />
        <Card>
          <h4 className="mb-2 font-semibold">Table-driven is the default</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            A slice of <InlineCode>&#123;name, in, want, err&#125;</InlineCode> cases, <InlineCode>t.Run(tc.name, ...)</InlineCode> per
            case. Adding a case is one line; a failure names the exact case. Match the error with{' '}
            <InlineCode>errors.Is(err, tc.err)</InlineCode>, not <InlineCode>==</InlineCode> — wrapped errors won't compare equal.
          </p>
        </Card>
        <Steps
          steps={[
            { label: 'pre-1.22: range loop, t.Parallel() in each subtest' },
            { label: 'subtests don’t run until the loop finishes' },
            { label: 'tc captured by reference, now points at the last case' },
            { label: 'every parallel subtest tests the same case', tone: 'fail' },
          ]}
          caption={
            <>
              <InlineCode>t.Parallel()</InlineCode> inside the subtest runs cases concurrently — and combined with{' '}
              <InlineCode>-race</InlineCode> it surfaces shared-state bugs a serial run would never hit. Cost: in pre-1.22 Go the
              loop variable is shared, so capture <InlineCode>tc</InlineCode> per iteration (<InlineCode>tc := tc</InlineCode>) or
              every parallel subtest sees the last case. Go 1.22+ fixed the loop variable, so the trap is gone on new toolchains.
            </>
          }
        />
        <Card>
          <h4 className="mb-2 font-semibold">go test -race — a found race is a real bug</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            It instruments every memory access and reports a race with <em>both</em> stacks — the read and the conflicting write.
            It's ~10× CPU and 5–10× memory, so run it in CI, not prod. A race the detector finds is a real bug <em>even if the test
            passed</em> — passing just means the unlucky interleaving didn't happen this run.
          </p>
        </Card>
        <Compare
          items={[
            {
              label: 'httptest.NewServer — test a client',
              tone: 'a',
              body: (
                <>
                  A real loopback server on a random port. Point your HTTP client at its URL to exercise the client end against real
                  network behaviour.
                </>
              ),
            },
            {
              label: 'httptest.NewRecorder — test a handler',
              tone: 'c',
              body: (
                <>
                  A <InlineCode>ResponseRecorder</InlineCode> + a hand-built <InlineCode>*http.Request</InlineCode> tests a handler
                  with no network at all. Call the handler func directly — don't stand up the whole router to check one route.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Stdlib testing is enough</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            <InlineCode>go test</InlineCode> ships with the toolchain. Add <InlineCode>testify</InlineCode> for assertion ergonomics
            if the team wants it, but it's a convenience, not a requirement. Keep fakes small — that's the payoff of the small
            consumer-side interface from 18.4.
          </p>
        </Card>
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
      </Section>

      <Section id="http" kicker="18.8" title="HTTP frameworks">
        <TopicCard
          layerId={L}
          index={7}
          title="net/http stdlib · chi · gin · echo · fiber"
          description="The stdlib is great after Go 1.22 (ServeMux gained method+path matching). Reach for chi when you want middleware ergonomics. Gin/Echo are speed-focused. Fiber is fasthttp-based — different perf model."
        />
        <HttpFrameworkMatrix />
        <Compare
          items={[
            {
              label: 'net/http (1.22+) — the default',
              tone: 'a',
              body: (
                <>
                  Go 1.22 removed the main reason to reach for a router: <InlineCode>ServeMux</InlineCode> gained method + path-pattern
                  matching — <InlineCode>mux.HandleFunc("GET /users/&#123;id&#125;", ...)</InlineCode> with{' '}
                  <InlineCode>r.PathValue("id")</InlineCode>. For most new services in 2026, stdlib routing is enough; don't adopt a
                  framework for routing alone anymore.
                </>
              ),
            },
            {
              label: 'chi — net/http compatible',
              tone: 'c',
              body: (
                <>
                  Stays compatible with <InlineCode>net/http</InlineCode> — its handlers are <InlineCode>http.Handler</InlineCode>, its
                  middleware is <InlineCode>func(http.Handler) http.Handler</InlineCode>. Adopting it is a small step, not a lock-in,
                  and you keep the whole stdlib middleware ecosystem. Reach for it when middleware ergonomics (groups, sub-routers)
                  actually matter.
                </>
              ),
            },
            {
              label: 'gin / echo — batteries, soft lock-in',
              tone: 'warn',
              body: (
                <>
                  Speed-focused with batteries included (binding, validation, render helpers). Fine for bigger apps; the choice
                  between them is mostly taste. Their handler signature is custom, so middleware is framework-specific — a soft
                  lock-in, not a hard one.
                </>
              ),
            },
            {
              label: 'fiber — fasthttp, hard trade-off',
              tone: 'fail',
              body: (
                <>
                  Built on <InlineCode>fasthttp</InlineCode>, not <InlineCode>net/http</InlineCode> — that's the headline. It's the
                  fastest, but its <InlineCode>*fiber.Ctx</InlineCode> is not an <InlineCode>http.ResponseWriter</InlineCode>/
                  <InlineCode>*http.Request</InlineCode>, so <em>no</em> stdlib middleware, no <InlineCode>httptest</InlineCode>, and
                  fasthttp has known edge-case quirks with streaming and HTTP semantics. Only worth it for pure-perf cases where you
                  accept that whole trade-off.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Where L18 stops and L5 starts</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Routing is L18's concern; the request-handling <em>design</em> — auth, rate limiting, caching, idempotency — is
            framework-agnostic and lives in L5. Pick the router here, build the middleware behaviour there.
          </p>
        </Card>
      </Section>

      <Section id="db" kicker="18.9" title="Database access — sqlc wins">
        <TopicCard
          layerId={L}
          index={8}
          title="Write SQL → get type-safe Go code generated"
          description="sqlc reads your migrations + .sql query files and emits Go functions with typed params and result structs. Best of both worlds: real SQL + compile-time safety."
        />
        <SqlcWorkflow />
        <Compare
          items={[
            {
              label: 'ORM (GORM) — SQL hidden',
              tone: 'fail',
              body: (
                <>
                  Hides the SQL behind reflection — you can't <InlineCode>EXPLAIN</InlineCode> what you can't see, and the N+1 query
                  is generated where you can't spot it. Convenient until the query plan matters, which is always eventually.
                </>
              ),
            },
            {
              label: 'database/sql — honest but verbose',
              tone: 'warn',
              body: (
                <>
                  Real SQL, but manual <InlineCode>Scan</InlineCode> into the wrong column order compiles fine and fails at runtime.
                  Every query is hand-wired plumbing the compiler can't check.
                </>
              ),
            },
            {
              label: 'sqlc — the sweet spot',
              tone: 'c',
              body: (
                <>
                  Real SQL you tune, real Go types the compiler checks. You write the query; sqlc emits the typed params and result
                  struct. Nothing hidden, nothing hand-scanned.
                </>
              ),
            },
          ]}
        />
        <Steps
          steps={[
            { label: 'change a column in schema.sql' },
            { label: 'sqlc generate re-parses schema + queries', tone: 'ok' },
            { label: 'regenerated structs no longer match old call sites' },
            { label: 'every broken call site is a compile error', tone: 'ok' },
          ]}
          caption={
            <>
              The safety is <em>generation-time</em>: <InlineCode>sqlc generate</InlineCode> parses your schema and queries, so a
              typo'd column or a param/arg mismatch fails the build, not production. Change the schema, regenerate, and every
              now-broken call site is a compile error — that's the refactor you want.
            </>
          }
        />
        <Card>
          <h4 className="mb-2 font-semibold">Thread ctx into every generated call</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            sqlc emits <InlineCode>QueryContext</InlineCode> under the hood, so passing <InlineCode>ctx</InlineCode> means a cancelled
            request actually cancels the in-flight query instead of holding a pool connection until it finishes.
          </p>
        </Card>
        <Card>
          <h4 className="mb-2 font-semibold">Translate DB errors into your vocabulary</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            The repository layer wraps <InlineCode>sql.ErrNoRows</InlineCode> as <InlineCode>%w</InlineCode> into{' '}
            <InlineCode>ErrNotFound</InlineCode> so the handler matches your sentinel (18.3), not a{' '}
            <InlineCode>database/sql</InlineCode> implementation detail leaking up the stack.
          </p>
        </Card>
        <Card>
          <h4 className="mb-2 font-semibold">sqlc isn't the whole data layer</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            It doesn't do migrations or connection pooling — pair it with <InlineCode>golang-migrate</InlineCode> (or similar) for
            schema and <InlineCode>pgxpool</InlineCode> for the pool. It generates query code; the rest of the data layer is still
            yours.
          </p>
        </Card>
      </Section>

      <Section id="profile" kicker="18.10" title="Profiling — pprof, trace, race">
        <TopicCard
          layerId={L}
          index={9}
          title="Built-in tools beat any APM for diagnosis"
          description="net/http/pprof gives you live CPU, heap, goroutine, block, mutex profiles via HTTP. `go tool trace` visualises scheduler events. `go test -race` finds data races."
        />
        <PprofGuide />
        <Compare
          items={[
            {
              label: 'CPU pegged',
              tone: 'warn',
              body: (
                <>
                  <InlineCode>profile?seconds=30</InlineCode> for hot functions — the flame graph shows where cycles actually go.
                </>
              ),
            },
            {
              label: 'Memory climbing',
              tone: 'b',
              body: (
                <>
                  <InlineCode>heap</InlineCode> for allocation hotspots and leaks — what's allocating and what's still reachable.
                </>
              ),
            },
            {
              label: 'Goroutine count climbing',
              tone: 'fail',
              body: (
                <>
                  <InlineCode>goroutine?debug=2</InlineCode> — the leak is the line hundreds of goroutines are piling up on.
                </>
              ),
            },
            {
              label: 'Latency, low CPU',
              tone: 'a',
              body: (
                <>
                  <InlineCode>block</InlineCode> (waiting on channels/locks) or <InlineCode>mutex</InlineCode> (lock contention).
                  Guessing the profile wastes the incident — pick by symptom.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">go tool pprof — top, list, web</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            <InlineCode>go tool pprof &lt;url&gt;</InlineCode> → <InlineCode>top</InlineCode> ranks by cost,{' '}
            <InlineCode>list &lt;func&gt;</InlineCode> shows line-level attribution, <InlineCode>web</InlineCode> draws the flame
            graph. The flame graph's <em>width</em> is total cost — read it for where time/memory actually goes, not where you
            assumed.
          </p>
        </Card>
        <Card>
          <h4 className="mb-2 font-semibold">go tool trace — what pprof can't answer</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Scheduler latency, GC pauses, goroutine-blocking timelines. Use it when the question is "why is this <em>p99</em>{' '}
            spiky" rather than "what's hot on average."
          </p>
        </Card>
        <Steps
          steps={[
            { label: 'import _ "net/http/pprof"' },
            { label: 'it registers on http.DefaultServeMux' },
            { label: 'you serve your API off DefaultServeMux too' },
            { label: 'anyone can dump stacks or DoS you with a 30s CPU profile', tone: 'fail' },
          ]}
          caption={
            <>
              <strong>Never expose pprof on the public API port.</strong> The endpoints leak stacks, memory contents, and let
              anyone run a 30s CPU profile as a DoS. Serve them on <InlineCode>localhost:6060</InlineCode> or behind auth — and don't
              serve your API off <InlineCode>http.DefaultServeMux</InlineCode>, since that's where the import registers them.
            </>
          }
        />
        <Compare
          items={[
            {
              label: 'pprof — leave it on in prod',
              tone: 'c',
              body: (
                <>
                  Overhead is low enough to leave the endpoints on in production — heap/goroutine are near-free, CPU/trace cost only
                  while sampling. That's the point: you diagnose the live process, not a reproduction.
                </>
              ),
            },
            {
              label: '-race — CI only, never prod',
              tone: 'fail',
              body: (
                <>
                  The opposite trade-off: a build-time instrument that's ~10× CPU and 5–10× memory. It belongs in CI, never in a
                  production build.
                </>
              ),
            },
          ]}
        />
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
