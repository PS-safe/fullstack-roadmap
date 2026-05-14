import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Atom, Box, FormInput, Layers as LayersIcon, Route as RouteIcon, Sparkles, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 17;

export default function Layer17() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="state" kicker="17.1" title="Where state actually lives">
        <TopicCard
          layerId={L}
          index={0}
          title="Server state ≠ client state ≠ URL state ≠ form state"
          description="Most React app pain comes from mixing these. State has a lifetime — the bug is putting it somewhere whose lifetime doesn't match."
        >
          <Bullets
            items={[
              <>Server state is a <em>cache</em>, not state you own. It can go stale the instant after you read it because another client (or your own other tab) can change the source of truth. Storing it in <InlineCode>useState</InlineCode> means you've signed up to manually invalidate it — and you'll get that wrong. This is what 17.2 solves.</>,
              <>URL state survives refresh and is shareable: the current filter, the open tab, the page number. If a user pasting the link to a coworker should reproduce the screen, it belongs in search params — not <InlineCode>useState</InlineCode>. The failure mode of getting this wrong is "works on my machine, blank on reload."</>,
              <>Lift state only when a <em>second</em> component truly needs it, and only as far as the closest common parent. Lifting to the root "just in case" is how every keystroke in a deep input re-renders the whole app. Premature lifting is the client-state version of premature optimization.</>,
              <>Cross-tree state (theme, auth, cart) is the only case for a global store — and even then, frequency decides the tool. Low-frequency (theme flips a few times a session) → Context is fine. High-frequency (cursor position, form-wide live total) → Context re-renders <strong>every consumer on every change</strong>; use Zustand/Jotai selectors so only subscribers to the changed slice re-render.</>,
            ]}
          />
          <StateDecisionTree />
          <StateLibCompare />
          <Card>
            <h4 className="mb-3 font-semibold">The misplaced-state failure modes worth memorizing</h4>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Server data in useState</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                  You <InlineCode>fetch</InlineCode> in <InlineCode>useEffect</InlineCode>, store in <InlineCode>useState</InlineCode>, refetch on filter change. Now: two components mounting both fetch the same URL (no dedup); the user edits a row and the list still shows the old value (no invalidation); a slow response from an old filter lands after a fast one and overwrites it (race). You've reimplemented a query library, minus every feature that made it worth having.
                </p>
              </div>
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Context as a hot store</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                  Context has no selector. Every component that calls <InlineCode>useContext</InlineCode> re-renders when <em>any</em> field of the value changes — even fields it never reads. Put a fast-changing value (a timer, a live total) in Context and the whole subtree re-renders on every tick. Splitting into multiple Contexts helps; a real store with selector subscriptions is the actual fix.
                </p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
              The decision is always "what is this value's lifetime, and who else needs it?" Match the tool to that, and most re-render and stale-data bugs never get written.
            </p>
          </Card>
        </TopicCard>
      </Section>

      <Section id="query" kicker="17.2" title="TanStack Query (data fetching done right)">
        <TopicCard
          layerId={L}
          index={1}
          title="Server state with cache, dedup, retry, optimistic updates"
          description="Stop putting fetched data in useState/useEffect. Query libraries solve cache invalidation, request dedup, mutation rollback — the bug-prone parts."
        >
          <Bullets
            items={[
              <>The query key <em>is</em> the cache key. <InlineCode>{`['user', userId]`}</InlineCode> — every input the request depends on goes in the array. Get this wrong and you serve user A's data to user B, or you change a filter and the cache never notices. Changing the key is also how you refetch: a new key is a new cache entry.</>,
              <><InlineCode>staleTime</InlineCode> vs <InlineCode>gcTime</InlineCode> are different clocks. <InlineCode>staleTime</InlineCode> = how long data is considered fresh (no background refetch on mount/focus). <InlineCode>gcTime</InlineCode> = how long an <em>unused</em> entry stays in memory before garbage collection. Default <InlineCode>staleTime</InlineCode> is <strong>0</strong> — every mount refetches. That's safe, not free; tune it up for data that doesn't change every second.</>,
              <>Dedup: two components mounting with the same key in the same tick fire <em>one</em> request and both subscribe to the result. This is why you can call <InlineCode>useQuery(['user', id])</InlineCode> in five components without thinking — the thing you could never safely do with raw <InlineCode>fetch</InlineCode>.</>,
              <>Optimistic mutation is a four-step contract, not a vibe: <InlineCode>onMutate</InlineCode> cancels in-flight queries + snapshots the current cache + writes the optimistic value; <InlineCode>onError</InlineCode> restores the snapshot; <InlineCode>onSettled</InlineCode> invalidates the key so the server's truth wins. Skip the snapshot and a failed write leaves a fake row in the UI forever — "optimistic" without rollback is just a bug.</>,
              <>Invalidation marks an entry stale and triggers a refetch <em>if</em> it's being observed; it does not blow away the cache. <InlineCode>setQueryData</InlineCode> writes a value directly. Use <InlineCode>invalidateQueries</InlineCode> after a mutation when you want the server's version; use <InlineCode>setQueryData</InlineCode> when you already have it (the mutation response) and want to skip a round-trip.</>,
            ]}
          />
          <TanStackQueryDemo />
          <Card>
            <h4 className="mb-3 font-semibold">Why not just useState — what the library actually buys you</h4>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">The hand-rolled version</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                  <InlineCode>useEffect</InlineCode> + <InlineCode>useState</InlineCode> gives you: no dedup (N components = N requests), no cache (remount = refetch from scratch), no retry, no refetch-on-focus, manual <InlineCode>loading</InlineCode>/<InlineCode>error</InlineCode> flags, and a race condition every time a slow response outlives its filter. You will write all of this, badly, in every project.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">SWR vs RTK Query vs TanStack Query</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                  Same shape — key, fetcher, cache, mutate. <strong>SWR</strong>: smallest, Vercel, great for simple read-heavy apps. <strong>RTK Query</strong>: pick it only if you're already on Redux Toolkit. <strong>TanStack Query</strong>: the 2026 default — richest mutation/optimistic API, framework-agnostic, best devtools. The pattern transfers; choose on ecosystem fit.
                </p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
              TanStack Query is a <em>cache</em>, not a client store. It is the wrong home for "is the sidebar open" — that's local UI state (17.1). One tool per state lifetime.
            </p>
          </Card>
        </TopicCard>
        <CodePlayground
          mode="js"
          height={260}
          title="TanStack Query patterns (pseudo)"
          initial={`// READ: dedup + cache + auto-refetch + retry — all built in
// const { data, isLoading, error } = useQuery({
//   queryKey: ['user', userId],
//   queryFn: () => fetch('/api/users/' + userId).then(r => r.json()),
//   staleTime: 60_000,
// });

// WRITE: mutation with optimistic update + rollback
// const qc = useQueryClient();
// const m = useMutation({
//   mutationFn: (todo) => fetch('/api/todos', { method: 'POST', body: JSON.stringify(todo) }),
//   onMutate: async (newTodo) => {
//     await qc.cancelQueries({ queryKey: ['todos'] });
//     const previous = qc.getQueryData(['todos']);
//     qc.setQueryData(['todos'], (old) => [...old, { ...newTodo, id: 'temp' }]);
//     return { previous };
//   },
//   onError: (_err, _vars, ctx) => qc.setQueryData(['todos'], ctx.previous),
//   onSettled: () => qc.invalidateQueries({ queryKey: ['todos'] }),
// });

console.log('Read above. Pattern is universal — same shape in SWR, RTK Query.');`}
        />
      </Section>

      <Section id="forms" kicker="17.3" title="Forms: React Hook Form + Zod">
        <TopicCard
          layerId={L}
          index={2}
          title="Schema-first, controlled-when-needed"
          description="RHF is uncontrolled by default — fewer re-renders. Zod gives you one schema for client validation AND server parsing AND TypeScript types. One source of truth."
        >
          <Bullets
            items={[
              <>RHF is uncontrolled by default: <InlineCode>register</InlineCode> wires a field via ref, so a keystroke updates the DOM and RHF's internal store <em>without</em> re-rendering your component. A controlled 30-field form does the opposite — every keystroke calls <InlineCode>setState</InlineCode>, re-renders the parent, and re-renders all 30 fields. That's the difference between a form that types instantly and one that lags.</>,
              <>The cost of uncontrolled: you can't trivially react to a value mid-typing. When you genuinely need to (live derived total, autocomplete, masked input), <InlineCode>useWatch</InlineCode> subscribes <em>one</em> component to <em>one</em> field — re-render just that, not the form. Reach for a fully controlled field only when you must transform every keystroke.</>,
              <>One Zod schema is the single source of truth: <InlineCode>zodResolver</InlineCode> runs it for client validation, the same schema <InlineCode>.parse()</InlineCode>s the request body on the server, and <InlineCode>z.infer</InlineCode> generates the TS type. The failure mode it kills: two validation paths — a client one and a server one — silently drifting apart until the client says valid and the server says 400.</>,
              <>Validation timing is a UX dial: <InlineCode>mode: 'onSubmit'</InlineCode> (default) is calm but late; <InlineCode>onBlur</InlineCode> validates when a field loses focus; <InlineCode>onChange</InlineCode> is live but noisy. Common pick: validate <InlineCode>onBlur</InlineCode>, then re-validate <InlineCode>onChange</InlineCode> once a field has errored, so the error clears as the user fixes it.</>,
              <>Server is the real boundary. Client validation is UX — it can be bypassed, disabled, or stale. The Zod schema must run on the server too; that's the whole point of schema-first. Client-only validation is a hint, not a guarantee.</>,
            ]}
          />
          <FormPlayground />
        </TopicCard>
      </Section>

      <Section id="routing" kicker="17.4" title="Routing">
        <TopicCard
          layerId={L}
          index={3}
          title="React Router · TanStack Router · Next.js App Router"
          description="If you're inside Next.js, use the App Router. Standalone SPA: TanStack Router for type-safety, React Router for ecosystem."
        >
          <Bullets
            items={[
              <>The real decision is "do I have a server?" Next.js App Router is server-first — routes are Server Components, data is fetched on the server, and the client gets HTML. A standalone SPA (Vite + TanStack/React Router) ships an empty shell and fetches everything client-side. That's a deployment and SEO choice, not a routing-API preference. (Rendering-strategy mechanics — RSC, hydration, streaming — are L10's job.)</>,
              <>Routers solve the data-loading waterfall. Without a router <InlineCode>loader</InlineCode>, a route renders → effect fires → fetches → child renders → its effect fetches — requests chained by render order. A <InlineCode>loader</InlineCode> starts the fetch <em>as navigation begins</em>, in parallel, before the component mounts. TanStack Router's <InlineCode>loader</InlineCode> integrates with TanStack Query so the loader primes the same cache the component reads.</>,
              <>Type-safety is where TanStack Router earns its place: params, search params, and loader data are <em>inferred</em> end-to-end. <InlineCode>{`navigate({ to: '/user/$id', params: { id } })`}</InlineCode> is a compile error if the route or param name is wrong. React Router's params are <InlineCode>string | undefined</InlineCode> — you cast and hope. For a large app, that inference catches a whole class of broken-link bugs.</>,
              <>Search params are URL state (17.1), not an afterthought. TanStack Router treats them as typed, validated, first-class state with its own schema — the right home for filters and pagination. Hand-managing <InlineCode>?sort=...</InlineCode> with <InlineCode>useSearchParams</InlineCode> string-twiddling is where that state silently rots.</>,
              <><strong>When each:</strong> in Next.js → App Router, no debate. Standalone SPA, greenfield, TS-heavy → TanStack Router for the inference. Existing app or you need the huge ecosystem of guides/integrations → React Router. Tiny widget or embed → wouter (~2 KB, hooks only, no data loading).</>,
            ]}
          />
          <RoutingMatrix />
        </TopicCard>
      </Section>

      <Section id="patterns" kicker="17.5" title="Component patterns">
        <TopicCard
          layerId={L}
          index={4}
          title="Compound components, render props, controlled vs uncontrolled"
          description="The patterns that make components reusable without coupling them to a single layout or style."
        >
          <Bullets
            items={[
              <>Compound components share state via context so the consumer owns layout. A fat <InlineCode>{`<Tabs tabs={[...]} />`}</InlineCode> config prop works until someone needs a divider between two tabs, or an icon, or a panel that isn't a sibling — then you're adding props forever to re-expose markup the consumer already knows how to write. <InlineCode>{`<Tabs.Tab>`}</InlineCode> reading active state from context costs you one provider and buys unlimited composition.</>,
              <>The compound trade-off: the context is private, so a stray <InlineCode>{`<Tabs.Panel>`}</InlineCode> rendered outside <InlineCode>{`<Tabs>`}</InlineCode> throws (or silently does nothing). That's usually the right call — fail loud — but it's a real constraint, and it's why these are exported as a namespace (<InlineCode>Tabs.Panel</InlineCode>), signalling "these belong together."</>,
              <>Render props share <em>behavior while the consumer controls where output renders</em>. Custom hooks (17.6) superseded them for sharing logic — a hook has no wrapper component, no extra tree depth. Reach for a render prop only when the consumer must control <em>placement</em>: a <InlineCode>{`<Virtualizer>`}</InlineCode> that computes which rows are visible but lets you render each row however you like.</>,
              <>Controlled vs uncontrolled is a question of who owns the value. Controlled = parent holds it in state, re-renders on every change, trivial to validate/transform/reset. Uncontrolled = the DOM holds it, you read via ref or on submit, far fewer re-renders. Same axis as the form rule in 17.3 — a 30-field controlled form re-renders the parent on every keystroke.</>,
              <>The best reusable components support <em>both</em>: a <InlineCode>value</InlineCode> prop makes them controlled, a <InlineCode>defaultValue</InlineCode> prop makes them uncontrolled, and the component picks the mode by checking which it got. That's exactly how <InlineCode>{`<input>`}</InlineCode> works — and why every serious component library copies the pattern.</>,
            ]}
          />
          <CompoundDemo />
          <ControlledVsUncontrolled />
        </TopicCard>
      </Section>

      <Section id="hooks" kicker="17.6" title="Custom hooks done right">
        <TopicCard
          layerId={L}
          index={5}
          title="Extract behavior, not just code"
          description="A custom hook is a contract: 'give me these inputs, I'll return this state and these handlers'. The win is reusable behavior with full type safety, not 'less code'."
        >
          <Bullets
            items={[
              <>The <InlineCode>use*</InlineCode> name isn't a style rule — it's how the linter knows to enforce the rules of hooks (no conditional calls, no calls in loops). Call <InlineCode>useQuery</InlineCode> from a function named <InlineCode>getUser</InlineCode> and the linter goes blind; the hook order can break and React's state slots desync. The name is load-bearing.</>,
              <>A custom hook does <strong>not</strong> share state between call sites — it shares <em>behavior</em>. Two components calling <InlineCode>useToggle()</InlineCode> get two independent booleans, same as two <InlineCode>useState</InlineCode> calls. If you want shared state, that's a store or lifted state (17.1), not a hook. Misunderstanding this is the most common custom-hook bug.</>,
              <>Hooks compose downward: <InlineCode>useUser()</InlineCode> calls <InlineCode>useQuery</InlineCode> internally, <InlineCode>useUser()</InlineCode> gets called by <InlineCode>useCurrentOrg()</InlineCode>. Each layer is a behavior contract — "give me these inputs, get this state and these handlers." Build small (<InlineCode>useDebounce</InlineCode>, <InlineCode>useToggle</InlineCode>, ~10 lines) and stack them; that's the actual win, not "fewer lines."</>,
              <>Watch the returned-array identity: a hook returning <InlineCode>{`{ data, refetch }`}</InlineCode> hands back a new object every render. If a consumer puts <InlineCode>refetch</InlineCode> in a <InlineCode>useEffect</InlineCode> dependency array, wrap it in <InlineCode>useCallback</InlineCode> inside the hook — or the effect fires every render. A hook's return value is part of its contract; unstable identities break callers silently.</>,
              <>Keep hooks platform-agnostic where you can — only touch the DOM (via refs) when the behavior genuinely needs it. A hook that's pure logic is testable without a renderer and reusable in React Native. If a hook returns more than ~4 things, return an object and destructure at the call site.</>,
            ]}
          />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={260}
          title="Custom hook examples"
          initial={`// useDebounce — defer a value
function useDebounce(value, delay = 300) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

// useToggle — boolean with helpers
function useToggle(initial = false) {
  const [v, setV] = React.useState(initial);
  return {
    value: v,
    on: () => setV(true),
    off: () => setV(false),
    toggle: () => setV((x) => !x),
  };
}

// useLocalStorage — persistent state
function useLocalStorage(key, initial) {
  const [v, setV] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial; }
    catch { return initial; }
  });
  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(v));
  }, [key, v]);
  return [v, setV];
}

console.log('Three hooks every app reuses. Keep them ~10 lines each.');`}
        />
      </Section>

      <Section id="animation" kicker="17.7" title="Animation libraries">
        <TopicCard
          layerId={L}
          index={6}
          title="Framer Motion · React Spring · auto-animate · CSS"
          description="Don't reach for a library before trying CSS transitions and the View Transitions API. When you need orchestration or physics-based motion, Motion is the default."
        >
          <Bullets
            items={[
              <>Animate <InlineCode>transform</InlineCode> and <InlineCode>opacity</InlineCode>, almost nothing else. Those two are composited on the GPU and skip layout + paint. Animating <InlineCode>width</InlineCode>, <InlineCode>top</InlineCode>, or <InlineCode>margin</InlineCode> forces a layout recalculation every frame — the jank you feel. This is true for CSS <em>and</em> every JS library; the library can't save you from a layout-thrashing property.</>,
              <>Start with CSS. A hover, an open/close, a fade is a <InlineCode>transition</InlineCode> — 0 KB, runs off the main thread, can't jank from a slow render. Reach for a library when CSS genuinely can't express it: orchestration (stagger a list), interruptible/physics motion, gesture-driven drag, or animating a component as it <em>unmounts</em>.</>,
              <>Exit animations are the real reason people install Framer Motion. React removes a node from the DOM the instant it leaves the tree — CSS gets no chance to animate it out. <InlineCode>{`<AnimatePresence>`}</InlineCode> holds the node mounted until its exit animation finishes, then removes it. There is no clean CSS-only equivalent.</>,
              <>Layout animation: <InlineCode>{`<motion.div layout>`}</InlineCode> does FLIP automatically — it measures the element's box before and after a change, then animates the delta with a transform. Reordering a list, expanding a card, moving between grid cells "just works" because the expensive part (measuring, computing the inverse transform) is the library's job.</>,
              <>The View Transitions API is the native version of this — animate between two DOM states (even across routes) for ~0 KB. Browser support is still partial in 2026, so feature-detect and let it degrade to an instant swap. Where it works, it's the cheapest cross-page transition you can ship.</>,
            ]}
          />
          <AnimationCompare />
          <AnimationDemo />
          <Card>
            <h4 className="mb-3 font-semibold">Picking an animation tool — the honest decision</h4>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Reach for CSS / auto-animate</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                  Hover, focus, open/close, simple fades → CSS <InlineCode>transition</InlineCode>, 0 KB. List add/remove/reorder with no fuss → <InlineCode>@formkit/auto-animate</InlineCode> (~3 KB, one line on the parent). Most "we need animations" tickets end here — and shipping a 30 KB dependency for a fade is a bundle-budget mistake (that budget conversation is L4's).
                </p>
              </div>
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Reach for Framer Motion / react-spring</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                  Exit animations, shared-layout transitions, orchestrated sequences, gesture-driven drag → <strong>Framer Motion</strong> (~30 KB), the default when you need real choreography. <strong>react-spring</strong> (~12 KB) when you specifically want physics-based, interruptible motion (rubber-band drag) and can absorb its steeper API.
                </p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
              Default order: CSS → auto-animate → View Transitions → Framer Motion. Each step up costs bundle size; only pay it for capability the cheaper tier genuinely lacks.
            </p>
          </Card>
        </TopicCard>
      </Section>

      <Section id="ui" kicker="17.8" title="Component libraries">
        <TopicCard
          layerId={L}
          index={7}
          title="shadcn/ui · Radix · Headless UI · Mantine · Chakra"
          description="Headless (Radix, Headless UI, RAC): you own the styles, they own behavior + a11y. Themed (Mantine, Chakra): you adopt their look. shadcn/ui = Radix + your own styles, copied into your repo."
        >
          <Bullets
            items={[
              <>The thing you're really outsourcing is accessibility, not looks. A "simple" dropdown is roving focus, <InlineCode>aria-activedescendant</InlineCode>, Escape-to-close, type-ahead, focus-return-on-close, and screen-reader announcements. Headless libraries (Radix, React Aria) ship exactly that behavior and zero styles — you write every class, they handle the part that's genuinely hard to get right.</>,
              <>Styled libraries (MUI, Mantine, Chakra) ship behavior <em>and</em> a look. Fast to a finished UI — but the moment your design diverges from theirs, you're overriding their styles, fighting specificity, and shipping their CSS runtime plus your overrides. The trap: picking a styled library for speed, then spending months making it not look like that library.</>,
              <>shadcn/ui is the third model: it's not a dependency. A CLI copies Radix-based, Tailwind-styled component <em>source</em> into your repo. You own the files — customise freely, no version lock, no upstream breaking changes. The cost: no <InlineCode>npm update</InlineCode> for components; you pull improvements manually. For a solo dev who wants control, that trade is usually right.</>,
              <>React Aria (Adobe) is the pick when accessibility is the hard requirement — it's the most rigorous behavior layer, tested across assistive tech. Radix is the pragmatic default for most apps. Headless UI is fine if you're all-in on Tailwind and only need the few components it covers.</>,
              <>The decision compounds across the codebase, so decide once: do you have a real design (or will you) → headless (shadcn/ui as the default starting point). Internal tool, no design budget, ship today → a styled library, and accept its look. The expensive mistake is mixing two styled libraries — two themes, two runtimes, two sets of overrides.</>,
            ]}
          />
          <ComponentLibMatrix />
        </TopicCard>
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 17 Quiz">
        <Quiz id="L17" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-400/10 via-bg-card to-sky-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-cyan-400 to-sky-500 text-white">L17</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">React Patterns Deep</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Beyond useState in useEffect</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          The React patterns that compound: where state lives, schema-first forms, server-state with TanStack Query,
          compound components, animation, and the headless-component trade-off.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Atom className="h-4 w-4 text-cyan-400" />
          8 topics · 9 visualizers · 3 playgrounds · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function StateDecisionTree() {
  const buckets = [
    { kind: 'Server state', q: 'Comes from an API?', tool: 'TanStack Query / SWR / RTK Query', color: 'border-emerald-400/30 bg-emerald-400/5' },
    { kind: 'URL state', q: 'Should survive refresh? Shareable link?', tool: 'Router params / search params', color: 'border-cyan-400/30 bg-cyan-400/5' },
    { kind: 'Form state', q: 'Tied to inputs? Needs validation?', tool: 'React Hook Form + Zod', color: 'border-amber-400/30 bg-amber-400/5' },
    { kind: 'Local UI state', q: 'Open/closed, selected tab, hover?', tool: 'useState / useReducer in the component', color: 'border-rose-400/30 bg-rose-400/5' },
    { kind: 'Cross-tree shared state', q: 'Multiple trees need it (theme, auth, cart)?', tool: 'Zustand / Jotai / Context (small)', color: 'border-violet-400/30 bg-violet-400/5' },
    { kind: 'Persistent client state', q: 'Survives page reload, no API?', tool: 'localStorage / IndexedDB + tiny wrapper hook', color: 'border-blue-400/30 bg-blue-400/5' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Where does this state belong?</h4>
      <div className="space-y-2">
        {buckets.map((b) => (
          <div key={b.kind} className={cn('rounded-xl border p-3', b.color)}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">{b.kind}</span>
              <span className="font-mono text-xs text-ink-dim">{b.tool}</span>
            </div>
            <div className="mt-1 text-xs text-ink-dim">{b.q}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        The classic React mistake is putting server data in <InlineCode>useState</InlineCode> and refetching in <InlineCode>useEffect</InlineCode>. That's a query library reimplemented poorly.
      </p>
    </Card>
  );
}

function StateLibCompare() {
  const rows = [
    { name: 'useState / useReducer', size: '0 KB', store: 'component-local', when: 'Always start here' },
    { name: 'Context',                size: '0 KB', store: 'tree-scoped',   when: 'Theme, auth, locale (low-frequency updates)' },
    { name: 'Zustand',                size: '~1 KB', store: 'global',       when: 'Default for "shared global" state' },
    { name: 'Jotai',                  size: '~3 KB', store: 'atomic',        when: 'Many independent atoms; bottom-up composition' },
    { name: 'Redux Toolkit',          size: '~12 KB', store: 'global',       when: 'Big team / heavy DevTools needs / RTK Query stack' },
    { name: 'XState',                 size: '~13 KB', store: 'state machine', when: 'Complex finite state (auth flows, multi-step forms)' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Client state libraries</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Tool</th><th className="px-4 py-2 text-left">Size (gz)</th><th className="px-4 py-2 text-left">Model</th><th className="px-4 py-2 text-left">When to pick</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 font-mono text-ink-dim">{r.size}</td>
                <td className="px-4 py-2 text-ink-dim">{r.store}</td>
                <td className="px-4 py-2 text-ink-dim">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">2026 default for shared client state: <strong className="text-ink">Zustand</strong>. For server state: <strong className="text-ink">TanStack Query</strong>. Don't use one library for the other's job.</p>
    </Card>
  );
}

type FakeTodo = { id: number; text: string; status: 'pending' | 'done' };

function TanStackQueryDemo() {
  const [todos, setTodos] = useState<FakeTodo[]>([
    { id: 1, text: 'Read the docs', status: 'done' },
    { id: 2, text: 'Set up TanStack Query', status: 'pending' },
  ]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addOptimistic = () => {
    if (!draft.trim()) return;
    const tempId = -Date.now();
    setTodos((arr) => [...arr, { id: tempId, text: draft, status: 'pending' }]);
    setPending(tempId);
    setLog((l) => ['1. onMutate: optimistic add (id=temp)', ...l]);
    setDraft('');
    setTimeout(() => {
      // Simulate either success (replace temp) or failure (rollback)
      if (Math.random() > 0.25) {
        const realId = Math.floor(Math.random() * 1000) + 100;
        setTodos((arr) => arr.map((t) => (t.id === tempId ? { ...t, id: realId } : t)));
        setLog((l) => [`2. onSuccess: server returned id=${realId}; reconcile`, ...l]);
        setLog((l) => ['3. onSettled: invalidate ["todos"]', ...l]);
      } else {
        setTodos((arr) => arr.filter((t) => t.id !== tempId));
        setLog((l) => ['2. onError: server failed → rollback to previous cache', ...l]);
      }
      setPending(null);
    }, 1000);
  };

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Optimistic mutation (live)</h4>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <form onSubmit={(e) => { e.preventDefault(); addOptimistic(); }} className="flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="add a todo" className="input" />
            <button className="btn-primary">add</button>
          </form>
          <div className="mt-3 space-y-1">
            <AnimatePresence>
              {todos.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: pending === t.id ? 0.6 : 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-bg-soft/40 px-3 py-2 text-sm"
                >
                  <span>{t.text}</span>
                  <span className="font-mono text-[10px] text-ink-faint">id={t.id < 0 ? 'temp' : t.id}{pending === t.id && ' · saving'}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">Mutation lifecycle</div>
          <div className="h-44 overflow-y-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[12px]">
            {log.length === 0 ? <div className="text-ink-faint">// add a todo to see mutation events</div> : log.map((l, i) => <div key={i} className={cn(l.includes('onError') && 'text-rose-300', l.includes('onSuccess') && 'text-emerald-300')}>{l}</div>)}
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">25% of writes fail to demo rollback. With TanStack Query the UI revert is automatic.</p>
        </div>
      </div>
    </Card>
  );
}

function FormPlayground() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');

  // Pretend Zod parse
  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required';
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  if (!email) errors.email = 'Email is required';
  else if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) errors.email = 'Email is not valid';
  if (age && (!/^\d+$/.test(age) || parseInt(age) < 18 || parseInt(age) > 120)) errors.age = 'Age must be 18–120';

  const valid = Object.keys(errors).length === 0 && name && email;
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><FormInput className="h-4 w-4" /> <h4 className="font-semibold">Schema-first form (Zod-style)</h4></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <pre className="rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[12px] leading-5 text-ink-dim">{`const schema = z.object({
  name:  z.string().min(2),
  email: z.string().email(),
  age:   z.coerce.number().int()
                  .min(18).max(120).optional(),
});

type FormValues = z.infer<typeof schema>;

const { register, handleSubmit, formState } =
  useForm<FormValues>({ resolver: zodResolver(schema) });`}</pre>
          <p className="mt-2 text-xs text-ink-faint">Same schema validates server-side. Same schema generates the TS type. One source of truth.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-3">
          <Field label="Name" v={name} setV={setName} err={errors.name} />
          <Field label="Email" v={email} setV={setEmail} err={errors.email} />
          <Field label="Age (optional)" v={age} setV={setAge} err={errors.age} type="number" />
          <button className="btn-primary w-full" disabled={!valid}>{valid ? 'Submit' : 'Fix errors first'}</button>
        </form>
      </div>
    </Card>
  );
}

function Field({ label, v, setV, err, type = 'text' }: { label: string; v: string; setV: (s: string) => void; err?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs">
        <span className="mb-1 block uppercase tracking-widest text-ink-faint">{label}</span>
        <input type={type} value={v} onChange={(e) => setV(e.target.value)} className={cn('input', err ? 'border-rose-400/40' : '')} />
      </label>
      {err && <div className="mt-1 text-xs text-rose-300">{err}</div>}
    </div>
  );
}

function RoutingMatrix() {
  const rows = [
    { name: 'Next.js App Router',     model: 'file-system, server-first', types: 'inferred via TS', loader: 'Server Components + fetch + cache', when: 'Inside Next.js — no question' },
    { name: 'TanStack Router',         model: 'file-system or code',       types: 'fully inferred params + search',     loader: 'beforeLoad / loader, integrates with TanStack Query', when: 'Standalone SPA, want type safety end-to-end' },
    { name: 'React Router 6',          model: 'code-defined',              types: 'minimal',                           loader: 'loader / action (data routers)', when: 'Existing apps, vast ecosystem' },
    { name: 'wouter',                  model: 'minimal hooks',             types: 'minimal',                           loader: 'none',                              when: 'Tiny apps, embedded widgets' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><RouteIcon className="h-4 w-4" /> <h4 className="font-semibold">Routing comparator</h4></div>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Router</th><th className="px-4 py-2 text-left">Style</th><th className="px-4 py-2 text-left">Type-safety</th><th className="px-4 py-2 text-left">Data loading</th><th className="px-4 py-2 text-left">Pick when</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-ink-dim">{r.model}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.types}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.loader}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* compound demo */

const TabsCtx = ({ children, value }: { children: ReactNode; value: { active: string; setActive: (v: string) => void } }) => (
  <div data-tabs="">{children}</div>
);

function CompoundDemo() {
  const [active, setActive] = useState('overview');
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><LayersIcon className="h-4 w-4" /> <h4 className="font-semibold">Compound components — Tabs example</h4></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-5 text-ink-dim">{`<Tabs value={tab} onChange={setTab}>
  <Tabs.List>
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
    <Tabs.Tab value="billing">Billing</Tabs.Tab>
  </Tabs.List>

  <Tabs.Panel value="overview">…</Tabs.Panel>
  <Tabs.Panel value="settings">…</Tabs.Panel>
  <Tabs.Panel value="billing">…</Tabs.Panel>
</Tabs>

// Why compound:
//   - parent owns shared state (active tab)
//   - children opt in by name, in any layout
//   - users can interleave their own elements
//   - no monolithic "tabs={[...]}" prop`}</pre>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Live preview</div>
          <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-3">
            <div className="flex gap-1 border-b border-white/5">
              {['overview', 'settings', 'billing'].map((t) => (
                <button key={t} onClick={() => setActive(t)} className={cn('-mb-px border-b-2 px-3 py-1.5 text-sm', active === t ? 'border-accent text-accent' : 'border-transparent text-ink-dim')}>
                  {t}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-ink-dim">
                {active === 'overview' && 'Quick stats and recent activity.'}
                {active === 'settings' && 'Account preferences and security.'}
                {active === 'billing' && 'Subscription and invoices.'}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ControlledVsUncontrolled() {
  const [value, setValue] = useState('controlled — every keystroke re-renders parent');
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Controlled vs Uncontrolled inputs</h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-cyan-300">Controlled</div>
          <input value={value} onChange={(e) => setValue(e.target.value)} className="input" />
          <div className="mt-1 text-xs text-ink-faint">Parent owns state. Re-renders on every change. Easy validation, transformation, derived state.</div>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-amber-300">Uncontrolled</div>
          <input defaultValue="uncontrolled — DOM owns it" className="input" />
          <div className="mt-1 text-xs text-ink-faint">DOM owns the value. Read via ref or on submit. Fewer re-renders. RHF defaults to this.</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-dim">Rule: prefer uncontrolled for big forms (perf). Use controlled when you need to react to every keystroke (autocomplete, masked inputs).</p>
    </Card>
  );
}

function AnimationCompare() {
  const rows = [
    { tool: 'CSS transitions / @keyframes',     style: 'declarative, no JS', good: 'simple state changes (hover, open/close)', bad: 'no orchestration, no sequencing', size: '0 KB' },
    { tool: 'Framer Motion',                    style: 'declarative React',  good: 'gestures, layout transitions, orchestration, AnimatePresence', bad: 'large bundle (~30 KB)', size: '~30 KB' },
    { tool: 'react-spring',                     style: 'physics-based',      good: 'natural motion, rubber-band drag', bad: 'API takes practice', size: '~12 KB' },
    { tool: '@formkit/auto-animate',            style: 'one-line drop-in',   good: 'list reorder/add/remove with zero config', bad: 'limited customization', size: '~3 KB' },
    { tool: 'View Transitions API',             style: 'browser-native',     good: 'cross-page transitions, free', bad: 'partial browser support, polyfill needed', size: '0 KB (native)' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Animation tooling</h4>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Tool</th><th className="px-4 py-2 text-left">Style</th><th className="px-4 py-2 text-left">Good for</th><th className="px-4 py-2 text-left">Watch out</th><th className="px-4 py-2 text-left">Size</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tool} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.tool}</td>
                <td className="px-4 py-2 text-ink-dim">{r.style}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.good}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.bad}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-dim">{r.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AnimationDemo() {
  const [items, setItems] = useState<number[]>([1, 2, 3, 4]);
  const [counter, setCounter] = useState(5);
  const add = () => { setItems((a) => [...a, counter]); setCounter((c) => c + 1); };
  const removeRandom = () => setItems((a) => a.filter((_, i) => i !== Math.floor(a.length / 2)));
  const shuffle = () => setItems((a) => [...a].sort(() => Math.random() - 0.5));
  const reset = () => { setItems([1, 2, 3, 4]); setCounter(5); };
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" /> Layout animation (Framer Motion)</h4>
        <div className="flex gap-2">
          <button onClick={add} className="btn-ghost h-8 text-xs">+ add</button>
          <button onClick={removeRandom} className="btn-ghost h-8 text-xs">− remove</button>
          <button onClick={shuffle} className="btn-ghost h-8 text-xs">shuffle</button>
          <button onClick={reset} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/5 bg-bg-soft/30 p-3">
        <AnimatePresence>
          {items.map((n) => (
            <motion.div
              key={n}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg"
            >
              {n}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Just <InlineCode>{`<motion.div layout>`}</InlineCode> + <InlineCode>{`<AnimatePresence>`}</InlineCode>. The library handles the FLIP math.</p>
    </Card>
  );
}

function ComponentLibMatrix() {
  const rows = [
    { name: 'shadcn/ui',   style: 'copy-paste',  basis: 'Radix + Tailwind', a11y: 'great', custom: 'unlimited (you own the code)', when: '2026 default for new TS apps' },
    { name: 'Radix UI',    style: 'headless',    basis: '—',                a11y: 'great', custom: 'styling is yours', when: 'You want primitives, not opinions' },
    { name: 'Headless UI', style: 'headless',    basis: '—',                a11y: 'good',  custom: 'styling is yours', when: 'Tailwind-first stack' },
    { name: 'React Aria',  style: 'headless',    basis: 'Adobe spec',       a11y: 'gold',  custom: 'styling is yours', when: 'Accessibility above all' },
    { name: 'Mantine',     style: 'styled',      basis: 'own design system', a11y: 'good',  custom: 'theme tokens', when: 'You want a finished look' },
    { name: 'Chakra UI',   style: 'styled',      basis: 'own design system', a11y: 'good',  custom: 'theme tokens', when: 'Mature React apps' },
    { name: 'MUI',         style: 'styled',      basis: 'Material Design',  a11y: 'good',  custom: 'theme + override', when: 'Material design required' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Box className="h-4 w-4" /> <h4 className="font-semibold">Component library comparator</h4></div>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Library</th><th className="px-4 py-2 text-left">Style</th><th className="px-4 py-2 text-left">Built on</th><th className="px-4 py-2 text-left">a11y</th><th className="px-4 py-2 text-left">Customisation</th><th className="px-4 py-2 text-left">When</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-ink-dim">{r.style}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.basis}</td>
                <td className="px-4 py-2 text-ink-dim">{r.a11y}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.custom}</td>
                <td className="px-4 py-2 text-xs text-ink-dim">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">"Headless" = behavior + a11y, no styles. You ship the design. "Styled" = pre-built look you theme. shadcn/ui is the third way: you copy headless components into your repo, then own them.</p>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'You\'re fetching a list in useEffect, storing in useState, refetching on filter change. Better tool?',
    options: [
      'Redux',
      'TanStack Query — handles cache, dedup, retry, refetch on focus.',
      'Zustand',
      'Context',
    ],
    answer: 1,
    explain: 'Server state has its own toolset. Query libraries solve cache invalidation — the bug everyone reinvents.',
  },
  {
    q: 'Big form with 30 fields. To minimize re-renders use...',
    options: [
      'Controlled inputs in useState.',
      'Uncontrolled inputs (refs) or React Hook Form (uncontrolled by default).',
      'Context for each field.',
      'Redux per field.',
    ],
    answer: 1,
    explain: 'Each controlled keystroke re-renders the parent. RHF subscribes per-field and only re-renders what changed.',
  },
  {
    q: 'A "compound component" is one that...',
    options: [
      'Is rendered by multiple parents.',
      'Exposes sub-components (Tabs.Tab, Tabs.Panel) sharing state via context.',
      'Has many props.',
      'Combines two component libraries.',
    ],
    answer: 1,
    explain: 'Tabs / Tabs.List / Tabs.Tab / Tabs.Panel — composition over a fat config object.',
  },
  {
    q: 'You want behavior + accessibility, but bring your own styles. Pick:',
    options: ['Mantine', 'MUI', 'Radix UI / React Aria / Headless UI', 'Bootstrap'],
    answer: 2,
    explain: 'Headless libraries give you the keyboard handlers, ARIA, focus management — you style.',
  },
  {
    q: 'Optimistic update implies that on the server failing you should...',
    options: [
      'Show an error and keep the optimistic UI.',
      'Roll back to the previous cache, then surface the error.',
      'Retry forever.',
      'Refresh the page.',
    ],
    answer: 1,
    explain: 'The "optimistic" part is showing the change immediately. The contract is: revert on failure. TanStack Query does this for you via onError / context.',
  },
];
