import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Play, Pause, RotateCcw, Globe } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 3;

export default function Layer3() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="osi" kicker="3.1" title="OSI Model & TCP/IP Stack">
        <TopicCard
          layerId={L}
          index={0}
          title="Seven layers, each adding a header"
          description="A packet leaving your machine is wrapped (encapsulated) at each layer on the way down, and unwrapped on the way up at the destination."
        >
          <Bullets
            items={[
              <>L7 Application — your HTTP, gRPC, WebSocket lives here.</>,
              <>L4 Transport — TCP for reliability, UDP for speed.</>,
              <>L3 Network — IP routes packets across networks.</>,
              <>L2 Data Link — Ethernet/Wi-Fi frames; MAC addresses.</>,
              <>Modern stack collapses 5/6/7 into one application layer (TCP/IP model).</>,
            ]}
          />
        </TopicCard>
        <OSIEncapsulation />
      </Section>

      <Section id="ip" kicker="3.2" title="IP Addressing & Subnetting">
        <TopicCard
          layerId={L}
          index={1}
          title="CIDR, masks, and the math behind /24"
          description="A subnet mask carves an IP into network bits and host bits. /24 = first 24 bits identify the network, last 8 identify the host (256 addresses, 254 usable)."
        >
          <Bullets
            items={[
              <>Private RFC 1918 ranges: <InlineCode>10/8</InlineCode>, <InlineCode>172.16/12</InlineCode>, <InlineCode>192.168/16</InlineCode>.</>,
              <>NAT lets many private hosts share one public IP. Source-NAT for outbound, destination-NAT for port forwarding.</>,
              <>IPv6 is 128 bits; <InlineCode>::1</InlineCode> is loopback and <InlineCode>fe80::/10</InlineCode> is link-local.</>,
              <>DHCP DORA: Discover → Offer → Request → Acknowledge.</>,
            ]}
          />
        </TopicCard>
        <SubnetCalculator />
      </Section>

      <Section id="tcpudp" kicker="3.3" title="TCP vs UDP">
        <TopicCard
          layerId={L}
          index={2}
          title="Reliability vs latency"
          description="TCP gives you ordered, reliable bytes — at the cost of head-of-line blocking and a handshake. UDP gives you unordered datagrams and minimal overhead."
        >
          <Bullets
            items={[
              <>TCP: 3-way handshake, sequence numbers, sliding window, congestion control (Reno, CUBIC, BBR).</>,
              <>UDP: 8-byte header, no state, no guarantees. Used by DNS, NTP, video, gaming.</>,
              <>QUIC (HTTP/3) gets best-of-both: streams over UDP, no HOL blocking between streams, 0-RTT resumption.</>,
            ]}
          />
        </TopicCard>
        <TcpHandshake />
      </Section>

      <Section id="dns" kicker="3.4" title="DNS — Domain Name System">
        <TopicCard
          layerId={L}
          index={3}
          title="A walking tour of one hostname lookup"
          description="Browser → OS cache → resolver → root → TLD → authoritative. Each layer caches by TTL."
        >
          <Bullets
            items={[
              <>Record types: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), TXT (verification, SPF, DKIM), NS, SRV, PTR.</>,
              <>TTL controls how long a record is cached. Lower TTL = faster propagation, more queries.</>,
              <>DNSSEC signs records; DoH/DoT encrypt queries.</>,
              <>Tools: <InlineCode>dig +trace example.com</InlineCode>, <InlineCode>nslookup</InlineCode>, <InlineCode>host</InlineCode>.</>,
            ]}
          />
        </TopicCard>
        <DnsResolver />
      </Section>

      <Section id="http" kicker="3.5" title="HTTP / HTTPS Deep Dive">
        <TopicCard
          layerId={L}
          index={4}
          title="The protocol you ship every day"
          description="HTTP/1.1 is text-based and 1 req/conn at a time. HTTP/2 is binary and multiplexed. HTTP/3 runs over QUIC/UDP."
        >
          <Bullets
            items={[
              <>Methods: GET (safe + idempotent), POST (not idempotent), PUT (replace, idempotent), PATCH (partial), DELETE (idempotent), OPTIONS (CORS preflight).</>,
              <>Statuses: 2xx success, 3xx redirect, 4xx client error, 5xx server error.</>,
              <>TLS 1.3: ClientHello → ServerHello + cert → key exchange → application data — only one round trip.</>,
              <>HSTS, certificate transparency, OCSP stapling lock down HTTPS.</>,
            ]}
          />
        </TopicCard>
        <HttpStatusExplorer />
        <CodePlayground
          mode="js"
          height={200}
          title="Make a real HTTP request (CORS-permitting)"
          initial={`// fetch is the modern HTTP client in browsers
const res = await fetch('https://api.github.com/zen');
console.log('status:', res.status);
console.log('content-type:', res.headers.get('content-type'));
console.log('body:', await res.text());`}
        />
      </Section>

      <Section id="sockets" kicker="3.6" title="Sockets & WebSockets">
        <TopicCard
          layerId={L}
          index={5}
          title="The socket lifecycle"
          description="socket → bind → listen → accept on the server. socket → connect on the client. Then send/recv until close."
        >
          <Bullets
            items={[
              <><InlineCode>SO_REUSEADDR</InlineCode> lets you rebind quickly after restart (TIME_WAIT).</>,
              <><InlineCode>TCP_NODELAY</InlineCode> disables Nagle's algorithm for low-latency apps (gaming, RPC).</>,
              <>WebSockets upgrade an HTTP connection to full-duplex. Use for chat, live dashboards, collaborative editing.</>,
              <>Server-Sent Events are simpler one-way streaming over plain HTTP, with auto-reconnect.</>,
            ]}
          />
        </TopicCard>
      </Section>

      <Section id="security" kicker="3.7" title="Network Security Fundamentals">
        <TopicCard
          layerId={L}
          index={6}
          title="Firewalls, attacks, and zero-trust"
          description="Stateless firewalls match individual packets; stateful ones (conntrack) track connections and allow return traffic automatically."
        >
          <Bullets
            items={[
              <>iptables chains: PREROUTING → INPUT/FORWARD → OUTPUT → POSTROUTING.</>,
              <>Common attacks: SYN flood, UDP amplification, ARP poisoning, BGP hijack.</>,
              <>VPNs: WireGuard (modern, kernel-level), IPSec (site-to-site), OpenVPN (TLS).</>,
              <>Zero-trust: verify identity + device + context on every request, regardless of network location.</>,
            ]}
          />
        </TopicCard>
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 3 Quiz">
        <Quiz id="L3" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-500/10 via-bg-card to-blue-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-cyan-500 to-blue-500 text-white">L03</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Networking Fundamentals</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">The medium of distributed software</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Every microservice call, page load, and database query travels the same physical wires. Knowing the stack lets you debug latency,
          design resilient APIs, and reason about security correctly.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Network className="h-4 w-4 text-cyan-400" />
          7 topics · 4 visualizers · 1 playground · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function OSIEncapsulation() {
  const [step, setStep] = useState(0);
  const layers = [
    { name: 'L7 Application', adds: 'HTTP request', color: 'bg-rose-500' },
    { name: 'L6 Presentation', adds: 'TLS encrypt', color: 'bg-orange-500' },
    { name: 'L5 Session', adds: 'Session ID', color: 'bg-amber-500' },
    { name: 'L4 Transport', adds: 'TCP header', color: 'bg-emerald-500' },
    { name: 'L3 Network', adds: 'IP header', color: 'bg-cyan-500' },
    { name: 'L2 Data Link', adds: 'Ethernet frame', color: 'bg-blue-500' },
    { name: 'L1 Physical', adds: 'bits on wire', color: 'bg-violet-500' },
  ];
  const top = layers.slice(0, step);

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Encapsulation walk-through</h4>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          {layers.map((l, i) => (
            <div
              key={l.name}
              className={cn(
                'flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all',
                i < step ? 'border-white/10 bg-white/[0.05] text-ink' : 'border-white/5 bg-bg-soft/30 text-ink-dim',
              )}
            >
              <span>{l.name}</span>
              <span className="text-xs text-ink-faint">+ {l.adds}</span>
            </div>
          ))}
          <div className="mt-3 flex gap-2">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="btn-ghost h-8 text-xs">← Up</button>
            <button onClick={() => setStep((s) => Math.min(layers.length, s + 1))} className="btn-ghost h-8 text-xs">Down →</button>
            <button onClick={() => setStep(0)} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Packet on the wire</div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-bg-soft/30 p-4">
            <div className="space-y-1">
              <AnimatePresence>
                {top.map((l) => (
                  <motion.div
                    key={l.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn('rounded px-2 py-1 text-center text-[10px] font-mono text-white', l.color)}
                    style={{ minWidth: 220 }}
                  >
                    {l.adds}
                  </motion.div>
                ))}
              </AnimatePresence>
              <motion.div
                animate={{ scale: step >= layers.length ? [1, 1.05, 1] : 1 }}
                transition={{ duration: 1, repeat: step >= layers.length ? Infinity : 0 }}
                className="rounded border border-white/10 bg-white/5 px-2 py-1 text-center text-[10px] font-mono text-ink"
                style={{ minWidth: 220 }}
              >
                payload: GET /api/users
              </motion.div>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-faint">Each layer prepends its header. The destination strips them in reverse on receive.</p>
        </div>
      </div>
    </Card>
  );
}

