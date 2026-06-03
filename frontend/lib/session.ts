const SESSION_ID_KEY = "app_session_id"

/** Marca una sesión nueva tras login (evita ver dashboard cacheado de otro usuario). */
export function registerSession(): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  sessionStorage.setItem(SESSION_ID_KEY, id)
  return id
}

export function getSessionId(): string | null {
  return sessionStorage.getItem(SESSION_ID_KEY)
}

export function clearSessionStorage(): void {
  localStorage.removeItem("token")
  localStorage.removeItem("admin")
  sessionStorage.removeItem(SESSION_ID_KEY)
}

export function logoutAndRedirectToLogin(): void {
  clearSessionStorage()
  window.location.replace("/login")
}

/** false = la página en caché del navegador no corresponde a la sesión actual */
export function isSessionStillValid(cachedSessionId: string | null): boolean {
  if (!localStorage.getItem("token")) return false
  const current = getSessionId()
  if (!current || !cachedSessionId) return true
  return current === cachedSessionId
}
