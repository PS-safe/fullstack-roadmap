import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Container, GitBranch, Activity, Play, Pause, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { MermaidDiagram } from '../components/MermaidDiagram';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 6;

export default function Layer6() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="git" kicker="6.1" title="Git & Version Control Mastery">
        <TopicCard
          layerId={L}
          index={0}
          title="Object model and branching"
          description="Git is a content-addressed key-value store. Once you grok blob/tree/commit/tag, every command makes sense."
        >
          <Bullets
            items={[
              <>Object model: blob (file), tree (directory), commit (snapshot + parent), tag — all addressed by SHA-1.</>,
              <>Branching: GitHub Flow (short-lived PRs) for most teams; Trunk-Based Dev for high-velocity teams with feature flags.</>,
              <>Merge preserves history; rebase rewrites it — never rebase shared/public branches.</>,
              <><InlineCode>git bisect</InlineCode> binary-searches commits to find which one broke the build.</>,
            ]}
          />
        </TopicCard>
        <GitGraphDemo />
      </Section>

      <Section id="cicd" kicker="6.2" title="CI/CD Pipelines">
        <TopicCard
          layerId={L}
          index={1}
          title="From commit to production, reproducibly"
          description="A broken main branch is a team-wide emergency. Fast feedback comes from running cheap checks early and expensive ones in parallel."
        >
          <Bullets
            items={[
              <>Pipeline: lint → unit → integration → security scan → build → push → deploy → smoke test.</>,
              <>Deploy strategies: rolling (default), blue-green (instant rollback), canary (% of traffic), shadow (mirror traffic).</>,
              <>Feature flags decouple deploy from release — enable a feature for 1% of users without redeploying.</>,
            ]}
          />
        </TopicCard>
        <CiPipelineRunner />
      </Section>

      <Section id="docker" kicker="6.3" title="Docker & Containerization">
        <TopicCard
          layerId={L}
          index={2}
          title="Namespaces + cgroups + union FS"
          description="A container is a Linux process with extra walls — isolated namespaces (PID, NET, MNT) and constrained resources (cgroups). Same kernel, different worldview."
        >
          <Bullets
            items={[
              <>Multi-stage builds: build in one image, copy artifacts to a minimal runtime image.</>,
              <>Order Dockerfile layers by change frequency. <InlineCode>COPY package.json</InlineCode> before <InlineCode>COPY src/</InlineCode> = better cache hits.</>,
              <>Run as non-root, drop all Linux capabilities, mount root read-only.</>,
              <>Networks: bridge (default), host (no isolation), overlay (Swarm).</>,
            ]}
          />
        </TopicCard>
        <DockerLayers />
      </Section>

      <Section id="k8s" kicker="6.4" title="Kubernetes Core Concepts">
        <TopicCard
          layerId={L}
          index={3}
          title="Declarative orchestration"
          description="You declare desired state in YAML; controllers reconcile cluster reality to match. The control plane is just a database (etcd) with watchers."
        >
          <Bullets
            items={[
              <>Pod = group of co-located containers sharing network and storage. Smallest deployable unit.</>,
              <>Deployment manages ReplicaSets; ReplicaSets manage Pods. Updating Deployment rolls out new ReplicaSet.</>,
              <>Service = stable virtual IP and DNS for a pool of pods (selected by label).</>,
              <>Ingress = HTTP routing rules + TLS termination, implemented by nginx-ingress, Traefik, etc.</>,
            ]}
          />
        </TopicCard>
        <K8sTopology />
        <MermaidDiagram
          chart={`flowchart LR
            U[User] --> ING[Ingress<br/>HTTPS]
            ING --> S[Service: web]
            S --> P1[Pod web-7d5b]
            S --> P2[Pod web-6c41]
            S --> P3[Pod web-9af2]
            P1 -.read.-> DB[(Postgres<br/>StatefulSet)]
            P2 -.read.-> DB
            P3 -.write.-> DB
            CM[ConfigMap] -.mounted.-> P1
            SEC[Secret] -.env.-> P1
            style U fill:#1f2937,stroke:#22d3ee
            style DB fill:#1f2937,stroke:#34d399`}
          caption="A typical web app on Kubernetes"
        />
      </Section>

      <Section id="cloud" kicker="6.5" title="Cloud Platforms & IaC">
        <TopicCard
          layerId={L}
          index={4}
          title="Code your infrastructure"
          description="Terraform/Pulumi turn 'click around in the AWS console' into reviewable PRs. State files are sacred — back them up, lock them, encrypt them."
        >
          <CloudGrid />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={220}
          title="Terraform-style snippet (HCL pretending to be JSON)"
          initial={`// Pretend HCL → JSON
const tf = {
  resource: {
    aws_s3_bucket: { app_assets: { bucket: "my-app-assets", acl: "private" } },
    aws_cloudfront_distribution: {
      cdn: {
        origin: { domain_name: "\${aws_s3_bucket.app_assets.bucket}" },
        enabled: true,
        default_cache_behavior: { viewer_protocol_policy: "redirect-to-https" },
      },
    },
  },
};

console.log(JSON.stringify(tf, null, 2));
console.log('Run: terraform init && terraform plan && terraform apply');`}
        />
      </Section>

      <Section id="obs" kicker="6.6" title="Observability">
        <TopicCard
          layerId={L}
          index={5}
          title="Logs, metrics, traces"
          description="Logs say 'what happened'. Metrics say 'how much, how fast'. Traces say 'where time was spent'. You need all three."
        >
          <Bullets
            items={[
              <>Structured JSON logs with <InlineCode>request_id</InlineCode>, <InlineCode>user_id</InlineCode>, <InlineCode>service</InlineCode>, <InlineCode>level</InlineCode>.</>,
              <>Prometheus pulls metrics; Grafana visualizes; Alertmanager routes pages.</>,
              <>OpenTelemetry: vendor-neutral SDK; instrument once, export anywhere.</>,
              <>SLO &gt; SLA: if you only have an SLA, you're behind. Burn-rate alerts catch problems early.</>,
            ]}
          />
        </TopicCard>
        <SloDashboard />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 6 Quiz">
        <Quiz id="L6" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-sky-500/10 via-bg-card to-cyan-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-sky-500 to-cyan-500 text-white">L06</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">DevOps & Cloud</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">From commit to production, reliably</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          DevOps closes the loop between writing code and running it at scale. Modern engineers own the entire path: build, ship, observe, page, fix.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Cloud className="h-4 w-4 text-sky-400" />
          6 topics · 5 visualizers · 1 playground · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

