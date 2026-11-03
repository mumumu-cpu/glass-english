import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { StudyTask } from '../../shared/types'
import { ArrowUpIcon, SkipIcon } from './Icons'
import { ChipSkeleton } from './Skeleton'

const KIND_LABEL: Record<StudyTask['kind'], string> = { translate: '英訳', use: '使う', rewrite: '直す' }

interface Props {
  text: string
  onText: (t: string) => void
  onSubmit: () => void
  busy: boolean
  task: StudyTask | null
  taskLoading: boolean
  context: StudyTask | null
  onContext: (t: StudyTask | null) => void
}

export const MAX_LEN = 1200

export function Composer({ text, onText, onSubmit, busy, task, taskLoading, context, onContext }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [context])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 260)}px`
  }, [text])

  const canSend = text.trim().length > 0 && !busy

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout" initial={false}>
        {taskLoading ? (
          <motion.div key="sk" exit={{ opacity: 0 }}>
            <ChipSkeleton />
          </motion.div>
        ) : context ? (
          <motion.div
            key={`ctx-${context.id}`}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            data-testid="task-context"
            className="glass flex items-center gap-3 rounded-2xl px-4 py-2.5"
          >
            <span className="rounded-full bg-sky-100/80 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
              {KIND_LABEL[context.kind]}
            </span>
            <span className="flex-1 truncate text-sm font-medium">{context.prompt}</span>
            <span className="text-xs text-slate-400">{context.hint}</span>
            <button aria-label="clear task" onClick={() => onContext(null)} className="text-slate-400">
              <SkipIcon width={16} height={16} />
            </button>
          </motion.div>
        ) : task ? (
          <motion.button
            key={`task-${task.id}`}
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onContext(task)}
            data-testid="today-task"
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-slate-300/80 bg-white/30 px-4 py-2.5 text-left backdrop-blur"
          >
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              {KIND_LABEL[task.kind]}
            </span>
            <span className="flex-1 truncate text-sm text-slate-600">{task.prompt}</span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <motion.form
        layout
        onSubmit={(e) => {
          e.preventDefault()
          if (canSend) onSubmit()
        }}
        className="glass-strong flex items-end gap-2 p-2 pl-4"
      >
        <textarea
          ref={ref}
          data-testid="composer-input"
          aria-label="English text"
          value={text}
          maxLength={MAX_LEN}
          rows={3}
          autoFocus
          autoCapitalize="sentences"
          spellCheck={false}
          placeholder="English…"
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              if (canSend) onSubmit()
            }
          }}
          className="min-h-[84px] flex-1 resize-none bg-transparent py-2 text-[17px] leading-relaxed outline-none placeholder:text-slate-400"
        />
        <motion.button
          type="submit"
          data-testid="submit-btn"
          aria-label="correct"
          disabled={!canSend}
          whileTap={{ scale: 0.85 }}
          animate={{ scale: canSend ? 1 : 0.92, opacity: canSend ? 1 : 0.4 }}
          className="mb-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20"
        >
          {busy ? (
            <motion.span
              className="block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
          ) : (
            <ArrowUpIcon width={20} height={20} />
          )}
        </motion.button>
      </motion.form>
    </div>
  )
}
