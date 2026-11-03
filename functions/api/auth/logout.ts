import { cookie, SESSION_COOKIE } from '../../_lib/session'

export const onRequestPost: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { 'set-cookie': cookie(SESSION_COOKIE, '', 0) } })
