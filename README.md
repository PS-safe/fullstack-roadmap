# Full Stack Developer Roadmap — Interactive

An interactive learning website covering the full stack developer roadmap from CS foundations to advanced architecture. Every layer ships with concept visualizers, code playgrounds, Mermaid diagrams, and quizzes.

Built from the **Full Stack Developer Roadmap (Professional Guide 2024)** PDF.

---

## Stack

- **Vite** + **React 18** + **TypeScript**
- **TailwindCSS** for styling, custom dark theme
- **Framer Motion** for animations
- **Mermaid** for diagrams (rendered live)
- **Lucide** icons
- **React Router** for layer navigation
- LocalStorage-based progress tracking — per browser

No backend, no database. Everything runs in the browser.

---

## Quick start

```bash
cd fullstack-roadmap
npm install
npm run dev
```

The dev server prints a URL (default `http://localhost:5173`). The browser opens automatically.

To produce a static build:

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

---

## What's inside

### L01 — Foundations of Computer Science
Binary converter · bitwise operations · IEEE 754 demo · logic gate lab with truth table · data structure animation (stack, queue, hash table) · sorting visualizer (bubble / insertion / quick / merge) · Big-O comparison chart · memory hierarchy with latency scale · compilation pipeline diagram · JS playground · 5-question quiz.

### L02 — Operating Systems & Linux
Boot pipeline · process state walker · virtual ↔ physical page mapping · chmod calculator · Linux command cheat sheet · pipeline simulator (sort | uniq -c | sort -rn) · graceful shutdown demo (SIGTERM vs SIGKILL) · Bash playground · 5-question quiz.

### L03 — Networking Fundamentals
OSI encapsulation walk-through · CIDR / subnet calculator with bit visualization · TCP 3-way handshake animation · DNS resolution chain · HTTP status code explorer · live `fetch` playground · 5-question quiz.

### L04 — Frontend Development
WCAG contrast checker · Flexbox playground (full controls + generated CSS) · live HTML/CSS sandbox · JavaScript event loop visualizer (call stack + microtask queue + macrotask queue) · React hooks demo · Web Vitals (LCP/INP/CLS) budget calculator · 5-question quiz.

### L05 — Backend Development
REST vs GraphQL vs gRPC sample comparison · JWT decoder (header / payload / signature, exp check) · `EXPLAIN ANALYZE` index demo · ER diagram (Mermaid) · cache strategy animator (cache-aside / write-through / write-behind) · Kafka topic + consumer group demo · saga playground · 5-question quiz.

### L06 — DevOps & Cloud
Git branch graph (commit, branch, merge) · CI/CD pipeline runner with stage status · Dockerfile layer cache visualizer · K8s topology (Service + Pods + restart) · Mermaid topology diagram · cloud service grid · Terraform-style snippet · SLO dashboard with burn-rate · 5-question quiz.

### L07 — Advanced Topics & Architecture
Consistent hashing ring (add/remove servers) · load balancer algorithm comparison · CAP theorem picker · token bucket rate limiter · security checklist · event sourcing & projection demo · latency histogram with P50/P95/P99 · benchmark playground · 5-question quiz.

### L08 — Web Platform & Browser
Cookie attribute builder (HttpOnly / Secure / SameSite / __Host-) · server-session vs JWT-cookie compare · CORS simulator with preflight + credential-conflict warnings · security headers builder (CSP / HSTS / X-Frame / Permissions-Policy) with grade · web storage matrix (cookie / local / session / IndexedDB / Cache API) · localStorage emulator · animated browser rendering pipeline (DOM → CSSOM → render tree → layout → paint → composite) · service worker lifecycle · modern Web APIs grid · service worker code playground · `IntersectionObserver` playground · 5-question quiz.

### L09 — Architecture & Design Patterns
SOLID grid + before/after code · DRY/KISS/YAGNI anti-patterns gallery · architecture switcher (Layered / Hexagonal / Clean / Onion) with pros, cons, and animated layer stack · Mermaid hex-arch diagram · MVC vs MVP vs MVVM compare · DDD bounded context map (clickable) · BFF SVG diagram · atomic design pyramid · GoF pattern picker (10 patterns) · anti-pattern catalog · Strategy + Observer playground · 5-question quiz.

