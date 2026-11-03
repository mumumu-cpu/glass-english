import { json, type Env } from '../../_lib/env'
import { getUser } from '../../_lib/session'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUser(request, env)
  if (!user) return json({ user: null }, { status: 401 })
  const { sub, email, name, picture } = user
  return json({ user: { sub, email, name, picture } })
}
