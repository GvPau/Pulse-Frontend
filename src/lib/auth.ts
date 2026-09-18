const TOKEN_KEY = 'pulse.token'

type Listener = () => void

let currentToken: string | null = localStorage.getItem(TOKEN_KEY)
const listeners = new Set<Listener>()

function emit() {
  for (const l of listeners) l()
}

export function getToken(): string | null {
  return currentToken
}

export function setToken(token: string): void {
  currentToken = token
  localStorage.setItem(TOKEN_KEY, token)
  emit()
}

export function clearToken(): void {
  currentToken = null
  localStorage.removeItem(TOKEN_KEY)
  emit()
}

export function subscribeToken(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}