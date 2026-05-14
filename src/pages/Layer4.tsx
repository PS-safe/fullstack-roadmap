import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutPanelLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 4;

export default function Layer4() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="html" kicker="4.1" title="HTML5 Semantics & Accessibility">
        <TopicCard
          layerId={L}
          index={0}
          title="Mean what you mark up"
          description="The browser builds an accessibility tree from your HTML — a parallel DOM that screen readers, search crawlers, and keyboard nav consume. Semantic tags populate it for free; a wall of divs leaves it empty."
        >
          <Bullets
            items={[
              <><InlineCode>&lt;button&gt;</InlineCode> vs <InlineCode>&lt;div onClick&gt;</InlineCode>: the button gives you keyboard activation (Enter/Space), focusability, a <InlineCode>role</InlineCode>, and form submission for free. A clickable div has <em>none</em> of that — failure mode: it's invisible to Tab, screen readers skip it, and you end up reimplementing all of it with <InlineCode>tabindex</InlineCode> + <InlineCode>onKeyDown</InlineCode> + ARIA, badly. The semantic element is the spec-correct version of code you'd otherwise hand-write.</>,
              <>Landmark elements (<InlineCode>&lt;nav&gt; &lt;main&gt; &lt;header&gt;</InlineCode>) become navigable regions — a screen-reader user jumps between them like you jump between functions in an editor. Wrong nesting (two <InlineCode>&lt;main&gt;</InlineCode>, an <InlineCode>&lt;article&gt;</InlineCode> with no heading) corrupts that map. <InlineCode>&lt;section&gt;</InlineCode> without an accessible name is just a <InlineCode>&lt;div&gt;</InlineCode> — don't reach for it reflexively.</>,
              <>Native form validation (<InlineCode>required</InlineCode>, <InlineCode>type=email</InlineCode>, <InlineCode>pattern</InlineCode>, <InlineCode>min/max</InlineCode>) runs on the client with no JS, ties errors to the field, and is announced. The why: it's a free first layer — but it is <em>not</em> a security boundary. The server still validates everything (that's L5's job); the browser check is UX, not trust.</>,
              <>ARIA is a patch, not a tool: <InlineCode>role</InlineCode>/<InlineCode>aria-*</InlineCode> only <em>describe</em> behavior to assistive tech — they add zero actual behavior. <InlineCode>role="button"</InlineCode> on a div still doesn't make Enter work. The first rule of ARIA is "don't use ARIA" — reach for it only for widgets HTML can't express (tabs, comboboxes), and wrong ARIA (a stale <InlineCode>aria-expanded</InlineCode>) actively lies to users — worse than none.</>,
              <><InlineCode>IntersectionObserver</InlineCode> tells you when an element enters the viewport without scroll-event spam (lazy-load images, infinite scroll, analytics). <InlineCode>ResizeObserver</InlineCode> fires on element size change — the building block under container queries. Both are async and batched, so they don't block scrolling the way a synchronous <InlineCode>scroll</InlineCode> handler does.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">Accessibility failures worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">The unlabeled input</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                An <InlineCode>&lt;input&gt;</InlineCode> with placeholder text but no <InlineCode>&lt;label&gt;</InlineCode>. A screen reader announces "edit text, blank" — the user has no idea what to type. Placeholder is not a label: it vanishes on focus and fails contrast.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: <InlineCode>&lt;label for="email"&gt;</InlineCode> or wrap the input. Bonus: clicking the label now focuses the input — a bigger hit target for everyone.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">The keyboard trap</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A modal opens but focus stays on the page behind it. Tab cycles through hidden content; there's no visible focus ring to follow. The user is lost, and Esc does nothing.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                A correct dialog: move focus in on open, <em>trap</em> Tab inside it, restore focus to the trigger on close, close on Esc. <InlineCode>&lt;dialog&gt;</InlineCode> does most of this natively — reach for it before a div.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            The cheap audit: unplug your mouse and Tab through the page. Anything you can't reach, can't see focused, or can't escape is a bug — and it's the same bug a screen-reader user hits.
          </p>
        </Card>
        <ContrastChecker />
      </Section>

      <Section id="css" kicker="4.2" title="CSS3, Layouts & Design Systems">
        <TopicCard
          layerId={L}
          index={1}
          title="Flexbox, Grid, and modern selectors"
          description="Flexbox lays out along one axis and lets content size itself. Grid defines a two-axis structure up front and places items into it. Picking wrong isn't a syntax error — it's a layout you fight forever with hacks."
        >
          <Bullets
            items={[
              <>Flexbox vs Grid, when each: Flex when the <em>content</em> drives sizing along one line (a nav row, a button with an icon, tags that wrap) — items flex to fill or shrink. Grid when <em>you</em> define the structure in two dimensions (a page shell, a card layout, anything where columns must line up across rows). Failure mode: forcing a 2D layout out of nested flex containers — the columns never align because each row sizes independently.</>,
              <>Box model: default <InlineCode>content-box</InlineCode> means <InlineCode>width: 200px</InlineCode> + padding + border renders <em>wider</em> than 200px — the classic "why is my layout 16px too big" bug. <InlineCode>box-sizing: border-box</InlineCode> globally makes <InlineCode>width</InlineCode> the final rendered width, so padding eats inward. Set it once on <InlineCode>*</InlineCode> and stop doing arithmetic.</>,
              <>The cascade is specificity-then-source-order, and that's why one stylesheet's <InlineCode>.btn</InlineCode> randomly loses to another's <InlineCode>#sidebar a</InlineCode>. <InlineCode>@layer</InlineCode> lets you declare priority bands explicitly (<InlineCode>@layer reset, base, components, utilities</InlineCode>) so a low-specificity utility can still beat a high-specificity component — the fix for specificity wars without <InlineCode>!important</InlineCode>.</>,
              <>Custom properties (<InlineCode>--var</InlineCode>) cascade and are live: JS reads/writes them with <InlineCode>getComputedStyle</InlineCode> / <InlineCode>style.setProperty</InlineCode>, and changing one re-styles everything that references it with no re-render. This is how runtime theming works without shipping two stylesheets — unlike Sass variables, which are compiled away and frozen.</>,
              <>Animate only <InlineCode>transform</InlineCode> and <InlineCode>opacity</InlineCode>: they're handled by the compositor on the GPU and skip layout + paint entirely. Animating <InlineCode>width</InlineCode>/<InlineCode>top</InlineCode>/<InlineCode>margin</InlineCode> forces a reflow <em>every frame</em> — on a list of 50 items that's the jank you can watch. <InlineCode>will-change</InlineCode> hints the browser to pre-promote a layer, but overuse just wastes GPU memory.</>,
              <><InlineCode>:has()</InlineCode> is the long-missing parent selector — <InlineCode>.card:has(img)</InlineCode> styles the card based on its children, killing a whole category of "add a class in JS" workarounds. <InlineCode>@container</InlineCode> queries size a component to <em>its container</em>, not the viewport — so the same card component works in a sidebar and a full-width grid without media-query guesswork.</>,
            ]}
          />
        </TopicCard>
        <FlexboxPlayground />
        <CodePlayground
          mode="html"
          height={260}
          title="Live HTML/CSS sandbox"
          initial={`<!doctype html>
<html><body style="font-family: system-ui; padding: 20px; background:#0b0f17; color:#e7ecf3">
  <h2 style="background: linear-gradient(90deg,#6366f1,#22d3ee); -webkit-background-clip: text; color: transparent">Hello, full stack</h2>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px">
    <div style="padding:14px; background:#1f2937; border-radius:10px">A</div>
    <div style="padding:14px; background:#1f2937; border-radius:10px">B</div>
    <div style="padding:14px; background:#1f2937; border-radius:10px">C</div>
  </div>
</body></html>`}
        />
      </Section>

      <Section id="js" kicker="4.3" title="JavaScript Core Language">
        <TopicCard
          layerId={L}
          index={2}
          title="Closures, the event loop, prototypes"
          description="JavaScript runs on one thread but never blocks on I/O — the event loop is the scheduler. Like Go's runtime parking a goroutine on a channel, except here there's exactly one worker, so a slow synchronous function freezes the entire UI."
        >
          <Bullets
            items={[
              <>A closure is a function plus a live reference to the scope it was defined in — not a snapshot. The classic bug: a <InlineCode>var i</InlineCode> loop creating callbacks that all close over the <em>same</em> <InlineCode>i</InlineCode>, so they all log the final value. <InlineCode>let</InlineCode> fixes it by creating a fresh binding per iteration. Same mechanism powers React's stale-closure bug — an effect closes over the props from the render it was created in.</>,
              <><InlineCode>this</InlineCode> is bound at <em>call time</em> for regular functions — <InlineCode>obj.fn()</InlineCode> sets <InlineCode>this = obj</InlineCode>, but <InlineCode>const f = obj.fn; f()</InlineCode> loses it (<InlineCode>undefined</InlineCode> in strict mode). That's the "passing a method as a callback breaks it" bug. Arrow functions have no own <InlineCode>this</InlineCode> — they close over the enclosing scope's, which is exactly why they're correct for callbacks and wrong for object methods.</>,
              <>The event loop runs one macrotask, then <em>fully drains</em> the microtask queue, then renders, then the next macrotask. Promises/<InlineCode>await</InlineCode>/<InlineCode>queueMicrotask</InlineCode> are microtasks; <InlineCode>setTimeout</InlineCode>/I/O callbacks are macrotasks. The why behind the quiz ordering: a <InlineCode>.then</InlineCode> always runs before a <InlineCode>setTimeout(0)</InlineCode> queued earlier, because microtasks jump the line.</>,
              <>Failure mode of that ordering: an infinite microtask chain (a promise that always schedules another) <em>starves</em> the macrotask queue and the render step — the page hangs with no error. And <InlineCode>await</InlineCode> pauses the function, not the thread: code after <InlineCode>await</InlineCode> is effectively a <InlineCode>.then</InlineCode> callback, so it runs in a later microtask, not synchronously.</>,
              <>Prototypes are JS's inheritance: a property miss on an object walks the <InlineCode>__proto__</InlineCode> chain until found or <InlineCode>null</InlineCode>. <InlineCode>class</InlineCode> is sugar over this — methods live on <InlineCode>Class.prototype</InlineCode>, shared by all instances (not copied per object). Mutating a built-in prototype (<InlineCode>Array.prototype</InlineCode>) is a global side effect every library on the page now sees.</>,
              <>Use <InlineCode>===</InlineCode> always: <InlineCode>==</InlineCode> triggers type coercion with rules nobody memorizes correctly — <InlineCode>[] == false</InlineCode>, <InlineCode>'' == 0</InlineCode>, and <InlineCode>null == undefined</InlineCode> are all <InlineCode>true</InlineCode>, while <InlineCode>NaN === NaN</InlineCode> is <InlineCode>false</InlineCode>. The only defensible <InlineCode>==</InlineCode> is <InlineCode>x == null</InlineCode> to catch both null and undefined.</>,
            ]}
          />
        </TopicCard>
        <EventLoopVisualizer />
        <CodePlayground
          mode="js"
          height={220}
          title="Event loop traps"
          initial={`console.log('1: sync start');

setTimeout(() => console.log('2: macrotask'), 0);

Promise.resolve().then(() => console.log('3: microtask'));

queueMicrotask(() => console.log('4: queueMicrotask'));

console.log('5: sync end');

// Observe order: 1, 5, 3, 4, 2
// All microtasks drain before any macrotask runs.`}
        />
      </Section>

      <Section id="ts" kicker="4.4" title="TypeScript">
        <TopicCard
          layerId={L}
          index={3}
          title="Types as guarantees, not annotations"
          description="TypeScript is a compile-time linter that erases to nothing at runtime — unlike Go's types, no check survives to execution. Its value is catching the bug in your editor; its limit is that a wrong type just means it never catches it."
        >
          <Bullets
            items={[
              <>Discriminated unions model state correctly: <InlineCode>{"{ status: 'loading' } | { status: 'error', err } | { status: 'ok', data }"}</InlineCode>. The why: a loose <InlineCode>{"{ loading: bool, data?, error? }"}</InlineCode> makes illegal states representable — <InlineCode>loading: true</InlineCode> with <InlineCode>data</InlineCode> set, or all three null. The union makes those unrepresentable, and a <InlineCode>switch</InlineCode> on the tag narrows each branch automatically.</>,
              <><InlineCode>interface</InlineCode> vs <InlineCode>type</InlineCode>, when each: <InlineCode>interface</InlineCode> for object shapes that might be extended or merged (and slightly better error messages); <InlineCode>type</InlineCode> for unions, intersections, mapped/conditional types, and tuples — things <InlineCode>interface</InlineCode> can't express. Default to <InlineCode>interface</InlineCode> for public object APIs, <InlineCode>type</InlineCode> for everything else.</>,
              <>Generics with constraints carry the relationship: <InlineCode>{'function pick<T, K extends keyof T>(o: T, k: K): T[K]'}</InlineCode> proves the key exists on the object and the return matches that field. Without the <InlineCode>extends keyof T</InlineCode> constraint you'd fall back to <InlineCode>any</InlineCode> and lose the whole point.</>,
              <><InlineCode>unknown</InlineCode> at boundaries, never <InlineCode>any</InlineCode> inside. A <InlineCode>fetch().json()</InlineCode> is <InlineCode>any</InlineCode> — it silently disables type-checking for everything downstream. Type the response as <InlineCode>unknown</InlineCode> and validate (Zod, a type guard) before use. The failure mode of <InlineCode>any</InlineCode>: the error doesn't disappear, it just moves to runtime where TS can't help.</>,
              <>Types are structural, not nominal — two types with the same shape are interchangeable even if unrelated. And they're fully erased: you cannot <InlineCode>instanceof</InlineCode> an interface, and a cast (<InlineCode>as User</InlineCode>) is a <em>lie you tell the compiler</em>, checked by nobody. If the server's shape drifts from your hand-written type, TS reports zero errors — one source of truth (generate from the OpenAPI schema, an L5 concern) beats redeclaring.</>,
              <><InlineCode>strict: true</InlineCode> is non-negotiable — without it <InlineCode>strictNullChecks</InlineCode> is off and every value is implicitly nullable with no warning. Add <InlineCode>noUncheckedIndexedAccess</InlineCode> so <InlineCode>arr[i]</InlineCode> is typed <InlineCode>T | undefined</InlineCode> — the honest type, since the index might be out of bounds.</>,
            ]}
          />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={220}
          title="(Plain JS — pretend it's TS)"
          initial={`// Discriminated union pattern
function area(s) {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r * s.r;
    case 'square': return s.size * s.size;
    case 'rect':   return s.w * s.h;
  }
}

console.log(area({ kind: 'circle', r: 3 }));
console.log(area({ kind: 'square', size: 4 }));
console.log(area({ kind: 'rect', w: 5, h: 6 }));`}
        />
      </Section>

      <Section id="react" kicker="4.5" title="React Ecosystem">
        <TopicCard
          layerId={L}
          index={4}
          title="Hooks, render cycles, server components"
          description="A component is a pure function of props + state that React re-runs on every state change. Re-running the function and diffing is cheap; committing changes to the real DOM is the cost. Most React performance work is about the first part, most React bugs are about when effects run."
        >
          <Bullets
            items={[
              <>A render is just React calling your function again. State change → re-run → diff the returned tree against the last one → commit only the differences to the DOM. The why behind the quiz answer: reconciliation is cheap, the DOM commit isn't — so "too many re-renders" only matters when they cause DOM work or run expensive code in the body.</>,
              <><InlineCode>useEffect</InlineCode> synchronizes with something <em>outside</em> React (network, DOM, subscriptions, timers) — it runs <em>after</em> the commit. Using it to copy props into state or compute derived values is the #1 React anti-pattern: it causes a second render, a flash of stale UI, and a bug source. Derived state is just a calculation in the render body — no hook needed.</>,
              <>The dependency array is exhaustive or it's a bug. Miss a dep and the effect closes over <em>stale</em> values from the render it was created in — a click handler that always sends the count from when the component mounted. The eslint <InlineCode>exhaustive-deps</InlineCode> rule isn't pedantic; a disabled deps array is a stale-closure bug waiting to ship.</>,
              <>Every effect that subscribes/opens must return a cleanup. React runs cleanup before the next effect run <em>and</em> on unmount. Skip it and you get the classic leak: a <InlineCode>setInterval</InlineCode> or WebSocket per render, all still firing, or a "can't set state on unmounted component" warning.</>,
              <><InlineCode>useState</InlineCode> vs <InlineCode>useReducer</InlineCode>: <InlineCode>useState</InlineCode> for independent values; <InlineCode>useReducer</InlineCode> when the next state depends on the current one in non-trivial ways, or several values must change together as a transaction. A reducer also makes state transitions testable as a pure function — the React analogue of a state machine.</>,
              <>Server Components (Next App Router) run only on the server and ship <em>zero</em> JS for that subtree — they can't have state, effects, or event handlers. <InlineCode>'use client'</InlineCode> marks the boundary where interactivity (and the JS bundle) begins. The why: static content shouldn't cost the user a hydration bill. Pushing <InlineCode>'use client'</InlineCode> to the leaves keeps the bundle small.</>,
              <>Server state ≠ client state. Fetched data needs caching, revalidation, dedup, and loading/error tracking — that's React Query / SWR's whole job. Putting server data in Zustand/Redux means hand-rolling all of that, badly, and it goes stale. Client state (UI toggles, form drafts) is the opposite: local <InlineCode>useState</InlineCode> first, a store only when prop-drilling genuinely hurts.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">React failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">The stale closure</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                <InlineCode>{"useEffect(() => { const id = setInterval(() => setCount(count + 1), 1000); return () => clearInterval(id) }, [])"}</InlineCode> — the counter freezes at 1. The interval closed over <InlineCode>count = 0</InlineCode> from the first render and never sees an update.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: the functional update <InlineCode>setCount(c =&gt; c + 1)</InlineCode> — it doesn't read the closed-over value at all. This is the same closure mechanism from §4.3, just hidden inside a hook.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Memoization that does nothing</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                <InlineCode>React.memo(Child)</InlineCode> still re-renders every time, because the parent passes <InlineCode>{"style={{...}}"}</InlineCode> or <InlineCode>{"onClick={() => ...}"}</InlineCode> — a fresh object/function identity each render, so memo's shallow prop compare always fails.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Memo only works if <em>every</em> prop is referentially stable — which means <InlineCode>useCallback</InlineCode>/<InlineCode>useMemo</InlineCode> on the props too. Measure first: this whole chain is often slower than just letting it re-render.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            <strong>Index as <InlineCode>key</InlineCode>:</strong> on a reorderable or filterable list, <InlineCode>key={'{i}'}</InlineCode> ties React's identity to <em>position</em>, not the item. Delete the first row and every key shifts up — React reuses the wrong DOM nodes, so input state and focus land on the wrong row. Use a stable id from the data.
          </p>
        </Card>
        <HooksPlayground />
      </Section>

      <Section id="perf" kicker="4.6" title="Build Tooling & Web Performance">
        <TopicCard
          layerId={L}
          index={5}
          title="Core Web Vitals are user-facing latency"
          description="LCP, INP, and CLS are the three things a user actually feels: how long until the page looks done, how fast it answers a tap, and whether it holds still. Each maps to a different bottleneck — network, main thread, and layout — so you can't fix all three the same way."
        >
          <Bullets
            items={[
              <>LCP (&lt; 2.5s) is when the largest above-the-fold element paints — usually the hero image or headline. It's a <em>loading</em> metric: the killer is request waterfalls. Render-blocking CSS, a late-discovered hero <InlineCode>&lt;img&gt;</InlineCode>, or a font that the text waits on. Fix with <InlineCode>&lt;link rel=preload&gt;</InlineCode> on the LCP resource, <InlineCode>fetchpriority=high</InlineCode>, and inline critical CSS so the first paint doesn't round-trip.</>,
              <>INP (&lt; 200ms) measures the worst interaction-to-next-paint across the visit. It's a <em>main-thread</em> metric: a tap can't paint until the thread is free, so a long synchronous task (a 300ms render, a big JSON parse) blocks every click during it. Fix by breaking long tasks (yield with <InlineCode>scheduler.yield()</InlineCode> or chunked work), moving heavy compute to a Web Worker, and not shipping JS you don't need yet.</>,
              <>CLS (&lt; 0.1) is the layout shift you can watch happen — an image loads with no reserved height and shoves the paragraph down as you're reading it, or you tap a button that just moved. Cause: async content (images, ads, late fonts, injected banners) with no space held for it. Fix: <InlineCode>width</InlineCode>/<InlineCode>height</InlineCode> attributes or <InlineCode>aspect-ratio</InlineCode> on media, reserve a min-height for async slots, never insert content above existing content.</>,
              <>The why these are separate: a tiny fast-loading page (great LCP) can still have terrible INP if one click runs a heavy handler, and a CLS problem isn't slow at all — it's correct content arriving in the wrong order. Measure on a throttled connection and a mid-tier phone, not your laptop — field data is the only honest number.</>,
              <>Bundle size is upstream of all three. Code-split by route so the home page doesn't pay for the dashboard's JS. The classic regression: <InlineCode>import {'{ debounce }'} from 'lodash'</InlineCode> pulls the whole library; <InlineCode>import debounce from 'lodash/debounce'</InlineCode> or a tree-shakeable package pulls one function. Run a bundle analyzer when size creeps — accidental whole-package imports and duplicate deps hide there.</>,
              <>Vite splits the job: <InlineCode>esbuild</InlineCode> (Go, extremely fast) transpiles in dev and serves native ES modules unbundled — that's the instant HMR. Production builds run <InlineCode>Rollup</InlineCode>, which does the real bundling, tree-shaking, and chunk-splitting. Different tools because dev wants speed and prod wants an optimal output graph — bundler internals as a compiler is an L1 topic.</>,
            ]}
          />
        </TopicCard>
        <PerfBudget />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 4 Quiz">
        <Quiz id="L4" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-amber-500/10 via-bg-card to-orange-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-amber-500 to-orange-500 text-white">L04</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Frontend Development</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Where users meet your product</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Frontend turns design into interactive, accessible, performant experience. Browser internals, reactive programming, build tooling — a deep discipline.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <LayoutPanelLeft className="h-4 w-4 text-amber-400" />
          6 topics · 4 visualizers · 3 playgrounds · 1 quiz
        </div>
      </div>
    </header>
  );
}

function ContrastChecker() {
  const [fg, setFg] = useState('#e7ecf3');
  const [bg, setBg] = useState('#0b0f17');
  const ratio = contrastRatio(fg, bg);
  const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'fail';
  const tone = grade === 'fail' ? 'text-rose-300' : 'text-emerald-300';

  return (
    <Card>
      <h4 className="mb-3 font-semibold">WCAG contrast checker</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block">
            <span className="text-xs text-ink-faint">Text color</span>
            <div className="mt-1 flex gap-2">
              <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border border-white/10 bg-transparent" />
              <input value={fg} onChange={(e) => setFg(e.target.value)} className="input flex-1 font-mono text-xs" />
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-ink-faint">Background</span>
            <div className="mt-1 flex gap-2">
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border border-white/10 bg-transparent" />
              <input value={bg} onChange={(e) => setBg(e.target.value)} className="input flex-1 font-mono text-xs" />
            </div>
          </label>
          <div className="rounded-lg border border-white/5 bg-bg-soft/40 p-3">
            <div className="text-xs uppercase tracking-widest text-ink-faint">Ratio</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{ratio.toFixed(2)}</span>
              <span className={cn('text-sm font-medium', tone)}>{grade}</span>
            </div>
            <div className="mt-1 text-[11px] text-ink-faint">AA: ≥ 4.5 (normal text), 3 (large). AAA: ≥ 7.</div>
          </div>
        </div>
        <div className="rounded-xl p-6" style={{ background: bg, color: fg }}>
          <div className="text-2xl font-semibold">Headline preview</div>
          <p className="mt-2 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Hover, focus, click — does it read clearly?</p>
          <p className="mt-3 text-xs opacity-80">Small body — passes only at higher ratios.</p>
        </div>
      </div>
    </Card>
  );
}

function contrastRatio(fg: string, bg: string): number {
  const lum = (hex: string) => {
    const c = hex.replace('#', '');
    if (c.length !== 6) return 0;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lum(fg);
  const b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function FlexboxPlayground() {
  const [direction, setDirection] = useState('row');
  const [justify, setJustify] = useState('flex-start');
  const [align, setAlign] = useState('stretch');
  const [wrap, setWrap] = useState('nowrap');
  const [gap, setGap] = useState(8);
  const [count, setCount] = useState(4);

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Flexbox playground</h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-2 text-xs">
          <Label>flex-direction</Label>
          <Pills options={['row', 'row-reverse', 'column', 'column-reverse']} value={direction} onChange={setDirection} />
          <Label>justify-content</Label>
          <Pills options={['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']} value={justify} onChange={setJustify} />
          <Label>align-items</Label>
          <Pills options={['stretch', 'flex-start', 'center', 'flex-end', 'baseline']} value={align} onChange={setAlign} />
          <Label>flex-wrap</Label>
          <Pills options={['nowrap', 'wrap', 'wrap-reverse']} value={wrap} onChange={setWrap} />
          <Label>gap: {gap}px · items: {count}</Label>
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="40" value={gap} onChange={(e) => setGap(parseInt(e.target.value))} className="flex-1" />
            <input type="range" min="1" max="8" value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="flex-1" />
          </div>
        </div>
        <div>
          <div
            className="grid-bg rounded-xl border border-white/10 p-3"
            style={{
              display: 'flex',
              flexDirection: direction as any,
              justifyContent: justify,
              alignItems: align,
              flexWrap: wrap as any,
              gap: `${gap}px`,
              minHeight: 220,
            }}
          >
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                style={{ width: 56, height: 36 + (i % 3) * 24 }}
                className="grid place-items-center rounded-md bg-gradient-to-br from-amber-500 to-orange-500 text-sm font-semibold text-white"
              >
                {i + 1}
              </div>
            ))}
          </div>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-white/5 bg-black/40 p-3 font-mono text-[12px] leading-5 text-ink-dim">{`display: flex;
flex-direction: ${direction};
justify-content: ${justify};
align-items: ${align};
flex-wrap: ${wrap};
gap: ${gap}px;`}</pre>
        </div>
      </div>
    </Card>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="font-mono uppercase tracking-widest text-ink-faint">{children}</div>;
}

function Pills({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            'rounded-md border px-2 py-1 font-mono text-[11px]',
            value === o ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim hover:bg-white/10',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

type LoopItem = { id: number; label: string; kind: 'sync' | 'micro' | 'macro' };

function EventLoopVisualizer() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [stack, setStack] = useState<LoopItem[]>([]);
  const [microQ, setMicroQ] = useState<LoopItem[]>([]);
  const [macroQ, setMacroQ] = useState<LoopItem[]>([]);
  const [output, setOutput] = useState<string[]>([]);

  const reset = () => {
    setRunning(false);
    setStep(0);
    setStack([]);
    setMicroQ([]);
    setMacroQ([]);
    setOutput([]);
  };

  const events = useMemo<{ desc: string; apply: () => void }[]>(() => {
    let id = 0;
    const next = () => ++id;
    return [
      { desc: 'Push main()', apply: () => setStack([{ id: next(), label: 'main()', kind: 'sync' }]) },
      { desc: 'console.log("1: sync start")', apply: () => setOutput((o) => [...o, '1: sync start']) },
      { desc: 'setTimeout queues macrotask', apply: () => setMacroQ((q) => [...q, { id: next(), label: 'cb (timeout)', kind: 'macro' }]) },
      { desc: 'Promise.resolve().then queues microtask', apply: () => setMicroQ((q) => [...q, { id: next(), label: '.then', kind: 'micro' }]) },
      { desc: 'console.log("5: sync end")', apply: () => setOutput((o) => [...o, '5: sync end']) },
      { desc: 'main() returns; pop frame', apply: () => setStack([]) },
      {
        desc: 'Drain microtask queue first',
        apply: () => {
          setMicroQ([]);
          setOutput((o) => [...o, '3: microtask']);
        },
      },
      {
        desc: 'Tick: next macrotask',
        apply: () => {
          setMacroQ([]);
          setOutput((o) => [...o, '2: macrotask']);
        },
      },
    ];
  }, []);

  useEffect(() => {
    if (!running) return;
    if (step >= events.length) {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => {
      events[step].apply();
      setStep((s) => s + 1);
    }, 900);
    return () => clearTimeout(id);
  }, [running, step, events]);

  const current = events[step];

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">JavaScript event loop visualizer</h4>
        <div className="flex items-center gap-2">
          <button onClick={() => { if (step >= events.length) reset(); setRunning((r) => !r); }} className="btn-primary h-8 text-xs">
            {running ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> {step >= events.length ? 'Replay' : 'Play'}</>}
          </button>
          <button onClick={() => { if (step >= events.length) return; events[step].apply(); setStep((s) => s + 1); }} className="btn-ghost h-8 text-xs">Step</button>
          <button onClick={reset} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Lane title="Call stack" items={stack} color="bg-rose-500/30 border-rose-400/30" reverse />
        <Lane title="Microtask queue" items={microQ} color="bg-cyan-500/30 border-cyan-400/30" />
        <Lane title="Macrotask queue" items={macroQ} color="bg-amber-500/30 border-amber-400/30" />
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">console.log</div>
          <div className="h-44 overflow-y-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-xs">
            {output.length === 0 ? <div className="text-ink-faint">// nothing yet</div> : output.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-white/5 bg-bg-soft/50 px-3 py-2 text-xs">
        <span className="font-mono text-ink-faint">step {Math.min(step + 1, events.length)} / {events.length}: </span>
        {current ? current.desc : 'done — microtasks always drain before the next macrotask'}
      </div>
    </Card>
  );
}

function Lane({ title, items, color, reverse }: { title: string; items: LoopItem[]; color: string; reverse?: boolean }) {
  const list = reverse ? [...items].reverse() : items;
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">{title}</div>
      <div className="flex h-44 flex-col gap-1 rounded-xl border border-white/5 bg-bg-soft/40 p-2">
        <AnimatePresence>
          {list.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className={cn('rounded border px-2 py-1 text-center font-mono text-[11px]', color)}
            >
              {it.label}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HooksPlayground() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  return (
    <Card>
      <h4 className="mb-3 font-semibold">React hooks in action</h4>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
          <div className="text-xs uppercase tracking-widest text-ink-faint">useState</div>
          <div className="mt-1 text-3xl font-semibold">{count}</div>
          <div className="mt-2 flex items-center gap-2">
            <button className="btn-ghost h-8 text-xs" onClick={() => setCount((c) => c - step)}>−{step}</button>
            <button className="btn-ghost h-8 text-xs" onClick={() => setCount((c) => c + step)}>+{step}</button>
            <button className="btn-ghost h-8 text-xs" onClick={() => setCount(0)}>reset</button>
            <input type="range" min="1" max="10" value={step} onChange={(e) => setStep(parseInt(e.target.value))} className="flex-1" />
            <span className="font-mono text-xs text-ink-dim">step={step}</span>
          </div>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 text-[12.5px] leading-relaxed text-ink-dim">{`function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  return (
    <button onClick={() => setCount(c => c + step)}>
      {count}
    </button>
  );
}

// useState returns the current value and a setter.
// React re-renders when setter is called with a new value.
// Use the function form (c => c + 1) when reading prev state.`}</pre>
      </div>
    </Card>
  );
}

