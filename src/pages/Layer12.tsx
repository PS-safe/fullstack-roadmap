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
          <OAuthPkceFlow />
        </TopicCard>
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
          <ResetFlow />
          <MfaPicker />
        </TopicCard>
      </Section>

      <Section id="jobs" kicker="12.3" title="Background Jobs & Queues">
        <TopicCard
          layerId={L}
          index={2}
          title="Anything slow goes through a queue"
          description="Email, image resize, PDF gen, billing — anything > 100ms or that can fail and retry. Idempotency + exponential backoff + dead-letter is the default recipe."
        >
          <JobQueueDemo />
        </TopicCard>
      </Section>

      <Section id="webhooks" kicker="12.4" title="Webhooks (sending and receiving)">
        <TopicCard
          layerId={L}
          index={3}
          title="HTTP callbacks that won't bite back"
          description="Every webhook needs: HMAC signature, timestamp (replay defence), idempotency key, retry policy on the sender, dead-letter on the receiver."
        >
          <WebhookSignatureDemo />
        </TopicCard>
      </Section>

      <Section id="realtime" kicker="12.5" title="Real-Time: WebSocket vs SSE vs Polling">
        <TopicCard
          layerId={L}
          index={4}
          title="Pick the smallest hammer"
          description="Most 'real-time' features ship fine on SSE or smart polling. Reach for WebSockets when you need bi-directional streams or sub-second latency."
        >
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
          <EmailAuthExplainer />
          <DeliverabilityChecklist />
        </TopicCard>
      </Section>

      <Section id="payments" kicker="12.7" title="Payments (Stripe pattern)">
        <TopicCard
          layerId={L}
          index={6}
          title="Idempotency keys, webhooks, PCI scope"
          description="Take payments on the client with Stripe Elements; never let card numbers touch your server (PCI scope explosion). Use idempotency keys on every charge — payment retries are unforgiving."
        >
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
      </Section>

      <Section id="time" kicker="12.8" title="Time, Money, Units, i18n traps">
        <TopicCard
          layerId={L}
          index={7}
          title="The bug magnets"
          description="UTC always in storage. Integers (cents) for money. Plurals are not 'add s'. Time zones are political, not mathematical."
        >
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
