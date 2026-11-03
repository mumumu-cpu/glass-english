import { useCallback, useEffect, useMemo, useState } from 'react'
import type { StudyTask } from '../../shared/types'
import { fetchTasks } from './api'
import { load, save } from './storage'

export type TaskStatus = 'pending' | 'done' | 'review' | 'skip'
export type TaskWithStatus = StudyTask & { status: TaskStatus }

const KEY = 'ge_task_status'

export function useTasks() {
  const [tasks, setTasks] = useState<StudyTask[] | null>(null)
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>(() => load(KEY, {}))
  const [error, setError] = useState(false)

  const reload = useCallback(() => {
    setError(false)
    fetchTasks()
      .then((r) => setTasks(r.tasks))
      .catch(() => setError(true))
  }, [])

  useEffect(reload, [reload])
  useEffect(() => save(KEY, statuses), [statuses])

  const setStatus = useCallback((id: string, status: TaskStatus) => {
    setStatuses((s) => ({ ...s, [id]: status }))
  }, [])

  const requeue = useCallback((from: TaskStatus) => {
    setStatuses((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v === from ? 'pending' : v])))
  }, [])

  const list = useMemo<TaskWithStatus[] | null>(
    () => tasks?.map((t) => ({ ...t, status: statuses[t.id] ?? 'pending' })) ?? null,
    [tasks, statuses],
  )

  return { tasks: list, loading: !tasks && !error, error, reload, setStatus, requeue }
}
