import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Container, GitBranch, Activity, Play, Pause, RotateCcw } from 'lucide-react';
import { Section, TopicCard, InlineCode, Card, Stat, Steps, Compare } from '../components/UI';
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
          description="Git is a content-addressed key-value store. Once you grok blob/tree/commit/tag, every command makes sense — and every 'lost work' panic stops being scary."
        />
        <GitGraphDemo />
        <Card>
          <h4 className="mb-2 font-semibold">The object model — everything is content-addressed</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Object model: blob (file content), tree (directory listing), commit (one tree + parent(s) + author/message), tag (named
            pointer). All keyed by the SHA-1 of their content — identical content stores once. A branch is not an object: it's a
            41-byte file in <InlineCode>.git/refs</InlineCode> holding a commit hash. "Moving a branch" just rewrites that file. A
            commit's hash covers its tree <em>and</em> its parent hash, so change anything in history and every descendant hash
            changes — that's why rebase produces new commits, not edited ones, and why a shared rebase forces everyone else to
            re-clone.
          </p>
        </Card>
        <Compare
          items={[
            {
              label: 'Merge',
              tone: 'a',
              body: (
                <>
                  Keeps the real topology — a merge commit with two parents. Honest but noisy: the graph shows exactly what happened,
                  branch points and all. Hashes are never rewritten, so it's always safe on shared branches.
                </>
              ),
            },
            {
              label: 'Rebase',
              tone: 'b',
              body: (
                <>
                  Replays your commits onto a new base for linear history — readable, but rewrites hashes. Rule: rebase your{' '}
                  <em>own</em> unpushed branch to clean it up; never rebase anything others have pulled, or you force everyone else
                  into a conflict-on-every-file pull.
                </>
              ),
            },
          ]}
        />
        <Compare
          items={[
            {
              label: 'GitHub Flow',
              tone: 'a',
              body: (
                <>
                  Short-lived branch → PR → merge → delete. The right default for most teams. Branches stay small enough that review
                  is fast and the merge is low-risk.
                </>
              ),
            },
            {
              label: 'Trunk-based',
              tone: 'b',
              body: (
                <>
                  Commit straight to main behind feature flags — for high-velocity teams. Both models exist for the same reason: keep
                  branches short. A week-old branch diverges far enough that the merge is a second feature's worth of risk.
                </>
              ),
            },
          ]}
        />
        <Compare
          items={[
            {
              label: 'git reflog — recovery',
              tone: 'c',
              body: (
                <>
                  Logs every HEAD move for ~90 days, so a "lost" commit after a bad <InlineCode>reset</InlineCode> is still reachable
                  by hash. The reason "lost work" panic is almost always unfounded — the commit isn't gone, just unreferenced.
                </>
              ),
            },
            {
              label: 'git bisect — find the break',
              tone: 'c',
              body: (
                <>
                  Binary-searches commits to pin the one that broke a test — O(log n) instead of reading every diff. Mark a known-good
                  and known-bad commit; Git checks out the midpoint until it isolates the culprit.
                </>
              ),
            },
          ]}
        />
        <Compare
          items={[
            {
              label: 'Force-push to a shared branch',
              tone: 'fail',
              body: (
                <>
                  You rebase <InlineCode>main</InlineCode> and <InlineCode>push --force</InlineCode>. Everyone else's local{' '}
                  <InlineCode>main</InlineCode> now points at commits that no longer exist upstream. Their next pull either conflicts
                  on every file or — worse — they "fix" it by pushing the old history back and silently revert your work.{' '}
                  <strong>Fix:</strong> never rewrite published history. If you must, use <InlineCode>--force-with-lease</InlineCode>{' '}
                  (fails if someone else pushed) and tell the team. Protect <InlineCode>main</InlineCode> server-side so force-push is
                  simply rejected.
                </>
              ),
            },
            {
              label: 'Committed a secret',
              tone: 'warn',
              body: (
                <>
                  An API key lands in a commit. Deleting it in a later commit does nothing — it's still in history, still in every
                  clone, still indexed by GitHub's secret scanners within seconds. <strong>Fix:</strong> treat the key as compromised
                  and <strong>rotate it</strong> — scrubbing history (<InlineCode>git filter-repo</InlineCode>) is cleanup, not
                  remediation. Prevent with a <InlineCode>.gitignore</InlineCode> for env files plus a pre-commit secret scanner
                  (gitleaks).
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Conventional Commits &amp; squash-merge</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Conventional Commits (<InlineCode>feat:</InlineCode>, <InlineCode>fix:</InlineCode>, <InlineCode>chore:</InlineCode>) aren't
            bureaucracy — they let tooling derive the next semver bump and generate a changelog automatically. Squash-merge a PR and
            the messy WIP history collapses to one clean commit on main while the branch keeps the detail.
          </p>
        </Card>
      </Section>

      <Section id="cicd" kicker="6.2" title="CI/CD Pipelines">
        <TopicCard
          layerId={L}
          index={1}
          title="From commit to production, reproducibly"
          description="A broken main branch is a team-wide emergency — it blocks everyone's merge. Fast feedback comes from ordering checks by cost: cheap-and-likely-to-fail first, expensive last."
        />
        <CiPipelineRunner />
        <Steps
          steps={[
            { label: 'lint' },
            { label: 'unit' },
            { label: 'integration' },
            { label: 'security scan' },
            { label: 'build' },
            { label: 'push' },
            { label: 'deploy staging' },
            { label: 'smoke' },
            { label: 'deploy prod', tone: 'ok' },
          ]}
          caption={
            <>
              <strong>Stage order is fail-fast economics.</strong> A lint error caught in 10s never wastes a 5-minute build slot.
              Order them expensive-first and every typo costs the full pipeline. And CI gates the merge, not the other way around:
              tests run on the PR <em>before</em> it reaches main, so main stays green by construction — tests that only run
              post-merge mean main breaks first and you find out second.
            </>
          }
        />
        <Card>
          <h4 className="mb-2 font-semibold">Pin every tool version</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Pin every tool version — base image, Node, the actions you call. "Latest" makes the build non-reproducible: it can break
            with zero code changes, and the failure isn't in your diff so it's the hardest kind to debug.
          </p>
        </Card>
        <Compare
          items={[
            {
              label: 'Rolling',
              tone: 'a',
              body: (
                <>
                  The default — gradual replace, no extra infra. But during the rollout you're running both versions, and a rollback
                  is just another slow rolling update.
                </>
              ),
            },
            {
              label: 'Blue-green',
              tone: 'b',
              body: (
                <>
                  Two full environments, instant atomic switch plus instant rollback. Pick it when you need the switch and the
                  rollback to be <em>instant</em> and atomic, and can afford double the infra.
                </>
              ),
            },
            {
              label: 'Canary',
              tone: 'c',
              body: (
                <>
                  Route 1–5% of real traffic to the new version, watch error rate, then promote. Pick it when the risk is
                  real-traffic behavior you can't catch in staging — it trades rollout speed for a tiny blast radius.
                </>
              ),
            },
            {
              label: 'Shadow',
              tone: 'warn',
              body: (
                <>
                  Mirror prod traffic to the new version; users never see its responses. Tests the new build under real load with
                  zero user-facing risk — the cost is running the duplicate path.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Feature flags decouple deploy from release</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Feature flags decouple deploy from release: ship the code dark, flip it on for 1% without a redeploy, kill it instantly
            if it misbehaves. The catch — a flag with no removal date becomes permanent branching dead code that every future change
            has to reason around.
          </p>
        </Card>
        <Compare
          items={[
            {
              label: 'The flaky test',
              tone: 'warn',
              body: (
                <>
                  A test fails ~3% of runs from a timing race or shared fixture. The team learns to "just re-run CI." Now a{' '}
                  <em>real</em> regression looks identical to noise — nobody trusts a red build, so red stops meaning anything.{' '}
                  <strong>Fix:</strong> a flaky test is a P1 bug, not an annoyance. Quarantine it out of the merge gate immediately,
                  then fix or delete it. A test you can't trust is worse than no test — it costs CI time and erodes the signal.
                </>
              ),
            },
            {
              label: 'Deploy with no rollback path',
              tone: 'fail',
              body: (
                <>
                  The deploy goes bad at 02:00. Now you're <em>designing</em> the rollback during the incident — and discover the
                  release also ran a non-reversible DB migration, so "just deploy the old image" corrupts data. <strong>Fix:</strong>{' '}
                  decide the rollback path <em>before</em> deploying. Keep migrations backward-compatible (expand/contract: add
                  column → deploy → backfill → switch → drop later) so old and new code can both run against the same schema during
                  the rollout window.
                </>
              ),
            },
          ]}
        />
      </Section>

      <Section id="docker" kicker="6.3" title="Docker & Containerization">
        <TopicCard
          layerId={L}
          index={2}
          title="Namespaces + cgroups + union FS"
          description="A container is a Linux process with extra walls — isolated namespaces (PID, NET, MNT) and constrained resources (cgroups). Same kernel, different worldview. (The kernel mechanics live in L2; here it's how to build images that are small, fast, and safe.)"
        />
        <DockerLayers />
        <Card>
          <h4 className="mb-2 font-semibold">Multi-stage builds</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            A heavy build stage with the compiler, dev deps, and source; a minimal runtime stage that{' '}
            <InlineCode>COPY --from=build</InlineCode>s only the artifact. Single-stage ships the whole toolchain to prod — a bigger
            attack surface, slower pulls, and CVEs in tools you don't even run.
          </p>
        </Card>
        <Steps
          steps={[
            { label: 'COPY package.json' },
            { label: 'RUN npm ci' },
            { label: 'COPY src/' },
            { label: 'RUN build' },
          ]}
          caption={
            <>
              Each Dockerfile instruction is a content-addressed layer; the build cache reuses a layer only if it <em>and every
              layer above it</em> are unchanged. Order by change frequency: <InlineCode>COPY package.json</InlineCode> +{' '}
              <InlineCode>RUN npm ci</InlineCode> (changes rarely) <em>before</em> <InlineCode>COPY src/</InlineCode> (changes every
              commit). Reverse them and every one-line code edit re-runs <InlineCode>npm ci</InlineCode> — minutes added to every CI
              build.
            </>
          }
        />
        <Compare
          items={[
            {
              label: 'Harden the runtime',
              tone: 'c',
              body: (
                <>
                  Run as a non-root <InlineCode>USER</InlineCode>, drop all Linux capabilities, mount the root filesystem read-only. A
                  container escape from a root process is a root process on the host; from an unprivileged read-only one it's far
                  less useful.
                </>
              ),
            },
            {
              label: 'Pin & scan the base',
              tone: 'a',
              body: (
                <>
                  Pin a specific base tag (<InlineCode>node:20.11-alpine</InlineCode>), never <InlineCode>:latest</InlineCode>.{' '}
                  <InlineCode>:latest</InlineCode> silently changes under you — last week's reproducible build is unbuildable today,
                  and a known-good image can rebuild with new CVEs. Scan images in CI (Trivy/Snyk) so the supply chain is checked,
                  not assumed.
                </>
              ),
            },
            {
              label: 'One process, log to stdout',
              tone: 'b',
              body: (
                <>
                  One process per container, logs to stdout/stderr — let the platform collect and ship them. A container that writes
                  its own log files reinvents log rotation badly and loses the logs when it's rescheduled.
                </>
              ),
            },
          ]}
        />
        <Compare
          items={[
            { label: 'bridge', tone: 'a', body: <>The default — NAT'd per-host. Containers get a private subnet; published ports are mapped through the host.</> },
            {
              label: 'host',
              tone: 'warn',
              body: <>Shares the host network stack directly — no isolation, no port mapping. Fast, but the container can bind any host port.</>,
            },
            { label: 'overlay', tone: 'c', body: <>Cross-host networking for Swarm / multi-node clusters — containers on different hosts share one virtual network.</> },
          ]}
        />
        <Compare
          items={[
            {
              label: 'The cache-busting COPY',
              tone: 'warn',
              body: (
                <>
                  Someone moves <InlineCode>COPY . .</InlineCode> above the dependency install "to simplify the Dockerfile." Now every
                  layer below it depends on the full source tree, so any code change invalidates the dependency layer too —{' '}
                  <InlineCode>npm ci</InlineCode> / <InlineCode>go mod download</InlineCode> re-runs on every single build.{' '}
                  <strong>Fix:</strong> copy the lockfile alone, install, <em>then</em> copy source. Add a{' '}
                  <InlineCode>.dockerignore</InlineCode> so <InlineCode>node_modules</InlineCode>, <InlineCode>.git</InlineCode>, and
                  build output don't enter the context and bust the cache for unrelated reasons.
                </>
              ),
            },
            {
              label: 'The secret baked into a layer',
              tone: 'fail',
              body: (
                <>
                  A build needs a private registry token, so it lands in an <InlineCode>ARG</InlineCode> or an early{' '}
                  <InlineCode>RUN</InlineCode>. Even if a later layer deletes it, the layer that <em>added</em> it is still in the
                  image — anyone who pulls the image can <InlineCode>docker history</InlineCode> it back out. <strong>Fix:</strong>{' '}
                  use BuildKit secret mounts (<InlineCode>RUN --mount=type=secret</InlineCode>) — the secret is available during that
                  step but never written to a layer. For runtime config, inject env vars / mounted secrets at{' '}
                  <InlineCode>docker run</InlineCode>, never at build.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Image size is latency</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Image size is latency you pay on every cold start, every autoscale event, every node replacement. A 1.2&nbsp;GB
            single-stage image vs a 90&nbsp;MB multi-stage one is the difference between a pod that's ready in seconds and one that
            holds up a deploy while it pulls.
          </p>
        </Card>
      </Section>

      <Section id="k8s" kicker="6.4" title="Kubernetes Core Concepts">
        <TopicCard
          layerId={L}
          index={3}
          title="Declarative orchestration"
          description="You declare desired state in YAML; controllers reconcile cluster reality to match. The control plane is just a database (etcd) with watchers — every object is a row, every controller a loop watching for drift."
        />
        <K8sTopology />
        <Card>
          <h4 className="mb-2 font-semibold">Pod — the smallest deployable unit, treated as cattle</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Pod = one or more co-located containers sharing a network namespace and volumes. Smallest deployable unit, and treated as
            cattle: a Pod has no stable identity, gets a new IP every restart, and is never edited in place — the controller deletes
            and recreates.
          </p>
        </Card>
        <Compare
          items={[
            { label: 'Deployment', tone: 'a', body: <>Stateless workloads. Deployment → ReplicaSet → Pods. A rolling update creates a <em>new</em> ReplicaSet and shifts replicas over per <InlineCode>maxSurge</InlineCode>/<InlineCode>maxUnavailable</InlineCode>; a rollback just scales the old ReplicaSet back up.</> },
            { label: 'StatefulSet', tone: 'b', body: <>Stable name + per-pod storage — e.g. a database. Each pod keeps its identity and volume across reschedules.</> },
            { label: 'DaemonSet', tone: 'c', body: <>One pod per node — e.g. a log agent or node exporter. Scales with the cluster, not with load.</> },
            { label: 'Job / CronJob', tone: 'warn', body: <>Run-to-completion work — a batch job once, or on a schedule. Not a long-running service.</> },
          ]}
        />
        <Compare
          items={[
            {
              label: 'requests — what the scheduler reserves',
              tone: 'a',
              body: (
                <>
                  Always set resource <InlineCode>requests</InlineCode>. Requests are what the scheduler reserves — omit them and it
                  bin-packs blindly, so one pod can starve a node.
                </>
              ),
            },
            {
              label: 'memory limit — OOM-kill',
              tone: 'fail',
              body: <>Hit the memory limit and the kernel OOM-kills the container outright — a hard, visible crash.</>,
            },
            {
              label: 'CPU limit — throttle',
              tone: 'warn',
              body: <>Exceed the CPU limit and you're throttled, not killed — a quieter, sneakier latency bug that's easy to miss.</>,
            },
          ]}
        />
        <Compare
          items={[
            {
              label: 'Readiness probe',
              tone: 'a',
              body: (
                <>
                  Gates traffic: fail → the pod is removed from the Service's endpoints but keeps running. A struggling pod drops out
                  of rotation and recovers instead of being killed.
                </>
              ),
            },
            {
              label: 'Liveness probe',
              tone: 'b',
              body: (
                <>
                  Restarts the pod: fail → kubelet kills it. Should test <em>only</em> "is this process wedged" — never a dependency.
                  Mixing the two up is a classic outage.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Service &amp; Ingress — stable addressing</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Service = stable virtual IP + DNS name for a label-selected pool of Pods; it only routes to <em>ready</em> endpoints.
            ClusterIP for internal traffic; Ingress for HTTP routing + TLS termination at the edge (implemented by nginx-ingress,
            Traefik, etc.).
          </p>
        </Card>
        <Steps
          steps={[
            { label: 'liveness hits a slow-under-load endpoint' },
            { label: 'it times out under traffic' },
            { label: 'kubelet kills the pod' },
            { label: 'fresh pod is cold, slower still' },
            { label: 'CrashLoopBackOff', tone: 'fail' },
          ]}
          caption={
            <>
              <strong className="text-rose-200">Liveness probe restart loop.</strong> The liveness probe hits an endpoint that's
              slow under load (or depends on a slow downstream); the restart loop is caused entirely by the health check, not the
              app. <strong>Fix:</strong> liveness should be a cheap local check with generous <InlineCode>timeoutSeconds</InlineCode>{' '}
              and <InlineCode>failureThreshold</InlineCode>. Put dependency checks in <em>readiness</em> instead.
            </>
          }
        />
        <Compare
          items={[
            {
              label: 'Secrets treated as encrypted',
              tone: 'warn',
              body: (
                <>
                  A K8s <InlineCode>Secret</InlineCode> is just base64 — encoding, not encryption. Anyone with read access to the
                  namespace, or to an etcd backup, can decode it instantly. Committing the manifest to git publishes the credential.{' '}
                  <strong>Fix:</strong> enable etcd encryption-at-rest, RBAC-restrict who can read Secrets, and keep them out of git
                  via sealed-secrets / external-secrets backed by a real KMS. ConfigMap is for non-sensitive config <em>only</em>.
                </>
              ),
            },
            {
              label: 'No readiness probe at all',
              tone: 'fail',
              body: (
                <>
                  The Service adds a Pod to its endpoints the moment the container <em>starts</em>, not when the app is ready to
                  serve. During every rollout, traffic hits pods still loading config or warming connection pools — a burst of 502s
                  on every deploy that looks random because it self-heals in seconds.
                </>
              ),
            },
            {
              label: 'No PodDisruptionBudget',
              tone: 'warn',
              body: (
                <>
                  A PodDisruptionBudget caps how many replicas a <em>voluntary</em> disruption (node drain, cluster upgrade) can take
                  down at once. Without one, a routine node drain can evict every replica of a service simultaneously — a
                  self-inflicted outage during planned maintenance.
                </>
              ),
            },
          ]}
        />
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
          description="Terraform/Pulumi turn 'click around in the AWS console' into reviewable PRs. The state file is the source of truth — and the single thing that, corrupted, takes the whole environment down."
        />
        <CloudGrid />
        <Steps
          steps={[
            { label: 'code' },
            { label: 'state (resource IDs)' },
            { label: 'live cloud' },
            { label: 'plan = the diff', tone: 'ok' },
          ]}
          caption={
            <>
              State maps your code to real cloud resource IDs. <InlineCode>plan</InlineCode> diffs (code) vs (state) vs (live cloud)
              and shows what <InlineCode>apply</InlineCode> will change — always read the plan; it <em>is</em> the diff, and a
              reviewed plan is the only thing standing between a typo and a deleted database.
            </>
          }
        />
        <Compare
          items={[
            {
              label: 'Remote, locked state',
              tone: 'c',
              body: (
                <>
                  Use a remote backend (S3 + DynamoDB lock, or Terraform Cloud) — not a local file. Local state is one laptop away
                  from total loss, and two engineers running <InlineCode>apply</InlineCode> at once with no lock interleave writes and
                  corrupt it.
                </>
              ),
            },
            {
              label: 'Console click-ops → drift',
              tone: 'fail',
              body: (
                <>
                  A manual console change makes the live cloud no longer match the code, so the next <InlineCode>plan</InlineCode>{' '}
                  wants to "fix" (revert) it — or fails outright. All infra in code, changed only through the repo.
                </>
              ),
            },
            {
              label: 'Modules over copy-paste',
              tone: 'a',
              body: (
                <>
                  Use modules for repeated patterns (a "service" module instantiated per environment) instead of copy-pasted dirs
                  that silently diverge. Encrypt state and never commit <InlineCode>.tfstate</InlineCode> — it holds resource
                  attributes including generated passwords in plaintext.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">IAM roles + OIDC over long-lived keys</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            Prefer cloud IAM roles + OIDC over long-lived access keys: the CI job assumes a short-lived role scoped to exactly what
            it needs. A leaked static key is a standing breach; an OIDC token expires in minutes.
          </p>
        </Card>
        <Compare
          items={[
            {
              label: 'Corrupted / lost state',
              tone: 'fail',
              body: (
                <>
                  Two concurrent <InlineCode>apply</InlineCode>s on unlocked state, or a deleted local <InlineCode>.tfstate</InlineCode>.
                  Terraform now thinks resources that exist don't — so the next <InlineCode>apply</InlineCode> tries to{' '}
                  <em>recreate</em> a live database, or orphans it (still billing, now unmanaged). <strong>Fix:</strong> remote
                  backend with locking and versioning from day one — S3 versioning lets you roll state back. Recover individual
                  resources with <InlineCode>terraform import</InlineCode> rather than re-applying.
                </>
              ),
            },
            {
              label: 'The unread plan',
              tone: 'warn',
              body: (
                <>
                  You change a tag and <InlineCode>apply</InlineCode> without reading the plan. Buried in it: a change to an immutable
                  attribute that forces <InlineCode>destroy → create</InlineCode> on the RDS instance. The "tag tweak" just took prod
                  down and lost the data. <strong>Fix:</strong> <InlineCode>plan</InlineCode> in CI on the PR, post it for review,
                  gate <InlineCode>apply</InlineCode> on approval. Watch for <InlineCode>-/+ destroy and then create</InlineCode> on
                  stateful resources — that line is the difference between a config change and an outage.
                </>
              ),
            },
          ]}
        />
        <Compare
          items={[
            {
              label: 'Managed',
              tone: 'a',
              body: (
                <>
                  Managed services (RDS, Cloud SQL, EKS control plane) buy back the undifferentiated ops — patching, backups,
                  failover — at a premium and some lock-in. For a solo operator the answer is almost always managed.
                </>
              ),
            },
            {
              label: 'Self-hosted',
              tone: 'warn',
              body: (
                <>
                  Self-host only when you need control the managed service won't give you <em>and</em> have the on-call depth to own
                  it at 3am. Otherwise you've bought a second job.
                </>
              ),
            },
          ]}
        />
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
          description="Logs say 'what happened and why'. Metrics say 'how much, how fast'. Traces say 'where the time went'. The real test: can on-call diagnose this at 3am from these alone, without attaching a debugger?"
        />
        <SloDashboard />
        <Compare
          items={[
            {
              label: 'Logs — what happened',
              tone: 'a',
              body: (
                <>
                  Structured JSON with <InlineCode>timestamp</InlineCode>, <InlineCode>level</InlineCode>,{' '}
                  <InlineCode>service</InlineCode>, and a <InlineCode>request_id</InlineCode>/<InlineCode>correlation_id</InlineCode>{' '}
                  threaded through every service the request touches. String-interpolated logs (
                  <InlineCode>"user 42 failed login"</InlineCode>) can't be queried or aggregated — you can't ask "how many failures
                  in the last hour" of free text. Never log secrets or PII; logs fan out to many systems.
                </>
              ),
            },
            {
              label: 'Metrics — how much, how fast',
              tone: 'b',
              body: (
                <>
                  Cheap (a counter, not a row per event) — that's why they drive dashboards and alerts. Prometheus <em>pulls</em>{' '}
                  metrics on a schedule (a missing target is itself a signal); Grafana visualizes; Alertmanager routes and dedupes
                  pages.
                </>
              ),
            },
            {
              label: 'Traces — where the time went',
              tone: 'c',
              body: (
                <>
                  Expensive, so sample them — they're for "<em>where</em> did this one slow request spend its 800ms across 6
                  services." A span per hop reconstructs the full request path.
                </>
              ),
            },
          ]}
        />
        <Steps
          steps={[
            { label: 'metric alert fires (error rate up)' },
            { label: 'logs filtered by request_id show what errored' },
            { label: 'trace shows which hop caused it', tone: 'ok' },
          ]}
          caption={
            <>
              Use the three together — each pillar answers a different question; one alone leaves you guessing. OpenTelemetry is the
              vendor-neutral SDK + wire format that makes this portable: instrument once, export to any backend, propagate W3C trace
              context across service boundaries so a trace doesn't break at the network edge — no re-instrumenting the codebase every
              time you switch vendors.
            </>
          }
        />
        <Compare
          items={[
            { label: 'SLI', tone: 'a', body: <>The measurement — e.g. the fraction of requests served under 200ms, or without a 5xx.</> },
            { label: 'SLO', tone: 'b', body: <>The target you hold yourself to — e.g. 99.9% of requests succeed. Error budget = 1 − SLO; spend it on shipping, and when it's exhausted, stop feature work and fix reliability. Burn-rate alerts page when you're <em>consuming</em> the budget too fast — before it's gone, not after.</> },
            { label: 'SLA', tone: 'warn', body: <>The contract with a customer — and a penalty if you breach it. Always looser than the internal SLO so the SLO trips first.</> },
          ]}
        />
        <Compare
          items={[
            {
              label: 'Alerting on causes, not symptoms',
              tone: 'fail',
              body: (
                <>
                  You page on "CPU &gt; 80%." It fires at 3am — but CPU is high because of a harmless batch job, users are fine, and
                  there's nothing to <em>do</em>. Meanwhile a real outage where CPU stayed at 40% never paged at all.{' '}
                  <strong>Fix:</strong> page on symptoms users feel — error rate, latency, request success. CPU/memory/queue depth
                  are <em>dashboard</em> signals you check <em>after</em> a symptom alert, to find the cause. Every page must be
                  actionable.
                </>
              ),
            },
            {
              label: 'Alert fatigue',
              tone: 'warn',
              body: (
                <>
                  Dozens of low-value alerts fire daily. On-call learns to swipe them away — so the one alert that mattered gets
                  swiped away too. A noisy alerting system is functionally the same as having none. <strong>Fix:</strong>{' '}
                  page-worthy means "a human must act <em>now</em>." Everything else is a dashboard or a ticket. Burn-rate windows
                  (fast burn → page, slow burn → ticket) keep the page volume tied to actual urgency.
                </>
              ),
            },
          ]}
        />
        <Card>
          <h4 className="mb-2 font-semibold">Averages hide the pain</h4>
          <p className="text-[13px] leading-relaxed text-ink-dim">
            A 200ms <em>average</em> latency can hide a p99 of 4s — and the p99 is a real slice of real users, often your heaviest
            ones. Alert and design against percentiles (p95/p99), never the mean. Connects to L7: tail latency is what compounds
            across a fan-out of service calls.
          </p>
        </Card>
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
