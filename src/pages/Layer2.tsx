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
          description="System calls are the doorway between your code and the kernel — every file read, network packet, and process spawn passes through this gate. The boundary exists so a buggy process can't corrupt the machine; the cost is a mode switch on every crossing."
        >
          <Bullets
            items={[
              <>Privilege rings: Ring 0 = kernel, Ring 3 = user. A syscall executes the <InlineCode>syscall</InlineCode> instruction, which traps the CPU into ring 0 at a fixed kernel entry point — userland never gets to <em>jump</em> into the kernel, only request a service. Why it matters: a mode switch costs ~100ns+ of register save/restore, so a hot loop doing one <InlineCode>read()</InlineCode> per byte is pathologically slow — buffer instead. Watch it live with <InlineCode>strace -c</InlineCode> (syscall counts) or <InlineCode>perf stat</InlineCode>.</>,
              <>Monolithic (Linux) vs microkernel (QNX, seL4) vs hybrid (Windows NT, macOS XNU). Monolithic = drivers and filesystems run in ring 0: fast (no IPC between subsystems) but a bad driver panics the box. Microkernel = drivers are user processes: a crashed driver restarts, but every disk read crosses a process boundary. Linux <em>compromised</em> with loadable kernel modules — monolithic core, drivers you can <InlineCode>insmod</InlineCode>/<InlineCode>rmmod</InlineCode> without rebooting.</>,
              <>Boot: POST → BIOS/UEFI → MBR/GPT → bootloader (GRUB) → kernel + initramfs → systemd as PID 1. The <em>initramfs</em> exists to solve a chicken-and-egg problem: the kernel needs a driver to mount the real root filesystem, but that driver lives <em>on</em> the root filesystem. initramfs is a tiny in-RAM root with just enough drivers to mount the real one. A broken initramfs = "kernel panic - not syncing: VFS: Unable to mount root fs".</>,
              <>Driver classes: char (stream, no seek — keyboard, <InlineCode>/dev/random</InlineCode>), block (seekable, buffered through page cache — disks), net (no <InlineCode>/dev</InlineCode> node, packets in/out). When something hangs in driver code, <InlineCode>dmesg</InlineCode> is the kernel ring buffer — it's where the actual error is, not your app log.</>,
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
          description="A process is the OS-level unit of isolation — its own address space, its own fd table. Threads share all of that: cheap to spawn and switch, but every piece of shared mutable state is now a race waiting to happen."
        >
          <Bullets
            items={[
              <>States: created → ready → running → blocked → terminated. A <em>zombie</em> (<InlineCode>Z</InlineCode> in <InlineCode>ps</InlineCode>, "defunct") is a process that exited but whose parent never called <InlineCode>wait()</InlineCode> — the kernel keeps the exit status and PID around for the parent to read. Zombies use no memory, but they hold a PID; a parent leaking them can exhaust the PID space. The fix is the <em>parent's</em> code (reap children / handle <InlineCode>SIGCHLD</InlineCode>), not <InlineCode>kill -9</InlineCode> on the zombie — you can't kill what's already dead.</>,
              <><InlineCode>fork()</InlineCode> clones the process, <InlineCode>exec()</InlineCode> replaces its image with a new program — every shell command is fork-then-exec. fork is fast on a 4 GB process because of <strong>copy-on-write</strong>: parent and child share the same physical pages marked read-only, and a page is only duplicated when one side writes it. Failure mode: fork a multi-GB process and the child immediately touches everything (or the parent does) → COW storms, and if RAM is tight the fork itself can fail with <InlineCode>ENOMEM</InlineCode>. This is why a memory-heavy server should <InlineCode>exec</InlineCode> a worker or use <InlineCode>posix_spawn</InlineCode>, not fork-and-compute.</>,
              <>Linux CFS schedules by <em>virtual runtime</em> — it picks the task with the lowest vruntime from a red-black tree, so CPU time is shared fairly without fixed time slices. <InlineCode>nice</InlineCode> (-20…+19) skews how fast vruntime accrues. Real-time classes <InlineCode>SCHED_FIFO</InlineCode>/<InlineCode>SCHED_RR</InlineCode> always preempt normal tasks — a runaway FIFO thread can lock out everything else, including your shell. Observe scheduling pressure with <InlineCode>vmstat 1</InlineCode> (the <InlineCode>r</InlineCode> column = runnable tasks waiting) or load average.</>,
              <>Deadlock needs <em>all four</em> Coffman conditions: mutual exclusion, hold-and-wait, no preemption, circular wait. Break any one and you're safe — the cheap, reliable fix is killing circular wait by imposing a <strong>global lock-ordering</strong> (always acquire A before B). Livelock is the nastier cousin: threads aren't blocked, they're busy politely retrying and making no progress.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">Concurrency failure modes worth memorizing</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Data race ≠ "occasionally wrong"</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Two threads touch shared state, at least one writes, no synchronization → <em>undefined behavior</em>. Not "a slightly stale value" — the compiler and CPU are free to reorder and tear the access. It compiling and passing in dev proves nothing; the race shows up under load, on a different core count, in prod.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Fix: a mutex, an atomic, or a channel/queue — pick by access pattern. RW lock for read-heavy, condition variable for "wait until", semaphore for a counted pool. In Go, <InlineCode>go test -race</InlineCode> catches most of these before they ship.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Threads vs processes — when each</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Threads: shared address space, ~µs context switch, one segfault kills the whole process. Processes: isolated, a crash is contained, but IPC (pipe, socket, shared memory) costs a copy or a syscall.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Default to processes for fault isolation (nginx workers, Postgres backends), threads when the work genuinely shares a large hot dataset. "Container = process with extra walls" is the same trade-off one level up — L6 builds on this.
              </p>
            </div>
          </div>
        </Card>
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
          description="Every process sees its own flat virtual address space — an illusion the MMU maintains by translating virtual → physical through multi-level page tables, with the TLB caching hot translations. The illusion is what lets the kernel overcommit, share, and lie about memory; the OOM killer is what happens when the lie is called."
        >
          <Bullets
            items={[
              <>Pages are 4 KB; x86-64 walks a 4-level page table per translation, so a TLB miss is expensive. The TLB caches recent virtual→physical mappings — a workload with poor locality (random pointer-chasing over GBs) thrashes the TLB and runs memory-bound even though the data is "in RAM". Huge pages (2 MB) cut the walk depth for databases and JVMs precisely to reduce this.</>,
              <><InlineCode>brk()</InlineCode>/<InlineCode>sbrk()</InlineCode> moves the heap-end pointer for small allocations; <InlineCode>mmap()</InlineCode> grabs a fresh region for large or file-backed ones (glibc malloc switches to mmap above ~128 KB). Why you care: mmap'd memory returns to the OS on <InlineCode>free</InlineCode>, brk-heap memory often doesn't — it's why a process's RSS stays high after a burst even though the heap is logically empty.</>,
              <><strong>RSS vs VSZ</strong>: VSZ is everything mapped (including pages never touched), RSS is what's actually resident in RAM. A Go binary showing 1 GB VSZ but 30 MB RSS is normal — the runtime reserves address space it hasn't faulted in. Alert on RSS, not VSZ. Memory-mapped files are the same trick reused: dynamic linking, Postgres shared buffers, and zero-copy IPC all let the page cache <em>be</em> the buffer instead of copying.</>,
              <>A "successful" write may still sit in the page cache, not on disk — <InlineCode>fsync()</InlineCode> is what forces durability. This is the same dirty-page mechanism the OOM section and L5 (database WAL) both rely on.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The OOM killer — what actually happens, and how to read it</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">You can die for someone else's leak</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Linux overcommits — <InlineCode>malloc</InlineCode> rarely fails; the reckoning comes when a process <em>touches</em> a page and there's no free frame. The kernel then picks a victim by <InlineCode>oom_score</InlineCode> (roughly: RSS-weighted), kills it, and logs to <InlineCode>dmesg</InlineCode>: <InlineCode>Out of memory: Killed process 1234 (node)</InlineCode>. The victim is "biggest", not "guilty" — your service can be killed for a sidecar's leak.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Triage: <InlineCode>dmesg -T | grep -i oom</InlineCode> for the kill, <InlineCode>journalctl -k</InlineCode> for context. Protect a critical process with <InlineCode>oom_score_adj</InlineCode> (-1000 = never kill); but the real fix is a memory limit so the cgroup OOMs <em>itself</em> instead of the host.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Page fault: minor vs major</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                A <em>minor</em> fault wires up a page already in RAM (COW, first touch of allocated memory) — cheap. A <em>major</em> fault must hit disk: load from a file, or read back something that was swapped out. Major faults are the silent latency killer — a process "using CPU" at 5% can be crawling because it's blocked on major faults.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Watch <InlineCode>vmstat 1</InlineCode> — <InlineCode>si</InlineCode>/<InlineCode>so</InlineCode> (swap in/out) above zero under load means you're swapping and latency is about to fall off a cliff. Per-process: <InlineCode>/proc/PID/stat</InlineCode> fields 10/12 (minflt/majflt). In containers, swap is usually off — so instead of slow, you just get OOM-killed.
              </p>
            </div>
          </div>
        </Card>
        <VirtualMemoryDemo />
      </Section>

      <Section id="fs" kicker="2.4" title="File Systems">
        <TopicCard
          layerId={L}
          index={3}
          title="VFS, inodes, links, permissions"
          description="The Virtual File System unifies ext4, XFS, tmpfs, and NFS behind one API: open/read/write/close. 'Everything is a file' isn't a slogan — it means the same syscalls drive disks, sockets, devices, and kernel state, so the tools you learn here work everywhere."
        >
          <Bullets
            items={[
              <>An <strong>inode</strong> is the file — it holds the metadata and block pointers. A directory entry is just a (name → inode) mapping. This is why <InlineCode>rm</InlineCode> is <InlineCode>unlink()</InlineCode>: it removes a name, and the data only dies when the link count <em>and</em> the open-fd count both hit zero. Practical consequence: <InlineCode>rm</InlineCode> a 50 GB log a process still has open and disk stays full — <InlineCode>df</InlineCode> shows it, <InlineCode>du</InlineCode> doesn't. Find the holder with <InlineCode>lsof | grep deleted</InlineCode>; truncate via <InlineCode>/proc/PID/fd</InlineCode> or restart the process.</>,
              <>Hard link = a second name for the same inode (same data, same filesystem, survives deleting the "original" — there is no original). Symlink = a tiny file containing a path string: can cross filesystems, can dangle if the target moves, and every dereference re-resolves it. Use a symlink for "current → release-2024" deploy swaps; never a hard link across mounts (impossible — inodes are per-filesystem).</>,
              <>Permissions are <InlineCode>rwx</InlineCode> for user/group/other, but the bits that bite are the specials: <strong>setuid</strong> on an executable runs it as the file's <em>owner</em> (how <InlineCode>passwd</InlineCode> edits root-owned files) — a setuid-root binary with a bug is a privilege-escalation hole. <strong>setgid</strong> on a directory makes new files inherit its group (shared project dirs). <strong>Sticky bit</strong> on <InlineCode>/tmp</InlineCode> stops users deleting each other's files. <InlineCode>chmod 777</InlineCode> "to fix permissions" is almost always the wrong fix and a real one.</>,
              <>File descriptors are per-process integers indexing the kernel's open-file table: <InlineCode>0</InlineCode> stdin, <InlineCode>1</InlineCode> stdout, <InlineCode>2</InlineCode> stderr. They are <em>not</em> free — every socket, pipe, and open file consumes one against the <InlineCode>ulimit -n</InlineCode> ceiling. "Too many open files" (<InlineCode>EMFILE</InlineCode>) is an fd leak (unclosed connections) or too low a limit — check <InlineCode>ls /proc/PID/fd | wc -l</InlineCode> against <InlineCode>/proc/PID/limits</InlineCode>.</>,
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
          description="A pipeline composes tiny single-purpose programs into an answer. grep | sort | uniq -c | sort -rn — 'count and rank lines' — beats reaching for a script, and the stages run concurrently, streaming."
        >
          <Bullets
            items={[
              <>A pipe is a kernel buffer; <InlineCode>a | b</InlineCode> runs both processes <em>at once</em> with <InlineCode>a</InlineCode>'s stdout wired to <InlineCode>b</InlineCode>'s stdin. <InlineCode>b</InlineCode> doesn't wait for <InlineCode>a</InlineCode> to finish — it processes the stream as it arrives, and back-pressures (blocks) when its input buffer fills. That's why <InlineCode>tail -f log | grep ERROR</InlineCode> works live and why piping into <InlineCode>head</InlineCode> can stop the upstream early with <InlineCode>SIGPIPE</InlineCode>.</>,
              <><InlineCode>uniq</InlineCode> only collapses <em>adjacent</em> duplicates — that's the #1 cheat-sheet trap. <InlineCode>sort</InlineCode> before <InlineCode>uniq</InlineCode> always, or it silently undercounts. The canonical "top N by frequency": <InlineCode>sort | uniq -c | sort -rn | head</InlineCode>.</>,
              <>Redirection order matters: <InlineCode>cmd &gt;file 2&gt;&amp;1</InlineCode> sends both streams to the file, but <InlineCode>cmd 2&gt;&amp;1 &gt;file</InlineCode> sends stderr to the <em>old</em> stdout (terminal) and only stdout to the file — redirections apply left-to-right. <InlineCode>2&gt;&amp;1</InlineCode> means "make fd 2 a copy of wherever fd 1 points <em>now</em>".</>,
              <>Reach for the right tool: <InlineCode>grep</InlineCode> filters lines, <InlineCode>sed</InlineCode> edits a stream, <InlineCode>awk</InlineCode> handles columns and arithmetic, <InlineCode>jq</InlineCode> for JSON, <InlineCode>xargs</InlineCode> turns a list into arguments. When the pipeline needs variables, branching, or arrays — stop, it's a script (§2.6), and past ~50 lines it's a real program.</>,
            ]}
          />
          <CommandCheatSheet />
        </TopicCard>
        <PipelineSimulator />
      </Section>

      <Section id="bash" kicker="2.6" title="Shell Scripting (Bash)">
        <TopicCard
          layerId={L}
          index={5}
          title="Script with safety belts on"
          description="Bash's defaults are from 1989: it keeps going after an error, expands an unset variable to empty string, and hides failures mid-pipe. A production script's first job is to turn those defaults off — every safety belt maps to a specific real bug."
        >
          <Bullets
            items={[
              <><InlineCode>set -e</InlineCode> — exit on any unhandled non-zero. Without it, <InlineCode>cd /backup && rm -rf *</InlineCode> still runs the <InlineCode>rm</InlineCode> if the <InlineCode>cd</InlineCode> failed — in the wrong directory. <InlineCode>set -u</InlineCode> — error on unset variable. The bug it prevents is the famous <InlineCode>rm -rf "$DIR/$SUBDIR"</InlineCode> where a typo'd <InlineCode>$DIR</InlineCode> expands to nothing and you <InlineCode>rm -rf /</InlineCode>. <InlineCode>set -o pipefail</InlineCode> — a pipeline fails if <em>any</em> stage fails; otherwise <InlineCode>generate_data | gzip &gt; backup.gz</InlineCode> reports success even when <InlineCode>generate_data</InlineCode> crashed and you backed up nothing.</>,
              <>Quote <em>every</em> expansion: <InlineCode>"$var"</InlineCode>, <InlineCode>"$@"</InlineCode>, <InlineCode>"$(cmd)"</InlineCode>. Unquoted, bash does word-splitting then glob-expansion on the result — a filename with a space becomes two arguments, and a file literally named <InlineCode>*</InlineCode> expands to the directory listing. Unquoted variables are the single largest source of shell bugs.</>,
              <>Prefer <InlineCode>[[ ... ]]</InlineCode> over <InlineCode>[ ... ]</InlineCode>: <InlineCode>[</InlineCode> is a real command that sees an empty unquoted variable as a missing argument and throws a syntax error; <InlineCode>[[ ]]</InlineCode> is shell syntax that handles it. <InlineCode>[[ ]]</InlineCode> also gives you <InlineCode>&amp;&amp;</InlineCode>, <InlineCode>||</InlineCode>, and <InlineCode>=~</InlineCode> regex matching.</>,
              <><InlineCode>trap 'cleanup' EXIT</InlineCode> runs your cleanup on success, error, <em>and</em> Ctrl+C — the only reliable way to remove a lockfile or temp dir. And never hardcode <InlineCode>/tmp/myfile</InlineCode>: it's a predictable name two runs (or an attacker) can collide on — use <InlineCode>mktemp</InlineCode>.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The script that looks fine and isn't</h4>
          <p className="mb-2 text-[13px] leading-relaxed text-ink-dim">
            Every line below is a real production incident shape. The header <InlineCode>#!/usr/bin/env bash</InlineCode> + <InlineCode>set -euo pipefail</InlineCode> + quoting turns most of them from "silent data loss" into "loud exit non-zero" — which is exactly what you want in CI, cron, or a container entrypoint.
          </p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">Silent failures</div>
              <ul className="mt-1.5 space-y-1.5 text-[13px] leading-relaxed text-ink-dim">
                <li><InlineCode>cd "$dir"; rm -rf *</InlineCode> — cd fails, rm runs in <InlineCode>$PWD</InlineCode>. Fix: <InlineCode>cd "$dir" || exit 1</InlineCode>, or <InlineCode>set -e</InlineCode>.</li>
                <li><InlineCode>curl … | tar xz</InlineCode> — curl 404s, tar "succeeds" on empty input. Fix: <InlineCode>pipefail</InlineCode>.</li>
                <li><InlineCode>VERSION=$(get_version)</InlineCode> then used unquoted — empty on failure, silently breaks the next command.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Bash vs a real program</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                Bash is unbeatable as glue: call commands, wire pipes, check exit codes, move files. It is miserable at arrays of structs, error recovery, concurrency, and arithmetic.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                Rule of thumb: once a script needs data structures or careful error handling, or crosses ~50 lines, rewrite it in Go or Python. The cost of "it's just a quick script" is paid later, at 3am.
              </p>
            </div>
          </div>
        </Card>
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
          description="A signal is the kernel's interrupt mechanism for processes. The one that matters most in production is SIGTERM — handling it correctly is the line between a clean rolling deploy and a 503 storm for every in-flight request."
        >
          <Bullets
            items={[
              <><InlineCode>SIGTERM</InlineCode> (15) = "please stop" — catchable, the default that orchestrators and <InlineCode>kill</InlineCode> send. <InlineCode>SIGINT</InlineCode> (2) = Ctrl+C. <InlineCode>SIGHUP</InlineCode> (1) = terminal closed, conventionally repurposed as "reload config". <InlineCode>SIGKILL</InlineCode> (9) and <InlineCode>SIGSTOP</InlineCode> (19) are the only two the kernel handles itself — uncatchable, no cleanup, no draining. Reaching for <InlineCode>kill -9</InlineCode> first is a smell: you're skipping the cleanup the process wanted to do.</>,
              <>A signal handler runs <em>asynchronously</em>, interrupting whatever the process was doing — so it must be async-signal-safe: no <InlineCode>malloc</InlineCode>, no locks, no blocking forever. The standard pattern is "handler just sets a flag (or writes a byte to a pipe), the main loop notices and shuts down" — Go's <InlineCode>signal.Notify</InlineCode> into a channel is exactly this, done for you.</>,
              <><InlineCode>strace -p PID</InlineCode> attaches via <InlineCode>ptrace</InlineCode> and prints every syscall — a process "stuck" is almost always blocked <em>in</em> a syscall, and strace shows which: a <InlineCode>read()</InlineCode> that never returns (dead peer), <InlineCode>futex()</InlineCode> (lock contention), <InlineCode>connect()</InlineCode> (DNS or network hang), <InlineCode>EACCES</InlineCode> on an <InlineCode>open()</InlineCode> (the real cause of a vague "permission denied"). <InlineCode>strace -f -e trace=network</InlineCode> to scope it down.</>,
              <>A systemd unit is a declarative supervisor: <InlineCode>ExecStart=</InlineCode> the command, <InlineCode>Restart=on-failure</InlineCode> the restart policy, <InlineCode>After=</InlineCode>/<InlineCode>Requires=</InlineCode> ordering and dependencies, <InlineCode>TimeoutStopSec=</InlineCode> the grace period before it escalates SIGTERM → SIGKILL. <InlineCode>journalctl -u svc -f</InlineCode> for live logs, <InlineCode>systemctl status svc</InlineCode> for state + last exit code. It also sandboxes — <InlineCode>MemoryMax=</InlineCode>, <InlineCode>User=</InlineCode>, <InlineCode>ProtectSystem=</InlineCode> — which is where this connects to L6's containers.</>,
            ]}
          />
        </TopicCard>
        <Card>
          <h4 className="mb-3 font-semibold">The graceful shutdown sequence — memorize this</h4>
          <p className="mb-2 text-[13px] leading-relaxed text-ink-dim">
            On <InlineCode>SIGTERM</InlineCode>, a well-behaved service does, in order: <strong>(1)</strong> stop accepting new work — close the listener / leave the load-balancer pool; <strong>(2)</strong> let in-flight requests finish, up to a deadline; <strong>(3)</strong> close DB connections, flush buffers and logs; <strong>(4)</strong> exit 0. Skip step 1 and you accept requests you can't finish; skip step 2 and you drop the ones already running.
          </p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-rose-300">The grace-period trap</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                systemd and Kubernetes send SIGTERM, wait a fixed grace period (<InlineCode>TimeoutStopSec</InlineCode> / <InlineCode>terminationGracePeriodSeconds</InlineCode>, default ~30s), then SIGKILL. If your drain takes longer than the grace period, you get hard-killed mid-drain anyway — the in-flight work you were carefully finishing is lost. Your drain deadline must be <em>shorter</em> than the grace period.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">PID 1 doesn't get default handlers</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                As PID 1 in a container, your process gets <em>no</em> default signal handlers — if it doesn't explicitly handle SIGTERM, the signal is ignored and <InlineCode>docker stop</InlineCode> always falls through to SIGKILL after 10s. Same trap if your entrypoint is a shell script that <InlineCode>exec</InlineCode>s nothing: the shell gets the signal, not your app. Fix: <InlineCode>exec</InlineCode> the real process, or use a tiny init (<InlineCode>tini</InlineCode>) — and reap zombies, which PID 1 is also responsible for.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            <strong>Reload vs restart:</strong> <InlineCode>SIGHUP</InlineCode> (or <InlineCode>systemctl reload</InlineCode>) re-reads config in the running process — zero downtime, no dropped connections. <InlineCode>restart</InlineCode> is a full stop+start and only as graceful as your SIGTERM handling. Prefer reload when the change allows it.
          </p>
        </Card>
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
