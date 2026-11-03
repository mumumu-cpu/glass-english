import { AnimatePresence, motion, useIsPresent, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { useRef } from 'react'
import type { TaskStatus, TaskWithStatus } from '../lib/useTasks'
import { CheckIcon, PenIcon, RepeatIcon, SkipIcon } from './Icons'
import { DeckSkeleton } from './Skeleton'

type Dir = Exclude<TaskStatus, 'pending'>

const KIND_LABEL = { translate: '英訳', use: '使う', rewrite: '直す' } as const
const THRESHOLD = 90
const VELOCITY = 550

const exitFor = (dir: Dir) => ({
  x: dir === 'done' ? 480 : dir === 'skip' ? -480 : 0,
  y: dir === 'review' ? -640 : 40,
  rotate: dir === 'done' ? 18 : dir === 'skip' ? -18 : 0,
  opacity: 0,
  transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
})

function haptic() {
  navigator.vibrate?.(12)
}

interface CardProps {
  task: TaskWithStatus
  depth: number
  onSwipe: (dir: Dir) => void
  onWrite: () => void
}

function SwipeCard({ task, depth, onSwipe, onWrite }: CardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-14, 14])
  const doneO = useTransform(x, [24, THRESHOLD], [0, 1])
  const skipO = useTransform(x, [-THRESHOLD, -24], [1, 0])
  const reviewO = useTransform(y, [-THRESHOLD, -24], [1, 0])
  const present = useIsPresent()
  const isTop = depth === 0 && present
  const showContent = depth === 0

  const onDragEnd = (_: unknown, { offset, velocity }: PanInfo) => {
    const horizontal = Math.abs(offset.x) >= Math.abs(offset.y)
    if (horizontal && (offset.x > THRESHOLD || velocity.x > VELOCITY)) onSwipe('done')
    else if (horizontal && (offset.x < -THRESHOLD || velocity.x < -VELOCITY)) onSwipe('skip')
    else if (!horizontal && (offset.y < -THRESHOLD || velocity.y < -VELOCITY)) onSwipe('review')
  }

  return (
    <motion.article
      data-testid={!present ? 'exiting-card' : isTop ? 'swipe-card' : 'stack-card'}
      data-task-id={task.id}
      className="glass-strong absolute inset-x-0 top-0 flex h-[340px] touch-none select-none flex-col p-6"
      style={{ x, y, rotate, zIndex: present ? 10 - depth : 0, pointerEvents: present ? 'auto' : 'none' }}
      initial={{ scale: 0.9, y: 40, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 14, opacity: 1 - depth * 0.25 }}
      exit="exit"
      variants={{ exit: (dir: Dir) => exitFor(dir) }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      dragSnapToOrigin
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
    >
      {isTop && (
        <>
          <motion.span style={{ opacity: doneO }} className="absolute right-5 top-5 flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white">
            <CheckIcon width={14} height={14} />完了
          </motion.span>
          <motion.span style={{ opacity: skipO }} className="absolute left-5 top-5 flex items-center gap-1 rounded-full bg-slate-500/90 px-3 py-1 text-xs font-semibold text-white">
            <SkipIcon width={14} height={14} />スキップ
          </motion.span>
          <motion.span style={{ opacity: reviewO }} className="absolute inset-x-0 top-5 mx-auto flex w-max items-center gap-1 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white">
            <RepeatIcon width={14} height={14} />復習
          </motion.span>
        </>
      )}
      {showContent && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col">
      <span className="w-max rounded-full bg-sky-100/80 px-3 py-1 text-xs font-semibold text-sky-700">{KIND_LABEL[task.kind]}</span>
      <p className="mt-6 text-2xl font-semibold leading-snug tracking-tight">{task.prompt}</p>
      <p className="mt-4 text-sm text-slate-500">{task.hint}</p>
      {isTop && (
      <motion.button
        whileTap={{ scale: 0.96 }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onWrite}
        data-testid="card-write"
        className="mt-auto flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-medium text-white"
      >
        <PenIcon width={18} height={18} />
        書く
      </motion.button>
      )}
        </motion.div>
      )}
    </motion.article>
  )
}

interface DeckProps {
  tasks: TaskWithStatus[] | null
  loading: boolean
  onStatus: (id: string, status: TaskStatus) => void
  onWrite: (task: TaskWithStatus) => void
  onRequeue: (from: TaskStatus) => void
}

export function CardDeck({ tasks, loading, onStatus, onWrite, onRequeue }: DeckProps) {
  const lastDir = useRef<Dir>('done')
  const pending = tasks?.filter((t) => t.status === 'pending') ?? []
  const counts = { done: 0, review: 0, skip: 0 }
  tasks?.forEach((t) => t.status !== 'pending' && counts[t.status]++)

  const swipe = (task: TaskWithStatus, dir: Dir) => {
    lastDir.current = dir
    haptic()
    onStatus(task.id, dir)
  }
  const top = pending[0]

  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-2 text-xs font-medium">
        {(
          [
            ['done', CheckIcon, 'text-emerald-600'],
            ['review', RepeatIcon, 'text-amber-600'],
            ['skip', SkipIcon, 'text-slate-500'],
          ] as const
        ).map(([k, Icon, color]) => (
          <span key={k} className={`glass-pill flex items-center gap-1.5 px-3 py-1.5 ${color}`}>
            <Icon width={14} height={14} />
            <motion.span key={counts[k]} data-testid={`count-${k}`} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular-nums">
              {counts[k]}
            </motion.span>
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <DeckSkeleton key="sk" />
        ) : (
          <motion.div key="deck" data-testid="deck" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-[380px]">
            <AnimatePresence custom={lastDir.current}>
              {pending
                .slice(0, 3)
                .map((t, i) => (
                  <SwipeCard key={t.id} task={t} depth={i} onSwipe={(d) => swipe(t, d)} onWrite={() => onWrite(t)} />
                ))
                .reverse()}
            </AnimatePresence>
            <AnimatePresence>
              {pending.length === 0 && (
                <motion.div
                  data-testid="deck-empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1, transition: { delay: 0.25 } }}
                  exit={{ opacity: 0 }}
                  className="glass absolute inset-x-0 top-0 grid h-[340px] place-items-center"
                >
                  <div className="flex flex-col items-center gap-4">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.35 }}
                      className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    >
                      <CheckIcon width={30} height={30} />
                    </motion.span>
                    {counts.review > 0 && (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => onRequeue('review')} className="glass-pill flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700">
                        <RepeatIcon width={16} height={16} />
                        {counts.review}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-5">
        {(
          [
            ['skip', SkipIcon, 'text-slate-500', 'h-14 w-14'],
            ['review', RepeatIcon, 'text-amber-500', 'h-12 w-12'],
            ['done', CheckIcon, 'text-emerald-500', 'h-14 w-14'],
          ] as const
        ).map(([dir, Icon, color, size]) => (
          <motion.button
            key={dir}
            data-testid={`btn-${dir}`}
            aria-label={dir}
            disabled={!top}
            whileTap={{ scale: 0.82 }}
            whileHover={{ y: -2 }}
            onClick={() => top && swipe(top, dir)}
            className={`glass-strong grid place-items-center rounded-full disabled:opacity-40 ${size} ${color}`}
          >
            <Icon />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