type Commit = { id: string; branch: string; parents: string[]; msg: string };

function GitGraphDemo() {
  const [commits, setCommits] = useState<Commit[]>([
    { id: 'a1', branch: 'main', parents: [], msg: 'init' },
    { id: 'a2', branch: 'main', parents: ['a1'], msg: 'add readme' },
    { id: 'b1', branch: 'feat', parents: ['a2'], msg: 'feat: form' },
    { id: 'b2', branch: 'feat', parents: ['b1'], msg: 'feat: validation' },
    { id: 'a3', branch: 'main', parents: ['a2'], msg: 'fix: typo' },
  ]);
  const [head, setHead] = useState('a3');

  const tip = (b: string) => [...commits].reverse().find((c) => c.branch === b)?.id;
  const cnt = commits.length;

  const addCommit = (branch: string) => {
    const parent = tip(branch);
    if (!parent) return;
    const id = String.fromCharCode(97 + Math.floor(cnt / 8)) + (cnt + 1);
    const msg = ['wip', 'fix', 'feat', 'chore', 'refactor'][cnt % 5];
    setCommits((arr) => [...arr, { id, branch, parents: [parent], msg }]);
    setHead(id);
  };

  const merge = () => {
    const featTip = tip('feat');
    const mainTip = tip('main');
    if (!featTip || !mainTip) return;
    const id = 'm' + (cnt + 1);
    setCommits((arr) => [...arr, { id, branch: 'main', parents: [mainTip, featTip], msg: 'merge feat' }]);
    setHead(id);
  };

  const branches = ['main', 'feat'];
  const ROW_H = 50;

  return (
    <Card>
      <h4 className="mb-3 font-semibold flex items-center gap-2"><GitBranch className="h-4 w-4" /> Git branch graph</h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-bg-soft/30 p-4">
          <svg width="100%" height={commits.length * ROW_H + 20} viewBox={`0 0 600 ${commits.length * ROW_H + 20}`}>
            {commits.map((c, i) => {
              const x = c.branch === 'main' ? 80 : 200;
              const y = (commits.length - i - 1) * ROW_H + 30;
              return (
                <g key={c.id}>
                  {c.parents.map((pId) => {
                    const pc = commits.find((x) => x.id === pId);
                    if (!pc) return null;
                    const pIdx = commits.indexOf(pc);
                    const px = pc.branch === 'main' ? 80 : 200;
                    const py = (commits.length - pIdx - 1) * ROW_H + 30;
                    return <path key={pId} d={`M${x},${y} C${x},${(y + py) / 2} ${px},${(y + py) / 2} ${px},${py}`} stroke={c.branch === 'main' ? '#6366f1' : '#22d3ee'} strokeWidth="2" fill="none" />;
                  })}
                  <circle cx={x} cy={y} r={head === c.id ? 9 : 7} fill={c.branch === 'main' ? '#6366f1' : '#22d3ee'} stroke={head === c.id ? '#fff' : 'transparent'} strokeWidth="2" />
                  <text x={x + 16} y={y + 4} fill="#9aa6b2" fontFamily="ui-monospace" fontSize="11">{c.id}</text>
                  <text x={x + 50} y={y + 4} fill="#e7ecf3" fontSize="12">{c.msg}</text>
                </g>
              );
            })}
            {branches.map((b, i) => (
              <text key={b} x={i === 0 ? 60 : 180} y={15} fill={b === 'main' ? '#6366f1' : '#22d3ee'} fontSize="11" fontFamily="ui-monospace">
                {b}
              </text>
            ))}
          </svg>
        </div>
        <div className="space-y-2">
          <button onClick={() => addCommit('main')} className="btn-ghost w-full text-xs">commit on main</button>
          <button onClick={() => addCommit('feat')} className="btn-ghost w-full text-xs">commit on feat</button>
          <button onClick={merge} className="btn-primary w-full text-xs">merge feat → main</button>
          <button onClick={() => { setCommits(commits.slice(0, 5)); setHead('a3'); }} className="btn-ghost w-full text-xs"><RotateCcw className="h-3 w-3" /> Reset</button>
          <p className="text-[11px] leading-relaxed text-ink-faint">Each commit knows its parent(s). A merge has two parents. Branches are just movable refs — pointers to a tip commit.</p>
        </div>
      </div>
    </Card>
  );
}

