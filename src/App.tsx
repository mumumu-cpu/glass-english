import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Correction, StudyTask, User } from '../shared/types'
import { AccountSheet } from './components/AccountSheet'
import { CardDeck } from './components/CardDeck'
import { Composer } from './components/Composer'
import { CorrectionView } from './components/CorrectionView'
import { RepeatIcon, UserIcon } from './components/Icons'
import { LoginSheet } from './components/LoginSheet'
import { AvatarSkeleton, CorrectionSkeleton } from './components/Skeleton'
import { StatusList } from './components/StatusList'
import { TabBar, type Tab } from './components/TabBar'
import { ApiError, correct, fetchMe, logout } from './lib/api'
import { load, save } from './lib/storage'
import { useTasks } from './lib/useTasks'

const ORDER: Tab[] = ['write', 'cards', 'log']
const DRAFT_KEY = 'ge_draft'
const PENDING_KEY = 'ge_pending_submit'

const page = {
  enter: (d: number) => ({ x: d * 48, opacity: 0, filter: 'blur(4px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: (d: number) => ({ x: d * -32, opacity: 0, filter: 'blur(4px)', transition: { duration: 0.14, ease: 'easeIn' } }),
}

function Progress({ done, total }: { done: number; total: number }) {
  const r = 16
  const c = 2 * Math.PI * r
  return (
    <div className="glass-pill flex items-center gap-2 py-1 pl-1 pr-3" data-testid="progress">
      <svg viewBox="0 0 40 40" className="h-8 w-8 -rotate-90">
        <circle cx="20" cy="20" r={r} stroke="rgba(148,163,184,0.25)" strokeWidth="4" fill="none" />
        <motion.circle
          cx="20"
          cy="20"
          r={r}
          stroke="#0ea5e9"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - (total ? done / total : 0)) }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </svg>
      <span className="text-sm font-semibold tabular-nums">
        {done}
        <span className="text-slate-400">/{total}</span>
      </span>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [tab, setTab] = useState<Tab>('write')
  const [dir, setDir] = useState(1)
  const [text, setText] = useState(() => load(DRAFT_KEY, ''))
  const [context, setContext] = useState<StudyTask | null>(null)
  const [result, setResult] = useState<Correction | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const { tasks, loading: tasksLoading, setStatus, requeue } = useTasks()

  useEffect(() => {
    fetchMe().then(setUser)
  }, [])
  useEffect(() => save(DRAFT_KEY, text || null), [text])

  const go = (t: Tab) => {
    setDir(ORDER.indexOf(t) >= ORDER.indexOf(tab) ? 1 : -1)
    setTab(t)
  }

  const submit = useCallback(async () => {
    const value = text.trim()
    if (!value) return
    if (user === null) {
      setLoginOpen(true)
      return
    }
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    setBusy(true)
    setError(false)
    setResult(null)
    try {
      const prompt = context ? `${context.kind}: ${context.prompt}` : undefined
      setResult(await correct(value, prompt, ctrl.signal))
    } catch (e) {
      if (ctrl.signal.aborted) return
      if (e instanceof ApiError && e.status === 401) {
        setUser(null)
        setLoginOpen(true)
      } else setError(true)
    } finally {
      if (abort.current === ctrl) setBusy(false)
    }
  }, [text, user, context])

  // Resume a submit that was interrupted by the Google sign-in redirect.
  useEffect(() => {
    if (user && load(PENDING_KEY, false, sessionStorage)) {
      save(PENDING_KEY, null, sessionStorage)
      submit()
    }
  }, [user, submit])

  const nextTask = tasks?.find((t) => t.status === 'pending') ?? null
  const doneCount = tasks?.filter((t) => t.status === 'done').length ?? 0

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <div className="ambient" aria-hidden />
      <header className="pt-safe sticky top-0 z-20 flex items-center justify-between px-4 pb-3">
        {tasksLoading ? <div className="skeleton h-10 w-24 rounded-full" /> : <Progress done={doneCount} total={tasks?.length ?? 0} />}
        <AnimatePresence mode="wait" initial={false}>
          {user === undefined ? (
            <motion.div key="sk" exit={{ opacity: 0 }}>
              <AvatarSkeleton />
            </motion.div>
          ) : user ? (
            <motion.button
              key="avatar"
              data-testid="avatar"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setAccountOpen(true)}
              className="glass-pill grid h-10 w-10 place-items-center overflow-hidden"
            >
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-sm font-semibold">{user.name.slice(0, 1)}</span>
              )}
            </motion.button>
          ) : (
            <motion.button
              key="login"
              data-testid="login-btn"
              aria-label="login"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setLoginOpen(true)}
              className="glass-pill grid h-10 w-10 place-items-center text-slate-600"
            >
              <UserIcon width={20} height={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </header>

      <main className="relative flex-1 overflow-x-hidden px-4 pb-32">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={tab}
            custom={dir}
            variants={page}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 420, damping: 38, restDelta: 0.5, opacity: { duration: 0.18 } }}
          >
            {tab === 'write' && (
              <div className="space-y-4">
                <Composer
                  text={text}
                  onText={setText}
                  onSubmit={submit}
                  busy={busy}
                  task={nextTask}
                  taskLoading={tasksLoading}
                  context={context}
                  onContext={setContext}
                />
                <AnimatePresence mode="wait">
                  {busy ? (
                    <CorrectionSkeleton key="sk" />
                  ) : error ? (
                    <motion.button
                      key="err"
                      data-testid="correction-error"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0, x: [0, -6, 6, -3, 3, 0] }}
                      exit={{ opacity: 0 }}
                      onClick={submit}
                      className="glass flex w-full items-center justify-center gap-2 p-4 text-sm font-medium text-rose-500"
                    >
                      <RepeatIcon width={16} height={16} />
                      再試行
                    </motion.button>
                  ) : result ? (
                    <CorrectionView key={result.corrected + result.score} result={result} />
                  ) : null}
                </AnimatePresence>
              </div>
            )}
            {tab === 'cards' && (
              <CardDeck
                tasks={tasks}
                loading={tasksLoading}
                onStatus={setStatus}
                onRequeue={requeue}
                onWrite={(t) => {
                  setContext(t)
                  setResult(null)
                  go('write')
                }}
              />
            )}
            {tab === 'log' && <StatusList tasks={tasks} loading={tasksLoading} onStatus={setStatus} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <TabBar tab={tab} onTab={go} badge={tasks?.filter((t) => t.status === 'pending').length ?? 0} />

      <LoginSheet
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onBeforeRedirect={() => text.trim() && save(PENDING_KEY, true, sessionStorage)}
      />
      <AccountSheet
        user={user ?? null}
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onLogout={async () => {
          await logout()
          setAccountOpen(false)
          setUser(null)
        }}
      />
    </div>
  )
}
