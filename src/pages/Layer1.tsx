import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { Section, TopicCard, TwoCol, Bullets, InlineCode, Stat, Card } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { MermaidDiagram } from '../components/MermaidDiagram';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 1;

export default function Layer1() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="binary" kicker="1.1" title="Binary Systems & Data Representation">
        <TopicCard
          layerId={L}
          index={0}
          title="Numbers, bits, encodings"
          description="Computers store everything as binary. Reading hex, understanding two's complement, and knowing IEEE 754 saves you on every off-by-one bug."
        >
          <Bullets
            items={[
              <>Binary (base-2), Octal (base-8), Hex (base-16) — convert fluently. Hex shows up in <InlineCode>0xFF</InlineCode> color codes, memory addresses, and assembly output.</>,
              <>Two's complement is universal because <InlineCode>x + (-x) = 0</InlineCode> falls out of plain binary addition.</>,
              <>IEEE 754 floats: sign (1) · exponent (8/11) · mantissa (23/52). <InlineCode>0.1 + 0.2 ≠ 0.3</InlineCode> for a reason.</>,
              <>UTF-8 is variable-width (1–4 bytes), backwards-compatible with ASCII, dominant on the web.</>,
              <>Bitwise ops: <InlineCode>x & 1</InlineCode> tests the low bit; <InlineCode>x &lt;&lt; 3</InlineCode> is fast multiply by 8.</>,
            ]}
          />
        </TopicCard>
        <TwoCol>
          <BinaryConverter />
          <BitwiseExplorer />
        </TwoCol>
        <Float754Card />
      </Section>

      <Section id="logic" kicker="1.2" title="Logic Gates & Boolean Algebra">
        <TopicCard
          layerId={L}
          index={1}
          title="Gates, truth tables, sequential circuits"
          description="Every CPU is built from billions of NAND gates. Boolean algebra is the math that compiles down to silicon."
        >
          <Bullets
            items={[
              <>Fundamental gates: AND, OR, NOT, NAND, NOR, XOR, XNOR. NAND and NOR are <em>universal</em> — every other gate can be built from them.</>,
              <>De Morgan's laws: <InlineCode>¬(A ∧ B) = ¬A ∨ ¬B</InlineCode> and <InlineCode>¬(A ∨ B) = ¬A ∧ ¬B</InlineCode>.</>,
              <>Combinational vs sequential: combinational depends only on inputs (adders, MUXes); sequential has memory (flip-flops, registers, FSMs).</>,
              <>Karnaugh maps simplify expressions of up to 4 variables visually.</>,
            ]}
          />
        </TopicCard>
        <LogicGateLab />
      </Section>

      <Section id="ds" kicker="1.3" title="Data Structures">
        <TopicCard
          layerId={L}
          index={2}
          title="Pick the right structure, then write the code"
          description="Choosing the right data structure is often the difference between O(n²) and O(log n)."
        >
          <DataStructureTable />
        </TopicCard>
        <TwoCol>
          <StackQueueDemo />
          <HashTableDemo />
        </TwoCol>
      </Section>

      <Section id="algos" kicker="1.4" title="Algorithms & Complexity Analysis">
        <TopicCard
          layerId={L}
          index={3}
          title="Big-O thinking & sorting"
          description="Big-O lets you compare algorithms independent of hardware. Sorting is the canonical lab — every comparison-based sort hits the Ω(n log n) wall."
        >
          <Bullets
            items={[
              <>Best / worst / average — quicksort is O(n log n) avg, O(n²) worst (already-sorted, no shuffle).</>,
              <>Stable vs unstable: stable sorts preserve input order of equal keys. Mergesort = stable; standard quicksort = unstable.</>,
              <>In-place vs out-of-place: mergesort needs O(n) auxiliary; quicksort uses O(log n) for the call stack.</>,
              <>Cache friendliness matters in practice — quicksort beats mergesort on small arrays despite identical Big-O.</>,
            ]}
          />
        </TopicCard>
        <SortingVisualizer />
        <BigOChart />
      </Section>

      <Section id="arch" kicker="1.5" title="Computer Architecture & Memory Model">
        <TopicCard
          layerId={L}
          index={4}
          title="The Von Neumann machine"
          description="CPU + memory + I/O bus, wired together by the fetch–decode–execute cycle. Every program ever written runs on this loop."
        >
          <Bullets
            items={[
              <>CPU internals: ALU, control unit, registers (general-purpose, PC, SP, IR).</>,
              <>Stack grows down (auto-managed, LIFO); heap grows up (manual or GC).</>,
              <>Virtual memory: paging, page tables, TLB, page faults, copy-on-write — every modern OS.</>,
              <>Endianness: x86 is little-endian; network byte order is big-endian. Always normalize at the boundary.</>,
            ]}
          />
        </TopicCard>
        <MemoryHierarchy />
      </Section>

      <Section id="compile" kicker="1.6" title="Compilation & Execution Pipeline">
        <TopicCard
          layerId={L}
          index={5}
          title="From source to running process"
          description="Source code travels through lexing, parsing, semantic analysis, IR, optimization, codegen, linking, and loading before a single instruction runs."
        >
          <Bullets
            items={[
              <>Compiled vs interpreted vs JIT: C compiles AOT; Python interprets bytecode; V8 JIT-compiles hot JS.</>,
              <>Linker resolves cross-file symbols; the loader maps the binary into memory and resolves dynamic symbols (PLT/GOT).</>,
              <>GC strategies: reference counting (Python), mark-and-sweep, tri-color, generational.</>,
            ]}
          />
        </TopicCard>
        <MermaidDiagram
          chart={`flowchart LR
            A[Source code] --> B[Lexer<br/>tokens]
            B --> C[Parser<br/>AST]
            C --> D[Semantic<br/>analysis]
            D --> E[IR<br/>generation]
            E --> F[Optimizer]
            F --> G[Code<br/>generation]
            G --> H[Linker]
            H --> I[Executable]
            I --> J[Loader]
            J --> K[Running<br/>process]
            style A fill:#1f2937,stroke:#6366f1
            style K fill:#1f2937,stroke:#22d3ee`}
          caption="The compilation & loading pipeline"
        />
      </Section>

      <Section id="play" kicker="Practice" title="JavaScript playground">
        <p className="text-ink-dim">JS runs in your browser via a JIT compiler (V8 in Chrome, JavaScriptCore in Safari, SpiderMonkey in Firefox). Try the bit tricks below.</p>
        <CodePlayground
          mode="js"
          height={220}
          initial={`// Bit tricks
const x = 0b10110101;
console.log('binary:', x.toString(2));
console.log('hex:   ', '0x' + x.toString(16));
console.log('low bit:', x & 1);
console.log('x * 8 =', x << 3);

// IEEE 754 surprise
console.log(0.1 + 0.2);       // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // false

// Two's complement in a 32-bit integer
console.log(~0);  // -1, because ~x = -(x+1)
`}
        />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 1 Quiz">
        <Quiz id="L1" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-500/10 via-bg-card to-violet-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-indigo-500 to-violet-500 text-white">L01</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Foundations of Computer Science</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">The machine you are programming</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          Before any framework, before any syntax — there is hardware reading bits, gates flipping voltage, and an instruction pointer
          marching forward. This layer is the bedrock for every decision you make above it.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Cpu className="h-4 w-4 text-accent" />
          6 topics · 4 visualizers · 1 playground · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function BinaryConverter() {
  const [bits, setBits] = useState<number[]>([0, 1, 0, 1, 1, 0, 1, 0]);

  const decimal = useMemo(() => bits.reduce((acc, b, i) => acc + b * (1 << (bits.length - 1 - i)), 0), [bits]);
  const hex = decimal.toString(16).toUpperCase().padStart(2, '0');
  const oct = decimal.toString(8).padStart(3, '0');
  const ascii = decimal >= 32 && decimal < 127 ? String.fromCharCode(decimal) : '·';

  const flip = (i: number) => setBits((bs) => bs.map((b, j) => (i === j ? (b ? 0 : 1) : b)));
  const set = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.floor(n)));
    setBits(clamped.toString(2).padStart(8, '0').split('').map(Number));
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Binary ⇄ Decimal ⇄ Hex</h4>
        <span className="text-xs text-ink-faint">8-bit unsigned</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {bits.map((b, i) => (
          <button
            key={i}
            onClick={() => flip(i)}
            className={cn(
              'h-12 w-10 rounded-lg border font-mono text-lg transition-all sm:h-14 sm:w-12 sm:text-xl',
              b ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim',
            )}
            title={`Bit ${bits.length - 1 - i} (value ${1 << (bits.length - 1 - i)})`}
          >
            {b}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] text-ink-faint">
        {bits.map((_, i) => (
          <div key={i} className="w-10 text-center sm:w-12">2<sup>{bits.length - 1 - i}</sup></div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Decimal" value={decimal} />
        <Stat label="Hex" value={`0x${hex}`} />
        <Stat label="Octal" value={`0o${oct}`} />
        <Stat label="ASCII" value={<span className="font-mono">{ascii}</span>} sub={decimal < 32 ? 'control' : decimal >= 127 ? 'non-printable' : 'printable'} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={255}
          value={decimal}
          onChange={(e) => set(parseInt(e.target.value || '0', 10))}
          className="input w-32"
        />
        <button onClick={() => set(0)} className="btn-ghost h-9">Reset</button>
        <button onClick={() => set(Math.floor(Math.random() * 256))} className="btn-ghost h-9">Random</button>
      </div>
    </Card>
  );
}

function BitwiseExplorer() {
  const [a, setA] = useState(0b11001010);
  const [b, setB] = useState(0b10110011);

  const ops = [
    { label: 'A & B (AND)', value: a & b },
    { label: 'A | B (OR)', value: a | b },
    { label: 'A ^ B (XOR)', value: a ^ b },
    { label: '~A (NOT)', value: (~a) & 0xff },
    { label: 'A << 1', value: (a << 1) & 0xff },
    { label: 'A >> 1', value: a >> 1 },
  ];

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Bitwise operations</h4>
      <div className="space-y-2">
        <BitRow label="A" value={a} onChange={setA} />
        <BitRow label="B" value={b} onChange={setB} />
      </div>
      <div className="mt-4 space-y-1">
        {ops.map((op) => (
          <div key={op.label} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-bg-soft/50 px-3 py-2">
            <span className="font-mono text-xs text-ink-dim">{op.label}</span>
            <span className="font-mono text-sm">{op.value.toString(2).padStart(8, '0')}</span>
            <span className="font-mono text-xs text-ink-faint">{op.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BitRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const flip = (i: number) => onChange(value ^ (1 << (7 - i)));
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 font-mono text-xs text-ink-dim">{label}</span>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: 8 }).map((_, i) => {
          const bit = (value >> (7 - i)) & 1;
          return (
            <button
              key={i}
              onClick={() => flip(i)}
              className={cn(
                'h-7 flex-1 rounded font-mono text-xs',
                bit ? 'bg-accent/30 text-accent' : 'bg-white/5 text-ink-dim',
              )}
            >
              {bit}
            </button>
          );
        })}
      </div>
      <span className="w-10 text-right font-mono text-xs text-ink-faint">{value}</span>
    </div>
  );
}

function Float754Card() {
  const [x, setX] = useState(0.1);
  const [y, setY] = useState(0.2);
  const sum = x + y;
  return (
    <Card>
      <h4 className="mb-2 font-semibold">IEEE 754 surprise</h4>
      <p className="text-sm text-ink-dim">
        Floating-point can't represent <InlineCode>0.1</InlineCode> exactly in binary — same as how <InlineCode>1/3</InlineCode> can't be written exactly in decimal.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs text-ink-faint">x</span>
          <input type="number" step="0.1" value={x} onChange={(e) => setX(parseFloat(e.target.value || '0'))} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-faint">y</span>
          <input type="number" step="0.1" value={y} onChange={(e) => setY(parseFloat(e.target.value || '0'))} className="input mt-1" />
        </label>
        <div className="rounded-lg border border-white/5 bg-bg-soft/50 p-3">
          <div className="text-xs text-ink-faint">x + y</div>
          <div className="font-mono text-sm">{sum}</div>
          <div className="mt-1 text-[11px] text-ink-faint">{Number.isInteger(sum) || sum.toString().length < 18 ? 'representable' : 'rounding error'}</div>
        </div>
      </div>
    </Card>
  );
}

function LogicGateLab() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);

  const gates = [
    { name: 'AND', fn: (x: boolean, y: boolean) => x && y, color: 'from-emerald-500 to-emerald-300' },
    { name: 'OR', fn: (x: boolean, y: boolean) => x || y, color: 'from-cyan-500 to-cyan-300' },
    { name: 'NAND', fn: (x: boolean, y: boolean) => !(x && y), color: 'from-amber-500 to-amber-300' },
    { name: 'NOR', fn: (x: boolean, y: boolean) => !(x || y), color: 'from-rose-500 to-rose-300' },
    { name: 'XOR', fn: (x: boolean, y: boolean) => x !== y, color: 'from-violet-500 to-violet-300' },
    { name: 'XNOR', fn: (x: boolean, y: boolean) => x === y, color: 'from-pink-500 to-pink-300' },
  ];

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Logic gate lab</h4>
      <div className="mb-4 flex flex-wrap gap-2">
        <Toggle label="A" value={a} onChange={setA} />
        <Toggle label="B" value={b} onChange={setB} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {gates.map((g) => {
          const out = g.fn(a, b);
          return (
            <div key={g.name} className="rounded-xl border border-white/5 bg-bg-soft/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-sm">{g.name}</span>
                <motion.div
                  initial={false}
                  animate={{ scale: out ? 1.05 : 1, opacity: out ? 1 : 0.4 }}
                  className={cn('h-3 w-3 rounded-full bg-gradient-to-br', g.color)}
                />
              </div>
              <div className="font-mono text-2xl text-ink">{out ? '1' : '0'}</div>
              <div className="mt-1 text-[11px] text-ink-faint">{a ? 1 : 0} {symbolFor(g.name)} {b ? 1 : 0}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        <div className="mb-2 text-xs uppercase tracking-widest text-ink-faint">Truth table</div>
        <div className="overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-xs">
            <thead className="bg-white/5 text-ink-dim">
              <tr>
                <th className="px-3 py-2 text-left">A</th>
                <th className="px-3 py-2 text-left">B</th>
                {gates.map((g) => (
                  <th key={g.name} className="px-3 py-2 text-left">{g.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [false, false],
                [false, true],
                [true, false],
                [true, true],
              ].map(([x, y], i) => {
                const isCurrent = x === a && y === b;
                return (
                  <tr key={i} className={cn('border-t border-white/5', isCurrent && 'bg-accent/10')}>
                    <td className="px-3 py-1.5 font-mono">{x ? 1 : 0}</td>
                    <td className="px-3 py-1.5 font-mono">{y ? 1 : 0}</td>
                    {gates.map((g) => (
                      <td key={g.name} className="px-3 py-1.5 font-mono">{g.fn(x, y) ? 1 : 0}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'flex items-center gap-2 rounded-lg border px-4 py-2 font-mono text-sm transition-colors',
        value ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim',
      )}
    >
      <span>{label}</span>
      <span className="text-lg">= {value ? 1 : 0}</span>
    </button>
  );
}

function symbolFor(name: string) {
  return { AND: '∧', OR: '∨', NAND: '↑', NOR: '↓', XOR: '⊕', XNOR: '⊙' }[name] ?? '·';
}

function DataStructureTable() {
  const rows: { name: string; ops: string; time: string; space: string; uses: string }[] = [
    { name: 'Array', ops: 'Access · Search', time: 'O(1) · O(n)', space: 'O(n)', uses: 'Indexing, iteration, cache-friendly' },
    { name: 'Linked List', ops: 'Insert at head · Access', time: 'O(1) · O(n)', space: 'O(n)', uses: 'Dynamic size, queues' },
    { name: 'Stack', ops: 'Push · Pop · Peek', time: 'O(1)', space: 'O(n)', uses: 'Undo, parsing, DFS, call stack' },
    { name: 'Queue / Deque', ops: 'Enqueue · Dequeue', time: 'O(1)', space: 'O(n)', uses: 'BFS, scheduling, sliding window' },
    { name: 'Hash Table', ops: 'Get · Set · Delete', time: 'O(1) avg', space: 'O(n)', uses: 'Caching, dedup, frequency count' },
    { name: 'BST / AVL / RBT', ops: 'Insert · Search · Delete', time: 'O(log n)', space: 'O(n)', uses: 'Sorted data, range queries' },
    { name: 'Heap', ops: 'Insert · Extract', time: 'O(log n)', space: 'O(n)', uses: 'Priority queue, Dijkstra' },
    { name: 'Graph (adj list)', ops: 'BFS · DFS', time: 'O(V+E)', space: 'O(V+E)', uses: 'Networks, shortest path' },
    { name: 'Trie', ops: 'Insert · Search', time: 'O(key length)', space: 'O(n·k)', uses: 'Autocomplete, IP routing' },
    { name: 'Segment Tree', ops: 'Range query · Update', time: 'O(log n)', space: 'O(n)', uses: 'Range min/max/sum' },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
          <tr>
            <th className="px-4 py-2 text-left">Structure</th>
            <th className="px-4 py-2 text-left">Key ops</th>
            <th className="px-4 py-2 text-left">Time (avg)</th>
            <th className="px-4 py-2 text-left">Space</th>
            <th className="px-4 py-2 text-left">Use cases</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-white/5">
              <td className="px-4 py-2 font-medium">{r.name}</td>
              <td className="px-4 py-2 text-ink-dim">{r.ops}</td>
              <td className="px-4 py-2 font-mono text-accent-cyan">{r.time}</td>
              <td className="px-4 py-2 font-mono text-ink-dim">{r.space}</td>
              <td className="px-4 py-2 text-ink-dim">{r.uses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StackQueueDemo() {
  const [stack, setStack] = useState<number[]>([3, 7, 2]);
  const [queue, setQueue] = useState<number[]>([5, 1, 9]);
  const [n, setN] = useState(0);

  const next = () => {
    const v = (n + 1) % 100;
    setN(v);
    return v;
  };

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Stack vs Queue</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-ink-faint">Stack · LIFO</span>
            <span className="text-[10px] text-ink-faint">size {stack.length}</span>
          </div>
          <div className="flex h-44 flex-col-reverse gap-1 rounded-lg border border-white/5 bg-bg-soft/30 p-2">
            <AnimatePresence>
              {stack.map((v, i) => (
                <motion.div
                  key={`${v}-${i}`}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="rounded border border-accent/40 bg-accent/10 px-3 py-1.5 text-center font-mono text-sm"
                >
                  {v}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-2 flex gap-1">
            <button className="btn-ghost h-8 flex-1 text-xs" onClick={() => setStack((s) => [...s, next()])}>push</button>
            <button className="btn-ghost h-8 flex-1 text-xs" onClick={() => setStack((s) => s.slice(0, -1))} disabled={!stack.length}>pop</button>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-ink-faint">Queue · FIFO</span>
            <span className="text-[10px] text-ink-faint">size {queue.length}</span>
          </div>
          <div className="flex h-44 flex-col gap-1 rounded-lg border border-white/5 bg-bg-soft/30 p-2">
            <AnimatePresence>
              {queue.map((v, i) => (
                <motion.div
                  key={`${v}-${i}`}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="rounded border border-accent-cyan/40 bg-accent-cyan/10 px-3 py-1.5 text-center font-mono text-sm"
                >
                  {v}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-2 flex gap-1">
            <button className="btn-ghost h-8 flex-1 text-xs" onClick={() => setQueue((q) => [...q, next()])}>enqueue</button>
            <button className="btn-ghost h-8 flex-1 text-xs" onClick={() => setQueue((q) => q.slice(1))} disabled={!queue.length}>dequeue</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function HashTableDemo() {
  const SIZE = 7;
  const [items, setItems] = useState<{ k: string; v: string }[]>([
    { k: 'apple', v: 'red' },
    { k: 'sky', v: 'blue' },
    { k: 'leaf', v: 'green' },
  ]);
  const [k, setK] = useState('');
  const [v, setV] = useState('');

  const buckets: { k: string; v: string }[][] = Array.from({ length: SIZE }, () => []);
  for (const it of items) buckets[hash(it.k) % SIZE].push(it);

  return (
    <Card>
      <h4 className="mb-3 font-semibold">Hash table (chaining)</h4>
      <div className="space-y-1">
        {buckets.map((bucket, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 text-right font-mono text-xs text-ink-faint">{i}</span>
            <div className="flex flex-1 flex-wrap gap-1 rounded-lg border border-white/5 bg-bg-soft/30 p-1.5 min-h-[34px]">
              <AnimatePresence>
                {bucket.map((it) => (
                  <motion.span
                    key={it.k}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="rounded border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-xs"
                  >
                    {it.k}={it.v}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!k.trim()) return;
          setItems((arr) => [...arr.filter((x) => x.k !== k), { k, v: v || '∅' }]);
          setK(''); setV('');
        }}
        className="mt-3 flex gap-2"
      >
        <input value={k} onChange={(e) => setK(e.target.value)} placeholder="key" className="input flex-1" />
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="value" className="input flex-1" />
        <button className="btn-primary" type="submit">put</button>
      </form>
      <div className="mt-2 text-[11px] text-ink-faint">
        Same bucket = collision. Real hash tables resize when load factor &gt; 0.7.
      </div>
    </Card>
  );
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

function SortingVisualizer() {
  const [size] = useState(32);
  const [arr, setArr] = useState<number[]>(() => randomArr(32));
  const [algo, setAlgo] = useState<'bubble' | 'insertion' | 'quick' | 'merge'>('quick');
  const [active, setActive] = useState<{ a?: number; b?: number; pivot?: number; sorted: Set<number> }>({ sorted: new Set() });
  const [running, setRunning] = useState(false);
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const cancelRef = useRef(false);

  const reset = () => {
    cancelRef.current = true;
    setRunning(false);
    setArr(randomArr(size));
    setActive({ sorted: new Set() });
    setComparisons(0);
    setSwaps(0);
  };

  const run = async () => {
    if (running) {
      cancelRef.current = true;
      setRunning(false);
      return;
    }
    cancelRef.current = false;
    setRunning(true);
    const work = arr.slice();
    let cmp = 0;
    let sw = 0;
    const sorted = new Set<number>();
    const tick = async () => {
      await new Promise((r) => setTimeout(r, 20));
      return !cancelRef.current;
    };
    const setVis = (v: { a?: number; b?: number; pivot?: number }) => setActive({ ...v, sorted: new Set(sorted) });

    if (algo === 'bubble') {
      for (let i = 0; i < work.length; i++) {
        for (let j = 0; j < work.length - i - 1; j++) {
          if (cancelRef.current) break;
          cmp++;
          setVis({ a: j, b: j + 1 });
          if (work[j] > work[j + 1]) {
            [work[j], work[j + 1]] = [work[j + 1], work[j]];
            sw++;
            setArr([...work]);
            setSwaps(sw);
          }
          setComparisons(cmp);
          if (!(await tick())) break;
        }
        sorted.add(work.length - i - 1);
      }
    } else if (algo === 'insertion') {
      for (let i = 1; i < work.length; i++) {
        let j = i;
        while (j > 0) {
          if (cancelRef.current) break;
          cmp++;
          setVis({ a: j - 1, b: j });
          if (work[j - 1] > work[j]) {
            [work[j - 1], work[j]] = [work[j], work[j - 1]];
            sw++;
            setArr([...work]);
            setSwaps(sw);
            j--;
          } else break;
          setComparisons(cmp);
          if (!(await tick())) break;
        }
      }
      for (let i = 0; i < work.length; i++) sorted.add(i);
    } else if (algo === 'quick') {
      const partition = async (lo: number, hi: number): Promise<number> => {
        const pivot = work[hi];
        let i = lo;
        for (let j = lo; j < hi; j++) {
          if (cancelRef.current) return i;
          cmp++;
          setVis({ a: j, b: i, pivot: hi });
          if (work[j] < pivot) {
            [work[i], work[j]] = [work[j], work[i]];
            sw++;
            setArr([...work]);
            setSwaps(sw);
            i++;
          }
          setComparisons(cmp);
          if (!(await tick())) return i;
        }
        [work[i], work[hi]] = [work[hi], work[i]];
        sw++;
        setArr([...work]);
        setSwaps(sw);
        return i;
      };
      const qs = async (lo: number, hi: number) => {
        if (lo < hi) {
          const p = await partition(lo, hi);
          sorted.add(p);
          await qs(lo, p - 1);
          await qs(p + 1, hi);
        } else if (lo === hi) sorted.add(lo);
      };
      await qs(0, work.length - 1);
    } else if (algo === 'merge') {
      const buf = work.slice();
      const merge = async (lo: number, mid: number, hi: number) => {
        let i = lo;
        let j = mid + 1;
        for (let k = lo; k <= hi; k++) buf[k] = work[k];
        for (let k = lo; k <= hi; k++) {
          if (cancelRef.current) return;
          cmp++;
          setVis({ a: i, b: j });
          if (i > mid) work[k] = buf[j++];
          else if (j > hi) work[k] = buf[i++];
          else if (buf[i] <= buf[j]) work[k] = buf[i++];
          else work[k] = buf[j++];
          sw++;
          setArr([...work]);
          setSwaps(sw);
          setComparisons(cmp);
          if (!(await tick())) return;
        }
      };
      const ms = async (lo: number, hi: number) => {
        if (lo >= hi) return;
        const mid = (lo + hi) >> 1;
        await ms(lo, mid);
        await ms(mid + 1, hi);
        await merge(lo, mid, hi);
      };
      await ms(0, work.length - 1);
      for (let i = 0; i < work.length; i++) sorted.add(i);
    }
    setActive({ sorted });
    setRunning(false);
  };

  const max = Math.max(...arr, 1);

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold">Sorting visualizer</h4>
        <div className="flex flex-wrap items-center gap-2">
          <select value={algo} onChange={(e) => setAlgo(e.target.value as typeof algo)} disabled={running} className="input w-auto py-1.5">
            <option value="bubble">Bubble · O(n²)</option>
            <option value="insertion">Insertion · O(n²)</option>
            <option value="quick">Quick · O(n log n) avg</option>
            <option value="merge">Merge · O(n log n)</option>
          </select>
          <button onClick={run} className="btn-primary h-8 px-3 text-xs">
            {running ? <><Pause className="h-3 w-3" /> Stop</> : <><Play className="h-3 w-3" /> Sort</>}
          </button>
          <button onClick={reset} className="btn-ghost h-8 px-3 text-xs"><RotateCcw className="h-3 w-3" /> Shuffle</button>
        </div>
      </div>

      <div className="flex h-48 items-end gap-[2px] rounded-lg border border-white/5 bg-bg-soft/30 p-2">
        {arr.map((v, i) => {
          const isA = active.a === i;
          const isB = active.b === i;
          const isPivot = active.pivot === i;
          const isSorted = active.sorted.has(i);
          return (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t transition-all',
                isPivot ? 'bg-amber-400' : isA || isB ? 'bg-rose-400' : isSorted ? 'bg-emerald-400' : 'bg-accent/60',
              )}
              style={{ height: `${(v / max) * 100}%` }}
              title={String(v)}
            />
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Comparisons" value={comparisons} />
        <Stat label="Swaps / writes" value={swaps} />
        <Stat label="Size" value={arr.length} />
      </div>
    </Card>
  );
}

function randomArr(n: number) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5);
}

function BigOChart() {
  const [n, setN] = useState(20);
  const max = Math.max(1, n * Math.log2(Math.max(2, n)) * 1.5);
  const items = [
    { name: 'O(1)', value: 1, color: 'bg-emerald-400', desc: 'Hash lookup' },
    { name: 'O(log n)', value: Math.log2(Math.max(2, n)), color: 'bg-cyan-400', desc: 'Binary search' },
    { name: 'O(n)', value: n, color: 'bg-amber-400', desc: 'Linear scan' },
    { name: 'O(n log n)', value: n * Math.log2(Math.max(2, n)), color: 'bg-orange-400', desc: 'Merge sort' },
    { name: 'O(n²)', value: n * n, color: 'bg-rose-400', desc: 'Nested loops' },
    { name: 'O(2ⁿ)', value: Math.min(2 ** n, max * 4), color: 'bg-fuchsia-400', desc: 'Brute-force subsets' },
  ];

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Big-O at a glance</h4>
        <div className="flex items-center gap-2 text-xs">
          <Zap className="h-3.5 w-3.5 text-accent-cyan" />
          n = <input type="number" min={1} max={40} value={n} onChange={(e) => setN(parseInt(e.target.value || '1', 10))} className="input w-20 py-1 text-xs" />
        </div>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.name} className="flex items-center gap-3">
            <div className="w-20 font-mono text-xs">{it.name}</div>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-white/5">
              <motion.div
                animate={{ width: `${Math.min(100, (it.value / max) * 100)}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                className={cn('h-full', it.color)}
              />
            </div>
            <div className="hidden w-32 text-xs text-ink-dim sm:block">{it.desc}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">Bars are clamped — at n=20, O(2ⁿ) is already over a million operations.</p>
    </Card>
  );
}

function MemoryHierarchy() {
  const tiers = [
    { name: 'Register', latency: 0.3, capacity: 'bytes', color: 'from-emerald-500 to-emerald-300' },
    { name: 'L1 Cache', latency: 1, capacity: '32 KB', color: 'from-cyan-500 to-cyan-300' },
    { name: 'L2 Cache', latency: 4, capacity: '256 KB', color: 'from-sky-500 to-sky-300' },
    { name: 'L3 Cache', latency: 10, capacity: '8 MB', color: 'from-blue-500 to-blue-300' },
    { name: 'RAM', latency: 100, capacity: '32 GB', color: 'from-violet-500 to-violet-300' },
    { name: 'SSD', latency: 100_000, capacity: '1 TB', color: 'from-amber-500 to-amber-300' },
    { name: 'HDD', latency: 10_000_000, capacity: '4 TB', color: 'from-rose-500 to-rose-300' },
  ];
  const max = Math.max(...tiers.map((t) => Math.log10(t.latency + 1)));

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Memory hierarchy &amp; latency</h4>
        <span className="text-xs text-ink-faint">log scale</span>
      </div>
      <div className="space-y-2">
        {tiers.map((t) => {
          const w = (Math.log10(t.latency + 1) / max) * 100;
          return (
            <div key={t.name} className="flex items-center gap-3">
              <div className="w-20 text-xs font-medium">{t.name}</div>
              <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${w}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, type: 'spring' }}
                  className={cn('h-full bg-gradient-to-r', t.color)}
                />
                <div className="absolute inset-0 flex items-center px-2 font-mono text-[11px] text-white/90">
                  {formatLatency(t.latency)}
                </div>
              </div>
              <div className="w-20 text-right text-xs text-ink-dim">{t.capacity}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-ink-dim">
        A cache miss to RAM costs ~100× a hit in L1. A page fault to disk costs ~1,000,000×. This is why locality matters more than micro-optimizations.
      </p>
    </Card>
  );
}

function formatLatency(ns: number): string {
  if (ns < 1000) return `${ns} ns`;
  if (ns < 1_000_000) return `${(ns / 1000).toFixed(0)} µs`;
  return `${(ns / 1_000_000).toFixed(0)} ms`;
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Why is two\'s complement the standard signed-integer representation?',
    options: [
      'It uses fewer transistors than sign-magnitude.',
      'Addition and subtraction work without special-casing the sign bit.',
      'It can represent more positive numbers.',
      'It is the only form that supports overflow detection.',
    ],
    answer: 1,
    explain: 'In two\'s complement, x + (-x) wraps to 0 using ordinary binary addition — no special hardware path for negatives.',
  },
  {
    q: 'Which sort is stable and runs in O(n log n) on every input?',
    options: ['Quicksort', 'Heapsort', 'Mergesort', 'Selection sort'],
    answer: 2,
    explain: 'Mergesort is stable and Θ(n log n) worst-case. Quicksort is unstable and O(n²) worst. Heapsort is O(n log n) but unstable.',
  },
  {
    q: 'What does ~0 evaluate to as a 32-bit signed integer in JavaScript?',
    options: ['0', '1', '-1', '2³² − 1'],
    answer: 2,
    explain: '~x = -(x + 1), so ~0 = -1. Bitwise ops in JS coerce to int32.',
  },
  {
    q: 'Hash tables give O(1) average but O(n) worst. What causes the worst case?',
    options: [
      'Too many keys.',
      'A bad hash that maps many keys to one bucket — chaining degenerates to a list.',
      'A power-of-two table size.',
      'Open addressing.',
    ],
    answer: 1,
    explain: 'When hashes collide for most keys, lookup becomes a linear scan of one bucket.',
  },
  {
    q: 'A cache hit in L1 is roughly 1 ns. A cache miss to RAM is roughly...',
    options: ['10 ns', '100 ns', '10 µs', '1 ms'],
    answer: 1,
    explain: 'RAM is ~100 ns. SSD is ~100 µs. HDD seeks are ~10 ms.',
  },
];