type StageStatus = 'pending' | 'running' | 'pass' | 'fail';

function CiPipelineRunner() {
  const initial = ['lint', 'unit', 'integration', 'build', 'security', 'deploy:staging', 'smoke', 'deploy:prod'];
  const [stages, setStages] = useState<{ name: string; status: StageStatus; ms: number }[]>(initial.map((n) => ({ name: n, status: 'pending', ms: 0 })));
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const idx = stages.findIndex((s) => s.status === 'running' || s.status === 'pending');
    if (idx === -1) {
      setRunning(false);
      return;
    }
    const cur = stages[idx];
    if (cur.status === 'pending') {
      setStages((arr) => arr.map((s, i) => (i === idx ? { ...s, status: 'running' } : s)));
      return;
    }
    const id = setTimeout(() => {
      const fail = Math.random() < 0.05 && idx > 0;
      setStages((arr) => arr.map((s, i) => (i === idx ? { ...s, status: fail ? 'fail' : 'pass', ms: 200 + Math.floor(Math.random() * 1500) } : s)));
      if (fail) setRunning(false);
    }, 600 + Math.random() * 600);
    return () => clearTimeout(id);
  }, [stages, running]);

  const reset = () => {
    setRunning(false);
    setStages(initial.map((n) => ({ name: n, status: 'pending', ms: 0 })));
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">CI/CD pipeline runner</h4>
        <div className="flex gap-2">
          <button onClick={() => setRunning((r) => !r)} className="btn-primary h-8 text-xs">
            {running ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Run</>}
          </button>
          <button onClick={reset} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {stages.map((s, i) => (
          <motion.div
            key={s.name}
            animate={{ scale: s.status === 'running' ? 1.04 : 1 }}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
              s.status === 'pending' && 'border-white/10 bg-white/5 text-ink-dim',
              s.status === 'running' && 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
              s.status === 'pass' && 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
              s.status === 'fail' && 'border-rose-400/30 bg-rose-400/10 text-rose-200',
            )}
          >
            <span className="font-mono text-[11px] text-ink-faint">{i + 1}</span>
            <span>{s.name}</span>
            {s.status === 'running' && <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />}
            {s.status === 'pass' && <span className="text-xs">{s.ms}ms ✓</span>}
            {s.status === 'fail' && <span className="text-xs">✗</span>}
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">A real pipeline runs cheap checks first (lint, unit) and expensive ones in parallel (integration, security).</p>
    </Card>
  );
}

