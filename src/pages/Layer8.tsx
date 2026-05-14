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
          description="HTTP is stateless — the server forgets you between requests. A cookie is the browser's automatic re-attach: once Set-Cookie lands, the browser replays it on every matching request without you asking. That convenience is also the attack surface — the browser attaches it even when another site triggered the request."
        >
          <Bullets
            items={[
              <>Server-side session: the cookie holds an opaque ID, the real data lives in Redis/DB keyed by that ID. Logout = <InlineCode>DEL session:id</InlineCode> and the token is dead instantly. Cost: every request does a store lookup, and you need a shared store across instances (or sticky sessions).</>,
              <>JWT-in-cookie: the cookie carries the signed claims, the server verifies the signature and trusts the payload — no lookup, no store. Cost: it's valid until <InlineCode>exp</InlineCode> no matter what. You can't revoke a stolen token; "logout" only clears the client's copy. Mitigate with short <InlineCode>exp</InlineCode> + a refresh token, or a denylist — which re-introduces the store you were avoiding.</>,
              <><InlineCode>HttpOnly</InlineCode> hides the cookie from <InlineCode>document.cookie</InlineCode> — an XSS payload can't <em>read</em> the token. It can still <em>use</em> your session by calling your API from the injected script; HttpOnly stops exfiltration, not abuse. <InlineCode>Secure</InlineCode> blocks the cookie on plaintext HTTP so a network attacker can't sniff it.</>,
              <><InlineCode>SameSite=Lax</InlineCode> (the modern default) stops the browser attaching the cookie to cross-site POSTs and subresource requests — the exact shape of a CSRF attack (evil.com auto-submits a form to your <InlineCode>/transfer</InlineCode>). It still sends on top-level GET navigation, so following a link to your site stays logged in. <InlineCode>Strict</InlineCode> blocks even that link-follow; <InlineCode>None</InlineCode> sends everywhere and <em>requires</em> <InlineCode>Secure</InlineCode>.</>,
              <><InlineCode>__Host-</InlineCode> prefix is enforced by the browser: it rejects the <InlineCode>Set-Cookie</InlineCode> unless it has <InlineCode>Secure</InlineCode>, <InlineCode>Path=/</InlineCode>, and no <InlineCode>Domain</InlineCode>. That last part matters — without it, a subdomain (or an attacker who got XSS on <InlineCode>blog.yoursite.com</InlineCode>) can set a <InlineCode>Domain=yoursite.com</InlineCode> cookie that overrides yours. The prefix makes the cookie un-spoofable from a sibling host.</>,
              <>Modern SPA pattern: short-lived access token in JS memory (a variable, not storage — dies on refresh, never persisted) + long-lived refresh token in an <InlineCode>HttpOnly</InlineCode> cookie scoped to the <InlineCode>/auth/refresh</InlineCode> path. XSS can't read either; the refresh cookie is only attached to the one endpoint that needs it.</>,
            ]}
          />
        </TopicCard>
        <CookieBuilder />
        <SessionVsJwt />
        <Card>
          <h4 className="mb-3 font-semibold">The two failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">CSRF — the browser attaches your cookie for the attacker</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                evil.com serves <InlineCode>{'<form action="https://bank.com/transfer" method="POST">'}</InlineCode> and auto-submits it. The browser sees a request to bank.com and dutifully attaches your bank.com session cookie — the server can't tell it apart from a real one. The attacker never sees the cookie; they just <em>borrow</em> it.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: <InlineCode>SameSite=Lax</InlineCode> alone blocks the cross-site POST. For defence-in-depth (and the GET-navigation hole) add a CSRF token the attacker's page can't read. This is why an XSS bug is worse than CSRF — XSS runs <em>on</em> your origin, so SameSite doesn't help.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">The "logout doesn't log out" JWT bug</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                User clicks logout, you clear the cookie, they're "out". But the JWT they (or an attacker who copied it) still hold is signature-valid until <InlineCode>exp</InlineCode>. Paste it back in a header and the stateless server happily accepts it — there's nothing to check it against.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                This is the cost of statelessness, not a bug you can patch cleanly. Real revocation needs server state: a short <InlineCode>exp</InlineCode> (minutes) so the window is small, plus a denylist or a per-user token version checked on refresh. At that point a server-side session is often simpler — pick JWT only when statelessness is a hard requirement.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Default to a server-side session in an <InlineCode>HttpOnly; Secure; SameSite=Lax</InlineCode> cookie — instant revocation, tiny cookie, the store lookup is one Redis hit. Reach for JWT only when you genuinely can't keep shared state (multi-region edge, third-party API tokens). The cookie attributes are not optional decoration — each one closes a specific attack.
          </p>
        </Card>
      </Section>

      <Section id="cors" kicker="8.2" title="CORS & Same-Origin Policy">
        <TopicCard
          layerId={L}
          index={1}
          title="Why your fetch fails with no obvious error"
          description="The same-origin policy is the browser's default: JS may send a cross-origin request but may not read the response unless the server opts in. Think of it as a browser-side allowlist — the server publishes which origins it trusts via Access-Control-Allow-* headers, and the browser enforces it. The server itself never blocks anything; it already ran the handler."
        >
          <Bullets
            items={[
              <>Same-origin = identical scheme + host + port. <InlineCode>https://a.com</InlineCode> ≠ <InlineCode>https://api.a.com</InlineCode> (host) ≠ <InlineCode>http://a.com</InlineCode> (scheme) ≠ <InlineCode>https://a.com:8443</InlineCode> (port). Cross-origin is the common case for a SPA hitting its own API on a different subdomain.</>,
              <>Simple request (GET/HEAD, or POST with a safelisted <InlineCode>Content-Type</InlineCode> — <InlineCode>text/plain</InlineCode>, <InlineCode>form-urlencoded</InlineCode>, <InlineCode>multipart</InlineCode> — no custom headers, no credentials) → sent directly, the browser just gates the <em>response</em>. Anything else (a <InlineCode>DELETE</InlineCode>, an <InlineCode>application/json</InlineCode> body, an <InlineCode>Authorization</InlineCode> header) → the browser first sends an <InlineCode>OPTIONS</InlineCode> preflight asking permission, and only sends the real request if the answer allows it.</>,
              <>The preflight is a real round trip the user pays for. The server answers it with <InlineCode>Access-Control-Allow-Methods/Headers</InlineCode> and an <InlineCode>Access-Control-Max-Age</InlineCode> that tells the browser how long to cache the "yes" — without it, every request re-preflights and you've doubled your latency.</>,
              <><InlineCode>Access-Control-Allow-Credentials: true</InlineCode> is required for the browser to send cookies <em>and</em> to expose the response — and it is incompatible with <InlineCode>Access-Control-Allow-Origin: *</InlineCode>. With credentials you must echo the exact requesting origin (and add <InlineCode>Vary: Origin</InlineCode> so a CDN doesn't serve one origin's headers to another).</>,
              <>CORS is enforced by the browser, not the server — <InlineCode>curl</InlineCode>, Postman, and your Go backend ignore it entirely. So CORS is <strong>not a security boundary</strong>: it stops a <em>victim's browser</em> on another site from reading your responses; it does nothing against a direct attacker. Auth still has to be real (cookies, tokens, server-side checks).</>,
            ]}
          />
        </TopicCard>
        <CorsSimulator />
        <Card>
          <h4 className="mb-3 font-semibold">The CORS bugs worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">"Server logs a 200, fetch still rejects"</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                The request reached the server, the handler ran, the row was written, the response is 200 — and <InlineCode>fetch</InlineCode> still throws "TypeError: Failed to fetch". The browser <em>received</em> the response, checked for <InlineCode>Access-Control-Allow-Origin</InlineCode>, didn't find a matching one, and threw the body away before your JS could touch it.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                The tell: it's a CORS problem, not a server problem — and on a non-idempotent call (a POST that charged a card) the side effect already happened. Fix the headers on the server; never "fix" it client-side. Also: the error object is deliberately opaque (no status, no body) so a cross-origin page can't probe your API.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">The reflexive wildcard "fix"</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                You hit a CORS error, set <InlineCode>Access-Control-Allow-Origin: *</InlineCode>, error gone — for now. Then you add cookies and it breaks again: wildcard is forbidden with credentials. So you reflect <em>any</em> <InlineCode>Origin</InlineCode> header back unconditionally — now every site on the internet can make credentialed calls to your API as your logged-in users.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Right answer: an explicit allowlist of your own origins, check the incoming <InlineCode>Origin</InlineCode> against it, echo it only on a match. CORS config is an allowlist decision, not a "make the error go away" toggle.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Mental model: the server always runs the handler; CORS only decides whether the browser hands the result back to JS. If you can't explain a fetch failure, open the Network tab — the request and its real status are right there even though <InlineCode>fetch</InlineCode> gave you nothing. HTTP-protocol and TLS mechanics live in L3; this is purely the browser's read-gate.
          </p>
        </Card>
      </Section>

      <Section id="headers" kicker="8.3" title="Security Headers">
        <TopicCard
          layerId={L}
          index={2}
          title="The headers that lock down your app"
          description="Each of these is the browser opting into a stricter mode for your site — but only because you asked. They're response headers, so they cost one config line and zero runtime. The reason to set them all is that each one closes a different, specific attack; a site with none is one injected <script> or one downgrade away from breach."
        >
          <Bullets
            items={[
              <><InlineCode>Content-Security-Policy</InlineCode> — an allowlist of where scripts/styles/images may load from, enforced by the browser. It's the <em>second</em> line against XSS: even if an attacker injects <InlineCode>{'<script>'}</InlineCode>, the browser refuses to run it unless it matches the policy. Inline script is the hole — <InlineCode>'unsafe-inline'</InlineCode> defeats the whole point, so use a per-response <InlineCode>nonce-</InlineCode> or a hash. Failure mode: a too-loose policy (or <InlineCode>'unsafe-inline'</InlineCode> "to make the app work") gives you the header without the protection.</>,
              <><InlineCode>Strict-Transport-Security</InlineCode> — after the first HTTPS visit, the browser refuses to talk to your host over plaintext HTTP <em>at all</em>, for <InlineCode>max-age</InlineCode> seconds. This kills the SSL-strip downgrade attack: without it, one <InlineCode>http://</InlineCode> link or typed address is a MITM window before the redirect fires. <InlineCode>preload</InlineCode> ships your domain in the browser's baked-in list so even the <em>first</em> visit is protected — but it's hard to undo, so commit deliberately.</>,
              <><InlineCode>X-Frame-Options: DENY</InlineCode> (or CSP <InlineCode>frame-ancestors 'none'</InlineCode>, the modern superset) — stops your page being loaded in an <InlineCode>{'<iframe>'}</InlineCode>. Without it, clickjacking: an attacker frames your real page invisibly over their decoy UI, the user thinks they're clicking "play" but they're clicking your "delete account". Use <InlineCode>frame-ancestors</InlineCode> if you need to allow specific partners; XFO can't express an allowlist.</>,
              <><InlineCode>X-Content-Type-Options: nosniff</InlineCode> — forces the browser to trust your <InlineCode>Content-Type</InlineCode> instead of guessing from the bytes. The attack it blocks: a user uploads <InlineCode>avatar.jpg</InlineCode> that's actually HTML+JS; you serve it as <InlineCode>image/jpeg</InlineCode>, but a sniffing browser sees markup, decides it's HTML, and executes the script on <em>your</em> origin.</>,
              <><InlineCode>Referrer-Policy: strict-origin-when-cross-origin</InlineCode> — controls how much of the current URL leaks in the <InlineCode>Referer</InlineCode> header on outbound requests. The default leaks the full path; if your URLs carry tokens or IDs (<InlineCode>/reset?token=abc</InlineCode>), every third-party image and analytics call ships that secret. This policy sends the full URL same-origin but only the bare origin cross-site.</>,
              <><InlineCode>Permissions-Policy</InlineCode> — explicitly turns off browser features your site doesn't use (<InlineCode>camera=(), microphone=(), geolocation=()</InlineCode>). It's blast-radius reduction: if you're ever XSS'd or a third-party script goes rogue, it still can't prompt for the camera, because the document itself disabled the capability.</>,
            ]}
          />
        </TopicCard>
        <SecurityHeadersBuilder />
        <Card>
          <h4 className="mb-3 font-semibold">CSP — the one that's actually hard</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Why CSP is the header people get wrong</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                HSTS, XFO, nosniff are one fixed line each — set and forget. CSP has to model every script, style, font, image, and connection your app actually makes. Get it too strict and the app breaks in the browser (but not in dev, if dev skips the header); get it too loose and it's theatre.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Ship it in <InlineCode>Content-Security-Policy-Report-Only</InlineCode> first: the browser reports violations to a <InlineCode>report-uri</InlineCode> endpoint without blocking anything. Watch the reports, tighten, then flip to enforcing. <InlineCode>'unsafe-inline'</InlineCode> in <InlineCode>script-src</InlineCode> is the line to never accept — it re-opens the exact hole CSP exists to close.
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Defence-in-depth, not the fix</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                CSP does not <em>fix</em> XSS — it limits what an injection can do once it's there. The actual fix is output encoding and not building HTML from untrusted strings (that's L7 territory). CSP is the seatbelt: you still drive carefully, but it catches the crash you didn't prevent.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                The honest framing: these headers are cheap and you should set all of them, but only nosniff/XFO/HSTS are genuinely "set once, forget". CSP is an ongoing relationship with your own app's network behaviour.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Set HSTS, XFO/frame-ancestors, nosniff, Referrer-Policy, and Permissions-Policy today — they're flat wins. Treat CSP as a project: report-only, observe, tighten, enforce. Run the result through securityheaders.com to catch what you missed.
          </p>
        </Card>
      </Section>

      <Section id="storage" kicker="8.4" title="Web Storage">
        <TopicCard
          layerId={L}
          index={3}
          title="Where to put what, on the client"
          description="Five mechanisms, and the choice is driven by three constraints: does it need to reach the server (only cookies do, automatically), how big is it, and who's allowed to read it. Get the last one wrong and you've built an XSS token-exfiltration path; get the first wrong and you're either re-sending data on every request or can't see it server-side at all."
        >
          <StorageMatrix />
        </TopicCard>
        <StorageDemo />
        <Card>
          <h4 className="mb-3 font-semibold">The storage choices worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Never: auth token in localStorage</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                <InlineCode>localStorage</InlineCode> is plain JS-readable key/value — <InlineCode>localStorage.getItem('token')</InlineCode> works from any script on the page, including an injected one. One XSS bug and the attacker reads the token and walks away with it; it keeps working from their machine. An <InlineCode>HttpOnly</InlineCode> cookie can't be read by JS at all — XSS can still <em>use</em> the session in-page, but it can't <em>steal</em> it.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                "But localStorage is easier" is the trap — easier to write, and easier to exfiltrate. The bearer-token-in-header SPA pattern only earns its keep when the token can't be a cookie (cross-domain API you don't control).
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">localStorage is synchronous — and that's a footgun</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Every <InlineCode>localStorage</InlineCode> read/write blocks the main thread, and it's string-only — storing an object means <InlineCode>JSON.parse</InlineCode> on every read. Stuff a few hundred KB in there and parse it on each render and you've built jank into your app. It also throws (doesn't return null) when full or in private mode.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Anything beyond a few small keys belongs in <InlineCode>IndexedDB</InlineCode>: async, structured, holds GBs, doesn't block paint. Use <InlineCode>sessionStorage</InlineCode> (not local) for per-tab draft/wizard state so two tabs don't clobber each other. <InlineCode>Cache API</InlineCode> is for response objects, driven from a service worker — see 8.6.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Decision shortcut: needs to authenticate a request → <InlineCode>HttpOnly</InlineCode> cookie. Small client-only preference → <InlineCode>localStorage</InlineCode>. Per-tab transient state → <InlineCode>sessionStorage</InlineCode>. Large or offline data → <InlineCode>IndexedDB</InlineCode>. Cached HTTP responses → <InlineCode>Cache API</InlineCode>. None of the JS-readable stores are private — treat everything in them as readable by any script you load, including a compromised dependency.
          </p>
        </Card>
      </Section>

      <Section id="render" kicker="8.5" title="Browser Rendering Pipeline">
        <TopicCard
          layerId={L}
          index={4}
          title="From bytes to pixels"
          description="Think of it as a compile step the browser re-runs to put a frame on screen: HTML → DOM, CSS → CSSOM, combined into a render tree, then layout (where is every box) → paint (fill pixels into layers) → composite (GPU stitches layers to screen). The skill is knowing which stage your change re-triggers — because to hit 60fps the browser has ~16ms per frame for all of it."
        >
          <Bullets
            items={[
              <>A <InlineCode>{'<script>'}</InlineCode> blocks the parser: the browser stops building the DOM until the script downloads and runs, because the script might call <InlineCode>document.write</InlineCode>. <InlineCode>defer</InlineCode> runs it after parsing, in order; <InlineCode>async</InlineCode> runs it the moment it arrives, out of order. Failure mode: a render-blocking <InlineCode>{'<script src>'}</InlineCode> in <InlineCode>{'<head>'}</InlineCode> with no attribute pushes back first paint by its entire download time.</>,
              <>CSS blocks <em>rendering</em> (not parsing): the browser won't paint until the CSSOM is complete, because painting with half the styles would flash unstyled content. So a big <InlineCode>{'<link rel=stylesheet>'}</InlineCode> is on the critical path — inline the above-the-fold CSS, load the rest with a non-blocking pattern. CSS is also implicitly render-blocking for any deferred script that follows it.</>,
              <><strong>Reflow (layout)</strong> — changing geometry (<InlineCode>width</InlineCode>, <InlineCode>height</InlineCode>, <InlineCode>top</InlineCode>, <InlineCode>font-size</InlineCode>, adding a node) forces the browser to recompute box positions, and because boxes affect their siblings and children it can cascade across the page, then re-paint, then re-composite. The most expensive path. Animating <InlineCode>width</InlineCode> runs this <em>every frame</em>.</>,
              <><strong>Repaint</strong> — changing a paint-only property (<InlineCode>color</InlineCode>, <InlineCode>background-color</InlineCode>, <InlineCode>box-shadow</InlineCode>) skips layout but still re-rasterizes pixels for the affected layer. <strong>Composite-only</strong> — <InlineCode>transform</InlineCode> and <InlineCode>opacity</InlineCode> change only how an existing, already-painted layer is positioned/blended by the GPU. No layout, no paint. This is the only path that reliably holds 60fps.</>,
              <>The why, concretely: animate a sidebar open with <InlineCode>width: 0 → 300px</InlineCode> and every frame is a full reflow of everything next to it — on a mid-range phone that's dropped frames and visible stutter. Animate the same motion with <InlineCode>transform: translateX(-300px) → 0</InlineCode> and it's compositor-only, runs on the GPU, stays smooth. Same visual result, completely different cost profile. "React is janky" is usually this.</>,
            ]}
          />
        </TopicCard>
        <RenderPipeline />
        <Card>
          <h4 className="mb-3 font-semibold">The rendering failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Layout thrash (forced synchronous reflow)</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                The browser batches layout — it wants to do one reflow per frame. But reading a geometric property (<InlineCode>offsetWidth</InlineCode>, <InlineCode>getBoundingClientRect</InlineCode>, <InlineCode>scrollTop</InlineCode>) forces it to flush <em>now</em> so the answer is correct. A loop that does <em>write → read → write → read</em> over a list of elements triggers a fresh full reflow on every iteration — O(n) layouts instead of one.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: batch all reads, then all writes (read-then-write, never interleaved). This is what libraries like FastDOM do, and what React's render/commit split is partly for.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Long task blocks the frame</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Rendering and your JS share one thread. A 200ms synchronous loop (parsing a big JSON, a heavy render) means the browser physically cannot produce a frame or respond to a click for 200ms — that's the jank, and it's what the INP Web Vital measures.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: break the work up (yield to the browser between chunks), or move pure CPU work to a Web Worker (8.7) so the main thread stays free to render and handle input. The compositor can still scroll a composite-only animation even while the main thread is busy — another reason transform/opacity animations survive jank.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Rule of thumb: to find what a style change costs, ask which stage it re-enters — layout (worst), paint (bad), composite (cheap). Animate <InlineCode>transform</InlineCode>/<InlineCode>opacity</InlineCode>, never <InlineCode>width</InlineCode>/<InlineCode>top</InlineCode>; promote a heavily-animated element to its own layer with <InlineCode>will-change: transform</InlineCode> (sparingly — each layer costs GPU memory). SSR/SEO rendering strategy is a different question — that's L10.
          </p>
        </Card>
      </Section>

      <Section id="sw" kicker="8.6" title="Service Workers & PWA">
        <TopicCard
          layerId={L}
          index={5}
          title="A scriptable proxy that lives in the browser"
          description="A service worker is a JS file that sits between your page and the network — every fetch your app makes can be intercepted, served from cache, or rewritten. It's a reverse proxy you ship to the client. That power is also the danger: it's the one piece of code that can keep serving a stale version of your app after you've deployed a fix."
        >
          <Bullets
            items={[
              <>Lifecycle: <strong>install</strong> (pre-cache your asset shell) → <strong>activate</strong> (the new worker takes control; purge old caches here) → <strong>fetch</strong> (proxy every request) → idle (the browser kills it to save memory and respawns it on the next event — so a SW holds <em>no</em> in-memory state between events).</>,
              <>The gotcha that bites everyone: by default a new SW <strong>waits</strong> — it installs but doesn't activate until every tab using the old one is closed. So a user with your site pinned can run a weeks-old worker. <InlineCode>skipWaiting()</InlineCode> + <InlineCode>clients.claim()</InlineCode> forces immediate takeover, but then the new SW is serving a page that loaded against the old one — version your caches and design for it.</>,
              <>Cache strategy by resource: <strong>cache-first</strong> for content-hashed immutable assets (<InlineCode>app.a1b2c3.js</InlineCode> — the URL changes when the content does, so a stale hit is impossible). <strong>Network-first</strong> for HTML (you want the latest, fall back to cache offline). <strong>Stale-while-revalidate</strong> for API data you can tolerate being a few seconds old — serve cache instantly, refresh in the background.</>,
              <>Cache-first on a URL that <em>isn't</em> content-hashed is the classic SW bug: you cache <InlineCode>/app.js</InlineCode>, deploy a fix, and users keep getting the old file forever because the SW never asks the network again. The <InlineCode>activate</InlineCode> handler deleting old cache versions is not optional cleanup — it's how you ship updates.</>,
              <>PWA = web app manifest (name, icons, <InlineCode>start_url</InlineCode>, <InlineCode>display</InlineCode>) + a service worker + HTTPS. That trio makes the browser offer "install to home screen" and run it in a standalone window. It's only worth the maintenance cost when offline use or home-screen presence is a real product requirement — a service worker you ship and forget is a stale-content bug with a countdown.</>,
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
          description="Most of these existed as npm packages first, then the browser absorbed them. Reaching for the platform API instead means zero bundle cost, no dependency to maintain, and native performance — but it also means feature-detecting and degrading gracefully, because support is uneven for the newer ones."
        >
          <WebApiGrid />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">Why these beat the library — and where they bite</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Observers replace scroll/resize handlers</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                The old way to lazy-load or trigger on-scroll was a <InlineCode>scroll</InlineCode> listener calling <InlineCode>getBoundingClientRect</InlineCode> on every event — which forces synchronous layout (see 8.5's layout thrash) dozens of times a second. <InlineCode>IntersectionObserver</InlineCode> moves that calculation off the main thread: the browser tells you when an element crosses the viewport, batched and cheap. <InlineCode>ResizeObserver</InlineCode> does the same for element size, which is what makes container queries possible.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Workers, WebAuthn, View Transitions</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                <strong>Web Workers</strong> run JS on a separate thread — the only real fix for a CPU task that would otherwise block rendering (8.5); the cost is they can't touch the DOM and you talk to them by message-passing. <strong>WebAuthn</strong> is passwordless via a hardware key or biometric — the credential is bound to your origin, so it's phishing-resistant by construction. <strong>View Transitions</strong> animate between DOM states with the compositor instead of hand-written JS animation.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            The discipline: feature-detect (<InlineCode>{"if ('IntersectionObserver' in window)"}</InlineCode>), then enhance — never assume. Some APIs (Background Sync, File System Access, Periodic Sync) are still Chromium-only, so they must be a progressive enhancement, not a load-bearing dependency. The payoff is real: every API you use from the platform is one you don't ship, version, or patch.
          </p>
        </Card>
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