function PerfBudget() {
  const [bytes, setBytes] = useState(420);
  const [reqs, setReqs] = useState(28);
  const [thirdParty, setThirdParty] = useState(120);

  const lcp = (bytes * 1000) / 350 + reqs * 8 + thirdParty * 1.5;
  const inp = 60 + reqs * 1.2 + thirdParty * 0.8 + Math.max(0, bytes - 300) * 0.3;
  const cls = Math.min(0.5, 0.02 + reqs * 0.0015 + thirdParty * 0.0006);

  const score = (val: number, good: number, poor: number) => (val <= good ? 'good' : val <= poor ? 'meh' : 'poor');
  const lcpClass = score(lcp, 2500, 4000);
  const inpClass = score(inp, 200, 500);
  const clsClass = score(cls, 0.1, 0.25);

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Performance budget calculator</h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Slider label="JS bundle (KB)" value={bytes} setValue={setBytes} min={50} max={1500} />
          <Slider label="Requests" value={reqs} setValue={setReqs} min={5} max={150} />
          <Slider label="Third-party scripts (KB)" value={thirdParty} setValue={setThirdParty} min={0} max={500} />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Vital name="LCP" value={`${(lcp / 1000).toFixed(2)}s`} status={lcpClass} thresholds="≤ 2.5s good · ≤ 4s ok" />
          <Vital name="INP" value={`${Math.round(inp)} ms`} status={inpClass} thresholds="≤ 200ms good · ≤ 500ms ok" />
          <Vital name="CLS" value={cls.toFixed(2)} status={clsClass} thresholds="≤ 0.1 good · ≤ 0.25 ok" />
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Numbers are illustrative. Real Web Vitals depend on device, network, and code.</p>
    </Card>
  );
}

