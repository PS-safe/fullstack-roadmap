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
          description="The OSI model isn't a thing that runs — it's a debugging coordinate system. Its real value: when something breaks, it tells you which layer to inspect so you stop guessing."
        >
          <Bullets
            items={[
              <>L7 Application — HTTP, gRPC, WebSocket, DNS. The only layer your code usually touches. Symptom here: 500s, wrong status codes, malformed JSON.</>,
              <>L4 Transport — TCP (ordered, reliable, connection) vs UDP (datagram, fire-and-forget). Identified by <strong>port</strong>. Symptom here: connection refused (nothing listening), connection timeout (firewall dropped the SYN).</>,
              <>L3 Network — IP routes packets hop-to-hop across networks; identified by <strong>IP address</strong>. Symptom here: "no route to host", asymmetric routing, MTU black holes.</>,
              <>L2 Data Link — Ethernet/Wi-Fi frames inside one network segment; identified by <strong>MAC address</strong>. ARP maps L3→L2. Symptom here: duplicate IP, ARP poisoning, switch loop.</>,
              <>Encapsulation is why a captured packet is an onion: <InlineCode>Ethernet[ IP[ TCP[ TLS[ HTTP ] ] ] ]</InlineCode>. Each layer reads only its own header and hands the payload up — that's the whole abstraction.</>,
              <>The TCP/IP model the internet actually runs collapses L5–L7 into one "Application" layer. L5/L6 (Session, Presentation) were never cleanly real — TLS spans "L6-ish" but is implemented in the app. Don't over-index on the magic number 7.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">Why the layer model earns its keep</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            "The site is down" is not a diagnosis. The layer model turns it into a binary search. Can you <InlineCode>ping</InlineCode> the host? L3 works. Can you <InlineCode>nc -vz host 443</InlineCode>? L4 works — something is listening and the firewall lets you in. Does <InlineCode>curl -v https://host</InlineCode> complete the TLS handshake? Then your problem is L7 — the app — and you've ruled out three layers in thirty seconds.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
            The trap: assuming the symptom's layer is the cause's layer. An HTTP 504 (L7) is usually an L7 upstream that's slow — but an identical-looking hang can be an L3 MTU black hole silently dropping large packets. Walk the layers; don't pattern-match the error string.
          </p>
        </Card>
        <OSIEncapsulation />
      </Section>

      <Section id="ip" kicker="3.2" title="IP Addressing & Subnetting">
        <TopicCard
          layerId={L}
          index={1}
          title="CIDR, masks, and the math behind /24"
          description="A subnet mask carves an IP into network bits and host bits. /24 = first 24 bits identify the network, last 8 identify the host: 256 addresses, but 254 usable — .0 is the network ID, .255 is broadcast, neither is assignable."
        >
          <Bullets
            items={[
              <>Smaller prefix = bigger network. <InlineCode>/24</InlineCode> is 256 addrs, <InlineCode>/16</InlineCode> is 65,536, <InlineCode>/8</InlineCode> is 16M. Every bit you give the network halves the host space. <InlineCode>/31</InlineCode> and <InlineCode>/32</InlineCode> skip the network/broadcast reservation (point-to-point links, single host).</>,
              <>Private RFC 1918 ranges — <InlineCode>10/8</InlineCode>, <InlineCode>172.16/12</InlineCode>, <InlineCode>192.168/16</InlineCode> — are not internet-routable. The why: they let everyone reuse the same address space behind NAT, which is what postponed IPv4 exhaustion for two decades.</>,
              <>NAT rewrites the source IP+port of outbound packets and keeps a translation table to reverse it on the reply (SNAT/masquerade). Cost: it's <em>stateful</em> — the table has finite size and entries expire, which is why a long-idle TCP connection behind NAT silently dies (the mapping was evicted; you only find out on the next send). DNAT/port-forwarding is the inbound direction.</>,
              <>Same private range on both ends of a VPN = overlapping subnets, and routing becomes ambiguous. This is the single most common reason a site-to-site VPN "connects" but no traffic flows — pick non-default ranges (<InlineCode>10.{'{'}random{'}'}.0.0/24</InlineCode>) for anything you might later bridge.</>,
              <>IPv6 is 128 bits — no NAT needed, every device globally addressable. <InlineCode>::1</InlineCode> is loopback, <InlineCode>fe80::/10</InlineCode> is link-local (auto-configured, not routed). A host with both stacks prefers IPv6; a broken IPv6 path causes the classic "slow for 20s then works" bug as it times out and falls back to v4 (Happy Eyeballs mitigates this).</>,
              <>DHCP DORA — Discover → Offer → Request → Acknowledge — is a broadcast conversation because the client has no IP yet. The lease has a duration; a client renews at 50%. Relevant failure: two DHCP servers on one LAN hand out conflicting leases → intermittent duplicate-IP outages.</>,
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
          description="TCP gives you an ordered, reliable byte stream — at the cost of a handshake and head-of-line blocking. UDP gives you unordered datagrams and gets out of your way. The choice is: who handles loss — the kernel, or you?"
        >
          <Bullets
            items={[
              <>TCP's guarantees aren't free magic — they're mechanism. <strong>Sequence numbers</strong> let the receiver reorder and detect gaps; <strong>ACKs</strong> trigger retransmission of anything unacknowledged; the <strong>sliding window</strong> bounds in-flight data; <strong>congestion control</strong> (CUBIC default, BBR newer) probes for bandwidth and backs off on loss. Every one of these adds latency you can sometimes feel.</>,
              <>Head-of-line blocking is TCP's defining cost: it's <em>one</em> byte stream, so a single lost segment stalls delivery of <em>everything</em> sent after it until the retransmit arrives — even data that's already in the receiver's buffer. On a lossy mobile link this is why a page with one stuck asset feels frozen.</>,
              <>UDP is an 8-byte header and nothing else — no handshake, no state, no ordering, no retransmit. If a datagram is lost, it's just gone, and the app never hears about it. That's a feature for DNS (just ask again), NTP, and real-time media/gaming (a 200ms-old position update is worthless — you want the <em>next</em> one, not the lost one redelivered).</>,
              <>QUIC (the transport under HTTP/3) is the synthesis: reliable, ordered <em>streams</em> built in userspace on top of UDP. Multiple independent streams mean a lost packet only stalls its own stream, not the others — it kills TCP's HOL blocking. It also folds the TLS handshake into the transport handshake (1-RTT, or 0-RTT on resumption) and survives IP changes via a connection ID, which is why it's a real win on mobile.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">TCP failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">The handshake tax on high-RTT links</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                The 3-way handshake costs one full round trip <em>before a single byte of your request is sent</em>. Add TLS and it's 2–3 RTT of pure setup. On a 300ms satellite or cross-region link that's ~1s of dead air the server never sees — so "the API is slow" can be entirely connection setup, and your server timing graph looks perfectly healthy.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: connection reuse (keep-alive, HTTP/2), TLS 1.3, putting an edge POP near the client. Measure it with <InlineCode>curl -w "%{'{'}time_connect{'}'} %{'{'}time_starttransfer{'}'}"</InlineCode>.
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Connection refused vs. connection timeout</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                These look similar but mean opposite things. <strong>Refused</strong> = your SYN reached the host and it sent back a RST — nothing is listening on that port (process down, wrong port). Fast failure. <strong>Timeout</strong> = your SYN got <em>silently dropped</em> — a firewall/security-group is eating it, or the host is unreachable. Slow failure (the kernel retries the SYN for ~1 min).
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Refused → it's an app/port problem. Timeout → it's a network/firewall problem. Don't debug the app when the SYN never arrived.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Default to TCP — almost everything (HTTP, databases, gRPC) needs ordered reliable bytes and you don't want to reimplement them. Reach for UDP only when you'll handle loss yourself <em>and</em> stale data is worse than no data, or when you can use QUIC and get reliability without the HOL cost.
          </p>
        </Card>
        <TcpHandshake />
      </Section>

      <Section id="dns" kicker="3.4" title="DNS — Domain Name System">
        <TopicCard
          layerId={L}
          index={3}
          title="A walking tour of one hostname lookup"
          description="Browser → OS → recursive resolver → root → TLD → authoritative. The resolver does the walking; everything along the way caches by TTL. That caching is both why DNS scales and why a deploy 'isn't live yet'."
        >
          <Bullets
            items={[
              <>The chain is a delegation, not a lookup. Root knows only "ask the <InlineCode>.com</InlineCode> servers"; the TLD knows only "ask <InlineCode>example.com</InlineCode>'s nameservers"; the <strong>authoritative</strong> server is the only one with the real answer. Your code never does this — the recursive resolver (8.8.8.8, your ISP's, your VPC's) does, and hands you the cached result.</>,
              <>Record types you'll actually touch: <strong>A</strong>/<strong>AAAA</strong> (name→IP), <strong>CNAME</strong> (name→another name, chased by the resolver — can't coexist with other records, so never on a zone apex), <strong>MX</strong> (mail), <strong>TXT</strong> (SPF/DKIM/domain-verification), <strong>NS</strong> (delegation). <strong>SRV</strong> for service discovery.</>,
              <>TTL is a cache lifetime in seconds, set per-record by the authoritative zone. It's the central trade-off: low TTL = fast propagation, more query load and a slower average lookup; high TTL = cheap and fast, but a change takes that long to take effect <em>everywhere</em>.</>,
              <>"DNS propagation" is a misnomer — nothing is pushed. Old records simply sit in resolver caches until their TTL expires. The fix for a planned change: <strong>lower the TTL to ~60s a day before</strong>, make the change, then raise it back. Drop the TTL on the day of and the old high-TTL record is already cached against you.</>,
              <>DNS rides UDP/53 by default (one packet, fast); falls back to TCP for large responses (DNSSEC, big record sets). DNSSEC <em>signs</em> records (integrity, not privacy); DoH/DoT <em>encrypt</em> the query (privacy, not integrity) — different problems.</>,
              <><InlineCode>dig +trace example.com</InlineCode> walks the delegation yourself; <InlineCode>dig example.com @8.8.8.8</InlineCode> asks a specific resolver, bypassing your local cache — essential for "is it just <em>my</em> machine that's stale?"</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">DNS failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">"The deploy isn't live yet"</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                You repointed an A record to the new server, but half of users still hit the old one. Nothing is broken — resolvers worldwide cached the old IP and won't re-query until its TTL expires. If that TTL was 3600, you have an hour of split traffic you didn't plan for.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Why it bites: you can't shorten a TTL retroactively — the value already in caches is the <em>old</em> one. Lower it <em>before</em> the cutover. Until every cache drains, the old server must keep serving correctly.
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Negative caching &amp; stale local cache</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                NXDOMAIN is cached too — governed by the zone's SOA minimum, not the record TTL. Query a name <em>before</em> you create it and the "doesn't exist" answer sticks around, so the brand-new record looks broken for minutes.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                And the resolver isn't the only cache: the OS and many runtimes cache too. "Works in <InlineCode>dig</InlineCode> but not in my app" = a stale process-local cache; <InlineCode>dig</InlineCode> bypasses it.
              </p>
            </div>
          </div>
        </Card>
        <DnsResolver />
      </Section>

      <Section id="http" kicker="3.5" title="HTTP / HTTPS Deep Dive">
        <TopicCard
          layerId={L}
          index={4}
          title="The protocol you ship every day"
          description="HTTP/1.1 is human-readable text, one in-flight request per connection. HTTP/2 is binary frames, many streams multiplexed over one connection. HTTP/3 moves that onto QUIC. The semantics (methods, statuses, headers) are identical across all three — only the wire format and connection model change."
        >
          <Bullets
            items={[
              <><strong>Idempotent</strong> = same request sent twice has the same effect as once — it's a retry-safety property, not "no side effects". GET/PUT/DELETE are idempotent so a client (or proxy) can safely retry them on a timeout; POST is not, which is exactly why a double-submitted form charges the card twice. <strong>Safe</strong> = no state change at all (GET, HEAD). A GET that mutates is a real bug — crawlers and prefetchers will trigger it.</>,
              <>Status codes are a contract, and the precise one matters: <strong>400</strong> (client sent garbage) vs <strong>401</strong> (not authenticated) vs <strong>403</strong> (authenticated, not allowed) vs <strong>404</strong>; <strong>409</strong> for a state conflict; <strong>422</strong> for well-formed-but-invalid; <strong>429</strong> with <InlineCode>Retry-After</InlineCode>; <strong>500</strong> (we crashed) vs <strong>503</strong> (temporarily down, retry me). Returning <InlineCode>200</InlineCode> with <InlineCode>{'{'}"error": ...{'}'}</InlineCode> in the body is the classic anti-pattern — every cache, proxy, and monitor now thinks it succeeded.</>,
              <>HTTP/1.1's limit is <em>one request per connection at a time</em>, so browsers open 6 parallel connections per origin and small assets queue behind big ones (head-of-line blocking at the app layer). HTTP/2 fixes this with multiplexed streams over <em>one</em> connection — but they still share <em>one TCP stream</em>, so a single lost packet stalls every stream (HOL blocking moved down to L4). HTTP/3 over QUIC is what actually eliminates it: independent streams at the transport level.</>,
              <>TLS 1.3 handshake is one round trip: ClientHello (with key share) → ServerHello + certificate + Finished → application data. 0-RTT resumption sends data on the first packet for return visitors — at the cost of replay-vulnerability, so never use it for non-idempotent requests. TLS 1.2 needed two RTT and shipped footgun cipher suites; <strong>TLS 1.3 only</strong>.</>,
              <>A certificate is trusted only if the whole <strong>chain</strong> validates to a root in the client's trust store <em>and</em> the hostname matches <em>and</em> it's in date. "Works in my browser" can just mean the browser cached an intermediate the server forgot to send — <InlineCode>openssl s_client -connect host:443</InlineCode> shows the chain the server actually presents. HSTS forces HTTPS; OCSP stapling lets the server prove the cert isn't revoked without the client making a side trip to the CA.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">Diagnose a slow request by layer, not by guessing</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            "The API is slow" is five separable costs. <InlineCode>curl -w</InlineCode> breaks them out: <InlineCode>time_namelookup</InlineCode> (DNS), <InlineCode>time_connect</InlineCode> (TCP handshake), <InlineCode>time_appconnect</InlineCode> (TLS handshake), <InlineCode>time_starttransfer</InlineCode> (server processing — time to first byte), then total minus that (transfer time = payload ÷ bandwidth).
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
            The point: don't optimize your server (stage 4) when the cost is DNS or handshake (stages 1–3) — connection reuse and an edge POP fix those, and your code can't. And don't optimize the server when the cost is a 4 MB JSON response (stage 5) — that's pagination and compression. Each stage has a different fix; measure before you pick one.
          </p>
        </Card>
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
          description="A socket is the OS handle for one connection's two byte buffers. Server: socket → bind → listen → accept. Client: socket → connect. Then send/recv until close. Every HTTP server is this loop underneath."
        >
          <Bullets
            items={[
              <><InlineCode>accept()</InlineCode> returns a <em>new</em> socket per connection — the listening socket keeps listening. That's why a server handles thousands of clients on "one port": one listener, N connection sockets, each keyed by the 4-tuple (src ip, src port, dst ip, dst port).</>,
              <><InlineCode>SO_REUSEADDR</InlineCode> exists because of <strong>TIME_WAIT</strong>: after close, the socket lingers ~60s so late-arriving packets from the old connection can't corrupt a new one. Without the flag, restarting your server gives "address already in use" until that drains — the option lets you rebind immediately.</>,
              <><InlineCode>TCP_NODELAY</InlineCode> disables Nagle's algorithm. Nagle batches small writes to avoid flooding the network with tiny packets — great for bulk transfer, terrible for a request/response RPC where it can add ~40ms waiting for more data that never comes. Latency-sensitive protocols turn it off.</>,
              <><strong>send/recv don't map 1:1 to messages</strong> — TCP is a byte <em>stream</em>, not a datagram service. One <InlineCode>send</InlineCode> can arrive as three <InlineCode>recv</InlineCode>s, or three sends can coalesce into one recv. This is the "TCP framing" problem: you must define message boundaries yourself (length prefix or delimiter). It's the #1 bug in hand-rolled protocols.</>,
              <>WebSocket: a real HTTP request with <InlineCode>Upgrade: websocket</InlineCode> that, once the server agrees, switches that same TCP connection to full-duplex framed messages. Use it when <em>both</em> sides push asynchronously — chat, collaborative editing, live cursors, multiplayer.</>,
              <>SSE (Server-Sent Events): a normal HTTP response that never closes, streaming <InlineCode>text/event-stream</InlineCode> chunks <em>server→client only</em>. It auto-reconnects and replays from <InlineCode>Last-Event-ID</InlineCode> for free, rides plain HTTP (no proxy/firewall surprises, works over HTTP/2). Use it for one-way feeds: notifications, progress, dashboards.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">WebSocket vs SSE vs polling — when each</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Default to <strong>SSE</strong> for server→client streams — it's a few lines, survives reconnects on its own, and needs no special infrastructure. Reach for <strong>WebSocket</strong> only when the client also sends frequently and latency matters; you take on heartbeats, reconnect logic, and the fact that a raw WS connection carries no cookies/auth re-check after the handshake. Reach for plain <strong>polling</strong> when updates are infrequent and "within 30s" is fine — a persistent connection per user has real memory and load-balancer cost.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
            The common mistake: WebSocket for a one-way notification feed. You've signed up for connection-lifecycle management to get something SSE hands you for free. Pick the protocol by the <em>traffic shape</em>, not by which one sounds more capable.
          </p>
        </Card>
      </Section>

      <Section id="security" kicker="3.7" title="Network Security Fundamentals">
        <TopicCard
          layerId={L}
          index={6}
          title="Firewalls, attacks, and zero-trust"
          description="A stateless firewall judges each packet alone — so to allow a reply you must open the return ports manually. A stateful firewall (conntrack) remembers connections it allowed out and auto-permits their replies. Almost everything you use is stateful; the model is default-deny inbound, allow only what's needed."
        >
          <Bullets
            items={[
              <>Default-deny is the rule because the alternative — default-allow, block known-bad — means every service you forget to lock down is exposed. Bind internal services to <InlineCode>127.0.0.1</InlineCode> or a private subnet, never <InlineCode>0.0.0.0</InlineCode>, unless public exposure is the intent. The most common breach isn't a clever exploit — it's a database that was reachable from the internet.</>,
              <><strong>SYN flood</strong>: attacker sends SYNs, never completes the handshake; the server's half-open connection table fills and it stops accepting real clients. SYN cookies defeat it by not allocating state until the handshake completes.</>,
              <><strong>Amplification</strong> (DNS/NTP): attacker spoofs the victim's IP as source, sends a tiny query to a server that returns a huge reply — the victim gets flooded by traffic it never asked for, multiplied 50×+. The enabler is UDP having no handshake to verify the source address.</>,
              <><strong>ARP poisoning</strong>: on a shared LAN, an attacker forges ARP replies to map the gateway's IP to its own MAC — now it's a man-in-the-middle for the whole segment. The lesson it teaches: <em>L2 adjacency is not trust</em>, which is the whole argument for Zero Trust.</>,
              <>VPNs: <strong>WireGuard</strong> (small, fast, modern crypto — the default now), <strong>IPsec</strong> (site-to-site, baked into routers), <strong>OpenVPN</strong> (TLS-based, traverses restrictive networks). But a VPN only moves the trust boundary — being "on the VPN" is still a network location, not an identity.</>,
              <>Zero Trust: every request is authenticated and authorized on its own merits, regardless of source IP. <strong>An internal IP is not a credential.</strong> "It came from 10.x so it's safe" is the assumption that turns one compromised host into a full breach — lateral movement. This is why L8/auth checks every call even service-to-service.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The CORS mental model — what it is, and what it isn't</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            CORS is enforced by the <em>browser</em>, not the server. The server always runs the request and sends the response; the browser then checks for <InlineCode>Access-Control-Allow-Origin</InlineCode> and, if it's missing, <em>hides the response from the JS that asked for it</em>. So a "CORS error" is never a server crash — it's a missing response header. The fix is on the server, not the client.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
            And it is <strong>not a security boundary</strong>. <InlineCode>curl</InlineCode>, a mobile app, or any non-browser client ignores CORS entirely — it only stops <em>other websites'</em> JavaScript from reading your authenticated responses in a user's browser. Your real authorization still has to live server-side on every endpoint. (API contract design and where these checks belong is L5.)
          </p>
        </Card>
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
