import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Play, RotateCcw } from 'lucide-react';
import { Section, TopicCard, TwoCol, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { MermaidDiagram } from '../components/MermaidDiagram';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 2;

export default function Layer2() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="kernel" kicker="2.1" title="OS Architecture & Kernel Concepts">
        <TopicCard
          layerId={L}
          index={0}
          title="Kernel space, user space, and the boot process"
          description="System calls are the doorway between your code and the kernel — every file read, network packet, and process spawn passes through this gate."
        >
          <Bullets
            items={[
              <>Privilege rings: Ring 0 = kernel, Ring 3 = user. Syscalls trap into ring 0 via an interrupt or <InlineCode>syscall</InlineCode> instruction.</>,
              <>Kernel design: monolithic (Linux), microkernel (QNX), hybrid (Windows NT, macOS XNU).</>,
              <>Boot: POST → BIOS/UEFI → MBR/GPT → bootloader (GRUB) → kernel + initramfs → systemd.</>,
              <>Drivers: char (keyboard), block (disk), net (NIC). Each registers with the kernel on load.</>,
            ]}
          />
        </TopicCard>
        <MermaidDiagram
          chart={`flowchart LR
            A[Power on] --> B[POST]
            B --> C{BIOS / UEFI}
            C --> D[MBR / GPT]
            D --> E[GRUB]
            E --> F[Kernel + initramfs]
            F --> G[systemd PID 1]
            G --> H[User session]
            style A fill:#1f2937,stroke:#22d3ee
            style H fill:#1f2937,stroke:#34d399`}
          caption="Linux boot pipeline"
        />
      </Section>

      <Section id="processes" kicker="2.2" title="Process & Thread Management">
        <TopicCard
          layerId={L}
          index={1}
          title="Lifecycle, scheduling, IPC, concurrency hazards"
          description="A process is the OS-level unit of isolation. Threads share its address space and file descriptors — they're cheap, but you pay for that with synchronization."
        >
          <Bullets
            items={[
              <>States: created → ready → running → blocked → terminated (with <em>zombie</em> if its parent never reaps it).</>,
              <><InlineCode>fork()</InlineCode> + <InlineCode>exec()</InlineCode> = launch. Linux uses copy-on-write so fork is cheap until you write.</>,
              <>Linux scheduler: CFS uses a red-black tree keyed by virtual runtime. Real-time tasks use SCHED_FIFO / SCHED_RR.</>,
              <>Coffman conditions for deadlock: mutual exclusion + hold-and-wait + no preemption + circular wait.</>,
            ]}
          />
        </TopicCard>
        <ProcessLifecycle />
        <MermaidDiagram
          chart={`stateDiagram-v2
            [*] --> Created
            Created --> Ready: admit
            Ready --> Running: dispatch
            Running --> Ready: preempt / quantum
            Running --> Blocked: I/O wait
            Blocked --> Ready: I/O complete
            Running --> Terminated: exit()
            Terminated --> [*]`}
          caption="Process state machine"
        />
      </Section>

      <Section id="memory" kicker="2.3" title="Memory Management">
        <TopicCard
          layerId={L}
          index={2}
          title="Virtual memory, paging, the OOM killer"
          description="Every process has its own virtual address space. The MMU translates virtual to physical via multi-level page tables, cached in the TLB."
        >
          <Bullets
            items={[
              <>Pages are typically 4 KB. x86-64 has a 4-level page table walk; the TLB caches recent translations.</>,
              <><InlineCode>brk()</InlineCode> for small allocations (the heap end pointer); <InlineCode>mmap()</InlineCode> for large or file-backed.</>,
              <>Memory-mapped files power dynamic linking, PostgreSQL shared buffers, and zero-copy IPC.</>,
              <>OOM killer scores processes by <InlineCode>/proc/PID/oom_score</InlineCode>; tune with <InlineCode>oom_score_adj</InlineCode>.</>,
            ]}
          />
        </TopicCard>
        <VirtualMemoryDemo />
      </Section>

      <Section id="fs" kicker="2.4" title="File Systems">
        <TopicCard
          layerId={L}
          index={3}
          title="VFS, inodes, links, permissions"
          description="The Virtual File System unifies ext4, XFS, NTFS, tmpfs, and NFS behind one API. Everything is a file — including devices, processes, and kernel state."
        >
          <Bullets
            items={[
              <><InlineCode>/proc</InlineCode> is the kernel exposing process state as files. <InlineCode>/sys</InlineCode> is sysfs (drivers). <InlineCode>/dev</InlineCode> is devtmpfs.</>,
              <>Hard links share an inode (same content). Symlinks are paths, can dangle, can cross filesystems.</>,
              <>Permissions: rwx for user/group/other, plus setuid / setgid / sticky bit.</>,
              <>File descriptors are integers. <InlineCode>0</InlineCode> stdin, <InlineCode>1</InlineCode> stdout, <InlineCode>2</InlineCode> stderr.</>,
            ]}
          />
        </TopicCard>
        <PermissionsCalculator />
      </Section>

      <Section id="commands" kicker="2.5" title="Linux Command Mastery">
        <TopicCard
          layerId={L}
          index={4}
          title="The shell is your power tool"
          description="Pipelines compose tiny programs into solutions. grep | sort | uniq -c | sort -rn beats most data tools."
        >
          <CommandCheatSheet />
        </TopicCard>
        <PipelineSimulator />
      </Section>

      <Section id="bash" kicker="2.6" title="Shell Scripting (Bash)">
        <TopicCard
          layerId={L}
          index={5}
          title="Script with safety belts on"
          description="set -euo pipefail and trap errors. Most production bash bugs come from unset variables and silent pipe failures."
        >
          <Bullets
            items={[
              <>Always start scripts with <InlineCode>set -euo pipefail</InlineCode>: exit on error, exit on unset var, catch pipe failures.</>,
              <>Quote your variables: <InlineCode>"$var"</InlineCode> not <InlineCode>$var</InlineCode> — a space in a path will ruin your day otherwise.</>,
              <>Use <InlineCode>[[ ... ]]</InlineCode> over <InlineCode>[ ... ]</InlineCode> in bash — fewer surprises with empty strings.</>,
            ]}
          />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={200}
          title="Simulate bash output with JS"
          initial={`// Pretend we're parsing 'ps aux' output
const ps = [
  'USER  PID  %CPU  CMD',
  'root    1   0.0  /sbin/init',
  'app  1234  12.4  node server.js',
  'app  1235   0.1  redis-server',
  'app  1240  98.7  ffmpeg',
];

// Equivalent of:  ps aux | awk '$3>50 {print $0}' | sort -k3 -nr
const hot = ps.slice(1)
  .map((l) => l.split(/\\s+/))
  .filter((cols) => parseFloat(cols[2]) > 50)
  .sort((a, b) => parseFloat(b[2]) - parseFloat(a[2]));

console.log('hot processes:');
for (const c of hot) console.log(c.join(' '));
`}
        />
      </Section>

      <Section id="signals" kicker="2.7" title="System Calls, Signals & systemd">
        <TopicCard
          layerId={L}
          index={6}
          title="Graceful shutdown, strace, systemd units"
          description="Catching SIGTERM and draining gracefully is the difference between a clean rolling deploy and a 503 storm."
        >
          <Bullets
            items={[
              <><InlineCode>SIGTERM</InlineCode> is polite (catchable). <InlineCode>SIGKILL</InlineCode> is the orbital strike — uncatchable, no cleanup.</>,
              <><InlineCode>strace -p &lt;PID&gt;</InlineCode> shows every syscall a process makes — invaluable for stuck-process triage.</>,
              <>systemd units declare <InlineCode>[Unit] After=</InlineCode>, <InlineCode>[Service] ExecStart=</InlineCode>, <InlineCode>Restart=on-failure</InlineCode>.</>,
            ]}
          />
        </TopicCard>
        <SignalDemo />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 2 Quiz">
        <Quiz id="L2" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-emerald-500/10 via-bg-card to-teal-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-emerald-500 to-teal-500 text-white">L02</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Operating Systems & Linux</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">The invisible foundation</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Linux is the operating system of the cloud. Containers are processes with extra walls. Knowing how processes,
          memory, and file descriptors actually work makes you a faster debugger and a safer engineer.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Terminal className="h-4 w-4 text-emerald-400" />
          7 topics · 5 visualizers · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

const STATES = ['Created', 'Ready', 'Running', 'Blocked', 'Terminated'] as const;
type ProcState = typeof STATES[number];

function ProcessLifecycle() {
  const [state, setState] = useState<ProcState>('Created');

  const transitions: Record<ProcState, { to: ProcState; label: string }[]> = {
    Created: [{ to: 'Ready', label: 'admit' }],
    Ready: [{ to: 'Running', label: 'dispatch' }],
    Running: [
      { to: 'Ready', label: 'preempt' },
      { to: 'Blocked', label: 'I/O wait' },
      { to: 'Terminated', label: 'exit()' },
    ],
    Blocked: [{ to: 'Ready', label: 'I/O complete' }],
    Terminated: [{ to: 'Created', label: 'fork again' }],
  };

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Process state walker</h4>
      <div className="grid grid-cols-5 gap-2">
        {STATES.map((s) => (
          <motion.div
            key={s}
            animate={{
              scale: state === s ? 1.05 : 1,
              backgroundColor: state === s ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
            }}
            className="rounded-xl border border-white/10 px-2 py-3 text-center text-xs sm:text-sm"
          >
            {s}
          </motion.div>
        ))}
      </div>
      <div className="mt-4">
        <div className="text-xs text-ink-faint">Transitions from <span className="text-ink">{state}</span>:</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {transitions[state].map((t) => (
            <button key={`${state}->${t.to}`} onClick={() => setState(t.to)} className="btn-ghost h-8 text-xs">
              <span className="font-mono text-accent-cyan">{t.label}</span>
              <span className="text-ink-dim">→ {t.to}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function VirtualMemoryDemo() {
  const PAGES = 16;
  const [pages] = useState(() =>
    Array.from({ length: PAGES }).map((_, i) => ({
      virt: i,
      phys: Math.floor(Math.random() * 64),
      resident: Math.random() > 0.3,
    })),
  );
  const [hover, setHover] = useState<number | null>(null);

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Virtual ⇄ Physical pages</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Virtual address space</div>
          <div className="space-y-1">
            {pages.map((p) => (
              <div
                key={p.virt}
                onMouseEnter={() => setHover(p.virt)}
                onMouseLeave={() => setHover(null)}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded border border-white/5 px-2 py-1 font-mono text-xs',
                  hover === p.virt ? 'bg-accent/20' : 'bg-bg-soft/40',
                )}
              >
                <span className="text-ink-dim">vpage {String(p.virt).padStart(2, '0')}</span>
                <span className={p.resident ? 'text-emerald-300' : 'text-rose-300'}>
                  {p.resident ? '→ resident' : 'page fault'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Physical RAM frames</div>
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 64 }).map((_, frame) => {
              const owner = pages.find((p) => p.phys === frame && p.resident);
              const highlighted = hover !== null && pages[hover]?.resident && pages[hover]?.phys === frame;
              return (
                <div
                  key={frame}
                  className={cn(
                    'aspect-square rounded transition-all',
                    highlighted ? 'bg-accent ring-2 ring-accent' : owner ? 'bg-accent/40' : 'bg-white/5',
                  )}
                  title={`frame ${frame}${owner ? ` ← vpage ${owner.virt}` : ''}`}
                />
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Hover a virtual page to see its physical frame. A page fault happens when the page isn't resident — the kernel pages it in (or kills the process if it's invalid).
      </p>
    </Card>
  );
}

function PermissionsCalculator() {
  const [bits, setBits] = useState({ ur: true, uw: true, ux: true, gr: true, gw: false, gx: true, or: true, ow: false, ox: true });
  const groups = [
    { key: 'u', label: 'User', r: bits.ur, w: bits.uw, x: bits.ux, set: (k: string, v: boolean) => setBits({ ...bits, [`u${k}`]: v }) },
    { key: 'g', label: 'Group', r: bits.gr, w: bits.gw, x: bits.gx, set: (k: string, v: boolean) => setBits({ ...bits, [`g${k}`]: v }) },
    { key: 'o', label: 'Other', r: bits.or, w: bits.ow, x: bits.ox, set: (k: string, v: boolean) => setBits({ ...bits, [`o${k}`]: v }) },
  ];
  const octal = groups.map((g) => (g.r ? 4 : 0) + (g.w ? 2 : 0) + (g.x ? 1 : 0)).join('');
  const symbolic = groups.map((g) => `${g.r ? 'r' : '-'}${g.w ? 'w' : '-'}${g.x ? 'x' : '-'}`).join('');

  return (
    <Card>
      <h4 className="mb-3 font-semibold">chmod calculator</h4>
      <div className="grid grid-cols-3 gap-3">
        {groups.map((g) => (
          <div key={g.key} className="rounded-xl border border-white/5 bg-bg-soft/50 p-3">
            <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">{g.label}</div>
            <div className="flex gap-2">
              {(['r', 'w', 'x'] as const).map((k) => {
                const v = (g as any)[k];
                return (
                  <button
                    key={k}
                    onClick={() => g.set(k, !v)}
                    className={cn(
                      'h-9 w-9 rounded-lg font-mono text-sm',
                      v ? 'bg-accent/20 text-accent' : 'bg-white/5 text-ink-faint',
                    )}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/5 bg-bg-soft/50 px-4 py-3 font-mono">
        <span className="text-ink-faint">$ chmod</span>
        <span className="text-accent">{octal}</span>
        <span className="text-ink-dim">file</span>
        <span className="ml-auto text-ink-dim">→</span>
        <span className="text-ink">-{symbolic}</span>
      </div>
    </Card>
  );
}

function CommandCheatSheet() {
  const sets = [
    { cat: 'Files', cmds: ['ls -la', 'find . -name "*.log" -mtime +7', 'stat file', 'ln -s target link'] },
    { cat: 'Text', cmds: ['grep -rn pattern .', 'sed s/old/new/g', 'awk \'{print $2}\'', 'sort | uniq -c'] },
    { cat: 'Process', cmds: ['ps aux | grep app', 'top / htop', 'kill -SIGTERM PID', 'lsof -i :8080'] },
    { cat: 'Net', cmds: ['ip addr', 'ss -tlnp', 'curl -v URL', 'tcpdump -i eth0'] },
    { cat: 'Disk', cmds: ['df -h', 'du -sh *', 'lsblk', 'mount /dev/sdb1 /mnt'] },
    { cat: 'systemd', cmds: ['systemctl status svc', 'systemctl restart svc', 'journalctl -u svc -f'] },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sets.map((s) => (
        <div key={s.cat} className="rounded-xl border border-white/5 bg-bg-soft/50 p-3">
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">{s.cat}</div>
          <ul className="space-y-1">
            {s.cmds.map((c) => (
              <li key={c} className="font-mono text-[12.5px] text-ink-dim">$ {c}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PipelineSimulator() {
  const initial = `apple\nbanana\napple\ncherry\napple\ndurian\nbanana`;
  const [src, setSrc] = useState(initial);
  const [steps, setSteps] = useState<string[]>(['sort', 'uniq -c', 'sort -rn']);

  const run = (input: string, step: string): string => {
    const lines = input.split('\n').filter((l) => l !== '');
    if (step.startsWith('sort -rn')) {
      return lines.sort((a, b) => parseInt(b) - parseInt(a)).join('\n');
    }
    if (step === 'sort') return lines.sort().join('\n');
    if (step === 'uniq -c') {
      const out: string[] = [];
      let prev = '';
      let count = 0;
      for (const l of lines.concat([''])) {
        if (l === prev) count++;
        else {
          if (count) out.push(`${String(count).padStart(4)} ${prev}`);
          prev = l;
          count = 1;
        }
      }
      return out.join('\n');
    }
    if (step.startsWith('grep ')) {
      const pat = step.slice(5).trim();
      return lines.filter((l) => l.includes(pat)).join('\n');
    }
    if (step.startsWith('head -')) {
      const n = parseInt(step.slice(6)) || 10;
      return lines.slice(0, n).join('\n');
    }
    return lines.join('\n');
  };

  let current = src;
  const stages = [{ cmd: 'input', out: current }];
  for (const s of steps) {
    current = run(current, s);
    stages.push({ cmd: s, out: current });
  }

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Pipeline simulator</h4>
      <p className="mb-3 text-xs text-ink-dim">Edit the input, then walk through how each command transforms the stream.</p>
      <textarea
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        className="input mb-3 h-24 resize-none font-mono text-xs"
      />
      <div className="mb-3 flex flex-wrap gap-2">
        {['sort', 'uniq -c', 'sort -rn', 'grep apple', 'head -3'].map((s) => (
          <button
            key={s}
            onClick={() => setSteps((arr) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]))}
            className={cn(
              'rounded-md border px-2 py-1 font-mono text-xs',
              steps.includes(s) ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim',
            )}
          >
            | {s}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {stages.map((stage, i) => (
          <div key={i} className="rounded-lg border border-white/5 bg-bg-soft/40">
            <div className="border-b border-white/5 px-3 py-1.5 font-mono text-[11px] text-accent-cyan">$ {stage.cmd}</div>
            <pre className="overflow-x-auto px-3 py-2 font-mono text-xs text-ink-dim">{stage.out || '(empty)'}</pre>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SignalDemo() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [draining, setDraining] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setActive((a) => Math.min(a + 1, 6)), 600);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    setLog(['process started, listening on :8080']);
    setRunning(true);
    setActive(0);
    setDraining(false);
  };
  const sigterm = () => {
    setLog((l) => [...l, '[SIGTERM] caught — draining 2 in-flight requests...']);
    setDraining(true);
    setTimeout(() => {
      setLog((l) => [...l, 'all requests completed', 'exiting cleanly']);
      setRunning(false);
      setActive(0);
    }, 1800);
  };
  const sigkill = () => {
    setLog((l) => [...l, '[SIGKILL] killed by kernel — no cleanup']);
    setRunning(false);
    setActive(0);
  };

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Graceful shutdown vs SIGKILL</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Process</div>
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-bg-soft/40 p-3">
            <motion.div
              animate={{ scale: running ? [1, 1.06, 1] : 1, opacity: running ? 1 : 0.4 }}
              transition={{ duration: 1.4, repeat: running ? Infinity : 0 }}
              className={cn(
                'grid h-12 w-12 place-items-center rounded-xl text-white',
                running ? (draining ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-white/10',
              )}
            >
              <Terminal className="h-5 w-5" />
            </motion.div>
            <div>
              <div className="text-sm font-medium">{running ? (draining ? 'draining…' : 'serving') : 'stopped'}</div>
              <div className="text-xs text-ink-dim">in-flight: {Math.max(0, 2 - Math.floor(active / 3))}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={start} disabled={running} className="btn-primary h-8 text-xs"><Play className="h-3 w-3" /> Start</button>
            <button onClick={sigterm} disabled={!running} className="btn-ghost h-8 text-xs">Send SIGTERM</button>
            <button onClick={sigkill} disabled={!running} className="btn-ghost h-8 text-xs">Send SIGKILL</button>
            <button onClick={() => setLog([])} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Log</div>
          <div className="h-48 overflow-y-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-xs">
            {log.length === 0 ? <div className="text-ink-faint">// nothing yet</div> : log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Which signal CANNOT be caught or handled by a process?',
    options: ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGKILL'],
    answer: 3,
    explain: 'SIGKILL (9) and SIGSTOP (19) are kernel-only — the process gets no chance to clean up.',
  },
  {
    q: 'fork() in Linux is fast even on huge processes because of...',
    options: ['shared memory always', 'copy-on-write', 'lazy file descriptor copying', 'a separate clone() syscall'],
    answer: 1,
    explain: 'COW means pages are shared between parent and child until either writes; fork avoids copying gigabytes.',
  },
  {
    q: 'What does a hard link share with the original file?',
    options: ['Just the path', 'The inode (and therefore the data)', 'Permissions only', 'A symbolic reference'],
    answer: 1,
    explain: 'Hard links are additional names pointing to the same inode. Symlinks store a path string instead.',
  },
  {
    q: 'Which command shows you all syscalls a running process is making?',
    options: ['top', 'lsof', 'strace -p PID', 'netstat'],
    answer: 2,
    explain: 'strace attaches via ptrace and prints each syscall — invaluable for debugging hangs and permission errors.',
  },
  {
    q: 'A web server should respond to SIGTERM by...',
    options: [
      'Exiting immediately to free resources',
      'Ignoring it — only systemd can stop it',
      'Stopping new connections, draining in-flight requests, then exiting',
      'Restarting itself',
    ],
    answer: 2,
    explain: 'Graceful shutdown: stop accepting → drain → close → exit. Otherwise rolling deploys drop requests mid-flight.',
  },
];
