import type { StudyTask } from '../../shared/types'
import { json } from '../_lib/env'

const POOL: Omit<StudyTask, 'id'>[] = [
  { kind: 'translate', prompt: '会議を明日に延期してもいいですか？', hint: 'postpone / push back' },
  { kind: 'use', prompt: 'take ~ for granted', hint: '当たり前だと思う' },
  { kind: 'rewrite', prompt: 'I very like this movie.', hint: '副詞の位置' },
  { kind: 'translate', prompt: '思っていたより時間がかかった。', hint: 'than I expected' },
  { kind: 'use', prompt: 'look forward to', hint: '後ろは動名詞' },
  { kind: 'rewrite', prompt: 'He said me that he is busy.', hint: 'say / tell' },
  { kind: 'translate', prompt: '週末に何をするか、まだ決めていません。', hint: "haven't decided" },
  { kind: 'use', prompt: 'end up ~ing', hint: '結局〜することになる' },
  { kind: 'rewrite', prompt: 'Can you borrow me your pen?', hint: 'borrow / lend' },
  { kind: 'translate', prompt: 'もっと早く知っていればよかった。', hint: 'I wish I had ...' },
  { kind: 'use', prompt: 'as long as', hint: '〜する限り' },
  { kind: 'rewrite', prompt: 'I am interesting in science.', hint: '-ing / -ed' },
  { kind: 'translate', prompt: '駅までどのくらいかかりますか？', hint: 'How long does it take' },
  { kind: 'use', prompt: 'get used to', hint: '慣れる' },
  { kind: 'rewrite', prompt: 'Informations are important.', hint: '不可算名詞' },
]

const PER_DAY = 6

export function tasksFor(day: string): StudyTask[] {
  let seed = [...day].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  const idx = POOL.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0
    const j = seed % (i + 1)
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx.slice(0, PER_DAY).map((i, n) => ({ id: `${day}-${n}`, ...POOL[i] }))
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const param = new URL(request.url).searchParams.get('day')
  const day = param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : new Date().toISOString().slice(0, 10)
  return json({ day, tasks: tasksFor(day) })
}
