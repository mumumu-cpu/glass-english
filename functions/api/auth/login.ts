import { json, type Env } from '../../_lib/env'
import { cookie, randomToken, STATE_COOKIE } from '../../_lib/session'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.GOOGLE_CLIENT_ID) return json({ error: 'oauth_not_configured' }, { status: 500 })

  const url = new URL(request.url)
  const state = randomToken()
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  auth.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  }).toString()

  return new Response(null, {
    status: 302,
    headers: { location: auth.toString(), 'set-cookie': cookie(STATE_COOKIE, state, 600) },
  })
}
