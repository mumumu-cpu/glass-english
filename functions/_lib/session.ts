import type { Env } from './env'

export interface SessionUser {
  sub: string
  email: string
  name: string
  picture?: string
  exp: number
}

export const SESSION_COOKIE = 'ge_session'
export const STATE_COOKIE = 'ge_oauth_state'
const MAX_AGE = 60 * 60 * 24 * 30

const enc = new TextEncoder()

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

export async function signSession(user: Omit<SessionUser, 'exp'>, secret: string) {
  const payload: SessionUser = { ...user, exp: Math.floor(Date.now() / 1000) + MAX_AGE }
  const body = b64url(enc.encode(JSON.stringify(payload)))
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body))
  return `${body}.${b64url(sig)}`
}

export async function verifySession(token: string, secret: string): Promise<SessionUser | null> {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64url(sig), enc.encode(body))
    if (!ok) return null
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionUser
    return payload.exp > Date.now() / 1000 ? payload : null
  } catch {
    return null
  }
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

export function cookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

export const sessionCookie = (token: string) => cookie(SESSION_COOKIE, token, MAX_AGE)

export async function getUser(request: Request, env: Env) {
  const token = readCookie(request, SESSION_COOKIE)
  if (!token || !env.SESSION_SECRET) return null
  return verifySession(token, env.SESSION_SECRET)
}

export function randomToken(bytes = 24) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)))
}
