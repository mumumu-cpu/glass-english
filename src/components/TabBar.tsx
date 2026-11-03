import { motion } from 'framer-motion'
import { CardsIcon, ListIcon, PenIcon } from './Icons'

export type Tab = 'write' | 'cards' | 'log'

const TABS: { id: Tab; label: string; Icon: typeof PenIcon }[] = [
  { id: 'write', label: '添削', Icon: PenIcon },
  { id: 'cards', label: 'カード', Icon: CardsIcon },
  { id: 'log', label: '記録', Icon: ListIcon },
]

export function TabBar({ tab, onTab, badge }: { tab: Tab; onTab: (t: Tab) => void; badge: number }) {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-safe">
      <div role="tablist" className="glass-strong pointer-events-auto flex w-full max-w-sm gap-1 rounded-full p-1.5">
        {TABS.map(({ id, label, Icon }) => {
          const active = id === tab
          return (
            <motion.button
              key={id}
              role="tab"
              aria-selected={active}
              data-testid={`tab-${id}`}
              onClick={() => onTab(id)}
              whileTap={{ scale: 0.92 }}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition-colors ${active ? 'text-slate-900' : 'text-slate-400'}`}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full border border-white bg-white/90 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.18)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon width={18} height={18} className="relative" />
              <span className="relative">{label}</span>
              {id === 'cards' && badge > 0 && (
                <motion.span
                  key={badge}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  className="relative grid h-4 min-w-4 place-items-center rounded-full bg-sky-500 px-1 text-[10px] text-white"
                >
                  {badge}
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
