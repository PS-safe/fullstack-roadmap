import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Workflow, Database, FileJson, GitBranch, Layers as LayersIcon, AlertTriangle, Play, RotateCcw } from 'lucide-react';
import { Section, TopicCard, Bullets, InlineCode, Card, Stat } from '../components/UI';
import { CodePlayground } from '../components/CodePlayground';
import { MermaidDiagram } from '../components/MermaidDiagram';
import { Quiz, type QuizQuestion } from '../components/Quiz';
import { cn } from '../lib/cn';

const L = 15;

export default function Layer15() {
  return (
    <div className="space-y-12">
      <Hero />

      <Section id="etl" kicker="15.1" title="ETL vs ELT (and why ELT won)">
        <TopicCard
          layerId={L}
          index={0}
          title="Where you transform decides everything"
          description="ETL transforms before loading; ELT loads raw, transforms in the warehouse. Cheap warehouse compute (Snowflake/BigQuery) flipped the equation — ELT is the modern default."
        >
          <EtlVsElt />
        </TopicCard>
      </Section>

      <Section id="batch" kicker="15.2" title="Batch vs Streaming">
        <TopicCard
          layerId={L}
          index={1}
          title="Latency budget drives the architecture"
          description="Batch is cheap, simple, and fine for daily reports. Streaming is for real-time decisions: fraud, personalization, monitoring. Most real systems run both — Lambda or Kappa architecture."
        >
          <BatchStreamingCompare />
        </TopicCard>
      </Section>

      <Section id="formats" kicker="15.3" title="File Formats">
        <TopicCard
          layerId={L}
          index={2}
          title="CSV is the new XML"
          description="Columnar formats (Parquet, ORC) are 5-10× smaller and 10-100× faster to query than CSV. Use Parquet for everything analytical. CSV only for human-readable handoffs."
        >
          <FileFormatMatrix />
        </TopicCard>
      </Section>

      <Section id="storage" kicker="15.4" title="Lake · Warehouse · Lakehouse">
        <TopicCard
          layerId={L}
          index={3}
          title="Three patterns, one storage problem"
          description="Lake: cheap object storage of raw files. Warehouse: optimized for SQL analytics. Lakehouse: warehouse semantics on lake storage (Iceberg, Delta, Hudi)."
        >
          <StorageComparator />
        </TopicCard>
      </Section>

      <Section id="dbt" kicker="15.5" title="dbt: SQL as software">
        <TopicCard
          layerId={L}
          index={4}
          title="The transformation layer of the modern stack"
          description="dbt turns SQL into version-controlled, tested, documented modules with dependency resolution. The closest thing data engineers have to Git + tests + Make."
        >
          <DbtDagDemo />
        </TopicCard>
      </Section>

      <Section id="orchestration" kicker="15.6" title="Orchestration: Airflow / Dagster / Prefect">
        <TopicCard
          layerId={L}
          index={5}
          title="A scheduler is not enough"
          description="Modern orchestrators give you DAGs, retries, backfills, asset lineage, alerting. Cron is the wrong tool for any pipeline that has more than two steps."
        >
          <AirflowDag />
        </TopicCard>
        <MermaidDiagram
          chart={`flowchart LR
            A[ingest_users] --> B[ingest_orders]
            A --> C[ingest_events]
            B --> D[stage_orders]
            C --> E[stage_events]
            D --> F[fact_orders]
            E --> F
            A --> G[dim_user]
            G --> F
            F --> H[mart_revenue]
            F --> I[ml_features]
            style F fill:#1f2937,stroke:#22d3ee
            style H fill:#1f2937,stroke:#34d399`}
          caption="A typical pipeline DAG"
        />
      </Section>

      <Section id="streaming" kicker="15.7" title="Stream Processing: Kafka, Flink, Spark Streaming">
        <TopicCard
          layerId={L}
          index={6}
          title="Windows, watermarks, late data"
          description="Streaming is just batch with smaller batches — until you need correctness over time. Then windows, watermarks, and exactly-once become essential vocabulary."
        >
          <StreamWindows />
        </TopicCard>
      </Section>

      <Section id="cdc" kicker="15.8" title="CDC: Change Data Capture">
        <TopicCard
          layerId={L}
          index={7}
          title="Database changes as a stream"
          description="Read the transaction log; emit each row change as an event. Debezium/Fivetran/Airbyte do this for you. Beats nightly full-table dumps in every dimension."
        >
          <CdcFlow />
        </TopicCard>
      </Section>

      <Section id="modeling" kicker="15.9" title="Dimensional Modeling & SCD">
        <TopicCard
          layerId={L}
          index={8}
          title="Star schema and Slowly Changing Dimensions"
          description="Facts are events (row per event). Dimensions are descriptive attributes (customer, product). SCD describes how to handle dimensions that change over time."
        >
          <StarSchema />
          <ScdPicker />
        </TopicCard>
      </Section>

      <Section id="quality" kicker="15.10" title="Data Quality & Lineage">
        <TopicCard
          layerId={L}
          index={9}
          title="Tests that catch bad data before users see it"
          description="dbt tests, Great Expectations, Soda. Lineage from OpenLineage / dbt docs answers 'what breaks if I change this column?' — invaluable in a 1000-model warehouse."
        >
          <QualityTests />
        </TopicCard>
        <CodePlayground
          mode="js"
          height={240}
          title="dbt-style tests in YAML"
          initial={`// models/marts/fct_orders.yml
const tests = {
  version: 2,
  models: [{
    name: 'fct_orders',
    columns: [
      { name: 'order_id',     tests: ['unique', 'not_null'] },
      { name: 'customer_id',  tests: [
        'not_null',
        { relationships: { to: "ref('dim_customer')", field: 'customer_id' } },
      ]},
      { name: 'total_cents',  tests: [
        'not_null',
        { dbt_utils_expression_is_true: { expression: '> 0' } },
      ]},
      { name: 'status',       tests: [
        { accepted_values: { values: ['pending', 'paid', 'shipped', 'cancelled'] } },
      ]},
    ],
  }],
};

console.log(JSON.stringify(tests, null, 2));
console.log('\\nRun: dbt test → fails the build if any row violates a contract');`}
        />
      </Section>

      <Section id="quiz" kicker="Knowledge Check" title="Layer 15 Quiz">
        <Quiz id="L15" questions={QUESTIONS} />
      </Section>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-emerald-500/10 via-bg-card to-green-500/10 p-8 sm:p-10">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="layer-chip bg-gradient-to-r from-emerald-500 to-green-500 text-white">L15</span>
          <span className="text-xs uppercase tracking-widest text-ink-faint">Data Engineering & Pipelines</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Move data, transform it, trust it</h1>
        <p className="mt-3 max-w-2xl text-ink-dim">
          The modern data stack: ELT into a cloud warehouse, transform with dbt, orchestrate with Airflow / Dagster,
          stream the hot path with Kafka, capture change with CDC, model with star schemas, test with contracts.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
          <Workflow className="h-4 w-4 text-emerald-400" />
          10 topics · 9 visualizers · 1 playground · 1 quiz
        </div>
      </div>
    </header>
  );
}

