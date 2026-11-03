import { motion } from 'framer-motion'

export const Bone = ({ className = '' }: { className?: string }) => <div className={`skeleton ${className}`} />

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.15 } } }

export function CorrectionSkeleton() {
  return (
    <motion.div {...fade} data-testid="correction-skeleton" aria-busy="true" aria-label="loading" className="space-y-3">
      <div className="glass p-5">
        <div className="flex items-center gap-4">
          <Bone className="h-14 w-14 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-11/12" />
            <Bone className="h-4 w-8/12" />
          </div>
        </div>
        <Bone className="mt-4 h-3 w-full" />
        <Bone className="mt-2 h-3 w-10/12" />
      </div>
      <div className="glass space-y-3 p-5">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex gap-2">
              <Bone className="h-5 w-20 rounded-lg" />
              <Bone className="h-5 w-24 rounded-lg" />
            </div>
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-7/12" />
          </div>
        ))}
      </div>
      <div className="glass p-5">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-8 flex-1 rounded-full" />
          ))}
        </div>
        <Bone className="mt-4 h-4 w-full" />
        <Bone className="mt-2 h-4 w-9/12" />
      </div>
    </motion.div>
  )
}

export function DeckSkeleton() {
  return (
    <motion.div {...fade} data-testid="deck-skeleton" aria-busy="true" className="relative mx-auto h-[380px] w-full">
      {[2, 1, 0].map((i) => (
        <div
          key={i}
          className="glass absolute inset-x-0 top-0 h-[340px] p-6"
          style={{ transform: `translateY(${i * 14}px) scale(${1 - i * 0.05})`, opacity: 1 - i * 0.25 }}
        >
          {i === 0 && (
            <>
              <Bone className="h-6 w-20 rounded-full" />
              <Bone className="mt-8 h-7 w-11/12" />
              <Bone className="mt-3 h-7 w-8/12" />
              <Bone className="mt-8 h-4 w-5/12" />
              <div className="absolute inset-x-6 bottom-6 flex gap-3">
                <Bone className="h-11 flex-1 rounded-2xl" />
              </div>
            </>
          )}
        </div>
      ))}
    </motion.div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <motion.div {...fade} data-testid="list-skeleton" aria-busy="true" className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="glass flex items-center gap-3 p-4">
          <Bone className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-9/12" />
            <Bone className="h-3 w-4/12" />
          </div>
        </div>
      ))}
    </motion.div>
  )
}

export function ChipSkeleton() {
  return <Bone className="h-10 w-full rounded-2xl" />
}

export function AvatarSkeleton() {
  return <Bone className="h-10 w-10 rounded-full" />
}