### L10 — Rendering, SEO & Accessibility
CSR / SSR / SSG / ISR / RSC comparator with pros, cons, examples · first-load timeline race · hydration modes table · meta tag + Open Graph builder with live Google + Slack/Twitter card preview · JSON-LD generator (Article / Product / FAQ / BreadcrumbList) · robots.txt + sitemap.xml templates · sitemap generator playground · hreflang generator · WCAG 2.1 AA checklist · simulated Lighthouse a11y score · 5-question quiz.

### L11 — Testing & Reliability
Pyramid vs testing trophy comparator · test doubles matrix (mock/stub/spy/fake) · TDD red-green-refactor animator · Pact-style contract test compare · "where would you put this test?" picker · incident runbook · severity calculator · blameless postmortem template (collapsible sections) · RPO/RTO selector · chaos experiments to start with · 5-question quiz.

### L12 — Productionisation
OAuth 2.0 + PKCE step animator · PKCE verifier/challenge playground · password reset flow walk-through · MFA mechanism comparator (TOTP / WebAuthn / magic / SMS / recovery) · job queue with retry + jitter + dead-letter · webhook signature & timestamp replay defence demo · WebSocket / SSE / polling / long-polling / WebTransport comparator · SPF / DKIM / DMARC explainer · deliverability checklist · Stripe end-to-end flow · idempotent payment intent playground · UTC ↔ timezone formatter · float-vs-cents money math · pluralization across en/ru/ja/ar · 5-question quiz.

### L13 — Product Operations
Distributed trace span tree with bottleneck highlight · RED + USE methods · feature flag gradual rollout (1% canary → 100%) · four kinds of flags compared · A/B test significance calculator (z-score, p-value, required sample size) · event taxonomy table & naming convention · RAG architecture diagram · LLM cost calculator (per request + monthly, with cache) · cloud cost estimator with breakdown · FinOps habits · GDPR/CCPA/cookie consent compliance checklist · ADR template · documentation hierarchy table · 5-question quiz.

### L14 — Unit Testing in Practice
Interactive AAA structure with role-highlighting · test naming conventions table · framework matrix (Vitest/Jest/Pytest/Go/JUnit/Playwright) · async patterns playground · mocking matrix (HTTP via MSW, time, modules, DB, FS) · MSW pattern example · snapshot vs property-based vs mutation picker · live property-based test demo with shrinking · coverage types comparator · flaky test taxonomy with triage · Testing Library query priority (4 tiers) · component testing playground · 5-question quiz.

### L15 — Data Engineering & Pipelines
ETL vs ELT animator with flow + trade-offs · batch vs streaming compare · file format matrix (CSV / JSON / Avro / Parquet / ORC / Delta) with relative size · lake / warehouse / lakehouse picker · dbt model dependency graph (SVG) with sample SQL · Airflow / Dagster DAG runner with task status + dep gating · stream window visualizer (tumbling / sliding / session) · CDC flow with sample event payload · Mermaid DAG diagram · star schema diagram (SVG) · SCD Type 1/2/3 picker with before/after tables · data quality test runner (dbt-style) · 5-question quiz.

### L16 — Node.js in Practice
Animated stream pipeline with backpressure (hold "slow consumer" to pile up chunks) · libuv event loop phases with microtask explanation · cluster vs worker_threads vs child_process picker (real code) · ESM ↔ CommonJS interop matrix · package manager comparator (npm/pnpm/Yarn/Bun) · semver range table · HTTP framework matrix (Express/Fastify/Hono/NestJS/tRPC) · ORM matrix (Drizzle/Kysely/Prisma/TypeORM/Sequelize/raw SQL) · async error patterns playground · debug + production cheats grid · pnpm + Turborepo monorepo layout · 5-question quiz.

