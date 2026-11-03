import { json, type Env } from '../../_lib/env'
import { cookie, readCookie, sessionCookie, signSession, STATE_COOKIE } from '../../_lib/session'

interface GoogleUser {
  sub: string
  email: string
  name?: string
  picture?: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET } = env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SESSION_SECRET) {
    return json({ error: 'oauth_not_configured' }, { status: 500 })
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state || state !== readCookie(request, STATE_COOKIE)) {
    return json({ error: 'invalid_state' }, { status: 400 })
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) return json({ error: 'token_exchange_failed' }, { status: 502 })
  const { access_token } = (await tokenRes.json()) as { access_token: string }

  const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${access_token}` },
  })
  if (!userRes.ok) return json({ error: 'userinfo_failed' }, { status: 502 })
  const g = (await userRes.json()) as GoogleUser

  const token = await signSession(
    { sub: g.sub, email: g.email, name: g.name ?? g.email, picture: g.picture },
    SESSION_SECRET,
  )
  const headers = new Headers({ location: '/' })
  headers.append('set-cookie', sessionCookie(token))
  headers.append('set-cookie', cookie(STATE_COOKIE, '', 0))
  return new Response(null, { status: 302, headers })
}
