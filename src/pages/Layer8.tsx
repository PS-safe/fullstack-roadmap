import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe2, Cookie, ShieldCheck, Database, Zap, Smartphone, Bell, Play, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 8;

export default function Layer8() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="cookies" kicker="8.1" title="Cookies & Sessions">
        <TopicCard
          layerId={L}
          index={0}
          title="State on the stateless web"
          description="HTTP is stateless — the server forgets you between requests. Cookies are how the browser remembers what server-side session you belong to."
        >
          <Bullets
            items={[
              <>Server-side sessions: cookie holds a session ID; server stores the actual data (Redis/DB). Easy invalidation.</>,
              <>JWT-in-cookie: cookie carries the signed token; server is stateless. Harder to revoke but scales to zero infra.</>,
              <>Always set <InlineCode>HttpOnly</InlineCode> (no JS access), <InlineCode>Secure</InlineCode> (HTTPS only), <InlineCode>SameSite=Lax</InlineCode> (CSRF defence).</>,
              <>Use <InlineCode>__Host-</InlineCode> prefix for ultra-strict cookies — bound to exact host, path=/, Secure required.</>,
              <>Refresh tokens in <InlineCode>HttpOnly</InlineCode> cookie + access tokens in memory is the modern SPA pattern.</>,
            ]}
          />
        </TopicCard>
        <CookieBuilder />
        <SessionVsJwt />
      </Section>

      <Section id="cors" kicker="8.2" title="CORS & Same-Origin Policy">
        <TopicCard
          layerId={L}
          index={1}
          title="Why your fetch fails with no obvious error"
          description="The browser blocks cross-origin reads by default. CORS is the server saying 'I trust this origin'. Preflight (OPTIONS) confirms before sending the real request."
        >
          <Bullets
            items={[
              <>Same-origin = same scheme + host + port. <InlineCode>https://a.com</InlineCode> ≠ <InlineCode>https://api.a.com</InlineCode>.</>,
              <>Simple requests (GET, HEAD, POST with safe content-types) skip preflight; everything else triggers OPTIONS.</>,
              <><InlineCode>Access-Control-Allow-Credentials: true</InlineCode> requires a specific origin — wildcard <InlineCode>*</InlineCode> won't work with cookies.</>,
              <>CORS is enforced by the browser, not the server. <InlineCode>curl</InlineCode> ignores it.</>,
            ]}
          />
        </TopicCard>
        <CorsSimulator />
      </Section>

      <Section id="headers" kicker="8.3" title="Security Headers">
        <TopicCard
          layerId={L}
          index={2}
          title="The headers that lock down your app"
          description="A web app without security headers is one stolen script tag from breach. These are free wins — set them once, ship them everywhere."
        >
          <Bullets
            items={[
              <><InlineCode>Content-Security-Policy</InlineCode>: whitelist sources for scripts/styles/images. Defense-in-depth against XSS.</>,
              <><InlineCode>Strict-Transport-Security</InlineCode>: force HTTPS for N seconds. <InlineCode>preload</InlineCode> gets you on the browser-baked list.</>,
              <><InlineCode>X-Frame-Options: DENY</InlineCode> or <InlineCode>frame-ancestors 'none'</InlineCode>: clickjacking defence.</>,
              <><InlineCode>X-Content-Type-Options: nosniff</InlineCode>: stop browsers guessing MIME types.</>,
              <><InlineCode>Referrer-Policy: strict-origin-when-cross-origin</InlineCode>: don't leak full URLs.</>,
              <><InlineCode>Permissions-Policy</InlineCode>: opt out of features (camera, geolocation, USB) you don't use.</>,
            ]}
          />
        </TopicCard>
        <SecurityHeadersBuilder />
      </Section>

      <Section id="storage" kicker="8.4" title="Web Storage">
        <TopicCard
          layerId={L}
          index={3}
          title="Where to put what, on the client"
          description="Five storage mechanisms — each with trade-offs in size, persistence, and security."
        >
          <StorageMatrix />
        </TopicCard>
        <StorageDemo />
      </Section>

      <Section id="render" kicker="8.5" title="Browser Rendering Pipeline">
        <TopicCard
          layerId={L}
          index={4}
          title="From bytes to pixels"
          description="HTML parses into a DOM, CSS into a CSSOM. Together they form a render tree. Layout computes geometry; paint produces layers; the compositor stitches them onto the screen."
        >
          <Bullets
            items={[
              <>JS blocks parsing unless <InlineCode>async</InlineCode> or <InlineCode>defer</InlineCode>.</>,
              <>CSS blocks rendering — keep critical CSS inline, defer the rest.</>,
              <>Animating <InlineCode>transform</InlineCode> / <InlineCode>opacity</InlineCode> skips layout + paint — pure compositor.</>,
              <>Animating <InlineCode>width / top</InlineCode> triggers full reflow on every frame — janky.</>,
            ]}
          />
        </TopicCard>
        <RenderPipeline />
      </Section>

      <Section id="sw" kicker="8.6" title="Service Workers & PWA">
        <TopicCard
          layerId={L}
          index={5}
          title="A scriptable proxy that lives in the browser"
          description="Service workers intercept network requests, cache responses, and enable offline-first apps. Combined with a manifest, your site becomes installable."
        >
          <Bullets
            items={[
              <>Lifecycle: install → activate → fetch handlers → idle (terminated when not needed).</>,
              <>Cache strategies: cache-first (assets), network-first (HTML), stale-while-revalidate (API).</>,
              <>PWA = installable manifest + service worker + HTTPS. Installs to home screen, runs offline.</>,
              <>Background Sync, Push, Periodic Sync extend the platform — but support varies.</>,
            ]}
          />
        </TopicCard>
        <ServiceWorkerLifecycle />
        <CodePlayground
          mode="js"
          height={220}
          title="A minimal service worker (cache-first for static assets)"
          initial={`// sw.js — registered by your page with navigator.serviceWorker.register('/sw.js')

const CACHE = 'app-v1';
const ASSETS = ['/', '/app.css', '/app.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request))
  );
});

console.log('SW source — copy to /sw.js to make this real.');`}
        />
      </Section>

      <Section id="apis" kicker="8.7" title="Modern Web APIs">
        <TopicCard
          layerId={L}
          index={6}
          title="The platform you already have"
          description="Browsers ship dozens of APIs that replace third-party scripts: notifications, geolocation, drag-drop, intersection observation, fullscreen, clipboard, share, file system."
        >
          <WebApiGrid />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={200}
          title="IntersectionObserver — lazy-load with one API"
          initial={`// Real-world usage: lazy-load images when they enter the viewport.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      console.log('visible:', e.target.tagName);
      io.unobserve(e.target);
    }
  }
}, { rootMargin: '200px' });

// Pretend we observe images
const images = [{ tagName: 'IMG' }, { tagName: 'IMG' }];
console.log('observing', images.length, 'images');
console.log('would fire when each scrolls into view + 200px buffer');`}
        />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 8 Quiz">
        <Quiz id="L8" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-lime-500/10 via-bg-card to-green-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-lime-500 to-green-500 text-white">L08</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Web Platform & Browser</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">The platform under your framework</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Cookies, CORS, security headers, the rendering pipeline, service workers. The browser is half your runtime — the half most full-stack
          courses skip.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Globe2 className="h-4 w-4 text-lime-400" />
          7 topics · 7 visualizers · 2 playgrounds · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function CookieBuilder() {
  const [name, setName] = useState('session');
  const [value, setValue] = useState('abc.def.ghi');
  const [httpOnly, setHttpOnly] = useState(true);
  const [secure, setSecure] = useState(true);
  const [sameSite, setSameSite] = useState<'Strict' | 'Lax' | 'None'>('Lax');
  const [maxAge, setMaxAge] = useState(3600);
  const [hostPrefix, setHostPrefix] = useState(false);

  const fullName = (hostPrefix ? '__Host-' : '') + name;
  const cookie = [
    `${fullName}=${value}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    httpOnly && 'HttpOnly',
    (secure || hostPrefix) && 'Secure',
    `SameSite=${sameSite}`,
    sameSite === 'None' && !secure ? null : null,
  ]
    .filter(Boolean)
    .join('; ');

  const warnings: string[] = [];
  if (sameSite === 'None' && !secure) warnings.push('SameSite=None requires Secure.');
  if (hostPrefix && !secure) warnings.push('__Host- prefix requires Secure.');
  if (!httpOnly) warnings.push('Without HttpOnly, JS can read this cookie — XSS attacks can steal it.');
  if (sameSite === 'None') warnings.push('SameSite=None means this cookie is sent in cross-site contexts. CSRF risk if state-changing.');

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Cookie className="h-4 w-4 text-amber-300" />
        <h4 className="font-semibold">Cookie attribute builder</h4>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Value" value={value} onChange={setValue} />
          <div className="grid grid-cols-3 gap-2">
            <Toggle label="HttpOnly" v={httpOnly} setV={setHttpOnly} />
            <Toggle label="Secure" v={secure} setV={setSecure} />
            <Toggle label="__Host- prefix" v={hostPrefix} setV={setHostPrefix} />
          </div>
          <div>
            <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">SameSite</div>
            <div className="flex gap-1.5">
              {(['Strict', 'Lax', 'None'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSameSite(s)}
                  className={cn(
                    'flex-1 rounded-md border px-2 py-1.5 font-mono text-xs',
                    sameSite === s ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="uppercase tracking-widest text-ink-faint">Max-Age (seconds)</span>
              <span className="font-mono text-ink">{maxAge}</span>
            </div>
            <input type="range" min="60" max="2592000" value={maxAge} onChange={(e) => setMaxAge(parseInt(e.target.value))} className="w-full" />
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Set-Cookie header</div>
          <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-5 text-emerald-200">
{`Set-Cookie: ${cookie}`}
          </pre>
          {warnings.length > 0 && (
            <ul className="mt-3 space-y-1">
              {warnings.map((w) => (
                <li key={w} className="rounded border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                  ⚠ {w}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="JS-readable" value={httpOnly ? 'no' : 'yes'} />
            <Stat label="HTTPS only" value={secure || hostPrefix ? 'yes' : 'no'} />
            <Stat label="Cross-site" value={sameSite === 'None' ? 'sent' : 'blocked'} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-ink-faint">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input font-mono text-sm" />
    </label>
  );
}

function Toggle({ label, v, setV }: { label: string; v: boolean; setV: (b: boolean) => void }) {
  return (
    <button
      onClick={() => setV(!v)}
      className={cn(
        'rounded-lg border px-2 py-1.5 text-xs',
        v ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-ink-dim',
      )}
    >
      {v ? '✓' : '○'} {label}
    </button>
  );
}

function SessionVsJwt() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card>
        <h4 className="mb-2 font-semibold">Server-side session</h4>
        <pre className="rounded-lg border border-white/5 bg-black/40 p-3 font-mono text-[11px] text-ink-dim">{`Cookie: SID=a3f9...

Server:
  sessions[a3f9] = { userId: 42, role: 'admin', exp: ... }

Pros: easy revoke, small cookie, server controls.
Cons: needs sticky session or shared store (Redis).`}</pre>
      </Card>
      <Card>
        <h4 className="mb-2 font-semibold">JWT in cookie</h4>
        <pre className="rounded-lg border border-white/5 bg-black/40 p-3 font-mono text-[11px] text-ink-dim">{`Cookie: token=eyJ...

Server: verifies signature; reads claims directly.

Pros: stateless server, scales to zero infra.
Cons: hard to revoke before exp; large cookie.

Modern pattern: short-lived access JWT (15m)
  + long-lived refresh in HttpOnly cookie.`}</pre>
      </Card>
    </div>
  );
}

function CorsSimulator() {
  const [from, setFrom] = useState('https://app.example.com');
  const [to, setTo] = useState('https://api.example.com');
  const [method, setMethod] = useState<'GET' | 'POST' | 'DELETE'>('GET');
  const [contentType, setContentType] = useState<'application/json' | 'application/x-www-form-urlencoded' | 'text/plain'>('application/json');
  const [withCookies, setWithCookies] = useState(false);
  const [serverAllow, setServerAllow] = useState<'mirror' | 'wildcard' | 'none'>('mirror');

  const sameOrigin = from === to;
  const isSimple = (method === 'GET' || (method === 'POST' && contentType !== 'application/json')) && !withCookies;
  const needsPreflight = !sameOrigin && !isSimple;
  const allowOrigin = serverAllow === 'mirror' ? from : serverAllow === 'wildcard' ? '*' : '';
  const credConflict = withCookies && serverAllow === 'wildcard';
  const ok = sameOrigin || (allowOrigin && !credConflict && (allowOrigin === '*' || allowOrigin === from));

  return (
    <Card>
      <h4 className="mb-3 font-semibold">CORS simulator</h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Page origin (browser)" value={from} onChange={setFrom} />
          <Field label="Request to" value={to} onChange={setTo} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">Method</div>
              <div className="flex gap-1">
                {(['GET', 'POST', 'DELETE'] as const).map((m) => (
                  <button key={m} onClick={() => setMethod(m)} className={cn('flex-1 rounded-md border px-1.5 py-1 font-mono text-[11px]', method === m ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">Content-Type</div>
              <select value={contentType} onChange={(e) => setContentType(e.target.value as any)} className="input py-1.5 font-mono text-xs">
                <option>application/json</option>
                <option>application/x-www-form-urlencoded</option>
                <option>text/plain</option>
              </select>
            </div>
          </div>
          <Toggle label="credentials: include (cookies)" v={withCookies} setV={setWithCookies} />
          <div>
            <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">Server response</div>
            <div className="flex gap-1.5">
              {([
                { id: 'mirror', label: 'Allow this origin' },
                { id: 'wildcard', label: 'Allow * (wildcard)' },
                { id: 'none', label: 'No CORS headers' },
              ] as const).map((o) => (
                <button key={o.id} onClick={() => setServerAllow(o.id)} className={cn('flex-1 rounded-md border px-1.5 py-1 text-[11px]', serverAllow === o.id ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Browser flow</div>
          <div className="space-y-2">
            {sameOrigin ? (
              <Stage label="Same-origin — no CORS check" tone="ok" />
            ) : (
              <>
                {needsPreflight && (
                  <Stage
                    label={`OPTIONS preflight to ${to}`}
                    tone={allowOrigin && !credConflict ? 'ok' : 'fail'}
                    detail={`Origin: ${from}\nAccess-Control-Request-Method: ${method}`}
                  />
                )}
                <Stage
                  label={`${method} ${to}`}
                  tone={ok ? 'ok' : 'fail'}
                  detail={`Origin: ${from}${withCookies ? '\nCookie: ...' : ''}`}
                />
                <Stage
                  label="Server response"
                  tone={ok ? 'ok' : 'fail'}
                  detail={
                    serverAllow === 'none'
                      ? '(no CORS headers)'
                      : `Access-Control-Allow-Origin: ${allowOrigin}${withCookies ? '\nAccess-Control-Allow-Credentials: true' : ''}`
                  }
                />
                <Stage
                  label={ok ? 'Browser delivers response to fetch()' : 'Browser blocks; fetch() rejects'}
                  tone={ok ? 'ok' : 'fail'}
                  detail={credConflict ? 'Wildcard origin not allowed with credentials' : ''}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Stage({ label, tone, detail }: { label: string; tone: 'ok' | 'fail' | 'info'; detail?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        tone === 'ok' && 'border-emerald-400/30 bg-emerald-400/5 text-emerald-200',
        tone === 'fail' && 'border-rose-400/30 bg-rose-400/5 text-rose-200',
        tone === 'info' && 'border-white/10 bg-white/5 text-ink-dim',
      )}
    >
      <div className="font-medium">{label}</div>
      {detail && <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] opacity-80">{detail}</pre>}
    </div>
  );
}

function SecurityHeadersBuilder() {
  const [hsts, setHsts] = useState(true);
  const [csp, setCsp] = useState(true);
  const [xfo, setXfo] = useState(true);
  const [nosniff, setNosniff] = useState(true);
  const [referrer, setReferrer] = useState(true);
  const [perms, setPerms] = useState(false);

  const headers: string[] = [];
  if (hsts) headers.push('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
  if (csp) headers.push("Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-r4nd0m'; img-src 'self' data:; object-src 'none'; base-uri 'self'");
  if (xfo) headers.push('X-Frame-Options: DENY');
  if (nosniff) headers.push('X-Content-Type-Options: nosniff');
  if (referrer) headers.push('Referrer-Policy: strict-origin-when-cross-origin');
  if (perms) headers.push('Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()');

  const score = [hsts, csp, xfo, nosniff, referrer, perms].filter(Boolean).length;
  const grade = score >= 5 ? 'A+' : score >= 4 ? 'A' : score >= 3 ? 'B' : score >= 2 ? 'C' : 'F';
  const gradeTone = grade === 'A+' || grade === 'A' ? 'text-emerald-300' : grade === 'B' ? 'text-cyan-300' : grade === 'C' ? 'text-amber-300' : 'text-rose-300';

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-300" />
        <h4 className="font-semibold">Security headers builder</h4>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-2">
          <Toggle label="Strict-Transport-Security" v={hsts} setV={setHsts} />
          <Toggle label="Content-Security-Policy" v={csp} setV={setCsp} />
          <Toggle label="X-Frame-Options" v={xfo} setV={setXfo} />
          <Toggle label="X-Content-Type-Options: nosniff" v={nosniff} setV={setNosniff} />
          <Toggle label="Referrer-Policy" v={referrer} setV={setReferrer} />
          <Toggle label="Permissions-Policy" v={perms} setV={setPerms} />
          <div className="mt-3 rounded-xl border border-white/5 bg-bg-soft/40 p-3">
            <div className="text-xs uppercase tracking-widest text-ink-faint">securityheaders.com grade</div>
            <div className={cn('mt-1 text-3xl font-semibold', gradeTone)}>{grade}</div>
            <div className="text-[11px] text-ink-faint">{score} / 6 critical headers set</div>
          </div>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[11.5px] leading-5 text-ink-dim">
{headers.length === 0 ? '// no headers — your site is wide open' : headers.join('\n')}
        </pre>
      </div>
    </Card>
  );
}

function StorageMatrix() {
  const rows = [
    { name: 'Cookie', size: '~4 KB', life: 'configurable', sent: 'every request', js: 'unless HttpOnly', use: 'auth, session ID' },
    { name: 'localStorage', size: '~5 MB', life: 'forever', sent: 'never', js: 'yes', use: 'preferences, cached views' },
    { name: 'sessionStorage', size: '~5 MB', life: 'tab close', sent: 'never', js: 'yes', use: 'wizard state, draft data' },
    { name: 'IndexedDB', size: 'GBs', life: 'forever', sent: 'never', js: 'yes', use: 'large blobs, offline data' },
    { name: 'Cache API', size: 'browser-managed', life: 'manual', sent: 'never', js: 'yes', use: 'service worker responses' },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
          <tr>
            <th className="px-4 py-2 text-left">Mechanism</th>
            <th className="px-4 py-2 text-left">Size</th>
            <th className="px-4 py-2 text-left">Lifetime</th>
            <th className="px-4 py-2 text-left">Sent to server</th>
            <th className="px-4 py-2 text-left">JS access</th>
            <th className="px-4 py-2 text-left">Best for</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-white/5">
              <td className="px-4 py-2 font-medium">{r.name}</td>
              <td className="px-4 py-2 font-mono text-ink-dim">{r.size}</td>
              <td className="px-4 py-2 text-ink-dim">{r.life}</td>
              <td className="px-4 py-2 text-ink-dim">{r.sent}</td>
              <td className="px-4 py-2 text-ink-dim">{r.js}</td>
              <td className="px-4 py-2 text-ink-dim">{r.use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StorageDemo() {
  const [k, setK] = useState('theme');
  const [v, setV] = useState('dark');
  const [items, setItems] = useState<{ k: string; v: string }[]>([
    { k: 'theme', v: 'dark' },
    { k: 'lang', v: 'en' },
  ]);

  const set = () => setItems((arr) => [...arr.filter((x) => x.k !== k), { k, v }]);
  const remove = (key: string) => setItems((arr) => arr.filter((x) => x.k !== key));

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Database className="h-4 w-4" />
        <h4 className="font-semibold">localStorage emulator (in-memory)</h4>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="key" value={k} onChange={setK} />
        <Field label="value" value={v} onChange={setV} />
        <button onClick={set} className="btn-primary h-9">setItem</button>
        <button onClick={() => setItems([])} className="btn-ghost h-9">clear</button>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-1">
        {items.length === 0 ? (
          <div className="text-xs text-ink-faint">// empty</div>
        ) : (
          items.map((it) => (
            <div key={it.k} className="flex items-center justify-between rounded border border-white/5 bg-bg-soft/40 px-3 py-1.5 font-mono text-xs">
              <span><span className="text-accent-cyan">{it.k}</span> = <span className="text-emerald-300">"{it.v}"</span></span>
              <button onClick={() => remove(it.k)} className="text-ink-faint hover:text-rose-300">remove</button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function RenderPipeline() {
  const stages = [
    { name: 'Bytes', desc: 'HTML & CSS arrive', icon: '📦' },
    { name: 'Tokens / Parse', desc: 'Tokenizer → AST', icon: '🔡' },
    { name: 'DOM', desc: 'Tree of nodes', icon: '🌳' },
    { name: 'CSSOM', desc: 'Tree of style rules', icon: '🎨' },
    { name: 'Render Tree', desc: 'DOM ∩ CSSOM (visible only)', icon: '🌲' },
    { name: 'Layout', desc: 'Compute geometry / box positions', icon: '📐' },
    { name: 'Paint', desc: 'Fill pixels into layers', icon: '🖌️' },
    { name: 'Composite', desc: 'Stitch layers → screen', icon: '🖼️' },
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % stages.length), 1500);
    return () => clearInterval(id);
  }, [stages.length]);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Browser rendering pipeline</h4>
        <div className="text-xs text-ink-faint">animating · click to pin</div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stages.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setStep(i)}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              i === step ? 'border-accent bg-accent/10 scale-[1.02]' : 'border-white/10 bg-white/5',
            )}
          >
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-1 text-sm font-medium">{i + 1}. {s.name}</div>
            <div className="mt-0.5 text-[11px] text-ink-dim">{s.desc}</div>
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
          <div className="text-xs uppercase tracking-widest text-rose-300">Reflow trigger</div>
          <p className="mt-1 text-sm text-ink-dim">Animating <InlineCode>width</InlineCode>, <InlineCode>height</InlineCode>, <InlineCode>top</InlineCode>, <InlineCode>left</InlineCode> — entire pipeline re-runs.</p>
        </div>
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
          <div className="text-xs uppercase tracking-widest text-amber-300">Repaint only</div>
          <p className="mt-1 text-sm text-ink-dim"><InlineCode>color</InlineCode>, <InlineCode>background-color</InlineCode>, <InlineCode>visibility</InlineCode> — skip layout, repaint.</p>
        </div>
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
          <div className="text-xs uppercase tracking-widest text-emerald-300">Compositor only</div>
          <p className="mt-1 text-sm text-ink-dim"><InlineCode>transform</InlineCode>, <InlineCode>opacity</InlineCode> — GPU-only, 60fps friendly.</p>
        </div>
      </div>
    </Card>
  );
}

const SW_STATES = ['installing', 'installed', 'activating', 'activated', 'redundant'] as const;
type SwState = typeof SW_STATES[number];

function ServiceWorkerLifecycle() {
  const [state, setState] = useState<SwState>('installing');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (state === 'redundant') {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setState((s) => SW_STATES[Math.min(SW_STATES.indexOf(s) + 1, SW_STATES.length - 1)]), 1200);
    return () => clearTimeout(id);
  }, [running, state]);

  const reset = () => { setRunning(false); setState('installing'); };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4" /> Service worker lifecycle</h4>
        <div className="flex gap-2">
          <button onClick={() => setRunning(true)} className="btn-primary h-8 text-xs"><Play className="h-3 w-3" /> Play</button>
          <button onClick={reset} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {SW_STATES.map((s) => (
          <motion.div
            key={s}
            animate={{
              scale: state === s ? 1.05 : 1,
              backgroundColor: state === s ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
            }}
            className="rounded-xl border border-white/10 px-2 py-3 text-center text-xs"
          >
            {s}
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-dim">
        Install runs <InlineCode>self.addEventListener('install')</InlineCode>; activate fires after old SW is gone. Once activated, fetch handlers proxy network requests.
      </p>
    </Card>
  );
}

function WebApiGrid() {
  const apis = [
    { name: 'IntersectionObserver', desc: 'Lazy-load when in viewport', icon: <Globe2 className="h-4 w-4" /> },
    { name: 'ResizeObserver', desc: 'Track element size — container queries', icon: <Globe2 className="h-4 w-4" /> },
    { name: 'Notifications', desc: 'Native push notifications', icon: <Bell className="h-4 w-4" /> },
    { name: 'Geolocation', desc: 'GPS / IP-based location', icon: <Globe2 className="h-4 w-4" /> },
    { name: 'Web Share', desc: 'Native share sheet (mobile)', icon: <Globe2 className="h-4 w-4" /> },
    { name: 'Clipboard', desc: 'Read/write clipboard with permission', icon: <Globe2 className="h-4 w-4" /> },
    { name: 'File System Access', desc: 'Persistent file handles', icon: <Database className="h-4 w-4" /> },
    { name: 'Background Sync', desc: 'Retry when network returns', icon: <Zap className="h-4 w-4" /> },
    { name: 'WebAuthn', desc: 'Hardware-key passwordless auth', icon: <ShieldCheck className="h-4 w-4" /> },
    { name: 'View Transitions', desc: 'CSS-driven page transitions', icon: <Globe2 className="h-4 w-4" /> },
    { name: 'Web Workers', desc: 'Background JS thread', icon: <Zap className="h-4 w-4" /> },
    { name: 'WebRTC', desc: 'P2P audio/video/data', icon: <Globe2 className="h-4 w-4" /> },
  ];
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {apis.map((a) => (
        <div key={a.name} className="flex items-start gap-3 rounded-xl border border-white/5 bg-bg-soft/40 p-3">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/5 text-ink-dim">{a.icon}</div>
          <div>
            <div className="text-sm font-medium">{a.name}</div>
            <div className="text-xs text-ink-dim">{a.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'You set a cookie with SameSite=None but no Secure flag. What happens?',
    options: ['It works in all browsers.', 'Modern browsers reject it.', 'Only Safari blocks it.', 'It works only on HTTP.'],
    answer: 1,
    explain: 'SameSite=None requires Secure (HTTPS only). Otherwise the browser drops it.',
  },
  {
    q: 'A simple GET cross-origin request needs preflight when...',
    options: ['Always', 'Never — only POST/DELETE preflight', 'When credentials: include is set or non-safelisted headers used', 'Only on Chrome'],
    answer: 2,
    explain: 'Cross-origin GETs are simple unless you add credentials, custom headers, or use a non-safelisted method.',
  },
  {
    q: 'Which Web Vitals stage runs *only* on the GPU compositor?',
    options: ['Animating width', 'Animating background-color', 'Animating transform / opacity', 'Animating top/left'],
    answer: 2,
    explain: 'Transform and opacity are the only common properties handled purely by the compositor — no layout or paint.',
  },
  {
    q: 'Best place to store an authentication token for a SPA?',
    options: [
      'localStorage — easiest.',
      'sessionStorage — clears on close.',
      'HttpOnly + Secure cookie — JS cannot read it, mitigating XSS theft.',
      'A hidden form field.',
    ],
    answer: 2,
    explain: 'localStorage is XSS-stealable. HttpOnly cookies can\'t be read by JS — XSS attacker can still call your API but can\'t exfiltrate the token.',
  },
  {
    q: 'A service worker\'s "activate" event runs when...',
    options: [
      'The page loads.',
      'Every fetch.',
      'A new SW takes over (after old one is closed or skipWaiting() called).',
      'On install only.',
    ],
    answer: 2,
    explain: 'activate fires once the SW is the controlling worker. Use it for cache cleanup of old versions.',
  },
];
