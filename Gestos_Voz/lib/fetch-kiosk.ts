import type { KioskTotemPayload } from "@/lib/kiosk-totem"
import { getStoredTotemId } from "@/lib/kiosk-session"

/**
 * Resuelve qué tótem muestra ESTE dispositivo (no lista todos).
 * Orden: sesión del navegador → variable opcional de fábrica → ?totem= en URL.
 */
export function getActiveTotemId(): string {
  if (typeof window !== "undefined") {
    const fromSession = getStoredTotemId()
    if (fromSession) return fromSession

    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get("totem")?.trim()
    if (fromQuery) return fromQuery
  }

  const fromEnv = process.env.NEXT_PUBLIC_TOTEM_ID?.trim()
  if (fromEnv) return fromEnv

  return ""
}

export async function loginKioskTotem(
  usuario: string,
  contraseña: string
): Promise<{ totemId: string; nombre: string }> {
  const response = await fetch("/api/kiosk/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contraseña }),
  })
  const data = await response.json()

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : "No se pudo iniciar sesión"
    throw new Error(message)
  }

  return {
    totemId: String((data as { totemId: string }).totemId),
    nombre: String((data as { nombre: string }).nombre),
  }
}

export async function fetchKioskTotem(
  totemId: string
): Promise<KioskTotemPayload> {
  const response = await fetch(`/api/kiosk/totems/${encodeURIComponent(totemId)}`)
  const data = await response.json()

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : "No se pudo cargar el tótem"
    throw new Error(message)
  }

  return data as KioskTotemPayload
}
