import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, FileText, Globe, Accessibility } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 10;

export default function Layer10() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="rendering" kicker="10.1" title="CSR vs SSR vs SSG vs ISR vs RSC">
        <TopicCard
          layerId={L}
          index={0}
          title="Where does HTML get built?"
          description="Five strategies. Each trades initial latency, server cost, freshness, and complexity differently. The decision is per route, not per app — a marketing page and a logged-in dashboard want opposite answers."
        >
          <Bullets
            items={[
              <><strong className="text-ink">CSR</strong>: server ships an empty <InlineCode>{'<div id="root">'}</InlineCode> + a JS bundle; the browser builds the DOM. TTFB is instant (static file), but first paint waits on download + parse + execute. Failure mode: a crawler that doesn't run JS sees the empty shell — <em>never</em> use CSR for a page that must rank. Right for auth-walled dashboards where SEO is irrelevant.</>,
              <><strong className="text-ink">SSR</strong>: server runs the render on every request and returns full HTML — fast first paint, indexable, can use per-request data (the logged-in user). Cost: TTFB now includes your render time, and server cost scales with traffic. The hydration JS still ships on top.</>,
              <><strong className="text-ink">SSG</strong>: render once at build, serve the file from a CDN. Fastest and cheapest possible — TTFB and first paint are both near-instant. Failure mode: the page is frozen until the next rebuild, and a 10k-page build gets slow. Default for content that changes rarely.</>,
              <><strong className="text-ink">ISR</strong>: SSG that self-refreshes. Serve the cached page; after a revalidation window the next request triggers a background rebuild. The one user who hits the stale window gets the old page — accept that and you get SSG speed with fresher data and no full rebuild.</>,
              <><strong className="text-ink">RSC</strong>: components run on the server and ship <em>HTML, not JS</em> — only the interactive (client) components hydrate. SSR-class SEO with a smaller client bundle, at the cost of a new mental model and a server runtime.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The comparisons worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">SSG vs ISR</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Both serve a static file from the CDN. SSG is frozen until you rebuild and redeploy; ISR re-renders in the background on a stale-while-revalidate window. Switch to ISR the moment rebuild-to-deploy latency becomes the bottleneck — e.g. a 5,000-product catalog where prices change but not per request.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">SSR vs RSC</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Both render on the server per request. SSR then hydrates the <em>whole</em> tree — every component's JS ships. RSC ships zero JS for server components; only client components (<InlineCode>'use client'</InlineCode>) hydrate. RSC is SSR with the hydration bill itemized instead of flat.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            CSR is the odd one out: it's the only strategy where the crawler can see an empty page. Everything else (SSR/SSG/ISR/RSC) sends real HTML. The modern default is to mix — static-render the marketing pages, SSR/RSC the personalized ones, CSR only behind the login wall. Core Web Vitals and bundle profiling for these choices live in the web-performance layer.
          </p>
        </Card>
        <RenderTimelineRace />
      </Section>

      <Section id="hydration" kicker="10.2" title="Hydration & Streaming">
        <TopicCard
          layerId={L}
          index={1}
          title="Making static HTML interactive"
          description="SSR gives you HTML that looks done but isn't — buttons render but don't click yet. Hydration is the second pass where the client downloads JS and wires up the DOM the server already painted."
        >
          <Bullets
            items={[
              <><strong className="text-ink">Why a static page still ships JS</strong>: hydration walks the server-sent DOM and attaches event listeners. To know <em>what</em> listeners to attach, the framework re-runs every component's render on the client. So a component costs JS even if it never updates — the bundle tracks <em>component count</em>, not interactivity. That's the gap between first paint (HTML visible) and TTI (actually clickable).</>,
              <><strong className="text-ink">Streaming SSR</strong>: <InlineCode>renderToPipeableStream</InlineCode> + <InlineCode>{'<Suspense>'}</InlineCode> flushes the shell immediately and streams slow subtrees as their data resolves. The user sees the header and layout before the slow product query finishes — instead of the whole page blocking on the slowest query. TTFB drops; the slow part just arrives late.</>,
              <><strong className="text-ink">Islands / partial</strong>: Astro, Fresh, 11ty hydrate <em>only</em> the interactive components — a search box, a carousel — and ship literally zero JS for static content. The fix for the bug above: make the bundle track interactivity instead of page size.</>,
              <><strong className="text-ink">RSC</strong>: server components render to HTML and never hydrate; only <InlineCode>'use client'</InlineCode> components ship JS. Same goal as islands, reached through the component tree instead of a separate file type.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The failure mode worth memorizing</h4>
          <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">A mostly-static page shipping a full hydration bundle</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
              A blog post is 95% text and one "share" button. With full hydration (Next.js Pages Router, Nuxt, Remix) the framework still ships and re-executes JS for the entire article tree — paragraphs, headings, the lot — just to wire up that one button. The user stares at painted-but-dead content while the bundle parses. This isn't a config you forgot; it's the default, and it's a bug for this page shape.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
              Fix: islands or RSC, so the article is HTML-only and the button is the sole hydrated unit. Rule of thumb — if the JS bundle grows when you add a non-interactive paragraph, your rendering strategy is wrong for the page.
            </p>
          </div>
        </Card>
        <HydrationModes />
      </Section>

      <Section id="meta" kicker="10.3" title="Meta Tags & Open Graph">
        <TopicCard
          layerId={L}
          index={2}
          title="The 200 bytes that decide your CTR"
          description="Title + description appear in Google. Open Graph appears when you paste a link in Slack, Twitter, LinkedIn. Get these wrong and your great content looks mediocre."
        >
          <MetaTagBuilder />
        </TopicCard>
      </Section>

      <Section id="jsonld" kicker="10.4" title="Structured Data (JSON-LD)">
        <TopicCard
          layerId={L}
          index={3}
          title="Tell search engines what your page IS"
          description="A crawler sees text; it can't tell a price from a phone number. Schema.org vocabulary in a JSON-LD script tag labels the entities — and unlocks rich results: star ratings, FAQ accordions, event dates, breadcrumbs. Two caveats that matter: the markup must describe what's actually visible on the page (marking up hidden content is a guidelines violation), and wrong markup is worse than none — it can get the page demoted or the markup ignored. Run Google's Rich Results Test before shipping."
        >
          <JsonLdBuilder />
        </TopicCard>
      </Section>

      <Section id="sitemap" kicker="10.5" title="sitemap.xml & robots.txt">
        <TopicCard
          layerId={L}
          index={4}
          title="The two text files that run SEO"
          description="robots.txt tells crawlers where they may go. sitemap.xml lists URLs you want indexed, with last-modified hints."
        >
          <RobotsAndSitemap />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={200}
          title="Generate a sitemap from a list of routes"
          initial={`const routes = [
  { url: '/', lastmod: '2026-04-01', priority: 1.0 },
  { url: '/blog', lastmod: '2026-05-01', priority: 0.8 },
  { url: '/blog/intro', lastmod: '2026-05-02', priority: 0.6 },
];

const xml = '<?xml version="1.0" encoding="UTF-8"?>\\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n' +
  routes.map((r) =>
    '  <url>\\n' +
    '    <loc>https://example.com' + r.url + '</loc>\\n' +
    '    <lastmod>' + r.lastmod + '</lastmod>\\n' +
    '    <priority>' + r.priority + '</priority>\\n' +
    '  </url>'
  ).join('\\n') +
  '\\n</urlset>';

console.log(xml);`}
        />
      </Section>

      <Section id="i18n" kicker="10.6" title="Internationalization">
        <TopicCard
          layerId={L}
          index={5}
          title="hreflang, canonical, language routing"
          description="Ten languages of the same page look like ten near-duplicates to a crawler. Left alone, Google picks one, splits ranking signals across the rest, and serves your Spanish users the English page. hreflang + canonical tell it which URL is for whom."
        >
          <Bullets
            items={[
              <><strong className="text-ink">hreflang</strong>: <InlineCode>{'<link rel="alternate" hreflang="es-mx" href="..." />'}</InlineCode> per language/region pair maps each URL to its audience, so Google serves the right one instead of letting the English page outrank the Spanish one for Spanish searchers. The value is a language code, optionally a region (<InlineCode>es</InlineCode> vs <InlineCode>es-mx</InlineCode>) — region only when the content actually differs by country.</>,
              <><strong className="text-ink">Must be reciprocal</strong>: every page in the set links to <em>all</em> the others <em>and itself</em>. If <InlineCode>/es/</InlineCode> lists <InlineCode>/en/</InlineCode> but <InlineCode>/en/</InlineCode> doesn't list <InlineCode>/es/</InlineCode> back, Google distrusts the whole set and ignores it. Failure mode is silent — no error, the tags just stop working.</>,
              <><strong className="text-ink">x-default</strong>: <InlineCode>hreflang="x-default"</InlineCode> names the fallback for a language you don't serve (a German user, English/Spanish/Japanese site). Omit it and that user gets whatever Google guesses.</>,
              <><strong className="text-ink">canonical works with it, not against it</strong>: canonical points each language page at <em>its own</em> URL — the canonical of <InlineCode>/es/</InlineCode> is <InlineCode>/es/</InlineCode>, not <InlineCode>/en/</InlineCode>. A common bug: pointing every translation's canonical at the English page, which tells Google the translations don't exist. canonical de-dupes <em>within</em> a language (query params, trailing slash, www); hreflang maps <em>across</em> languages.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">URL strategy — subfolder vs subdomain vs ccTLD</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Subfolder <InlineCode>/es/</InlineCode></div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                One domain, one set of hosting and SSL. All languages inherit the domain's accumulated authority — a new translation ranks off day one. Easiest to operate. The recommended default.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Subdomain <InlineCode>es.site.com</InlineCode></div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Google treats it as a partly separate site — domain authority is split, not shared, so a new subdomain starts colder. Worth it only when languages need genuinely separate hosting or infra.
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Country TLD <InlineCode>site.es</InlineCode></div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Strongest geo-targeting signal — but every TLD is a separate domain to buy, host, secure, and rank from zero. Operationally heaviest. Reach for it only when per-country presence is a real business requirement.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Default to subfolders unless you have a concrete reason not to — the authority-sharing alone usually outweighs the geo-signal of a ccTLD. The actual routing (locale detection, redirects, the <InlineCode>/es/</InlineCode> route tree) is framework work — see the frontend-frameworks layer.
          </p>
        </Card>
        <HreflangBuilder />
      </Section>

      <Section id="a11y" kicker="10.7" title="Accessibility Audit">
        <TopicCard
          layerId={L}
          index={6}
          title="Building for everyone (and for the law)"
          description="WCAG 2.1 AA is the de-facto standard and increasingly a legal requirement. Each rule serves a specific user: alt text serves the screen-reader user, the visible focus ring serves the keyboard-only user, 4.5:1 contrast serves low-vision users. The failures are a small, concrete set — and most are one CSS line or one attribute."
        >
          <A11yChecklist />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The failures worth memorizing — who each one locks out</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300"><InlineCode>outline: none</InlineCode> with no replacement</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A keyboard-only user (motor impairment, power user, broken trackpad) Tabs through the page and now has no idea where they are — the focus ring was the only cursor they had. If you remove the default outline, you owe a replacement <InlineCode>:focus-visible</InlineCode> style. Never remove it bare.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300"><InlineCode>{'<div onClick>'}</InlineCode> instead of <InlineCode>{'<button>'}</InlineCode></div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A <InlineCode>div</InlineCode> isn't focusable, isn't in the tab order, and doesn't fire on Enter/Space — it works only for a mouse. A native <InlineCode>button</InlineCode> gets all of that free. Bolting on <InlineCode>role="button"</InlineCode> + <InlineCode>tabindex</InlineCode> + key handlers is re-implementing the element badly. Semantic HTML first; ARIA only when there's no native equivalent.
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Missing <InlineCode>alt</InlineCode> / skipped heading level</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A screen reader reads the file name (<InlineCode>"IMG_4021.jpg"</InlineCode>) for a missing <InlineCode>alt</InlineCode> — useless. And it builds a document outline from headings; jumping <InlineCode>h2 → h4</InlineCode> for visual size breaks the user's ability to skim by structure. Decorative image → <InlineCode>alt=""</InlineCode> (explicitly empty, not omitted) so it's skipped cleanly.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">A green Lighthouse score read as "done"</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Automated audits (Lighthouse, axe) catch maybe 30–40% — they verify <InlineCode>alt</InlineCode> exists, not that it's <em>meaningful</em>; they can't test a keyboard trap or whether a screen reader makes sense of the flow. A 100 score means "no machine-detectable failures," not "accessible." Tab through it; turn on VoiceOver.
              </p>
            </div>
          </div>
        </Card>
        <A11yScore />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 10 Quiz">
        <Quiz id="L10" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-yellow-500/10 via-bg-card to-amber-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-yellow-500 to-amber-500 text-white">L10</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Rendering, SEO & Accessibility</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Make it fast, findable, and usable</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Picking the right rendering strategy, getting indexed, and being usable by everyone — three forces that decide whether anyone ever sees your work.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Search className="h-4 w-4 text-yellow-400" />
          7 topics · 7 visualizers · 1 playground · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

const STRATEGIES = [
  {
    key: 'CSR',
    name: 'Client-Side Rendering',
    where: 'Browser',
    when: 'Per request, in the user\'s browser',
    pros: ['Cheap server (static)', 'Snappy after first load', 'Easy SPAs'],
    cons: ['Slow first paint on weak devices', 'Hard SEO without prerender', 'Big JS bundles'],
    examples: 'create-react-app, Vite SPA, the original Angular',
    seo: 'weak',
    ttfb: 'fast (static)',
    fcp: 'slow',
    color: 'from-rose-500 to-pink-500',
  },
  {
    key: 'SSR',
    name: 'Server-Side Rendering',
    where: 'Server (per request)',
    when: 'Every request, server returns rendered HTML',
    pros: ['Great SEO', 'Personalized fresh data', 'Fast first paint'],
    cons: ['Server cost scales with traffic', 'TTFB depends on render speed', 'Hydration JS still ships'],
    examples: 'Next.js (default), Nuxt, Remix, Rails+Turbo',
    seo: 'great',
    ttfb: 'slower',
    fcp: 'fast',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'SSG',
    name: 'Static Site Generation',
    where: 'Build time',
    when: 'Once, at build. Served from CDN.',
    pros: ['Fastest possible', 'Cheapest possible', 'Great SEO'],
    cons: ['Stale until next rebuild', 'Long builds at scale (10k+ pages)'],
    examples: 'Astro, 11ty, Next.js getStaticProps, Hugo',
    seo: 'great',
    ttfb: 'instant',
    fcp: 'instant',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    key: 'ISR',
    name: 'Incremental Static Regeneration',
    where: 'Build + on-demand',
    when: 'Built once, regenerated in background after stale-while-revalidate window',
    pros: ['Fast like SSG', 'Fresher than SSG', 'Scales infinitely with cache'],
    cons: ['First user after revalidation gets stale page', 'Complexity around invalidation'],
    examples: 'Next.js revalidate, Vercel ISR, on-demand revalidation API',
    seo: 'great',
    ttfb: 'instant',
    fcp: 'instant',
    color: 'from-violet-500 to-purple-500',
  },
  {
    key: 'RSC',
    name: 'React Server Components',
    where: 'Server, no JS shipped',
    when: 'Per request — server renders + sends serialized tree',
    pros: ['Less JS in client', 'Direct DB access in components', 'Composable across server/client'],
    cons: ['New mental model', 'Server runtime needed', 'Tooling still maturing'],
    examples: 'Next.js App Router, Waku, future React-anywhere',
    seo: 'great',
    ttfb: 'fast',
    fcp: 'fast',
    color: 'from-amber-500 to-orange-500',
  },
];

function RenderStrategyComparator() {
  const [pick, setPick] = useState('SSR');
  const cur = STRATEGIES.find((s) => s.key === pick)!;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap gap-2">
        {STRATEGIES.map((s) => (
          <button
            key={s.key}
            onClick={() => setPick(s.key)}
            className={cn(
              'rounded-md border px-3 py-1.5 font-mono text-xs',
              pick === s.key ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim',
            )}
          >
            {s.key}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="flex items-baseline gap-2">
            <h5 className="text-xl font-semibold">{cur.name}</h5>
            <span className="text-xs text-ink-faint">renders at <span className="text-ink-dim">{cur.where}</span></span>
          </div>
          <p className="mt-1 text-sm text-ink-dim">{cur.when}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3">
              <div className="text-xs uppercase tracking-widest text-emerald-300">Pros</div>
              <ul className="mt-1 space-y-1 text-xs text-ink-dim">
                {cur.pros.map((p) => <li key={p}>+ {p}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs uppercase tracking-widest text-rose-300">Cons</div>
              <ul className="mt-1 space-y-1 text-xs text-ink-dim">
                {cur.cons.map((p) => <li key={p}>− {p}</li>)}
              </ul>
            </div>
          </div>
          <div className="mt-3 text-xs text-ink-faint">
            <span className="text-ink-dim">Used by:</span> {cur.examples}
          </div>
        </div>
        <div className="space-y-2">
          <Stat label="SEO" value={cur.seo} />
          <Stat label="TTFB" value={cur.ttfb} />
          <Stat label="First paint" value={cur.fcp} />
        </div>
      </div>
    </Card>
  );
}

function RenderTimelineRace() {
  // Fake timing per strategy
  const data = [
    { name: 'CSR', ttfb: 50, html: 100, js: 1200, fcp: 1500, ttilm: 2200 },
    { name: 'SSR', ttfb: 400, html: 600, js: 1100, fcp: 700, ttilm: 1700 },
    { name: 'SSG / ISR', ttfb: 30, html: 80, js: 900, fcp: 120, ttilm: 1300 },
    { name: 'RSC', ttfb: 350, html: 500, js: 600, fcp: 600, ttilm: 1200 },
  ];
  const max = Math.max(...data.map((d) => d.ttilm));

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">First-load timeline (illustrative)</h4>
        <span className="text-xs text-ink-faint">lower is better · ms</span>
      </div>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium">{d.name}</span>
              <span className="font-mono text-ink-faint">FCP {d.fcp}ms · TTI {d.ttilm}ms</span>
            </div>
            <div className="relative h-6 overflow-hidden rounded bg-white/5">
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${(d.ttfb / max) * 100}%` }} viewport={{ once: true }} className="absolute left-0 top-0 h-full bg-rose-400/60" title={`TTFB ${d.ttfb}ms`} />
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${((d.fcp - d.ttfb) / max) * 100}%` }} viewport={{ once: true }} style={{ left: `${(d.ttfb / max) * 100}%` }} className="absolute top-0 h-full bg-amber-400/70" title={`HTML→FCP`} />
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${((d.ttilm - d.fcp) / max) * 100}%` }} viewport={{ once: true }} style={{ left: `${(d.fcp / max) * 100}%` }} className="absolute top-0 h-full bg-emerald-400/70" title="JS hydration" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-faint">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-rose-400/80" /> TTFB (server)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-amber-400/80" /> HTML to first paint</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-emerald-400/80" /> JS hydrate to interactive</span>
      </div>
    </Card>
  );
}

function HydrationModes() {
  const modes = [
    { name: 'Full hydration', desc: 'Whole tree gets JS + listeners on load.', cost: 'high', fw: 'Next.js (default), Nuxt, Remix' },
    { name: 'Streaming SSR', desc: 'HTML streams in chunks via Suspense.', cost: 'medium', fw: 'Next.js App Router, Remix' },
    { name: 'Islands / Partial', desc: 'Only interactive components hydrate.', cost: 'low', fw: 'Astro, Fresh, 11ty' },
    { name: 'Resumability', desc: 'No re-execution; serialize state and pick up.', cost: 'lowest', fw: 'Qwik' },
    { name: 'RSC', desc: 'Server components ship HTML only; client components hydrate.', cost: 'mixed', fw: 'Next.js App Router, Waku' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Hydration approaches</h4>
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Mode</th><th className="px-4 py-2 text-left">What it does</th><th className="px-4 py-2 text-left">JS cost</th><th className="px-4 py-2 text-left">Frameworks</th></tr>
          </thead>
          <tbody>
            {modes.map((m) => (
              <tr key={m.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{m.name}</td>
                <td className="px-4 py-2 text-ink-dim">{m.desc}</td>
                <td className="px-4 py-2 font-mono text-ink-dim">{m.cost}</td>
                <td className="px-4 py-2 text-ink-dim">{m.fw}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MetaTagBuilder() {
  const [title, setTitle] = useState('Full Stack Roadmap — Interactive Learning');
  const [desc, setDesc] = useState('A progressive, animated guide from CS fundamentals to distributed systems.');
  const [url, setUrl] = useState('https://example.com/');
  const [image, setImage] = useState('https://example.com/og.png');
  const [twHandle, setTwHandle] = useState('@example');

  const head = `<title>${title}</title>
<meta name="description" content="${desc}" />
<link rel="canonical" href="${url}" />

<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${image}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="${twHandle}" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${image}" />`;

  const titleScore = title.length > 0 && title.length <= 60 ? 'good' : title.length <= 70 ? 'meh' : 'long';
  const descScore = desc.length > 50 && desc.length <= 160 ? 'good' : desc.length <= 200 ? 'meh' : 'off';

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <h4 className="font-semibold">Meta + Open Graph builder</h4>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs">
            <div className="mb-1 flex items-center justify-between">
              <span className="uppercase tracking-widest text-ink-faint">Title</span>
              <span className={cn(titleScore === 'good' ? 'text-emerald-300' : titleScore === 'meh' ? 'text-amber-300' : 'text-rose-300')}>{title.length} / 60</span>
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input text-sm" />
          </label>
          <label className="block text-xs">
            <div className="mb-1 flex items-center justify-between">
              <span className="uppercase tracking-widest text-ink-faint">Description</span>
              <span className={cn(descScore === 'good' ? 'text-emerald-300' : descScore === 'meh' ? 'text-amber-300' : 'text-rose-300')}>{desc.length} / 160</span>
            </div>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="input h-20 resize-none text-sm" />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block uppercase tracking-widest text-ink-faint">Canonical URL</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="input text-sm" />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block uppercase tracking-widest text-ink-faint">OG image URL</span>
            <input value={image} onChange={(e) => setImage(e.target.value)} className="input text-sm" />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block uppercase tracking-widest text-ink-faint">Twitter handle</span>
            <input value={twHandle} onChange={(e) => setTwHandle(e.target.value)} className="input text-sm" />
          </label>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Google search preview</div>
          <div className="rounded-xl border border-white/5 bg-white p-4">
            <div className="text-xs text-emerald-700">{url.replace(/^https?:\/\//, '')}</div>
            <div className="mt-1 truncate text-base text-blue-700 underline">{title || '(empty)'}</div>
            <div className="mt-1 line-clamp-2 text-xs text-gray-700">{desc}</div>
          </div>
          <div className="mb-2 mt-4 text-xs uppercase tracking-widest text-ink-faint">Slack / Twitter card preview</div>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="aspect-[1.91/1] bg-bg-soft/40">
              <div className="grid h-full place-items-center text-xs text-ink-faint">[ og:image ]</div>
            </div>
            <div className="border-t border-white/5 bg-white/5 p-3 text-xs">
              <div className="text-[10px] uppercase tracking-widest text-ink-faint">{url.replace(/^https?:\/\//, '').split('/')[0]}</div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="mt-0.5 line-clamp-2 text-ink-dim">{desc}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">{'<head>'} output</div>
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[11.5px] leading-5 text-ink-dim">{head}</pre>
      </div>
    </Card>
  );
}

function JsonLdBuilder() {
  const [type, setType] = useState<'Article' | 'Product' | 'FAQ' | 'BreadcrumbList'>('Article');

  const samples: Record<string, object> = {
    Article: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Full Stack Roadmap',
      author: { '@type': 'Person', name: 'Ada Lovelace' },
      datePublished: '2026-04-01',
      image: ['https://example.com/cover.jpg'],
      publisher: { '@type': 'Organization', name: 'Example Inc.', logo: { '@type': 'ImageObject', url: 'https://example.com/logo.png' } },
    },
    Product: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Wireless Earbuds Pro',
      image: 'https://example.com/earbuds.jpg',
      description: 'Active noise cancelling, 24-hour battery.',
      brand: { '@type': 'Brand', name: 'Acme' },
      offers: { '@type': 'Offer', price: 199, priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.6, reviewCount: 1284 },
    },
    FAQ: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Is shipping free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — over $50.' } },
        { '@type': 'Question', name: 'What\'s the return window?', acceptedAnswer: { '@type': 'Answer', text: '30 days, no questions.' } },
      ],
    },
    BreadcrumbList: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://example.com/blog' },
        { '@type': 'ListItem', position: 3, name: 'Post', item: 'https://example.com/blog/post' },
      ],
    },
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">JSON-LD generator</h4>
        <div className="flex gap-1.5">
          {(['Article', 'Product', 'FAQ', 'BreadcrumbList'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={cn('rounded-md border px-2 py-1 font-mono text-xs', type === t ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-5 text-ink-dim">
{`<script type="application/ld+json">
${JSON.stringify(samples[type], null, 2)}
</script>`}
      </pre>
      <p className="mt-3 text-xs text-ink-faint">Validate with Google's Rich Results Test before shipping. Wrong markup is worse than no markup.</p>
    </Card>
  );
}

function RobotsAndSitemap() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card>
        <div className="mb-2 flex items-center gap-2"><Globe className="h-4 w-4" /> <h4 className="font-semibold">robots.txt</h4></div>
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-5 text-ink-dim">{`User-agent: *
Disallow: /admin/
Disallow: /api/
Allow: /api/og/

# Important — point crawlers at your sitemap
Sitemap: https://example.com/sitemap.xml`}</pre>
        <ul className="mt-3 space-y-1 text-xs text-ink-dim">
          <li>• <InlineCode>Disallow</InlineCode> tells well-behaved bots NOT to fetch — it doesn't enforce auth.</li>
          <li>• Don't disallow your CSS/JS — Google needs them to render the page for ranking.</li>
        </ul>
      </Card>
      <Card>
        <div className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> <h4 className="font-semibold">sitemap.xml</h4></div>
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[11.5px] leading-5 text-ink-dim">{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-05-01</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/blog/intro</loc>
    <lastmod>2026-05-02</lastmod>
    <priority>0.6</priority>
  </url>
</urlset>`}</pre>
        <ul className="mt-3 space-y-1 text-xs text-ink-dim">
          <li>• Max 50,000 URLs / 50 MB per sitemap. Use sitemap index for more.</li>
          <li>• Submit in Google Search Console for faster discovery.</li>
        </ul>
      </Card>
    </div>
  );
}

function HreflangBuilder() {
  const [base, setBase] = useState('https://example.com');
  const [langs, setLangs] = useState<{ code: string; path: string }[]>([
    { code: 'en', path: '/' },
    { code: 'es', path: '/es/' },
    { code: 'es-mx', path: '/es-mx/' },
    { code: 'ja', path: '/ja/' },
  ]);

  const tags = [
    ...langs.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${base}${l.path}" />`),
    `<link rel="alternate" hreflang="x-default" href="${base}/" />`,
  ].join('\n');

  return (
    <Card>
      <h4 className="mb-3 font-semibold">hreflang generator</h4>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <label className="block text-xs">
            <span className="mb-1 block uppercase tracking-widest text-ink-faint">Base domain</span>
            <input value={base} onChange={(e) => setBase(e.target.value)} className="input font-mono text-sm" />
          </label>
          <div className="mt-3 space-y-1">
            {langs.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={l.code} onChange={(e) => setLangs((arr) => arr.map((x, j) => (i === j ? { ...x, code: e.target.value } : x)))} className="input w-24 font-mono text-xs" />
                <input value={l.path} onChange={(e) => setLangs((arr) => arr.map((x, j) => (i === j ? { ...x, path: e.target.value } : x)))} className="input flex-1 font-mono text-xs" />
                <button onClick={() => setLangs((arr) => arr.filter((_, j) => j !== i))} className="text-ink-faint hover:text-rose-300">×</button>
              </div>
            ))}
            <button onClick={() => setLangs((arr) => [...arr, { code: 'fr', path: '/fr/' }])} className="btn-ghost mt-2 h-8 w-full text-xs">+ language</button>
          </div>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[11.5px] leading-5 text-ink-dim">{tags}</pre>
      </div>
    </Card>
  );
}

function A11yChecklist() {
  const items = [
    { k: 'lang', text: 'Set <html lang="…"> so screen readers pronounce correctly.' },
    { k: 'alt', text: 'Every <img> has alt text (or alt="" if decorative).' },
    { k: 'label', text: 'Every form field has a <label> or aria-label.' },
    { k: 'contrast', text: 'Text contrast ≥ 4.5:1 (3:1 for ≥ 24px or 18.5px bold).' },
    { k: 'kb', text: 'Every interactive element is reachable + activatable by keyboard.' },
    { k: 'focus', text: 'Visible focus ring. Don\'t set outline:none without an alternative.' },
    { k: 'heading', text: 'Headings in order (h1 → h2 → h3) — don\'t skip levels for styling.' },
    { k: 'link', text: 'Link text describes the destination (not "click here").' },
    { k: 'aria', text: 'Use semantic HTML first; ARIA only when there\'s no native equivalent.' },
    { k: 'region', text: 'Use landmarks (<header>, <nav>, <main>, <footer>) for screen-reader navigation.' },
  ];
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Accessibility className="h-4 w-4" />
          <h4 className="font-semibold">WCAG 2.1 AA quick check</h4>
        </div>
        <span className="text-xs text-ink-dim">{Object.values(checked).filter(Boolean).length} / {items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <label key={it.k} className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/5 bg-bg-soft/30 p-3 hover:bg-white/5">
            <input
              type="checkbox"
              checked={!!checked[it.k]}
              onChange={(e) => setChecked({ ...checked, [it.k]: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-emerald-500"
            />
            <span className={cn('text-sm', checked[it.k] ? 'text-ink-faint line-through' : 'text-ink-dim')}>{it.text}</span>
          </label>
        ))}
      </div>
    </Card>
  );
}

function A11yScore() {
  const [issues, setIssues] = useState({
    contrast: 2,
    altMissing: 5,
    formLabel: 1,
    keyboardTrap: 0,
    focusVisible: 1,
    headingOrder: 0,
  });
  const total = Object.values(issues).reduce((a, b) => a + b, 0);
  const score = Math.max(0, 100 - total * 6);
  const tone = score >= 90 ? 'text-emerald-300' : score >= 70 ? 'text-amber-300' : 'text-rose-300';

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <h4 className="font-semibold">Accessibility audit (simulated)</h4>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
        <div className="space-y-2">
          {[
            ['contrast', 'Low contrast text'],
            ['altMissing', 'Images missing alt'],
            ['formLabel', 'Form fields without label'],
            ['keyboardTrap', 'Keyboard traps'],
            ['focusVisible', 'Focus invisible'],
            ['headingOrder', 'Heading order skipped'],
          ].map(([k, label]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-ink-dim">{label}</span>
              <input
                type="range"
                min={0}
                max={10}
                value={(issues as any)[k]}
                onChange={(e) => setIssues({ ...issues, [k]: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="w-8 text-right font-mono text-sm">{(issues as any)[k]}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4 text-center">
          <div className="text-xs uppercase tracking-widest text-ink-faint">Lighthouse-style score</div>
          <div className={cn('mt-1 text-5xl font-semibold', tone)}>{score}</div>
          <div className="mt-1 text-xs text-ink-dim">{total} issues</div>
        </div>
      </div>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Which rendering strategy serves pre-built HTML from a CDN?',
    options: ['CSR', 'SSR', 'SSG', 'RSC'],
    answer: 2,
    explain: 'SSG builds HTML at build time. ISR refreshes those pages incrementally. SSR renders on every request.',
  },
  {
    q: 'What\'s the main downside of full hydration?',
    options: [
      'It breaks SEO.',
      'Every component\'s JS ships even if it never updates — large bundle, slow TTI.',
      'It can\'t do streaming.',
      'It only works on Next.js.',
    ],
    answer: 1,
    explain: 'Islands and RSC try to send less JS so non-interactive parts cost nothing.',
  },
  {
    q: 'Which header tells search engines the canonical URL for duplicate content?',
    options: [
      '<meta name="canonical">',
      '<link rel="canonical">',
      '<meta property="og:url">',
      'X-Canonical HTTP header',
    ],
    answer: 1,
    explain: '<link rel="canonical" href="..."/> in <head> is the standard.',
  },
  {
    q: 'JSON-LD goes where?',
    options: [
      'In a separate .json file.',
      'In a <script type="application/ld+json"> tag inside HTML.',
      'In an HTTP header.',
      'In meta tags.',
    ],
    answer: 1,
    explain: 'It\'s inline JSON-LD inside a script tag — typically in <head>.',
  },
  {
    q: 'WCAG normal-text contrast minimum (AA):',
    options: ['3:1', '4.5:1', '7:1', '10:1'],
    answer: 1,
    explain: 'AA = 4.5:1 normal, 3:1 large text. AAA = 7:1 normal, 4.5:1 large.',
  },
];
