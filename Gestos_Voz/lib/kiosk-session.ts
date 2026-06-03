const STORAGE_KEY = "kiosk_totem_id"

/** ID del tótem vinculado a este dispositivo (tras login o config opcional). */
export function getStoredTotemId(): string {
  if (typeof window === "undefined") return ""
  try {
    return sessionStorage.getItem(STORAGE_KEY)?.trim() ?? ""
  } catch {
    return ""
  }
}

export function setStoredTotemId(totemId: string) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(STORAGE_KEY, totemId.trim())
}

export function clearStoredTotemId() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(STORAGE_KEY)
}