function Slider({ label, value, setValue, min, max }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-ink-dim">{label}</span>
        <span className="font-mono text-ink">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => setValue(parseInt(e.target.value))} className="w-full" />
    </div>
  );
}

function Vital({ name, value, status, thresholds }: { name: string; value: string; status: 'good' | 'meh' | 'poor'; thresholds: string }) {
  const color = status === 'good' ? 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' : status === 'meh' ? 'text-amber-300 border-amber-400/30 bg-amber-400/10' : 'text-rose-300 border-rose-400/30 bg-rose-400/10';
  return (
    <div className={cn('rounded-xl border p-3', color)}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest">{name}</span>
        <span className="text-2xl font-semibold">{value}</span>
      </div>
      <div className="mt-1 text-[11px] opacity-80">{thresholds}</div>
    </div>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Which order does this print?\nconsole.log("a"); setTimeout(() => console.log("b")); Promise.resolve().then(() => console.log("c")); console.log("d");',
    options: ['a b c d', 'a d c b', 'a c d b', 'a d b c'],
    answer: 1,
    explain: 'Sync first (a, d). Microtasks (Promise) drain before macrotasks (setTimeout) → c, then b.',
  },
  {
    q: 'For one-dimensional layout (toolbar, nav row), the right tool is...',
    options: ['CSS Grid', 'Flexbox', 'Floats', 'Position absolute'],
    answer: 1,
    explain: 'Flexbox is 1D. Grid is 2D. Use Grid for full-page layouts, Flex for components in a row or column.',
  },
  {
    q: 'Which transform property is GPU-accelerated and won\'t cause layout?',
    options: ['width: 50%', 'top: 100px', 'transform: translateX(100px)', 'margin-left: 10px'],
    answer: 2,
    explain: 'Transforms run on the compositor and skip layout/paint. Animating left/top/width forces reflow.',
  },
  {
    q: 'A React component re-renders. Which is the most expensive?',
    options: ['Function execution', 'Reconciliation', 'Real DOM updates', 'Reading state'],
    answer: 2,
    explain: 'React calls your function and diffs the virtual DOM cheaply. The cost is committing changes to the actual DOM.',
  },
  {
    q: 'You ship a 1.2 MB JS bundle on the home page. Likely Web Vital impact?',
    options: ['Mostly CLS', 'Mostly INP', 'Mostly LCP — JS blocks rendering and main thread', 'No impact, modern browsers parse fast'],
    answer: 2,
    explain: 'Large JS delays parse, compile, and main-thread work — the LCP element waits.',
  },
];