function SubnetCalculator() {
  const [ipStr, setIpStr] = useState('192.168.1.42');
  const [mask, setMask] = useState(24);

  const parsed = useMemo(() => parseIp(ipStr), [ipStr]);
  if (!parsed) {
    return (
      <Card>
        <h4 className="font-semibold">Subnet calculator</h4>
        <input value={ipStr} onChange={(e) => setIpStr(e.target.value)} className="input mt-2" />
        <p className="mt-2 text-xs text-rose-300">Invalid IPv4 address.</p>
      </Card>
    );
  }
  const ipNum = parsed;
  const m = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
  const network = (ipNum & m) >>> 0;
  const broadcast = (network | (~m >>> 0)) >>> 0;
  const total = mask >= 31 ? 1 << (32 - mask) : 1 << (32 - mask);
  const usable = mask >= 31 ? total : Math.max(0, total - 2);

  return (
    <Card>
      <h4 className="mb-3 font-semibold">CIDR / subnet calculator</h4>
      <div className="flex flex-wrap items-center gap-3">
        <input value={ipStr} onChange={(e) => setIpStr(e.target.value)} className="input w-48 font-mono text-sm" placeholder="192.168.1.42" />
        <span className="font-mono text-ink-dim">/</span>
        <input
          type="number"
          min={0}
          max={32}
          value={mask}
          onChange={(e) => setMask(Math.min(32, Math.max(0, parseInt(e.target.value || '0'))))}
          className="input w-20 font-mono"
        />
        <input
          type="range"
          min={8}
          max={32}
          value={mask}
          onChange={(e) => setMask(parseInt(e.target.value))}
          className="flex-1"
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Network" value={<span className="font-mono text-base">{ipToString(network)}</span>} />
        <Stat label="Broadcast" value={<span className="font-mono text-base">{ipToString(broadcast)}</span>} />
        <Stat label="Mask" value={<span className="font-mono text-base">{ipToString(m)}</span>} />
        <Stat label="Usable hosts" value={usable.toLocaleString()} sub={`${total} addrs total`} />
      </div>
      <div className="mt-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">Bits</div>
        <div className="flex flex-wrap gap-[2px]">
          {Array.from({ length: 32 }).map((_, i) => {
            const bit = (ipNum >> (31 - i)) & 1;
            const inNetwork = i < mask;
            return (
              <div
                key={i}
                className={cn(
                  'h-7 w-6 rounded text-center font-mono text-xs leading-7',
                  inNetwork ? 'bg-accent/30 text-accent' : 'bg-white/5 text-ink-dim',
                )}
                title={inNetwork ? 'network bit' : 'host bit'}
              >
                {bit}
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex flex-wrap gap-[2px] text-[10px] text-ink-faint">
          {Array.from({ length: 32 }).map((_, i) => {
            const isBoundary = (i + 1) % 8 === 0;
            return <div key={i} className={cn('w-6 text-center', isBoundary && 'border-r border-white/10')}>{31 - i}</div>;
          })}
        </div>
      </div>
    </Card>
  );
}

function parseIp(s: string): number | null {
  const parts = s.trim().split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = parseInt(p, 10);
    if (!Number.isFinite(v) || v < 0 || v > 255 || String(v) !== p) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}
function ipToString(n: number): string {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.');
}

function TcpHandshake() {
  const [phase, setPhase] = useState(0);
  const [auto, setAuto] = useState(false);

  const phases = [
    { from: 'client', to: 'server', label: 'SYN', detail: 'seq=x' },
    { from: 'server', to: 'client', label: 'SYN-ACK', detail: 'seq=y, ack=x+1' },
    { from: 'client', to: 'server', label: 'ACK', detail: 'ack=y+1' },
    { from: 'client', to: 'server', label: 'GET /', detail: 'application data' },
    { from: 'server', to: 'client', label: '200 OK', detail: 'response' },
  ];

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setPhase((p) => (p + 1) % (phases.length + 1));
    }, 1500);
    return () => clearInterval(id);
  }, [auto]);

  const cur = phase < phases.length ? phases[phase] : null;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">TCP 3-way handshake</h4>
        <div className="flex items-center gap-2">
          <button onClick={() => setAuto((a) => !a)} className="btn-ghost h-8 text-xs">
            {auto ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Auto</>}
          </button>
          <button onClick={() => setPhase(0)} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="relative grid grid-cols-2 gap-6 py-6">
        <div className="text-center">
          <motion.div
            animate={{ scale: cur?.from === 'client' ? 1.06 : 1 }}
            className={cn('mx-auto grid h-16 w-16 place-items-center rounded-2xl text-white', cur?.from === 'client' ? 'bg-accent' : 'bg-white/10')}
          >
            <Globe className="h-7 w-7" />
          </motion.div>
          <div className="mt-2 font-mono text-sm">Client</div>
          <div className="text-xs text-ink-faint">browser / app</div>
        </div>
        <div className="text-center">
          <motion.div
            animate={{ scale: cur?.from === 'server' ? 1.06 : 1 }}
            className={cn('mx-auto grid h-16 w-16 place-items-center rounded-2xl text-white', cur?.from === 'server' ? 'bg-accent-cyan' : 'bg-white/10')}
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-2"><rect x="3" y="4" width="18" height="6" rx="1" /><rect x="3" y="14" width="18" height="6" rx="1" /><circle cx="7" cy="7" r="0.6" fill="currentColor" /><circle cx="7" cy="17" r="0.6" fill="currentColor" /></svg>
          </motion.div>
          <div className="mt-2 font-mono text-sm">Server</div>
          <div className="text-xs text-ink-faint">api.example.com :443</div>
        </div>
        <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 sm:inset-x-24">
          <AnimatePresence mode="wait">
            {cur && (
              <motion.div
                key={phase}
                initial={{ x: cur.from === 'client' ? -120 : 120, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: cur.from === 'client' ? 120 : -120, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-auto flex flex-col items-center"
              >
                <div className={cn('rounded-full border px-3 py-1 text-xs font-mono', cur.label.includes('SYN') ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : cur.label.includes('ACK') || cur.label.includes('OK') ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-300')}>
                  {cur.label}
                </div>
                <div className="mt-1 font-mono text-[10px] text-ink-faint">{cur.detail}</div>
                <div
                  className={cn('mt-2 text-2xl', cur.from === 'client' ? 'text-emerald-300' : 'text-cyan-300')}
                  style={{ transform: cur.from === 'server' ? 'scaleX(-1)' : 'none' }}
                >
                  →
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {phases.map((p, i) => (
          <button
            key={i}
            onClick={() => setPhase(i)}
            className={cn('rounded-md border px-2 py-1 font-mono text-[11px]', phase === i ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}
          >
            {i + 1}. {p.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-dim">
        After ACK, the connection is ESTABLISHED. Closing uses a 4-way (FIN, ACK, FIN, ACK) — or RST for an abrupt close.
      </p>
    </Card>
  );
}

function DnsResolver() {
  const [step, setStep] = useState(0);
  const [host, setHost] = useState('docs.example.com');
  const stages = [
    { label: 'Browser cache', detail: 'miss', color: 'bg-white/5' },
    { label: 'OS cache (/etc/hosts)', detail: 'miss', color: 'bg-white/5' },
    { label: 'Recursive resolver (8.8.8.8)', detail: 'no entry → asks root', color: 'bg-violet-500/20' },
    { label: 'Root nameserver', detail: 'try a.gtld-servers.net (.com)', color: 'bg-blue-500/20' },
    { label: 'TLD nameserver (.com)', detail: 'try ns1.example.com', color: 'bg-cyan-500/20' },
    { label: 'Authoritative for example.com', detail: 'docs.example.com → 93.184.216.34', color: 'bg-emerald-500/20' },
    { label: 'Resolver caches answer (TTL=300s)', detail: 'returns to client', color: 'bg-amber-500/20' },
  ];

  useEffect(() => {
    setStep(0);
  }, [host]);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="font-semibold">DNS resolution chain</h4>
        <input value={host} onChange={(e) => setHost(e.target.value)} className="input w-56 font-mono text-sm" />
      </div>
      <div className="space-y-2">
        {stages.map((s, i) => (
          <motion.div
            key={s.label}
            animate={{
              opacity: i <= step ? 1 : 0.4,
              scale: i === step ? 1.01 : 1,
            }}
            className={cn(
              'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm',
              i <= step ? 'border-white/15' : 'border-white/5',
              s.color,
            )}
          >
            <div>
              <div className="font-medium">{i + 1}. {s.label}</div>
              <div className="text-xs text-ink-dim">{s.detail.replace('docs.example.com', host)}</div>
            </div>
            {i === step && <span className="font-mono text-xs text-accent-cyan">resolving…</span>}
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setStep((s) => Math.min(stages.length - 1, s + 1))}
          className="btn-primary h-8 text-xs"
          disabled={step >= stages.length - 1}
        >
          Next step
        </button>
        <button onClick={() => setStep(0)} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /> Restart</button>
      </div>
    </Card>
  );
}

function HttpStatusExplorer() {
  const [pick, setPick] = useState(200);
  const codes: Record<number, { name: string; cat: string; explain: string; color: string }> = {
    200: { name: 'OK', cat: '2xx Success', explain: 'Standard success response. Body contains the resource.', color: 'bg-emerald-500' },
    201: { name: 'Created', cat: '2xx Success', explain: 'New resource was created. Include Location header pointing to it.', color: 'bg-emerald-500' },
    204: { name: 'No Content', cat: '2xx Success', explain: 'Action succeeded; nothing to return. Common after DELETE.', color: 'bg-emerald-500' },
    301: { name: 'Moved Permanently', cat: '3xx Redirect', explain: 'Permanent move. Browsers cache the redirect indefinitely. Use 308 to preserve method.', color: 'bg-cyan-500' },
    302: { name: 'Found', cat: '3xx Redirect', explain: 'Temporary redirect. Method MAY change to GET; use 307 to preserve method.', color: 'bg-cyan-500' },
    304: { name: 'Not Modified', cat: '3xx Redirect', explain: 'Cached copy is fresh (ETag/If-None-Match matched). No body returned.', color: 'bg-cyan-500' },
    400: { name: 'Bad Request', cat: '4xx Client', explain: 'Malformed request the server cannot or will not parse.', color: 'bg-amber-500' },
    401: { name: 'Unauthorized', cat: '4xx Client', explain: 'Authentication required or failed. Misnamed — really means "unauthenticated".', color: 'bg-amber-500' },
    403: { name: 'Forbidden', cat: '4xx Client', explain: 'Authenticated but not authorized for this resource.', color: 'bg-amber-500' },
    404: { name: 'Not Found', cat: '4xx Client', explain: 'No resource at this URI. Sometimes used in place of 403 to hide existence.', color: 'bg-amber-500' },
    409: { name: 'Conflict', cat: '4xx Client', explain: 'Request conflicts with current state (e.g. version mismatch, duplicate creation).', color: 'bg-amber-500' },
    429: { name: 'Too Many Requests', cat: '4xx Client', explain: 'Rate limited. Server SHOULD include Retry-After header.', color: 'bg-amber-500' },
    500: { name: 'Internal Server Error', cat: '5xx Server', explain: 'Generic server-side failure. Logs should always be checked.', color: 'bg-rose-500' },
    502: { name: 'Bad Gateway', cat: '5xx Server', explain: 'Reverse proxy got an invalid response from upstream.', color: 'bg-rose-500' },
    503: { name: 'Service Unavailable', cat: '5xx Server', explain: 'Server overloaded or in maintenance. Retry-After is appropriate here too.', color: 'bg-rose-500' },
    504: { name: 'Gateway Timeout', cat: '5xx Server', explain: 'Upstream did not respond in time.', color: 'bg-rose-500' },
  };
  const list = Object.entries(codes).map(([k, v]) => ({ code: parseInt(k, 10), ...v }));
  const cur = codes[pick];

  return (
    <Card>
      <h4 className="mb-3 font-semibold">HTTP status explorer</h4>
      <div className="flex flex-wrap gap-1.5">
        {list.map((c) => (
          <button
            key={c.code}
            onClick={() => setPick(c.code)}
            className={cn(
              'rounded-md border px-2 py-1 font-mono text-xs',
              pick === c.code ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim hover:bg-white/10',
            )}
          >
            {c.code}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-white/5 bg-bg-soft/40 p-4">
        <div className="flex items-center gap-3">
          <div className={cn('grid h-10 w-10 place-items-center rounded-lg font-mono text-sm font-semibold text-white', cur.color)}>
            {pick}
          </div>
          <div>
            <div className="text-base font-semibold">{cur.name}</div>
            <div className="text-xs text-ink-faint">{cur.cat}</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-dim">{cur.explain}</p>
      </div>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'You have a /27 subnet. How many usable host addresses?',
    options: ['14', '30', '32', '62'],
    answer: 1,
    explain: '/27 = 32 - 27 = 5 host bits = 2⁵ = 32 addresses, minus network and broadcast = 30 usable.',
  },
  {
    q: 'TCP guarantees ordered delivery using...',
    options: ['Sequence numbers and ACKs', 'IP options', 'Checksums alone', 'Magic'],
    answer: 0,
    explain: 'Each byte gets a sequence number; receiver ACKs the next expected; missing segments are retransmitted.',
  },
  {
    q: 'A 401 Unauthorized actually means...',
    options: [
      'You are forbidden from this resource.',
      'You are not authenticated (or auth failed).',
      'You hit a rate limit.',
      'The server is broken.',
    ],
    answer: 1,
    explain: '401 = unauthenticated (the spec\'s naming is misleading). 403 = authenticated but not authorized.',
  },
  {
    q: 'Which DNS record points one name to another name?',
    options: ['A', 'AAAA', 'CNAME', 'MX'],
    answer: 2,
    explain: 'CNAME aliases one hostname to another. The resolver chases the chain until it gets an A or AAAA.',
  },
  {
    q: 'HTTP/3 differs from HTTP/2 most fundamentally because...',
    options: [
      'It removes TLS.',
      'It runs over UDP via QUIC, eliminating head-of-line blocking between streams.',
      'It compresses headers.',
      'It is text-based.',
    ],
    answer: 1,
    explain: 'QUIC over UDP gives independent streams — a lost packet on one stream doesn\'t stall the others.',
  },
];
