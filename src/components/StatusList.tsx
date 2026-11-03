import { AnimatePresence, motion } from 'framer-motion'
import type { TaskStatus, TaskWithStatus } from '../lib/useTasks'
import { CheckIcon, RepeatIcon, SkipIcon } from './Icons'
import { ListSkeleton } from './Skeleton'

const META = {
  done: { Icon: CheckIcon, cls: 'bg-emerald-100 text-emerald-600' },
  review: { Icon: RepeatIcon, cls: 'bg-amber-100 text-amber-600' },
  skip: { Icon: SkipIcon, cls: 'bg-slate-100 text-slate-500' },
  pending: { Icon: () => <span className="h-2 w-2 rounded-full bg-sky-400" />, cls: 'bg-sky-50' },
} as const

const NEXT: Record<TaskStatus, TaskStatus> = { pending: 'done', done: 'review', review: 'skip', skip: 'pending' }

interface Props {
  tasks: TaskWithStatus[] | null
  loading: boolean
  onStatus: (id: string, s: TaskStatus) => void
}

export function StatusList({ tasks, loading, onStatus }: Props) {
  if (loading || !tasks) return <ListSkeleton rows={6} />
  return (
    <motion.ul data-testid="status-list" className="space-y-2" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
      <AnimatePresence initial={false}>
        {tasks.map((t) => {
          const { Icon, cls } = META[t.status]
          return (
            <motion.li
              key={t.id}
              layout
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              className="glass flex items-center gap-3 rounded-2xl p-3.5"
            >
              <motion.button
                whileTap={{ scale: 0.8 }}
                aria-label={`status ${t.status}`}
                data-status={t.status}
                onClick={() => onStatus(t.id, NEXT[t.status])}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${cls}`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={t.status} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                    <Icon width={16} height={16} />
                  </motion.span>
                </AnimatePresence>
              </motion.button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.prompt}</p>
                <p className="truncate text-xs text-slate-400">{t.hint}</p>
              </div>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </motion.ul>
  )
}
