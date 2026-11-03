import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  testId?: string
}

export function Sheet({ open, onClose, children, testId }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            data-testid={testId}
            className="glass-strong fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-[32px] p-6 pb-safe"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => (i.offset.y > 80 || i.velocity.y > 500) && onClose()}
          >
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-300/80" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
