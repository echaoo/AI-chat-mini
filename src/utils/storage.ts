export function getString(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key) || ''
}

export function setString(key: string, value: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
}

export function getJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)

  if (!raw) return null

  try {
    return JSON.parse(raw) as T
  } catch (error) {
    window.localStorage.removeItem(key)
    return null
  }
}

export function setJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeStorage(key: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}
