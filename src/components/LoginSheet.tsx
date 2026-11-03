import { motion } from 'framer-motion'
import { LOGIN_URL } from '../lib/api'
import { GoogleLogo } from './Icons'
import { Sheet } from './Sheet'

interface Props {
  open: boolean
  onClose: () => void
  onBeforeRedirect: () => void
}

export function LoginSheet({ open, onClose, onBeforeRedirect }: Props) {
  return (
    <Sheet open={open} onClose={onClose} testId="login-sheet">
      <motion.a
        href={LOGIN_URL}
        data-testid="google-login"
        onClick={onBeforeRedirect}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white text-[15px] font-semibold text-slate-800 shadow-sm"
      >
        <GoogleLogo />
        Googleで続ける
      </motion.a>
    </Sheet>
  )
}
