export function load<T>(key: string, fallback: T, store: Storage = localStorage): T {
  try {
    const raw = store.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown, store: Storage = localStorage) {
  try {
    if (value === null) store.removeItem(key)
    else store.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}