/* -------------------- VISUALIZERS -------------------- */

function EtlVsElt() {
  const [pick, setPick] = useState<'etl' | 'elt'>('elt');
  const data = {
    etl: {
      label: 'ETL — Extract → Transform → Load',
      flow: [
        { name: 'Source DBs / APIs', color: 'bg-cyan-500' },
        { name: 'Transform (Python / Informatica)', color: 'bg-amber-500', emphasis: true },
        { name: 'Warehouse (loaded clean)', color: 'bg-emerald-500' },
      ],
      pros: ['Less data in the warehouse', 'Sensitive data can be filtered before it lands'],
      cons: ['Transform logic in code, not SQL — harder to discover', 'Warehouse never sees raw — limits exploration', 'Re-processing requires re-pulling from source'],
      era: 'Pre-cloud (Informatica / Talend / SSIS era)',
    },
    elt: {
      label: 'ELT — Extract → Load → Transform',
      flow: [
        { name: 'Source DBs / APIs', color: 'bg-cyan-500' },
        { name: 'Warehouse (raw layer)', color: 'bg-emerald-500' },
        { name: 'Transform with dbt / SQL', color: 'bg-amber-500', emphasis: true },
        { name: 'Marts (clean, modeled)', color: 'bg-violet-500' },
      ],
      pros: ['Cheap warehouse compute makes T affordable', 'Raw is preserved — re-derive any model', 'Transformations in SQL — discoverable, testable'],
      cons: ['Sensitive data lands in the warehouse — needs governance', 'Bigger warehouse bill if you\'re not careful'],
      era: 'Cloud era (Snowflake / BigQuery / Redshift)',
    },
  };
  const cur = data[pick];

  return (
    <Card>
      <div className="mb-3 flex flex-wrap gap-2">
        {(['etl', 'elt'] as const).map((k) => (
          <button key={k} onClick={() => setPick(k)} className={cn('rounded-md border px-3 py-1.5 font-mono text-xs uppercase', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
            {k}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-2">
          <div className="text-base font-semibold">{cur.label}</div>
          <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <AnimatePresence mode="wait">
                {cur.flow.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <motion.div
                      key={pick + i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={cn('rounded-lg px-3 py-2 text-xs text-white', step.color, step.emphasis && 'ring-2 ring-white/40')}
                    >
                      {step.name}
                    </motion.div>
                    {i < cur.flow.length - 1 && <span className="text-ink-faint">→</span>}
                  </div>
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-3 text-xs text-ink-faint">{cur.era}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3">
            <div className="text-xs uppercase tracking-widest text-emerald-300">Pros</div>
            <ul className="mt-1 space-y-1 text-xs text-ink-dim">
              {cur.pros.map((p) => <li key={p}>+ {p}</li>)}
            </ul>
          </div>
          <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-3">
            <div className="text-xs uppercase tracking-widest text-rose-300">Cons</div>
            <ul className="mt-1 space-y-1 text-xs text-ink-dim">
              {cur.cons.map((p) => <li key={p}>− {p}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

function BatchStreamingCompare() {
  const rows = [
    { dim: 'Latency', batch: 'minutes → days', stream: 'milliseconds → seconds' },
    { dim: 'Throughput', batch: 'huge — terabytes per job', stream: 'high but per-event' },
    { dim: 'Cost', batch: 'cheapest', stream: '5-10× more' },
    { dim: 'Complexity', batch: 'simple', stream: 'high — windows, watermarks, exactly-once' },
    { dim: 'Tools', batch: 'Spark, dbt, Airflow', stream: 'Kafka + Flink, Kinesis, Pulsar, Materialize' },
    { dim: 'Use cases', batch: 'BI, daily reports, ML training', stream: 'Fraud, personalization, alerts, real-time dashboards' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Workflow className="h-4 w-4" /> <h4 className="font-semibold">Batch vs Streaming</h4></div>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr><th className="px-4 py-2 text-left">Dimension</th><th className="px-4 py-2 text-left">Batch</th><th className="px-4 py-2 text-left">Streaming</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.dim} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.dim}</td>
                <td className="px-4 py-2 text-ink-dim">{r.batch}</td>
                <td className="px-4 py-2 text-ink-dim">{r.stream}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        <strong className="text-ink">Lambda</strong> = both, separate code paths. <strong className="text-ink">Kappa</strong> = stream-only, batch is just a bounded stream. Kappa is simpler if your tools support it (Flink, Materialize).
      </p>
    </Card>
  );
}

function FileFormatMatrix() {
  const formats = [
    { name: 'CSV',      type: 'row',     compress: 'gzip optional', schema: 'no',          query: 'full scan',  size: 100,  use: 'human-readable handoffs' },
    { name: 'JSON / NDJSON', type: 'row', compress: 'gzip',         schema: 'flexible',    query: 'full scan',  size: 130,  use: 'event logs, semi-structured' },
    { name: 'Avro',     type: 'row',     compress: 'snappy / deflate', schema: 'embedded', query: 'full scan',  size: 30,   use: 'Kafka, schema evolution' },
    { name: 'Parquet',  type: 'columnar', compress: 'snappy / zstd', schema: 'embedded',   query: 'predicate pushdown + column projection', size: 12, use: 'analytical queries, lake storage' },
    { name: 'ORC',      type: 'columnar', compress: 'zstd',          schema: 'embedded',   query: 'predicate pushdown', size: 11, use: 'Hive ecosystem' },
    { name: 'Delta / Iceberg / Hudi', type: 'columnar (Parquet) + manifest', compress: 'snappy', schema: 'evolves', query: 'time travel + ACID', size: 12, use: 'lakehouse tables' },
  ];
  const max = Math.max(...formats.map((f) => f.size));
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><FileJson className="h-4 w-4" /> <h4 className="font-semibold">File format comparator</h4></div>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-dim">
            <tr>
              <th className="px-4 py-2 text-left">Format</th>
              <th className="px-4 py-2 text-left">Layout</th>
              <th className="px-4 py-2 text-left">Schema</th>
              <th className="px-4 py-2 text-left">Query</th>
              <th className="px-4 py-2 text-left">Relative size</th>
              <th className="px-4 py-2 text-left">Best for</th>
            </tr>
          </thead>
          <tbody>
            {formats.map((f) => (
              <tr key={f.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{f.name}</td>
                <td className="px-4 py-2 text-ink-dim">{f.type}</td>
                <td className="px-4 py-2 text-ink-dim">{f.schema}</td>
                <td className="px-4 py-2 text-ink-dim">{f.query}</td>
                <td className="px-4 py-2">
                  <div className="relative h-3 w-32 overflow-hidden rounded bg-white/5">
                    <div className="h-full bg-emerald-400" style={{ width: `${(f.size / max) * 100}%` }} />
                  </div>
                  <div className="mt-0.5 text-[10px] text-ink-faint">{f.size}% of CSV</div>
                </td>
                <td className="px-4 py-2 text-xs text-ink-dim">{f.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Default for analytics: Parquet. Default for streaming events: Avro. CSV only when a human will read the file.</p>
    </Card>
  );
}

function StorageComparator() {
  const [pick, setPick] = useState<'lake' | 'warehouse' | 'lakehouse'>('lakehouse');
  const data = {
    lake: {
      title: 'Data Lake',
      what: 'Cheap object storage (S3 / GCS / ABFS) holding raw files in any format.',
      shines: 'Cost, schema-on-read, semi-structured & unstructured data, ML training sets.',
      hurts: 'No ACID, no concurrent updates, full-table scans without good partitioning.',
      ex: 'S3 + Parquet + Glue catalog',
    },
    warehouse: {
      title: 'Data Warehouse',
      what: 'Managed columnar SQL engine (Snowflake / BigQuery / Redshift) with proprietary storage.',
      shines: 'Sub-second SQL on TB scale, governance, ACID, time travel, ML features built in.',
      hurts: 'Vendor lock-in, expensive at extreme scale, semi-structured needs special types.',
      ex: 'Snowflake, BigQuery',
    },
    lakehouse: {
      title: 'Lakehouse',
      what: 'Open table format (Iceberg / Delta / Hudi) on lake storage; warehouse query engines on top.',
      shines: 'Open format, ACID + time travel on cheap storage, multi-engine (Spark, Trino, DuckDB).',
      hurts: 'Newer, more moving parts (catalog, manifest), tooling still maturing.',
      ex: 'Iceberg + Trino, Databricks Delta',
    },
  };
  const cur = data[pick];
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><Database className="h-4 w-4" /> <h4 className="font-semibold">Storage choice</h4></div>
      <div className="mb-3 flex gap-2">
        {(['lake', 'warehouse', 'lakehouse'] as const).map((k) => (
          <button key={k} onClick={() => setPick(k)} className={cn('rounded-md border px-3 py-1.5 text-xs', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
            {data[k].title}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-white/5 bg-bg-soft/40 p-4">
        <div className="text-base font-semibold">{cur.title}</div>
        <p className="mt-1 text-sm text-ink-dim">{cur.what}</p>
        <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3 text-sm"><div className="text-xs uppercase tracking-widest text-emerald-300">Shines</div><p className="mt-1 text-ink-dim">{cur.shines}</p></div>
          <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-3 text-sm"><div className="text-xs uppercase tracking-widest text-rose-300">Hurts</div><p className="mt-1 text-ink-dim">{cur.hurts}</p></div>
        </div>
        <div className="mt-3 text-xs text-ink-faint">Examples: <span className="font-mono text-ink-dim">{cur.ex}</span></div>
      </div>
    </Card>
  );
}

function DbtDagDemo() {
  const models = [
    { name: 'stg_users',     layer: 'staging', deps: [] },
    { name: 'stg_orders',    layer: 'staging', deps: [] },
    { name: 'stg_events',    layer: 'staging', deps: [] },
    { name: 'int_user_orders', layer: 'intermediate', deps: ['stg_users', 'stg_orders'] },
    { name: 'dim_user',      layer: 'mart', deps: ['stg_users'] },
    { name: 'fct_orders',    layer: 'mart', deps: ['int_user_orders'] },
    { name: 'fct_events',    layer: 'mart', deps: ['stg_events'] },
    { name: 'mart_revenue',  layer: 'analytics', deps: ['fct_orders', 'dim_user'] },
  ];
  const layers: Record<string, { x: number; color: string }> = {
    staging: { x: 60, color: '#22d3ee' },
    intermediate: { x: 220, color: '#a78bfa' },
    mart: { x: 380, color: '#34d399' },
    analytics: { x: 540, color: '#f59e0b' },
  };
  const positioned = models.map((m, i) => {
    const layerModels = models.filter((x) => x.layer === m.layer);
    const idx = layerModels.findIndex((x) => x.name === m.name);
    return { ...m, x: layers[m.layer].x, y: 30 + idx * 60, color: layers[m.layer].color };
  });
  const findP = (name: string) => positioned.find((p) => p.name === name)!;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><GitBranch className="h-4 w-4" /> <h4 className="font-semibold">dbt model dependency graph</h4></div>
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-bg-soft/30 p-3">
        <svg viewBox="0 0 640 250" className="w-full" style={{ minWidth: 600 }}>
          {positioned.map((m) =>
            m.deps.map((d) => {
              const p = findP(d);
              return <path key={`${d}-${m.name}`} d={`M${p.x + 110},${p.y + 18} C${(p.x + m.x) / 2 + 70},${p.y + 18} ${(p.x + m.x) / 2 + 30},${m.y + 18} ${m.x},${m.y + 18}`} stroke="rgba(255,255,255,0.15)" fill="none" />;
            }),
          )}
          {positioned.map((m) => (
            <g key={m.name}>
              <rect x={m.x} y={m.y} width="110" height="36" rx="8" fill={m.color + '22'} stroke={m.color} />
              <text x={m.x + 55} y={m.y + 22} textAnchor="middle" fill="white" fontSize="11" fontFamily="ui-monospace">{m.name}</text>
            </g>
          ))}
          {Object.entries(layers).map(([l, v]) => (
            <text key={l} x={v.x + 55} y={20} textAnchor="middle" fill={v.color} fontSize="10" fontFamily="ui-monospace">{l}</text>
          ))}
        </svg>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-5 text-ink-dim">{`-- models/marts/fct_orders.sql
{{ config(materialized='incremental', unique_key='order_id') }}

select
  o.order_id,
  o.customer_id,
  o.total_cents,
  u.country
from {{ ref('int_user_orders') }} o
left join {{ ref('dim_user') }} u using (customer_id)

{% if is_incremental() %}
  where o.updated_at > (select max(updated_at) from {{ this }})
{% endif %}`}</pre>
      <p className="mt-3 text-xs text-ink-faint">
        <InlineCode>{'{{ ref(...) }}'}</InlineCode> declares dependencies. dbt builds the DAG, runs in order, parallelizes where it can. Incremental models avoid full rebuilds.
      </p>
    </Card>
  );
}

type Task = { name: string; deps: string[]; status: 'pending' | 'running' | 'success' | 'failed' };

function AirflowDag() {
  const initial: Task[] = [
    { name: 'extract_users', deps: [], status: 'pending' },
    { name: 'extract_orders', deps: [], status: 'pending' },
    { name: 'load_to_warehouse', deps: ['extract_users', 'extract_orders'], status: 'pending' },
    { name: 'dbt_run', deps: ['load_to_warehouse'], status: 'pending' },
    { name: 'dbt_test', deps: ['dbt_run'], status: 'pending' },
    { name: 'notify_slack', deps: ['dbt_test'], status: 'pending' },
  ];
  const [tasks, setTasks] = useState(initial);

  const tick = () => {
    setTasks((arr) => {
      const next = [...arr];
      for (const t of next) {
        if (t.status === 'pending' && t.deps.every((d) => next.find((x) => x.name === d)?.status === 'success')) {
          t.status = 'running';
          break;
        }
        if (t.status === 'running') {
          t.status = Math.random() < 0.1 ? 'failed' : 'success';
          break;
        }
      }
      return next;
    });
  };
  const reset = () => setTasks(initial);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Airflow / Dagster DAG runner</h4>
        <div className="flex gap-2">
          <button onClick={tick} className="btn-primary h-8 text-xs"><Play className="h-3 w-3" /> tick</button>
          <button onClick={reset} className="btn-ghost h-8 text-xs"><RotateCcw className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="space-y-1">
        {tasks.map((t) => {
          const tone = t.status === 'success' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : t.status === 'running' ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' : t.status === 'failed' ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-white/10 bg-white/5 text-ink-dim';
          const blocked = t.status === 'pending' && !t.deps.every((d) => tasks.find((x) => x.name === d)?.status === 'success');
          return (
            <motion.div key={t.name} layout className={cn('flex items-center justify-between rounded-lg border px-3 py-2 text-sm', tone, blocked && 'opacity-50')}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs">{t.name}</span>
                {t.deps.length > 0 && <span className="text-[10px] text-ink-faint">deps: {t.deps.join(', ')}</span>}
              </div>
              <div className="flex items-center gap-2">
                {t.status === 'running' && <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />}
                <span className="font-mono text-[10px] uppercase">{t.status}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-ink-faint">Each task only starts when ALL upstream tasks succeed. Failure quarantines downstream — the orchestrator pages you, not retries blindly.</p>
    </Card>
  );
}

const WINDOW_TYPES = ['tumbling', 'sliding', 'session'] as const;
type Win = typeof WINDOW_TYPES[number];

function StreamWindows() {
  const [pick, setPick] = useState<Win>('tumbling');
  // Build event positions on a simple t=0..60 timeline
  const events = [3, 7, 12, 16, 22, 28, 35, 42, 48, 53, 58];

  const windows = useMemo(() => {
    if (pick === 'tumbling') {
      return [0, 10, 20, 30, 40, 50].map((s) => ({ start: s, end: s + 10 }));
    }
    if (pick === 'sliding') {
      return [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((s) => ({ start: s, end: s + 10 }));
    }
    // session: gap > 7 = new session
    const sessions: { start: number; end: number }[] = [];
    let cur: { start: number; end: number } | null = null;
    for (const e of events) {
      if (!cur) cur = { start: e, end: e + 1 };
      else if (e - cur.end <= 7) cur.end = e + 1;
      else { sessions.push(cur); cur = { start: e, end: e + 1 }; }
    }
    if (cur) sessions.push(cur);
    return sessions;
  }, [pick]);

  const tColor = { tumbling: 'border-emerald-400/40 bg-emerald-400/15', sliding: 'border-cyan-400/40 bg-cyan-400/15', session: 'border-amber-400/40 bg-amber-400/15' };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Stream windows</h4>
        <div className="flex gap-2">
          {WINDOW_TYPES.map((w) => (
            <button key={w} onClick={() => setPick(w)} className={cn('rounded-md border px-3 py-1 text-xs', pick === w ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
              {w}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-32 rounded-xl border border-white/5 bg-bg-soft/30">
        {/* Timeline */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
        {/* Window bands */}
        {windows.map((w, i) => (
          <motion.div
            key={pick + i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn('absolute top-2 bottom-12 rounded-md border', tColor[pick])}
            style={{ left: `${(w.start / 60) * 100}%`, width: `${((w.end - w.start) / 60) * 100}%` }}
          />
        ))}
        {/* Events */}
        {events.map((e, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${(e / 60) * 100}%`, top: '50%' }}>
            <div className="h-3 w-3 rounded-full bg-accent ring-2 ring-bg" />
            <div className="mt-1 text-center font-mono text-[10px] text-ink-faint">t={e}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-dim">
        {pick === 'tumbling' && '10s tumbling: non-overlapping windows. Each event lands in exactly one. Used for "events per minute".'}
        {pick === 'sliding' && '10s sliding, 5s slide: overlapping. Each event counted in multiple. Used for moving averages.'}
        {pick === 'session' && 'Session: a window per burst, closed when no event for 7s. Used for "user session length".'}
      </p>
      <div className="mt-2 rounded-lg border border-white/5 bg-bg-soft/40 p-3 text-[11px] text-ink-faint">
        <strong className="text-ink-dim">Watermarks</strong> = the engine's belief about how late an event can still arrive. After watermark passes, the window can close. Late events go to a side-output (or get dropped, your choice).
      </div>
    </Card>
  );
}

function CdcFlow() {
  const steps = [
    { name: 'Source DB', detail: 'OLTP Postgres / MySQL / Mongo' },
    { name: 'Transaction log', detail: 'WAL / binlog / oplog (the source of truth for changes)' },
    { name: 'CDC connector', detail: 'Debezium reads the log, emits row-level events' },
    { name: 'Kafka topic', detail: 'One topic per table, ordered by primary key' },
    { name: 'Consumers', detail: 'Sink to warehouse (Snowflake), search index (Elasticsearch), cache (Redis), other services' },
  ];
  return (
    <Card>
      <h4 className="mb-3 font-semibold">Change Data Capture flow</h4>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.name} className="flex items-center gap-2">
            <div className="rounded-lg border border-white/10 bg-bg-soft/40 px-3 py-2 text-xs">
              <div className="font-medium">{s.name}</div>
              <div className="mt-0.5 text-[10px] text-ink-faint">{s.detail}</div>
            </div>
            {i < steps.length - 1 && <span className="text-ink-faint">→</span>}
          </div>
        ))}
      </div>
      <pre className="mt-3 overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-[12px] leading-5 text-ink-dim">{`// One Kafka message per row change:
{
  "op": "u",                                 // c | u | d
  "before": { "id": 42, "email": "ada@x.com", "plan": "free" },
  "after":  { "id": 42, "email": "ada@x.com", "plan": "pro"  },
  "ts_ms": 1714329600000,
  "source": { "db": "app", "schema": "public", "table": "users" }
}`}</pre>
      <p className="mt-3 text-xs text-ink-faint">CDC is near-real-time, low-impact (reads the log, not the table), and preserves <em>change history</em> — perfect feed for SCD2 and audit logs.</p>
    </Card>
  );
}

function StarSchema() {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2"><LayersIcon className="h-4 w-4" /> <h4 className="font-semibold">Star schema (Kimball)</h4></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <svg viewBox="0 0 480 280" className="w-full">
          {[
            { x: 30, y: 30, label: 'dim_date', color: '#22d3ee' },
            { x: 350, y: 30, label: 'dim_product', color: '#34d399' },
            { x: 30, y: 200, label: 'dim_customer', color: '#a78bfa' },
            { x: 350, y: 200, label: 'dim_store', color: '#f59e0b' },
          ].map((d) => (
            <g key={d.label}>
              <rect x={d.x} y={d.y} width="100" height="50" rx="8" fill={d.color + '22'} stroke={d.color} />
              <text x={d.x + 50} y={d.y + 30} textAnchor="middle" fill="white" fontSize="11" fontFamily="ui-monospace">{d.label}</text>
              <line x1={d.x + 50} y1={d.y + 50} x2="240" y2="140" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
            </g>
          ))}
          <rect x="180" y="115" width="120" height="60" rx="8" fill="#e7ecf322" stroke="white" strokeWidth="2" />
          <text x="240" y="140" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">fct_sales</text>
          <text x="240" y="158" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10">dimension keys + measures</text>
        </svg>
        <div className="space-y-2 text-sm text-ink-dim">
          <p><strong className="text-ink">Fact</strong> table: one row per business event (a sale). Holds foreign keys to every dimension and the measurable values (quantity, revenue).</p>
          <p><strong className="text-ink">Dimension</strong> tables: descriptive context (date, product, customer, store). De-normalized — denormalize into wide tables for query simplicity.</p>
          <p>Star schema is fast to query (one join level) and easy for analysts. Snowflake schema normalizes dimensions further — usually overkill.</p>
        </div>
      </div>
    </Card>
  );
}

function ScdPicker() {
  const [pick, setPick] = useState<'1' | '2' | '3'>('2');
  const data = {
    '1': {
      title: 'SCD Type 1 — overwrite',
      desc: 'No history. Update in place. Simple and small, but you lose the past.',
      table: [
        { id: 1, name: 'Ada', city: 'NYC' },
        { id: 2, name: 'Lin', city: 'LA' },
      ],
      after: [
        { id: 1, name: 'Ada', city: 'SF' },
        { id: 2, name: 'Lin', city: 'LA' },
      ],
      use: 'Corrections to bad data, attributes you don\'t care about historically.',
    },
    '2': {
      title: 'SCD Type 2 — versioning',
      desc: 'Insert a new row, mark the old one with end_date. Adds is_current flag and surrogate key. Full history preserved.',
      table: [
        { sk: 1, id: 1, name: 'Ada', city: 'NYC', valid_from: '2024-01-01', valid_to: null, is_current: true },
        { sk: 2, id: 2, name: 'Lin', city: 'LA', valid_from: '2024-01-01', valid_to: null, is_current: true },
      ],
      after: [
        { sk: 1, id: 1, name: 'Ada', city: 'NYC', valid_from: '2024-01-01', valid_to: '2026-04-15', is_current: false },
        { sk: 2, id: 2, name: 'Lin', city: 'LA', valid_from: '2024-01-01', valid_to: null, is_current: true },
        { sk: 3, id: 1, name: 'Ada', city: 'SF', valid_from: '2026-04-15', valid_to: null, is_current: true },
      ],
      use: 'Default for any dimension where history matters (customer, product, employee).',
    },
    '3': {
      title: 'SCD Type 3 — previous-only column',
      desc: 'Add prev_value column. Only one step of history.',
      table: [
        { id: 1, name: 'Ada', current_city: 'NYC', previous_city: null },
        { id: 2, name: 'Lin', current_city: 'LA', previous_city: null },
      ],
      after: [
        { id: 1, name: 'Ada', current_city: 'SF', previous_city: 'NYC' },
        { id: 2, name: 'Lin', current_city: 'LA', previous_city: null },
      ],
      use: 'Rarely the right choice. Use Type 2 instead.',
    },
  };
  const cur = data[pick];
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">Slowly Changing Dimensions</h4>
        <div className="flex gap-2">
          {(['1', '2', '3'] as const).map((k) => (
            <button key={k} onClick={() => setPick(k)} className={cn('rounded-md border px-2.5 py-1 font-mono text-xs', pick === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5 text-ink-dim')}>
              SCD {k}
            </button>
          ))}
        </div>
      </div>
      <div className="text-base font-semibold">{cur.title}</div>
      <p className="mt-1 text-sm text-ink-dim">{cur.desc}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">Before update</div>
          <ScdTable rows={cur.table as any} />
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-widest text-ink-faint">After Ada moves to SF</div>
          <ScdTable rows={cur.after as any} />
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">{cur.use}</p>
    </Card>
  );
}

function ScdTable({ rows }: { rows: Record<string, any>[] }) {
  if (!rows.length) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-lg border border-white/5">
      <table className="w-full text-[11px]">
        <thead className="bg-white/5 text-ink-dim">
          <tr>{cols.map((c) => <th key={c} className="px-2 py-1 text-left font-mono">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/5 font-mono">
              {cols.map((c) => <td key={c} className={cn('px-2 py-1', r[c] === null && 'text-ink-faint')}>{r[c] === null ? 'null' : String(r[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QualityTests() {
  const [run, setRun] = useState(false);
  const tests = [
    { name: 'unique(order_id)', status: 'pass', detail: '14,201,338 rows, 0 duplicates' },
    { name: 'not_null(customer_id)', status: 'pass', detail: '0 nulls' },
    { name: 'fk(customer_id → dim_customer)', status: 'fail', detail: '17 orphan customer_ids found in fct_orders' },
    { name: 'accepted_values(status)', status: 'pass', detail: 'all in [pending, paid, shipped, cancelled]' },
    { name: 'expression(total_cents > 0)', status: 'fail', detail: '3 rows with total_cents = 0' },
    { name: 'freshness(updated_at < 24h)', status: 'pass', detail: 'most recent: 2 minutes ago' },
  ];
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-300" /><h4 className="font-semibold">Data quality test run</h4></div>
        <button onClick={() => setRun(true)} className="btn-primary h-8 text-xs"><Play className="h-3 w-3" /> Run dbt test</button>
      </div>
      <div className="space-y-1">
        {tests.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: run ? 1 : 0.4 }}
            transition={{ delay: i * 0.08 }}
            className={cn('flex items-center justify-between rounded-lg border px-3 py-2 text-sm', t.status === 'pass' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/30 bg-rose-400/10 text-rose-200')}
          >
            <span className="font-mono text-xs">{t.name}</span>
            <span className="text-xs">{t.status === 'pass' ? '✓' : '✗'} {t.detail}</span>
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">Failed tests block the dbt run — bad data never gets to consumers. Set test severity (warn / error) per importance.</p>
    </Card>
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'You have 1 TB of analytics data on S3. Best file format?',
    options: ['CSV gzipped', 'JSON one-row-per-line', 'Parquet (columnar)', 'XML'],
    answer: 2,
    explain: 'Parquet is columnar, compressed, and supports predicate pushdown. Queries that touch 2 columns of 200 only read those columns.',
  },
  {
    q: 'When does ELT beat ETL?',
    options: [
      'When source data is small.',
      'When warehouse compute is cheap (Snowflake/BigQuery) and you want raw history preserved.',
      'When you need real-time.',
      'When you have no warehouse.',
    ],
    answer: 1,
    explain: 'Modern cloud warehouses make T cheap and easy. Raw layer stays in the warehouse for re-derivation.',
  },
  {
    q: 'A user logs in every 30s for 3 minutes, then nothing for 20 min, then 3 more logins. How many session windows (gap=5min)?',
    options: ['1', '2', '6', '7'],
    answer: 1,
    explain: 'Session windows close after the gap is exceeded. First burst → window 1. Second burst → window 2.',
  },
  {
    q: 'You need to track every customer\'s historical city, not just current. Which SCD?',
    options: ['Type 1 (overwrite)', 'Type 2 (versioning)', 'Type 3 (prev column)', 'Type 0 (do nothing)'],
    answer: 1,
    explain: 'Type 2 inserts a new row per change with valid_from/valid_to and an is_current flag. Full history; standard for dimensions.',
  },
  {
    q: 'CDC reads from...',
    options: [
      'A nightly full-table SELECT.',
      'The database\'s transaction log (WAL / binlog / oplog).',
      'A separate replica DB.',
      'A user-defined trigger.',
    ],
    answer: 1,
    explain: 'CDC tools (Debezium, Fivetran) tail the transaction log. Low impact on the source, near-real-time, captures every change.',
  },
];
