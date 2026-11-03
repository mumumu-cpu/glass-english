import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { Correction, Tone } from '../../shared/types'
import { CheckIcon, CopyIcon } from './Icons'

const TONE_LABEL: Record<Tone, string> = {
  formal: 'Formal',
  casual: 'Casual',
  natural: 'Natural',
  concise: 'Concise',
}

const item = {
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 260, damping: 26 } },
}

function ScoreRing({ score }: { score: number }) {
  const r = 24
  const c = 2 * Math.PI * r
  const color = score >= 85 ? '#10b981' : score >= 60 ? '#0ea5e9' : '#f59e0b'
  return (
    <div className="relative h-14 w-14 shrink-0" data-testid="score">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} stroke="rgba(148,163,184,0.25)" strokeWidth="5" fill="none" />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums">{score}</span>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      aria-label="copy"
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {})
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      className="glass-pill grid h-9 w-9 shrink-0 place-items-center text-slate-500"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'y' : 'n'}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
        >
          {copied ? <CheckIcon width={16} height={16} className="text-emerald-500" /> : <CopyIcon width={16} height={16} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

export function CorrectionView({ result }: { result: Correction }) {
  const [tone, setTone] = useState<Tone>(result.alternatives[0]?.tone ?? 'natural')
  const active = result.alternatives.find((a) => a.tone === tone) ?? result.alternatives[0]

  return (
    <motion.div
      data-testid="correction-result"
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-3"
    >
      <motion.section variants={item} className="glass-strong p-5">
        <div className="flex items-start gap-4">
          <ScoreRing score={result.score} />
          <p data-testid="corrected-text" className="flex-1 pt-1 text-[17px] font-medium leading-relaxed">
            {result.corrected}
          </p>
          <CopyButton text={result.corrected} />
        </div>
        {result.summary && <p className="mt-3 text-sm leading-relaxed text-slate-600">{result.summary}</p>}
      </motion.section>

      {result.changes.length > 0 && (
        <motion.section variants={item} className="glass divide-y divide-slate-200/60" data-testid="changes">
          {result.changes.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="p-4"
            >
              <div className="flex flex-wrap items-center gap-1.5 text-sm">
                {c.original && (
                  <span className="rounded-lg bg-rose-50/80 px-2 py-0.5 text-rose-500 line-through decoration-rose-300">
                    {c.original}
                  </span>
                )}
                <span className="text-slate-300">→</span>
                <span className="rounded-lg bg-emerald-50/80 px-2 py-0.5 font-medium text-emerald-600">{c.corrected}</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{c.explanation}</p>
            </motion.div>
          ))}
        </motion.section>
      )}

      {active && (
        <motion.section variants={item} className="glass p-4" data-testid="alternatives">
          <div role="tablist" className="relative flex gap-1 rounded-full bg-slate-100/70 p-1">
            {result.alternatives.map((a) => (
              <button
                key={a.tone}
                role="tab"
                aria-selected={a.tone === tone}
                data-testid={`alt-tab-${a.tone}`}
                onClick={() => setTone(a.tone)}
                className="relative flex-1 rounded-full py-1.5 text-xs font-medium text-slate-500 aria-selected:text-slate-900"
              >
                {a.tone === tone && (
                  <motion.span
                    layoutId="tone-pill"
                    className="absolute inset-0 rounded-full bg-white shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{TONE_LABEL[a.tone]}</span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active.tone}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex items-start gap-3 px-1 pt-4"
            >
              <div className="flex-1">
                <p data-testid="alt-text" className="text-[15px] leading-relaxed">
                  {active.text}
                </p>
                {active.note && <p className="mt-1.5 text-xs text-slate-500">{active.note}</p>}
              </div>
              <CopyButton text={active.text} />
            </motion.div>
          </AnimatePresence>
        </motion.section>
      )}
    </motion.div>
  )
}
