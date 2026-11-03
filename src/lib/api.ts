import type { Correction, StudyTask, User } from '../../shared/types'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...init })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'request_failed')
  return data as T
}

export async function fetchMe(): Promise<User | null> {
  try {
    return (await request<{ user: User }>('/api/auth/me')).user
  } catch {
    return null
  }
}

export const logout = () => fetch('/api/auth/logout', { method: 'POST' })

export const fetchTasks = () => request<{ day: string; tasks: StudyTask[] }>('/api/tasks')

export const correct = (text: string, context?: string, signal?: AbortSignal) =>
  request<Correction>('/api/correct', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, context }),
    signal,
  })

export const LOGIN_URL = '/api/auth/login'
