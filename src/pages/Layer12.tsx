import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Mail, CreditCard, Webhook, Radio, Clock, Coins, KeyRound, Play, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 12;

export default function Layer12() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="oauth" kicker="12.1" title="OAuth 2.0 Authorization Code + PKCE">
        <TopicCard
          layerId={L}
          index={0}
          title="The flow every SaaS implements"
          description="The recommended flow for SPAs and mobile. PKCE protects against authorization-code interception by binding the code to a per-request secret only the original client knows."
        >
          <Bullets
            items={[
              <>The attack PKCE defeats: the auth code comes back on a redirect URL. A malicious app registered for the same custom scheme, a leaky referer header, or a logged URL can <em>steal that code</em>. Without PKCE, whoever holds the code can exchange it for tokens. PKCE makes a stolen code worthless on its own.</>,
              <>Mechanism: the client generates a random <InlineCode>code_verifier</InlineCode>, sends only <InlineCode>code_challenge = base64url(SHA256(verifier))</InlineCode> with <InlineCode>/authorize</InlineCode>. At <InlineCode>/token</InlineCode> it presents the raw verifier; the server re-hashes and compares. The attacker has the code but not the verifier — the hash is one-way.</>,
              <>Why a client secret can't save a public client: a SPA or mobile binary ships to the user. Anyone can crack it open and read an embedded secret, so it's not secret. PKCE replaces a <em>static shared</em> secret with a <em>per-request</em> one generated fresh client-side — nothing to extract from the bundle.</>,
              <>Always <InlineCode>code_challenge_method=S256</InlineCode>, never <InlineCode>plain</InlineCode>: with <InlineCode>plain</InlineCode> the challenge <em>is</em> the verifier, so intercepting the <InlineCode>/authorize</InlineCode> request hands over both. The auth code is single-use and ~30–60s lived — a replayed exchange fails because the code is already spent.</>,
              <>Token storage: refresh token in an <InlineCode>httpOnly</InlineCode> + <InlineCode>Secure</InlineCode> cookie, access token in memory only. Access token in <InlineCode>localStorage</InlineCode> = any XSS payload reads it (see L9). Implicit flow (token straight in the redirect fragment) is dead — it has no exchange step to protect.</>,
            ]}
          />
          <OAuthPkceFlow />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">PKCE vs client secret — when each</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">PKCE — public clients</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Anything that runs on the user's device: SPA, mobile app, desktop app, CLI. There is no trusted place to keep a secret, so the client proves itself with a fresh per-request verifier instead. This is now the recommended default for <em>all</em> clients in OAuth 2.1, even confidential ones.
              </p>
            </div>
            <div className="rounded-xl border border-violet-400/30 bg-violet-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-violet-300">Client secret — confidential clients</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Server-to-server only: your backend talking to an IdP, where the secret lives in env/secrets manager and never leaves the box. Use it <em>in addition to</em> PKCE, not instead — the secret authenticates the app, PKCE binds the specific request.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Rule of thumb: if the code ships to the user, assume the secret is public. The question is never "is my client confidential or public" but "can an attacker read this string" — and for anything in a browser or app bundle, they can.
          </p>
        </Card>
        <CodePlayground
          mode="js"
          height={240}
          title="Generate a PKCE verifier + challenge"
          initial={`// Step 1: code_verifier = random 43-128 char string [A-Z a-z 0-9 - . _ ~]
const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
  .map(b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[b % 64])
  .join('');

// Step 2: code_challenge = base64url( SHA256(verifier) )
const enc = new TextEncoder().encode(verifier);
const hash = await crypto.subtle.digest('SHA-256', enc);
const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
  .replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_');

console.log('verifier (keep secret):', verifier);
console.log('challenge (send in /authorize):', challenge);

// Then redirect to:
//   /authorize?response_type=code&client_id=...&redirect_uri=...&code_challenge=' + challenge + '&code_challenge_method=S256
// On callback, POST /token with the verifier — server hashes it and checks it matches.`}
        />
      </Section>

      <Section id="reset" kicker="12.2" title="Password Reset, Email Verification, MFA">
        <TopicCard
          layerId={L}
          index={1}
          title="The auth flows you'll actually build"
          description="The signup flow is half a product on its own — verification email, magic link expiry, MFA enrolment, recovery codes. Get it wrong and your support inbox fills up."
        >
          <Bullets
            items={[
              <><strong>Account-existence leak:</strong> <InlineCode>POST /forgot-password</InlineCode> must return the same 200 + "check your email" for a known and unknown address. A 404 on unknown emails turns the endpoint into a free membership oracle — feed it a breach list and you've enumerated every user. Same logic on signup ("email already taken") and login timing.</>,
              <><strong>Raw token out, hashed token stored:</strong> the reset token is a bearer credential — treat it like a password. Email the raw <InlineCode>crypto.randomBytes(32)</InlineCode>; store only its SHA-256 + <InlineCode>user_id</InlineCode> + <InlineCode>expires_at</InlineCode>. A DB leak then exposes hashes, not live reset links. Short expiry (15–30 min) caps the replay window if the email is intercepted.</>,
              <><strong>The step everyone forgets:</strong> after a successful reset, delete the reset row <em>and invalidate every existing session</em>. If an attacker reset the password <em>because</em> they were already in, skipping this leaves their session alive — the reset achieved nothing. Then send a "password changed" notice with a revert link so the real owner notices a hijack.</>,
              <><strong>Email verification ≠ ownership forever:</strong> verify on signup, but also re-verify on email <em>change</em> — and keep sending to the old address until the new one is confirmed, or an attacker who briefly controls the account redirects all future mail to themselves.</>,
              <><strong>MFA without recovery codes is a lockout machine:</strong> lost-device is the #1 MFA support ticket. Issue 8–10 single-use recovery codes at enrolment, store them hashed like passwords. SMS is a last-resort factor only — SIM-swap defeats it, and it's a network dependency you don't control.</>,
            ]}
          />
          <ResetFlow />
          <MfaPicker />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">TOTP vs WebAuthn — when each</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">WebAuthn / passkeys — phishing-resistant</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                The credential is bound to your origin by the browser — a lookalike domain simply can't trigger it, so phishing the second factor is structurally impossible. Private key never leaves the authenticator. Best UX and best security; the modern default for new SaaS. Cost: device/browser support edge cases and a more involved enrolment flow.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">TOTP — solid, cheap, universal</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A shared seed + RFC 6238 time-stepped code. No phone-network dependency, works with any authenticator app. But it <em>is</em> phishable — a real-time proxy phishing page relays the 6 digits before they expire. Safe default for most products; pair it with a path toward passkeys.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Default to TOTP for breadth today, offer WebAuthn for users who want it. The failure mode that bites either way: no recovery path. A second factor you can't recover from is a denial-of-service on your own users.
          </p>
        </Card>
      </Section>

      <Section id="jobs" kicker="12.3" title="Background Jobs & Queues">
        <TopicCard
          layerId={L}
          index={2}
          title="Anything slow goes through a queue"
          description="Email, image resize, PDF gen, billing — anything > 100ms or that can fail and retry. Idempotency + exponential backoff + dead-letter is the default recipe."
        >
          <Bullets
            items={[
              <><strong>Why off the request path:</strong> a 3-second PDF render in the handler holds a connection, a worker thread, and the user's patience hostage. Worse, if it fails, the user retries — and now you're doing the slow thing twice with no record. The queue gives you a durable record, retries you control, and a fast 202 to the user.</>,
              <><strong>At-least-once means the job WILL run twice.</strong> The worker crashes after sending the email but before ACKing → redelivery → second email. The fix is not "make delivery exactly-once" (you can't) — it's an idempotent worker: dedupe on a business key (<InlineCode>order_id</InlineCode>), or check-and-set a <InlineCode>processed_jobs</InlineCode> row before the side effect.</>,
              <><strong>Jitter prevents the synchronized retry storm.</strong> A downstream API goes down; 5,000 jobs fail at the same instant. With pure exponential backoff they <em>all</em> retry at exactly <InlineCode>t+2s</InlineCode>, then <InlineCode>t+4s</InlineCode> — synchronized waves that re-knock the service over the moment it recovers. <InlineCode>backoff = base · 2^attempt + rand(0, base·2^attempt)</InlineCode> smears the herd across the window.</>,
              <><strong>Cap retries, then dead-letter.</strong> A poison job — malformed payload, deleted resource — will fail forever. Without a cap it loops, burning the worker pool. After N attempts (≈4) it moves to a dead-letter queue: a quarantine for human triage, not a black hole. You <em>page on dead-letter depth</em>, not on individual failures — one failure is noise, a growing DLQ is an incident.</>,
              <><strong>Visibility timeout is a footgun:</strong> if a job legitimately takes longer than the broker's invisibility window, the broker assumes the worker died and redelivers — now two workers run the same job concurrently. Size the timeout to the realistic worst-case duration, or heartbeat to extend it.</>,
            ]}
          />
          <JobQueueDemo />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The retry failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Thundering herd on recovery</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                No jitter → every failed job retries on the same tick. The recovering service gets hit by the full backlog at once and falls over again. This is the same shape as the cache stampede in L5.4 — synchronized clients amplifying one event. Jitter is the cure in both.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">The duplicate side effect</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Crash-after-side-effect-before-ACK → redelivery → the customer gets charged / emailed / shipped twice. The job body being identical doesn't help; the <em>effect</em> is what duplicates. Make the side effect itself idempotent, keyed to a business event, or wrap it in a dedup check.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Default recipe: idempotent worker + exponential backoff + jitter + capped attempts + dead-letter you alert on. Queue choice (RabbitMQ work-queue vs Kafka log) and broker internals live in L5.5 — here it's the operational discipline around them.
          </p>
        </Card>
      </Section>

      <Section id="webhooks" kicker="12.4" title="Webhooks (sending and receiving)">
        <TopicCard
          layerId={L}
          index={3}
          title="HTTP callbacks that won't bite back"
          description="Every webhook needs: HMAC signature, timestamp (replay defence), idempotency key, retry policy on the sender, dead-letter on the receiver."
        >
          <Bullets
            items={[
              <><strong>The webhook endpoint is an untrusted boundary.</strong> Anyone on the internet can <InlineCode>POST</InlineCode> to your <InlineCode>/webhook</InlineCode> URL pretending to be Stripe. <em>Verify the HMAC signature before doing any work</em> — recompute <InlineCode>HMAC-SHA256(secret, timestamp + "." + raw_body)</InlineCode> and constant-time compare. Verify on the <em>raw bytes</em>, not the re-serialized JSON — key reordering changes the hash.</>,
              <><strong>Signature alone doesn't stop replay.</strong> A valid past payload, captured and re-sent, has a valid signature. That's why the timestamp is signed too: reject if drift &gt; ~5 min. The timestamp inside the signed region can't be tampered without breaking the signature.</>,
              <><strong>At-least-once delivery → the duplicate-order bug.</strong> The sender doesn't get your 2xx (network blip, your slow response) and retries. Your handler runs <InlineCode>order.paid</InlineCode> twice → two orders, two fulfilments. Dedupe on the event ID or a business key with a unique constraint — the second insert fails harmlessly and you return 200.</>,
              <><strong>Return 2xx fast, process async.</strong> Do the signature check, enqueue, return 200 in milliseconds. If you do the real work inline and it takes 30s, the sender times out, marks it failed, and retries — now you're processing a slow job twice. Ack-then-work, never work-then-ack.</>,
              <><strong>Sending side:</strong> sign every payload, include a timestamp and an idempotency key, retry non-2xx with backoff + jitter, dead-letter after N attempts. Document the scheme like Stripe (<InlineCode>Stripe-Signature</InlineCode>) or GitHub (<InlineCode>X-Hub-Signature-256</InlineCode>) so receivers can verify.</>,
            ]}
          />
          <WebhookSignatureDemo />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">Webhook vs polling — and why you need both</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Webhook — timely, push</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                The provider tells you the instant something happens — no wasted polls, low latency. But a webhook is a single delivery attempt over a flaky network: your endpoint was down for a deploy, the retry budget ran out, the event is silently lost. You cannot assume every webhook arrives.
              </p>
            </div>
            <div className="rounded-xl border border-violet-400/30 bg-violet-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-violet-300">Reconciliation poll — the safety net</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A periodic job that lists "events since last cursor" from the provider's API and fills gaps the webhooks missed. Slow but complete. Webhook for speed, poll for completeness — production payment systems run both, and the poll is what catches the dropped <InlineCode>payment_intent.succeeded</InlineCode>.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            The mental model: a webhook is a best-effort notification, not a guaranteed message bus. Build the happy path on webhooks, build the audit/recovery path on a poll, and make both idempotent so running them over the same event is a no-op.
          </p>
        </Card>
      </Section>

      <Section id="realtime" kicker="12.5" title="Real-Time: WebSocket vs SSE vs Polling">
        <TopicCard
          layerId={L}
          index={4}
          title="Pick the smallest hammer"
          description="Most 'real-time' features ship fine on SSE or smart polling. Reach for WebSockets when you need bi-directional streams or sub-second latency."
        >
          <Bullets
            items={[
              <><strong>SSE is one-way over plain HTTP</strong> — a long-lived <InlineCode>text/event-stream</InlineCode> response. It gets auto-reconnect and a <InlineCode>Last-Event-ID</InlineCode> resume cursor <em>for free</em>, and rides through proxies, CDNs, and HTTP/2 like any other request. The cost: server→client only, text only, and on HTTP/1.1 it eats one of the browser's ~6 connections per origin (HTTP/2 multiplexing removes that).</>,
              <><strong>WebSockets are bi-directional and stateful</strong> — and stateful is the word that costs you. The connection lives on one server process. Scale past one box and you've signed up for sticky sessions <em>or</em> a pub/sub fan-out layer (Redis, NATS) so a message published on server B reaches a client pinned to server A. That infra is the real price, not the protocol.</>,
              <><strong>Polling's failure mode is waste, not breakage.</strong> 10k clients polling every 5s = 2k req/s of mostly-304s, burning bandwidth and mobile battery. It's the <em>right</em> call when data changes on the order of minutes — no connection state, no fan-out layer, trivially cacheable. Don't reach for a socket to avoid a poll that was fine.</>,
              <><strong>Reconnection is the part demos skip.</strong> Connections drop — laptop sleeps, wifi switches, load balancer recycles. SSE reconnects itself and replays from <InlineCode>Last-Event-ID</InlineCode>; with WebSockets you build reconnect-with-backoff and a resume protocol yourself, or the client silently goes stale and the user sees frozen data with no error.</>,
              <><strong>The common mistake: WebSockets to push a notification.</strong> A one-way server→client event — "your export is ready", a feed update — is exactly SSE's job. Choosing WebSockets there buys you the sticky-session/fan-out tax for a capability you never use.</>,
            ]}
          />
          <RealtimeComparator />
        </TopicCard>
      </Section>

      <Section id="email" kicker="12.6" title="Email Deliverability (SPF / DKIM / DMARC)">
        <TopicCard
          layerId={L}
          index={5}
          title="Why your transactional emails go to spam"
          description="Three TXT records in DNS decide whether Gmail trusts your domain. Get the trio right and inbox placement jumps overnight."
        >
          <Bullets
            items={[
              <><strong>SPF answers "is this server allowed to send as me?"</strong> — a DNS TXT list of permitted IPs/includes. It checks the SMTP envelope sender, <em>not</em> the visible <InlineCode>From:</InlineCode>, so it breaks on forwarding (the forwarder's IP isn't on your list). Prefer <InlineCode>-all</InlineCode> (hard fail) over <InlineCode>~all</InlineCode> (soft fail); and SPF has a hard 10-DNS-lookup limit — chain too many <InlineCode>include:</InlineCode>s and the whole record silently fails.</>,
              <><strong>DKIM answers "was this message tampered with in transit?"</strong> — the sending server signs headers + body with a private key; receivers verify against a public key in your DNS. Because the signature travels <em>with</em> the message, DKIM survives forwarding where SPF doesn't. The provider usually manages key rotation.</>,
              <><strong>DMARC ties the two to the visible From and sets policy.</strong> It requires SPF <em>or</em> DKIM to pass <em>and</em> align with the <InlineCode>From:</InlineCode> domain — that alignment check is what actually stops spoofing. It also tells receivers what to do on failure and where to send aggregate reports.</>,
              <><strong>The rollout failure mode: jumping straight to <InlineCode>p=reject</InlineCode>.</strong> If a legitimate sender (your CRM, a support tool, your own staging box) isn't covered yet, <InlineCode>reject</InlineCode> bins their mail instantly. Roll out <InlineCode>p=none</InlineCode> (monitor, read the reports) → <InlineCode>quarantine</InlineCode> → <InlineCode>reject</InlineCode>, weeks apart, only advancing once reports are clean.</>,
              <><strong>Auth gets you delivered, not trusted.</strong> Passing SPF/DKIM/DMARC means you're <em>allowed</em> in — reputation (engagement, complaint rate, bounce rate) decides inbox vs spam folder. The records are necessary, not sufficient.</>,
            ]}
          />
          <EmailAuthExplainer />
          <DeliverabilityChecklist />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">Shared vs dedicated sending IP — when each</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Shared IP — under ~50k/month</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                You sit on the provider's pool, riding their already-warm reputation. Low volume on a dedicated IP is actually <em>worse</em> — receivers distrust an IP with no consistent history, and a trickle never builds one. The risk: a bad neighbour on the pool can dent your placement, but reputable providers police this hard.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Dedicated IP — high, steady volume</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Above ~50k/month <em>and</em> consistent: your reputation is yours alone, no neighbours. But you must warm it slowly (≈50 → 1k/day over weeks) or receivers throttle the sudden volume, and if you can't keep the volume steady the reputation decays between sends.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            And isolate by purpose: send transactional mail from a dedicated subdomain (<InlineCode>mail.app.com</InlineCode>) so a marketing-campaign complaint spike never drags your password-reset emails into the spam folder. Reputation is scoped to the domain — don't pool the critical mail with the risky mail.
          </p>
        </Card>
      </Section>

      <Section id="payments" kicker="12.7" title="Payments (Stripe pattern)">
        <TopicCard
          layerId={L}
          index={6}
          title="Idempotency keys, webhooks, PCI scope"
          description="Take payments on the client with Stripe Elements; never let card numbers touch your server (PCI scope explosion). Use idempotency keys on every charge — payment retries are unforgiving."
        >
          <Bullets
            items={[
              <><strong>Card data never touches your origin.</strong> Stripe.js / Elements tokenizes the PAN in the browser; your server only ever sees a <InlineCode>pm_xxx</InlineCode> handle. That single decision keeps you at PCI scope <InlineCode>SAQ A</InlineCode> (a short self-assessment) instead of a full audit — the moment a raw card number hits your logs or DB, your compliance scope explodes.</>,
              <><strong>The idempotency key must be a business event ID, not <InlineCode>Date.now()</InlineCode>.</strong> The whole point is that a <em>retry</em> reuses the <em>same</em> key so Stripe returns the original charge instead of making a second one. <InlineCode>Date.now()</InlineCode> is different on every call — the retry gets a fresh key and you double-charge. Use <InlineCode>order_&lt;id&gt;_charge</InlineCode>: stable across retries, unique across orders.</>,
              <><strong>Webhooks are the source of truth, not the redirect.</strong> The post-payment browser redirect can be lost — user closes the tab, network drops, mobile backgrounds the app. The order would then be paid at Stripe but never marked paid in your DB. <InlineCode>payment_intent.succeeded</InlineCode> (verified signature) is what flips the order to paid and enqueues fulfilment.</>,
              <><strong>That webhook handler must be idempotent too.</strong> Stripe delivers at-least-once — the same <InlineCode>payment_intent.succeeded</InlineCode> can arrive twice. Mark-paid-and-fulfil keyed to the payment intent ID, behind a unique constraint, or the customer gets shipped twice off one payment.</>,
              <><strong>Don't build 3DS / SCA yourself.</strong> The <InlineCode>requires_action</InlineCode> state and the bank challenge UI are handled by Stripe.js. Your job is to react to the resulting webhook, not to reimplement the card-network flow.</>,
            ]}
          />
          <StripeFlow />
          <CodePlayground
            mode="js"
            height={220}
            title="Idempotent payment intent creation"
            initial={`// Same idempotency key = Stripe returns the SAME intent, never creates a duplicate.
async function chargeCustomer(orderId, amountCents) {
  const idempotencyKey = 'order_' + orderId + '_charge';

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_test_xxx',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': idempotencyKey,
    },
    body: 'amount=' + amountCents + '&currency=usd&customer=cus_xxx',
  });

  return res.json();
}

console.log('Even if this runs 3× because of a retry,');
console.log('Stripe charges exactly once. Use the order ID, not Date.now().');`}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The two payment failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Double charge from a retry</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Your <InlineCode>POST /payment_intents</InlineCode> call times out — but Stripe actually processed it; you just never got the response. Your code retries. Without a stable idempotency key, that's a second real charge. With one, Stripe recognizes the key and returns the original intent. This is the at-least-once duplicate bug from L12.3, with money attached.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Paid at Stripe, unpaid in your DB</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                You marked the order paid on the success redirect. The redirect was lost. Now the customer was charged and has nothing — a support ticket and a refund. The fix is structural: the verified webhook is the only thing that flips the order state, and a reconciliation poll catches any webhook that was itself dropped.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Both failure modes come from treating an unreliable channel (an HTTP response, a browser redirect) as reliable. Idempotency keys make the charge safe to repeat; webhooks-as-truth makes the fulfilment safe to miss-and-recover.
          </p>
        </Card>
      </Section>

      <Section id="time" kicker="12.8" title="Time, Money, Units, i18n traps">
        <TopicCard
          layerId={L}
          index={7}
          title="The bug magnets"
          description="UTC always in storage. Integers (cents) for money. Plurals are not 'add s'. Time zones are political, not mathematical."
        >
          <Bullets
            items={[
              <><strong>Store UTC + the IANA timezone <em>name</em>, never a GMT offset.</strong> An offset like <InlineCode>+07:00</InlineCode> is a fact about one instant, not a place — DST means the same location shifts offset twice a year. Store <InlineCode>Asia/Bangkok</InlineCode> and convert at display, or a recurring "9am meeting" silently moves an hour when the clocks change.</>,
              <><strong>Floats can't represent most decimals.</strong> <InlineCode>0.1 + 0.2 === 0.30000000000000004</InlineCode> — base-2 can't hold 0.1 exactly, and the error compounds over a sum of line items. Store money as integers in the smallest unit (cents), do all arithmetic there, format only at display. Stripe does exactly this — match it.</>,
              <><strong>A bare amount is half a value.</strong> <InlineCode>1000</InlineCode> is meaningless without a currency — and the smallest unit isn't universal: JPY has no minor unit (¥1000 = <InlineCode>1000</InlineCode>), KWD has three decimals (<InlineCode>1000</InlineCode> = 1 dinar). Carry <InlineCode>{`{ amount, currency }`}</InlineCode> together as one Money type, or you've planted a second bug class.</>,
              <><strong>Plurals are not "add s".</strong> Russian has one/few/many, Arabic has six forms, Japanese has none. <InlineCode>count + " items"</InlineCode> is unfixable for translators. Use <InlineCode>Intl.PluralRules</InlineCode> + ICU MessageFormat so the <em>language</em> decides the form, not your string concat.</>,
              <><strong>These pass every demo.</strong> The developer, the test data, and the reviewer are all in one timezone, one currency, one language — so the bug only fires for a real user somewhere else. That's what makes this class insidious: it's invisible until it's a production incident for someone you can't reproduce.</>,
            ]}
          />
          <TimeZoneDemo />
          <MoneyMath />
          <PluralRules />
        </TopicCard>
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 12 Quiz">
        <Quiz id="L12" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-rose-500/10 via-bg-card to-fuchsia-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white">L12</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Productionisation</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">The boring parts that make money</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Auth that doesn't lock users out. Jobs that don't lose work. Webhooks that survive a retry storm.
          Emails that reach the inbox. Payments that charge exactly once. Time and money done right.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Rocket className="h-4 w-4 text-rose-400" />
          8 topics · 9 visualizers · 2 playgrounds · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

const PKCE_STEPS = [
  { actor: 'Browser', text: 'User clicks "Sign in"', detail: 'App generates code_verifier (random) and code_challenge = SHA256(verifier)' },
  { actor: 'Browser → IdP', text: 'GET /authorize?...&code_challenge=X&code_challenge_method=S256', detail: 'No client secret. Just the challenge.' },
  { actor: 'IdP', text: 'User logs in + consents', detail: 'Identity provider authenticates the user' },
  { actor: 'IdP → Browser', text: 'Redirect to /callback?code=AUTH_CODE', detail: 'Authorization code is short-lived (~30s)' },
  { actor: 'Browser → IdP', text: 'POST /token with code + code_verifier', detail: 'IdP hashes verifier, checks it matches the original challenge' },
  { actor: 'IdP → Browser', text: 'access_token + refresh_token', detail: 'Refresh in HttpOnly cookie. Access in memory.' },
  { actor: 'Browser → API', text: 'Authorization: Bearer access_token', detail: 'Use the access token until it expires' },
];

function OAuthPkceFlow() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto) return;
    if (step >= PKCE_STEPS.length - 1) { setAuto(false); return; }
    const id = setTimeout(() => setStep((s) => s + 1), 1400);
    return () => clearTimeout(id);
  }, [auto, step]);
  const cur = PKCE_STEPS[step];
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">OAuth 2.0 Authorization Code + PKCE</h4>
        <div className="flex gap-2">
          <button onClick={() => { setStep(0); setAuto(true); }} className="btn-primary h-8 text-xs"><Play className="h-3 w-3" /> Play</button>
          <button onClick={() => { setAuto(false); setStep(0); }} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {['Browser', 'Identity Provider', 'API'].map((label, i) => {
          const active = cur.actor.includes(label.split(' ')[0]);
          return (
            <div key={label} className={cn('rounded-xl border p-3 text-center text-sm', active ? 'border-accent bg-accent/10' : 'border-white/5 bg-bg-soft/40 text-ink-dim')}>
              {label}
            </div>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-xl border border-white/5 bg-bg-soft/40 p-4">
          <div className="font-mono text-xs text-accent-cyan">step {step + 1} / {PKCE_STEPS.length} · {cur.actor}</div>
          <div className="mt-1 text-base font-medium">{cur.text}</div>
          <div className="mt-1 text-sm text-ink-dim">{cur.detail}</div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PKCE_STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={cn('rounded-md border px-2 py-1 font-mono text-[11px]', step === i ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </Card>
  );
}

function ResetFlow() {
  const [step, setStep] = useState(0);
  const steps = [
    { name: 'POST /forgot-password', detail: 'Always return 200, even for unknown emails (don\'t leak account existence).' },
    { name: 'Generate token', detail: 'crypto.randomBytes(32). Hash and store in DB with user_id + expires_at (15-30 min).' },
    { name: 'Email link', detail: 'https://app.com/reset?token=RAW_TOKEN. RAW_TOKEN is what you sent; HASHED is what you stored.' },
    { name: 'GET /reset?token=...', detail: 'Server hashes token, looks up. If valid + unexpired, render form.' },
    { name: 'POST /reset', detail: 'Verify token, update password (argon2id), delete reset row, invalidate all existing sessions.' },
    { name: 'Notify user', detail: 'Send "your password was changed" email with revert link in case it wasn\'t them.' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><KeyRound className="h-4 w-4" /> <h4 className="font-semibold">Password reset flow (do it right)</h4></div>
      <div className="space-y-1">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={cn('block w-full rounded-lg border px-3 py-2 text-left text-sm', step === i ? 'border-accent bg-accent/10' : 'border-white/5 bg-bg-soft/30')}
          >
            <span className="font-mono text-xs text-ink-faint">{i + 1}. </span>
            <span className="font-medium">{s.name}</span>
            <div className="mt-0.5 text-xs text-ink-dim">{s.detail}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function MfaPicker() {
  const [pick, setPick] = useState<'sms' | 'totp' | 'webauthn' | 'magic' | 'recovery'>('totp');
  const data = {
    sms:      { name: 'SMS code',          security: 1, ux: 4, cost: 2, notes: 'Vulnerable to SIM swap. Last resort.' },
    totp:     { name: 'TOTP (Authy/Google Auth)', security: 4, ux: 3, cost: 1, notes: 'Default for most products. RFC 6238.' },
    webauthn: { name: 'WebAuthn / Passkeys', security: 5, ux: 5, cost: 1, notes: 'Phishing-resistant. Modern default for new SaaS.' },
    magic:    { name: 'Magic link',        security: 3, ux: 3, cost: 1, notes: 'No password = no leak. Email is the weak link.' },
    recovery: { name: 'Recovery codes',    security: 4, ux: 2, cost: 1, notes: 'Always offer 8-10 single-use codes alongside MFA.' },
  };
  const cur = data[pick];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">MFA mechanism comparator</h4>
      <div className="mb-3 flex flex-wrap gap-2">
        {(['totp', 'webauthn', 'magic', 'sms', 'recovery'] as const).map((k) => (
          <button key={k} onClick={() => setPick(k)} className={cn('rounded-md border px-2.5 py-1 text-xs', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
            {data[k].name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Security" value={'★'.repeat(cur.security) + '☆'.repeat(5 - cur.security)} />
        <Stat label="UX" value={'★'.repeat(cur.ux) + '☆'.repeat(5 - cur.ux)} />
        <Stat label="Cost" value={'$'.repeat(cur.cost)} />
      </div>
      <p className="mt-3 text-sm text-ink-dim">{cur.notes}</p>
    </Card>
  );
}

type Job = { id: number; payload: string; attempts: number; status: 'queued' | 'running' | 'done' | 'failed' | 'dead'; nextAt?: number };

function JobQueueDemo() {
  const [jobs, setJobs] = useState<Job[]>([
    { id: 1, payload: 'send welcome email', attempts: 0, status: 'queued' },
    { id: 2, payload: 'generate invoice PDF', attempts: 0, status: 'queued' },
  ]);
  const [counter, setCounter] = useState(3);

  const tick = () => {
    setJobs((arr) => arr.map((j) => {
      if (j.status === 'queued' && (!j.nextAt || j.nextAt <= Date.now())) {
        return { ...j, status: 'running' };
      }
      if (j.status === 'running') {
        const fail = Math.random() < 0.3;
        if (fail) {
          const next = j.attempts + 1;
          if (next >= 4) return { ...j, status: 'dead', attempts: next };
          const backoff = 2 ** next * 200; // exponential
          const jitter = Math.random() * backoff * 0.3;
          return { ...j, status: 'queued', attempts: next, nextAt: Date.now() + backoff + jitter };
        }
        return { ...j, status: 'done' };
      }
      return j;
    }));
  };

  const enqueue = () => {
    setJobs((arr) => [...arr, { id: counter, payload: 'task #' + counter, attempts: 0, status: 'queued' }]);
    setCounter((c) => c + 1);
  };

  const reset = () => {
    setJobs([
      { id: 1, payload: 'send welcome email', attempts: 0, status: 'queued' },
      { id: 2, payload: 'generate invoice PDF', attempts: 0, status: 'queued' },
    ]);
    setCounter(3);
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Job queue with retry + dead-letter</h4>
        <div className="flex gap-2">
          <button onClick={enqueue} className="btn-ghost h-8 text-xs">+ enqueue</button>
          <button onClick={tick} className="btn-primary h-8 text-xs"><Play className="h-3 w-3" /> tick worker</button>
          <button onClick={reset} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="space-y-1">
        <AnimatePresence>
          {jobs.map((j) => {
            const tone = j.status === 'done' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : j.status === 'running' ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' : j.status === 'dead' ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200';
            return (
              <motion.div key={j.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('flex items-center justify-between rounded-lg border px-3 py-2 text-sm', tone)}>
                <div>
                  <span className="font-mono text-[11px] text-ink-faint">#{j.id}</span> {j.payload}
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>attempts: {j.attempts}</span>
                  <span className="uppercase">{j.status}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        <Stat label="Queued" value={jobs.filter((j) => j.status === 'queued').length} />
        <Stat label="Running" value={jobs.filter((j) => j.status === 'running').length} />
        <Stat label="Done" value={jobs.filter((j) => j.status === 'done').length} />
        <Stat label="Dead-letter" value={jobs.filter((j) => j.status === 'dead').length} sub="page on this" />
      </div>
      <p className="mt-3 text-xs text-ink-faint">Backoff: 200ms × 2^attempt + jitter. Cap retries (4 here). Dead-letter queue holds give-up jobs for human triage.</p>
    </Card>
  );
}

function WebhookSignatureDemo() {
  const [secret, setSecret] = useState('whsec_test_abcdef');
  const [body, setBody] = useState('{"event":"order.paid","id":"ord_42","amount":1999}');
  const [tampered, setTampered] = useState('{"event":"order.paid","id":"ord_42","amount":99}');
  const [t, setT] = useState(Math.floor(Date.now() / 1000));

  // Tiny hash for demo (NOT cryptographically secure — real impl uses HMAC-SHA256)
  const sign = (payload: string) => {
    const s = secret + t + payload;
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(16).padStart(8, '0');
  };

  const expected = sign(body);
  const tamperedSig = sign(tampered);
  const drift = Math.floor(Date.now() / 1000) - t;
  const replayOk = Math.abs(drift) < 300;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Webhook className="h-4 w-4" /> <h4 className="font-semibold">Webhook signature & replay defence</h4></div>
      <div className="space-y-2">
        <label className="block text-xs">
          <span className="mb-1 block uppercase tracking-widest text-ink-faint">Secret (server only)</span>
          <input value={secret} onChange={(e) => setSecret(e.target.value)} className="input font-mono text-xs" />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block uppercase tracking-widest text-ink-faint">Original body (signed by sender)</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className="input h-16 resize-none font-mono text-xs" />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block uppercase tracking-widest text-ink-faint">Body the receiver actually got</span>
          <textarea value={tampered} onChange={(e) => setTampered(e.target.value)} className="input h-16 resize-none font-mono text-xs" />
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-dim">Timestamp drift:</span>
          <input type="range" min={-600} max={600} value={drift} onChange={(e) => setT(Math.floor(Date.now() / 1000) - parseInt(e.target.value))} className="flex-1" />
          <span className="font-mono text-xs">{drift}s</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2">
        <div className={cn('rounded-lg border p-3 font-mono text-xs', expected === tamperedSig ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/40 bg-rose-400/10 text-rose-200')}>
          <div>signature on header: {expected}</div>
          <div>recomputed from body: {tamperedSig}</div>
          <div className="mt-1">{expected === tamperedSig ? '✓ signature matches' : '✗ signature mismatch — request tampered or wrong secret'}</div>
        </div>
        <div className={cn('rounded-lg border p-3 text-xs', replayOk ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/40 bg-rose-400/10 text-rose-200')}>
          {replayOk ? '✓ timestamp within 5 min — accept' : '✗ timestamp drift > 5 min — reject (replay defence)'}
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Real life: HMAC-SHA256 of <InlineCode>{`${'${'}timestamp${'}'}.${'${'}body${'}'}`}</InlineCode>, sent as <InlineCode>Stripe-Signature</InlineCode> / <InlineCode>X-Hub-Signature-256</InlineCode>.</p>
    </Card>
  );
}

function RealtimeComparator() {
  const cols = [
    { name: 'Polling',          dir: 'C → S',   latency: 'seconds',  cost: 'high (constant traffic)', use: 'Slow-changing dashboards', cons: 'Wasted bandwidth, bad battery' },
    { name: 'Long polling',     dir: 'C → S',   latency: 'sub-sec',  cost: 'medium',                  use: 'Fallback when WS blocked',  cons: 'Connection overhead per message' },
    { name: 'Server-Sent Events', dir: 'S → C', latency: 'sub-sec',  cost: 'low',                     use: 'Notifications, feeds',      cons: 'Browser only; no native binary' },
    { name: 'WebSockets',       dir: 'C ↔ S',   latency: 'ms',       cost: 'low (per conn)',          use: 'Chat, collab, games',       cons: 'Stateful — sticky sessions or pub/sub layer' },
    { name: 'WebTransport (QUIC)', dir: 'C ↔ S', latency: 'ms',     cost: 'low',                     use: 'Future: low-latency streams',  cons: 'Limited browser support today' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Radio className="h-4 w-4" /> <h4 className="font-semibold">Real-time mechanism comparator</h4></div>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr>
              <th className="px-4 py-2 text-left">Mechanism</th>
              <th className="px-4 py-2 text-left">Direction</th>
              <th className="px-4 py-2 text-left">Latency</th>
              <th className="px-4 py-2 text-left">Cost</th>
              <th className="px-4 py-2 text-left">Best for</th>
              <th className="px-4 py-2 text-left">Trade-off</th>
            </tr>
          </thead>
          <tbody>
            {cols.map((c) => (
              <tr key={c.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2 font-mono text-ink-dim">{c.dir}</td>
                <td className="px-4 py-2 text-ink-dim">{c.latency}</td>
                <td className="px-4 py-2 text-ink-dim">{c.cost}</td>
                <td className="px-4 py-2 text-ink-dim">{c.use}</td>
                <td className="px-4 py-2 text-xs text-ink-faint">{c.cons}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Default to SSE for one-way, WebSockets for bi-directional. Polling is fine when your data updates every few minutes — don't over-engineer.</p>
    </Card>
  );
}

function EmailAuthExplainer() {
  const [pick, setPick] = useState<'spf' | 'dkim' | 'dmarc'>('spf');
  const data = {
    spf: {
      name: 'SPF (Sender Policy Framework)',
      what: 'Lists which servers may send email FROM your domain.',
      record: 'v=spf1 include:_spf.google.com include:mailgun.org -all',
      key: '-all = hard fail anything else. ~all = soft fail (common but weaker).',
    },
    dkim: {
      name: 'DKIM (DomainKeys Identified Mail)',
      what: 'Cryptographic signature on every email. Receivers verify against your public key in DNS.',
      record: 'k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ...',
      key: 'Rotate keys quarterly. Provider (Postmark, SES, SendGrid) usually manages this for you.',
    },
    dmarc: {
      name: 'DMARC (Domain-based Message Auth)',
      what: 'Policy: what should receivers do when SPF or DKIM fails? Where to send reports?',
      record: 'v=DMARC1; p=reject; rua=mailto:dmarc@example.com; pct=100',
      key: 'Start with p=none (monitor only), graduate to quarantine, then reject.',
    },
  };
  const cur = data[pick];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Mail className="h-4 w-4" /> <h4 className="font-semibold">SPF · DKIM · DMARC</h4></div>
      <div className="mb-3 flex gap-2">
        {(['spf', 'dkim', 'dmarc'] as const).map((k) => (
          <button key={k} onClick={() => setPick(k)} className={cn('rounded-md border px-3 py-1.5 font-mono text-xs uppercase', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
            {k}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
        <div className="text-base font-semibold">{cur.name}</div>
        <p className="mt-1 text-sm text-ink-dim">{cur.what}</p>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-white/5 bg-black/40 p-3 font-mono text-[12px] leading-5 text-emerald-200">{cur.record}</pre>
        <p className="mt-2 text-xs text-ink-faint">{cur.key}</p>
      </div>
    </Card>
  );
}

function DeliverabilityChecklist() {
  const items = [
    'Use a subdomain for transactional (e.g. mail.app.com) — keep marketing reputation separate.',
    'Warm up new sending IPs slowly: ~50/day → 200/day → 1k/day over weeks.',
    'Honor unsubscribe in 1 click. <List-Unsubscribe> header + one-click form.',
    'Send only to engaged users. Bounce + suppression list immediately.',
    'Plain-text alternative + alt text on every image.',
    'Avoid spam triggers: ALL CAPS, !!!, link shorteners, "FREE 100% GUARANTEED".',
    'Dedicated IP only above ~50k/month. Below that, shared IP is better.',
    'Set up a Postmaster account at Google + Microsoft to monitor reputation.',
  ];
  const [done, setDone] = useState<Record<number, boolean>>({});
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Deliverability checklist</h4>
      <div className="space-y-1">
        {items.map((it, i) => (
          <label key={i} className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/5 bg-bg-soft/30 p-2 hover:bg-white/5">
            <input type="checkbox" checked={!!done[i]} onChange={(e) => setDone({ ...done, [i]: e.target.checked })} className="mt-0.5 accent-emerald-500" />
            <span className={cn('text-sm', done[i] ? 'text-ink-faint line-through' : 'text-ink-dim')}>{it}</span>
          </label>
        ))}
      </div>
    </Card>
  );
}

function StripeFlow() {
  const steps = [
    { actor: 'Browser', text: 'Stripe.js loads from js.stripe.com (PCI scope: SAQ A)', detail: 'Card never touches your origin' },
    { actor: 'Browser → Stripe', text: 'createPaymentMethod → returns pm_xxx', detail: 'No card data in your servers' },
    { actor: 'Browser → Server', text: 'POST /api/checkout with pm_xxx + order details', detail: 'Idempotency-Key: order_<id>' },
    { actor: 'Server → Stripe', text: 'POST /payment_intents (amount, customer, payment_method)', detail: 'Idempotency-Key forwarded' },
    { actor: 'Stripe', text: 'Authorizes & captures (or requires 3DS)', detail: '3DS challenge handled by Stripe.js' },
    { actor: 'Stripe → Server', text: 'POST /webhook payment_intent.succeeded', detail: 'Verify Stripe-Signature header before doing ANY work' },
    { actor: 'Server', text: 'Mark order paid; enqueue fulfilment job', detail: 'Idempotent: webhook may arrive twice' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4" /> <h4 className="font-semibold">Stripe Checkout — end-to-end</h4></div>
      <div className="space-y-1">
        {steps.map((s, i) => (
          <div key={i} className="rounded-lg border border-white/5 bg-bg-soft/40 px-3 py-2 text-sm">
            <span className="font-mono text-xs text-accent-cyan">{i + 1}. {s.actor}</span>
            <span className="ml-2">{s.text}</span>
            <div className="mt-0.5 text-xs text-ink-dim">{s.detail}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="PCI scope" value="SAQ A" sub="card never touches your server" />
        <Stat label="Idempotent" value="yes" sub="key per business event" />
        <Stat label="Source of truth" value="webhooks" sub="not the redirect" />
      </div>
    </Card>
  );
}

function TimeZoneDemo() {
  const [iso, setIso] = useState('2026-05-08T10:30:00Z');
  const [tz, setTz] = useState('Asia/Bangkok');
  const date = useMemo(() => new Date(iso), [iso]);
  const formatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'long', timeZone: tz }).format(date);
    } catch {
      return 'invalid timezone';
    }
  }, [date, tz]);

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> <h4 className="font-semibold">UTC in storage, locale on display</h4></div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs">
            <span className="mb-1 block uppercase tracking-widest text-ink-faint">Stored (always UTC, ISO 8601)</span>
            <input value={iso} onChange={(e) => setIso(e.target.value)} className="input font-mono text-xs" />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block uppercase tracking-widest text-ink-faint">User's IANA timezone</span>
            <select value={tz} onChange={(e) => setTz(e.target.value)} className="input">
              {['UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Berlin', 'Asia/Bangkok', 'Asia/Tokyo', 'Australia/Sydney'].map((z) => <option key={z}>{z}</option>)}
            </select>
          </label>
          <div className="text-xs text-ink-faint">DST shifts twice a year for some zones. <strong className="text-ink-dim">Always</strong> store IANA name, not GMT offset.</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
          <div className="text-xs uppercase tracking-widest text-ink-faint">User sees</div>
          <div className="mt-2 text-base font-medium">{formatted}</div>
          <pre className="mt-3 rounded-lg border border-white/5 bg-black/40 p-3 font-mono text-[11px] leading-5 text-ink-dim">{`new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
  timeStyle: 'long',
  timeZone: '${tz}',
}).format(new Date('${iso}'))`}</pre>
        </div>
      </div>
    </Card>
  );
}

function MoneyMath() {
  const [a, setA] = useState(0.1);
  const [b, setB] = useState(0.2);
  const floatSum = a + b;
  const intCents = Math.round(a * 100) + Math.round(b * 100);
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Coins className="h-4 w-4" /> <h4 className="font-semibold">Never use floats for money</h4></div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs"><span className="mb-1 block uppercase tracking-widest text-ink-faint">$a</span><input type="number" step="0.01" value={a} onChange={(e) => setA(parseFloat(e.target.value || '0'))} className="input font-mono" /></label>
          <label className="block text-xs"><span className="mb-1 block uppercase tracking-widest text-ink-faint">$b</span><input type="number" step="0.01" value={b} onChange={(e) => setB(parseFloat(e.target.value || '0'))} className="input font-mono" /></label>
        </div>
        <div className="space-y-2">
          <div className={cn('rounded-xl border p-3 font-mono text-sm', floatSum.toString().length > 10 ? 'border-rose-400/40 bg-rose-400/10 text-rose-200' : 'border-white/5 bg-bg-soft/40 text-ink-dim')}>
            <div className="text-xs uppercase tracking-widest text-ink-faint">Float arithmetic ($)</div>
            <div className="text-xl">{floatSum}</div>
            {floatSum.toString().length > 10 && <div className="text-[11px]">↑ that's why you don't store money in floats</div>}
          </div>
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 font-mono text-sm text-emerald-200">
            <div className="text-xs uppercase tracking-widest text-emerald-300/80">Integer cents (correct)</div>
            <div className="text-xl">{intCents}c → ${(intCents / 100).toFixed(2)}</div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Store cents (or smallest unit). Use a Money type with currency. Format only at display time. Stripe stores amounts in the smallest currency unit — match that.</p>
    </Card>
  );
}

function PluralRules() {
  const [n, setN] = useState(1);
  const en = new Intl.PluralRules('en').select(n);
  const ru = new Intl.PluralRules('ru').select(n);
  const ja = new Intl.PluralRules('ja').select(n);
  const ar = new Intl.PluralRules('ar').select(n);

  const samples = {
    en: { one: '1 file', other: `${n} files` },
    ru: { one: `${n} файл`, few: `${n} файла`, many: `${n} файлов`, other: `${n} файлов` } as Record<string, string>,
    ja: { other: `${n} ファイル` } as Record<string, string>,
    ar: { zero: 'لا ملفات', one: 'ملف واحد', two: 'ملفان', few: `${n} ملفات`, many: `${n} ملفًا`, other: `${n} ملف` } as Record<string, string>,
  };

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Pluralization is not "add s"</h4>
      <input type="range" min={0} max={120} value={n} onChange={(e) => setN(parseInt(e.target.value))} className="w-full" />
      <div className="mt-1 text-center font-mono">n = {n}</div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Loc lang="en" rule={en} text={samples.en[en as keyof typeof samples.en] ?? `${n} files`} />
        <Loc lang="ru" rule={ru} text={samples.ru[ru] ?? `${n} файлов`} />
        <Loc lang="ja" rule={ja} text={samples.ja['other']} />
        <Loc lang="ar" rule={ar} text={samples.ar[ar] ?? `${n} ملف`} dir="rtl" />
      </div>
      <p className="mt-3 text-xs text-ink-faint">Russian has one/few/many. Arabic has 6 plural forms. Japanese has no plural. Use <InlineCode>Intl.PluralRules</InlineCode> + ICU MessageFormat.</p>
    </Card>
  );
}

function Loc({ lang, rule, text, dir }: { lang: string; rule: string; text: string; dir?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-3 text-center" dir={dir}>
      <div className="text-xs uppercase tracking-widest text-ink-faint">{lang} <span className="text-accent-cyan">· {rule}</span></div>
      <div className="mt-1 text-sm">{text}</div>
    </div>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Why does PKCE add a code_challenge instead of using a client secret?',
    options: [
      'It\'s faster.',
      'SPAs and mobile apps can\'t safely store a client secret. PKCE proves the original requester even without one.',
      'It improves SEO.',
      'OAuth requires it.',
    ],
    answer: 1,
    explain: 'A public client (browser/mobile) can\'t hide a secret. PKCE binds the code to a per-request verifier so an intercepted code is useless without it.',
  },
  {
    q: 'Stripe is sending the same webhook twice. Your handler creates a duplicate order. Fix?',
    options: [
      'Disable webhooks.',
      'Make handler idempotent — dedupe by event.id, or use the order_id as a unique constraint.',
      'Reduce Stripe retries.',
      'Use POST instead of PUT.',
    ],
    answer: 1,
    explain: 'Webhooks are at-least-once. Your handler must be safe to run twice. Use event ID or business key for dedup.',
  },
  {
    q: 'Money should be stored as...',
    options: [
      'Float (double precision).',
      'String "$1.99".',
      'Integer in the smallest unit (cents) + a separate currency code.',
      'Decimal in the database, float in code.',
    ],
    answer: 2,
    explain: 'Floats lose precision (0.1 + 0.2 ≠ 0.3). Cents avoid it. Currency must be tracked alongside or you create another bug class.',
  },
  {
    q: 'Your transactional emails go to spam. The first thing to verify is...',
    options: [
      'Your email subject line.',
      'SPF + DKIM + DMARC are configured for your sending domain.',
      'You\'re sending from a Gmail address.',
      'You\'re using HTML email.',
    ],
    answer: 1,
    explain: 'Without SPF/DKIM/DMARC, modern inbox providers either reject or quarantine your mail regardless of content.',
  },
  {
    q: 'Best mechanism for a chat app?',
    options: [
      'Polling every 2 seconds.',
      'Server-Sent Events.',
      'WebSockets.',
      'GraphQL queries on a timer.',
    ],
    answer: 2,
    explain: 'Chat needs bi-directional, low-latency. SSE is one-way; polling burns battery; WS is the fit.',
  },
];
