import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, Trophy, RotateCcw } from 'lucide-react';
import { cn } from '../lib/cn';

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number;
  explain?: string;
};

export function Quiz({ id, questions, title }: { id: string; questions: QuizQuestion[]; title?: string }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
  };

  const reset = () => {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="card-pad text-center">
        <Trophy className="mx-auto h-10 w-10 text-amber-300" />
        <h3 className="mt-3 text-2xl font-semibold">{score} / {questions.length}</h3>
        <p className="mt-1 text-ink-dim">{pct >= 80 ? 'Excellent — you know this layer cold.' : pct >= 50 ? 'Solid. Review the missed topics.' : 'Worth another pass through the section.'}</p>
        <button onClick={reset} className="btn-ghost mt-4">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="card-pad" data-quiz-id={id}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-ink-faint">{title ?? 'Knowledge check'}</div>
        <div className="text-xs text-ink-dim">
          {idx + 1} / {questions.length}
        </div>
      </div>
      <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-accent-cyan"
          initial={{ width: 0 }}
          animate={{ width: `${((idx + (picked !== null ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>
      <h4 className="mt-4 text-base font-medium sm:text-lg">{q.q}</h4>
      <div className="mt-4 space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.answer;
          const isPicked = picked === i;
          const showFeedback = picked !== null;
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => choose(i)}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all',
                !showFeedback && 'border-white/10 bg-white/5 hover:bg-white/10',
                showFeedback && isCorrect && 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
                showFeedback && !isCorrect && isPicked && 'border-rose-400/40 bg-rose-400/10 text-rose-200',
                showFeedback && !isCorrect && !isPicked && 'border-white/5 bg-white/[0.02] text-ink-dim',
              )}
            >
              <span>{opt}</span>
              {showFeedback && isCorrect && <Check className="h-4 w-4" />}
              {showFeedback && isPicked && !isCorrect && <X className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {picked !== null && q.explain && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-ink-dim"
          >
            <span className="font-medium text-ink">Why: </span>
            {q.explain}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-4 flex justify-end">
        <button disabled={picked === null} onClick={next} className="btn-primary">
          {isLast ? 'See result' : 'Next'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
