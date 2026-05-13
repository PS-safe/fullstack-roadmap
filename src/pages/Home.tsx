import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Layers, Sparkles } from 'lucide-react';
import { LAYERS } from '../data/layers';
import { progressForLayer, useProgress } from '../lib/progress';
import { Stat } from '../components/UI';

export default function Home() {
  const { map } = useProgress();
  const totalTopics = LAYERS.reduce((acc, l) => acc + l.topics.length, 0);
  const totalCompleted = Object.values(map).filter(Boolean).length;

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-bg-card to-bg-soft p-8 sm:p-12">
        <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-accent-cyan/15 blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink-dim">
            <Sparkles className="h-3.5 w-3.5 text-accent-cyan" />
            Professional Guide · Interactive
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Full Stack <span className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text text-transparent">Developer Roadmap</span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-dim">
            A progressive learning journey from <strong className="text-ink">computing fundamentals</strong> to{' '}
            <strong className="text-ink">distributed systems</strong>. Every concept comes with an interactive demo —
            click, type, and see how it works.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/layer/foundations" className="btn-primary">
              Start with Layer 1 <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#layers" className="btn-ghost">
              <Layers className="h-4 w-4" /> Browse layers
            </a>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Layers" value={LAYERS.length} />
            <Stat label="Core topics" value={totalTopics} />
            <Stat label="Demos" value="130+" />
            <Stat label="Mastered" value={`${totalCompleted}/${totalTopics}`} sub="Track in localStorage" />
          </div>
        </div>
      </section>

      <section id="layers" className="space-y-4">
        <header className="flex items-end justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-accent-cyan">Knowledge Architecture</div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Eighteen layers, built from the ground up</h2>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {LAYERS.map((layer, i) => {
            const Icon = layer.icon;
            const p = progressForLayer(map, layer.id, layer.topics.length);
            return (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
              >
                <Link
                  to={`/layer/${layer.slug}`}
                  className="group relative block overflow-hidden rounded-2xl border border-white/5 bg-bg-card/70 p-5 transition-all hover:border-white/15 hover:bg-bg-card"
                >
                  <div className="flex items-start gap-4">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${layer.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`layer-chip bg-gradient-to-r ${layer.color} text-white/95`}>L{String(layer.id).padStart(2, '0')}</span>
                        <span className="text-xs text-ink-faint">{p.completed}/{p.total} mastered</span>
                      </div>
                      <h3 className="mt-1 text-lg font-semibold">{layer.title}</h3>
                      <p className="mt-1 text-sm text-ink-dim">{layer.blurb}</p>
                      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
                        <div className={`h-full bg-gradient-to-r ${layer.color}`} style={{ width: `${p.pct * 100}%` }} />
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-ink-dim" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="card-pad">
        <div className="flex items-start gap-4">
          <BookOpen className="mt-1 h-5 w-5 text-accent-cyan" />
          <div>
            <h3 className="text-lg font-semibold">How to use this site</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-dim">
              <li>• Each layer has reading + interactive demos. Tap, type, and drag to explore.</li>
              <li>• Mark topics as <em>Mastered</em> — progress saves in your browser.</li>
              <li>• End each layer with a quiz. Aim for 80%+ before moving up.</li>
              <li>• Layers build on each other; resist the urge to skip ahead.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
