import { test as base, expect, type Page, type BrowserContext } from '@playwright/test'
import { createHmac } from 'node:crypto'
import type { Correction } from '../shared/types'
import { SESSION_SECRET } from './constants'

export const USER = { sub: '1234567890', email: 'learner@example.com', name: 'Test Learner' }

const b64url = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** Mint a session cookie exactly as functions/_lib/session.ts does, so the real /api/auth/me accepts it. */
export function sessionToken(user = USER) {
  const body = b64url(Buffer.from(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + 3600 })))
  const sig = b64url(createHmac('sha256', SESSION_SECRET).update(body).digest())
  return `${body}.${sig}`
}

export async function signIn(context: BrowserContext, baseURL: string) {
  await context.addCookies([{ name: 'ge_session', value: sessionToken(), url: baseURL, httpOnly: true, sameSite: 'Lax' }])
}

export const SAMPLE: Correction = {
  corrected: 'I have lived in Tokyo for three years.',
  score: 62,
  summary: '現在完了形で継続を表しましょう。',
  changes: [
    { original: 'am living', corrected: 'have lived', explanation: '「〜年間住んでいる」は現在完了形で継続を表します。' },
    { original: 'since three years', corrected: 'for three years', explanation: '期間には for、起点には since を使います。' },
  ],
  alternatives: [
    { tone: 'formal', text: 'I have resided in Tokyo for three years.', note: 'ビジネス・書類向け' },
    { tone: 'casual', text: "I've been in Tokyo for three years now.", note: '友人との会話向け' },
    { tone: 'natural', text: "I've lived in Tokyo for three years.", note: '最も一般的' },
    { tone: 'concise', text: 'Three years in Tokyo.', note: '短いメモ向け' },
  ],
}

/** Stub Workers AI at the network edge of the browser; `delay` keeps the skeleton on screen long enough to assert. */
export async function mockCorrect(page: Page, { delay = 800, body = SAMPLE, status = 200 } = {}) {
  const calls: unknown[] = []
  await page.route('**/api/correct', async (route) => {
    calls.push(route.request().postDataJSON())
    await new Promise((r) => setTimeout(r, delay))
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  })
  return calls
}

export async function swipe(page: Page, dx: number, dy: number) {
  const card = page.getByTestId('swipe-card')
  const box = (await card.boundingBox())!
  const sx = box.x + box.width / 2
  const sy = box.y + box.height / 3
  await page.mouse.move(sx, sy)
  await page.mouse.down()
  const steps = 12
  for (let i = 1; i <= steps; i++) await page.mouse.move(sx + (dx * i) / steps, sy + (dy * i) / steps)
  await page.mouse.up()
}

export const test = base
export { expect }