### L17 — React Patterns Deep
State decision tree (server / URL / form / local / shared / persistent) · client-state library matrix · live optimistic mutation demo (TanStack Query pattern with rollback) · TanStack Query mutation patterns playground · live form validation (Zod-style) with schema sample · routing comparator (Next App Router / TanStack Router / React Router / wouter) · compound components (Tabs) live + code · controlled vs uncontrolled inputs · custom hooks playground (useDebounce, useToggle, useLocalStorage) · animation library matrix · live Framer Motion layout demo · component library matrix (shadcn / Radix / RAC / Mantine / MUI) · 5-question quiz.

### L18 — Go in Practice
Concurrency pattern picker (fan-out / fan-in / pipeline / worker pool) · channel pattern playground · context.Context propagation diagram with do/don't · error handling reference (sentinel · wrap %w · typed · multi · errors.Is/As) · error pattern playground · interface design before/after (accept interfaces, return structs) · generics playground (when they pay off) · conventional Go project layout · table-driven test playground · interactive race detector demo · HTTP framework matrix (net/http/chi/gin/echo/fiber) · sqlc workflow (queries → generate → use) · pprof endpoint guide (CPU/heap/goroutine/block/mutex/trace) · 5-question quiz.

---

## Tracking progress

Each topic card has a **Mark mastered** button. Per-layer progress shows in the sidebar; total progress shows at the bottom.

Progress is stored in `localStorage` under the key `fsr.progress.v1`. Reset with the small ↺ button next to the progress total in the sidebar.

---

## Project layout

```
fullstack-roadmap/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                # entry
    ├── App.tsx                 # routes
    ├── index.css               # tailwind + custom layer
    ├── components/
    │   ├── Layout.tsx          # sidebar + main area
    │   ├── UI.tsx              # Section, Card, Pill, TopicCard, Stat, Bullets...
    │   ├── Quiz.tsx            # quiz component
    │   ├── MermaidDiagram.tsx  # mermaid wrapper
    │   └── CodePlayground.tsx  # JS / HTML editor + runner
    ├── data/
    │   └── layers.ts           # layer metadata + icons
    ├── lib/
    │   ├── cn.ts               # className combiner
    │   └── progress.ts         # localStorage progress hook
    ├── types/
    │   └── mermaid.d.ts        # fallback type decl for offline editor
    └── pages/
        ├── Home.tsx
        ├── Layer1.tsx          # Foundations
        ├── Layer2.tsx          # OS & Linux
        ├── Layer3.tsx          # Networking
        ├── Layer4.tsx          # Frontend
        ├── Layer5.tsx          # Backend
        ├── Layer6.tsx          # DevOps & Cloud
        ├── Layer7.tsx          # Advanced & Architecture
        ├── Layer8.tsx          # Web Platform & Browser
        ├── Layer9.tsx          # Architecture & Design Patterns
        ├── Layer10.tsx         # Rendering, SEO & Accessibility
        ├── Layer11.tsx         # Testing & Reliability
        ├── Layer12.tsx         # Productionisation
        ├── Layer13.tsx         # Product Operations
        ├── Layer14.tsx         # Unit Testing in Practice
        ├── Layer15.tsx         # Data Engineering & Pipelines
        ├── Layer16.tsx         # Node.js in Practice
        ├── Layer17.tsx         # React Patterns Deep
        └── Layer18.tsx         # Go in Practice
```

Each layer page contains its visualizers as inline components — co-located so you can read one file end-to-end.

---

## Adding a new visualizer

1. Open the relevant `LayerN.tsx`.
2. Add a function component below the page export.
3. Render it inside the matching `<Section>` block.
4. If it's a topic-level concept, wrap it in `<TopicCard layerId={N} index={i} ...>` so it counts toward progress.

For new playground content, use `<CodePlayground mode="js" initial={...} />` (JS console) or `mode="html"` (rendered iframe).

---

## Quiz format

Each quiz is an array of `{ q, options, answer, explain }`. The component shows a progress bar, immediate feedback, an explanation, and a final score with a retry button.

---

## License

For personal study use, drawn from the *Full Stack Developer Roadmap — Professional Teaching Resource*.
