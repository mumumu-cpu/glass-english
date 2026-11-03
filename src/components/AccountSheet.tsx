import type { User } from '../../shared/types'
import { Sheet } from './Sheet'

interface Props {
  user: User | null
  open: boolean
  onClose: () => void
  onLogout: () => void
}

export function AccountSheet({ user, open, onClose, onLogout }: Props) {
  return (
    <Sheet open={open && !!user} onClose={onClose} testId="account-sheet">
      {user && (
        <div className="flex flex-col items-center gap-4">
          {user.picture && <img src={user.picture} alt="" className="h-16 w-16 rounded-full" referrerPolicy="no-referrer" />}
          <div className="text-center">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <button onClick={onLogout} data-testid="logout" className="h-12 w-full rounded-2xl bg-slate-100 text-sm font-medium text-rose-500">
            ログアウト
          </button>
        </div>
      )}
    </Sheet>
  )
}