function DockerLayers() {
  const dockerfile = `FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]`;
  const layers = [
    { line: 'FROM node:20-alpine AS build', size: 165, kind: 'base', cached: true },
    { line: 'COPY package*.json ./', size: 0.4, kind: 'copy', cached: true },
    { line: 'RUN npm ci', size: 240, kind: 'run', cached: true },
    { line: 'COPY src ./src', size: 5, kind: 'copy', cached: false },
    { line: 'RUN npm run build', size: 12, kind: 'run', cached: false },
    { line: '— stage 2 —', size: 0, kind: 'stage', cached: true },
    { line: 'FROM node:20-alpine', size: 165, kind: 'base', cached: true },
    { line: 'COPY --from=build dist', size: 12, kind: 'copy', cached: false },
  ];
  const finalSize = layers.filter((l) => l.kind !== 'stage' && l.line.startsWith('COPY --from')).reduce((a, l) => a + l.size, 0) + 165;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Container className="h-4 w-4" />
        <h4 className="font-semibold">Dockerfile layer cache</h4>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-3 text-[12px] leading-5 text-ink-dim">{dockerfile}</pre>
        <div className="space-y-1">
          {layers.map((l, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center justify-between gap-2 rounded border px-3 py-1.5 font-mono text-[11px]',
                l.kind === 'stage' && 'border-dashed border-white/10 bg-transparent text-ink-faint',
                l.cached ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200',
              )}
            >
              <span className="truncate">{l.line}</span>
              <span className="text-[10px] text-ink-faint">{l.kind === 'stage' ? '' : `${l.size} MB · ${l.cached ? 'cache hit' : 'rebuild'}`}</span>
            </div>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Final image" value={`${Math.round(finalSize)} MB`} sub="multi-stage runtime" />
            <Stat label="If single-stage" value={`${Math.round(layers.reduce((a, l) => a + l.size, 0))} MB`} sub="includes build deps" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function K8sTopology() {
  const [pods, setPods] = useState(3);
  const [restarting, setRestarting] = useState<number | null>(null);

  const restartPod = (i: number) => {
    setRestarting(i);
    setTimeout(() => setRestarting(null), 1200);
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Deployment scaling demo</h4>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink-dim">replicas:</span>
          <button onClick={() => setPods((p) => Math.max(1, p - 1))} className="btn-ghost h-7 px-2">−</button>
          <span className="font-mono">{pods}</span>
          <button onClick={() => setPods((p) => Math.min(8, p + 1))} className="btn-ghost h-7 px-2">+</button>
        </div>
      </div>
      <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-cyan-200">Service: web</span>
          <span className="text-ink-faint">selector: app=web</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <AnimatePresence>
            {Array.from({ length: pods }).map((_, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  'rounded-xl border p-3',
                  restarting === i ? 'border-amber-400/30 bg-amber-400/10' : 'border-emerald-400/30 bg-emerald-400/10',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink">web-{(7000 + i).toString(16)}</span>
                  <span className={cn('h-2 w-2 rounded-full', restarting === i ? 'animate-pulse bg-amber-400' : 'bg-emerald-400')} />
                </div>
                <div className="mt-1 text-[10px] text-ink-faint">node-{(i % 3) + 1}</div>
                <button onClick={() => restartPod(i)} className="mt-2 w-full rounded border border-white/10 bg-white/5 py-1 text-[11px] text-ink-dim hover:bg-white/10">
                  restart
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Increase replicas → ReplicaSet creates new Pods. Restart a Pod → kubelet replaces it; the Service routes only to ready endpoints.
      </p>
    </Card>
  );
}

function CloudGrid() {
  const groups = [
    { title: 'Compute', items: ['EC2 / VM', 'Fargate / Cloud Run', 'Lambda / Functions'] },
    { title: 'Containers', items: ['EKS / GKE / AKS', 'Fargate', 'ECS'] },
    { title: 'Storage', items: ['S3 / GCS / Blob', 'EBS / PD', 'EFS / Filestore'] },
    { title: 'Database', items: ['RDS / Cloud SQL', 'Aurora', 'DynamoDB / Firestore'] },
    { title: 'Network', items: ['VPC, subnets', 'ALB / NLB', 'Route 53 / Cloud DNS'] },
    { title: 'Identity', items: ['IAM roles + OIDC', 'Service accounts', 'KMS / Secret Manager'] },
    { title: 'Edge / CDN', items: ['CloudFront', 'Cloud CDN', 'WAF'] },
    { title: 'IaC', items: ['Terraform', 'Pulumi', 'CDK / Bicep'] },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {groups.map((g) => (
        <div key={g.title} className="rounded-xl border border-white/5 bg-bg-soft/40 p-3">
          <div className="mb-2 text-xs uppercase tracking-widest text-accent-cyan">{g.title}</div>
          <ul className="space-y-1 text-xs text-ink-dim">
            {g.items.map((it) => (
              <li key={it} className="font-mono">{it}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SloDashboard() {
  const [latency, setLatency] = useState(120);
  const [errorRate, setErrorRate] = useState(0.3);
  const slo = 99.9;
  const observed = 100 - errorRate;
  const errorBudget = (100 - slo) / 100;
  const burnRate = errorRate / 100 / errorBudget;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-emerald-300" />
        <h4 className="font-semibold">Tiny SLO dashboard</h4>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink-faint">P99 latency (ms)</div>
          <input type="range" min="20" max="2000" value={latency} onChange={(e) => setLatency(parseInt(e.target.value))} className="mt-2 w-full" />
          <div className="font-mono text-2xl">{latency}<span className="text-sm text-ink-dim"> ms</span></div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-ink-faint">Error rate (%)</div>
          <input type="range" min="0" max="5" step="0.05" value={errorRate} onChange={(e) => setErrorRate(parseFloat(e.target.value))} className="mt-2 w-full" />
          <div className="font-mono text-2xl">{errorRate.toFixed(2)}%</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-3">
          <div className="text-xs uppercase tracking-widest text-ink-faint">SLO {slo}%</div>
          <div className={cn('mt-1 text-2xl font-semibold', observed >= slo ? 'text-emerald-300' : 'text-rose-300')}>
            {observed >= slo ? 'within' : 'breaching'}
          </div>
          <div className="mt-1 text-[11px] text-ink-faint">observed {observed.toFixed(2)}%</div>
          <div className="mt-2 text-[11px] text-ink-dim">
            burn rate: <span className={cn(burnRate > 1 ? 'text-rose-300' : 'text-ink')}>{burnRate.toFixed(1)}×</span>{' '}
            {burnRate > 14 && '— page now'}
            {burnRate > 6 && burnRate <= 14 && '— page soon'}
            {burnRate <= 6 && '— ticket'}
          </div>
        </div>
      </div>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'What does git store at its core?',
    options: [
      'Diffs between revisions.',
      'Compressed snapshots, addressed by SHA-1.',
      'A linked list of patches.',
      'A relational database.',
    ],
    answer: 1,
    explain: 'Git is a content-addressed object store. Each commit is a full snapshot (deduplicated by hash), not a diff.',
  },
  {
    q: 'A multi-stage Docker build is preferred because...',
    options: [
      'It speeds up builds.',
      'The final image excludes build dependencies, shrinking and securing it.',
      'It enables layer caching.',
      'It is required by Dockerfile spec.',
    ],
    answer: 1,
    explain: 'You build in one stage and copy only the artifacts to a minimal runtime stage — no compilers or test deps in production.',
  },
  {
    q: 'A Kubernetes Service does what?',
    options: [
      'Replaces a Pod when it crashes.',
      'Provides a stable DNS name and load-balances across selected Pods.',
      'Stores configuration.',
      'Schedules workloads.',
    ],
    answer: 1,
    explain: 'Pods come and go (different IPs). The Service is the stable virtual IP/DNS that routes traffic to ready Pods matching its selector.',
  },
  {
    q: 'You have an SLO of 99.9% over 30 days. Your error budget is...',
    options: ['~10 minutes', '~43 minutes', '~6 hours', '~30 minutes'],
    answer: 1,
    explain: '0.1% of 30 days = 0.001 × 43,200 min = 43.2 minutes.',
  },
  {
    q: 'Canary deployment means...',
    options: [
      'Replacing all instances at once.',
      'Routing a small percentage of traffic to the new version, watching, then rolling forward.',
      'Building two parallel environments.',
      'Reverting on failure.',
    ],
    answer: 1,
    explain: 'Canaries detect bad releases at low blast radius before promoting to 100%.',
  },
];
