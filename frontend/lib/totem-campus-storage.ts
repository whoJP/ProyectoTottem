import Totem from "@/models/Totem"
import { getCampusIdVariants, getSedeNameFromId, normalizeCampusId } from "@/lib/totem-labels"

/**
 * Valor de campus_id que debemos persistir en MongoDB.
 * Respeta el formato ya usado en la sede (legacy) o el nombre visible de la sede.
 */
export async function resolveCampusIdForStorage(
  normalizedCampusId: string
): Promise<string> {
  const id = normalizeCampusId(normalizedCampusId)
  const variants = getCampusIdVariants(id)

  const existing = await Totem.findOne({ campus_id: { $in: variants } })
    .select("campus_id")
    .lean()

  if (existing?.campus_id) {
    return String(existing.campus_id)
  }

  // Primera alta en la sede: formato histórico por sede
  if (id === "cochabamba") return "cochabamba"
  return getSedeNameFromId(id)
}

export function formatApiError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Error al crear el tótem"
  }

  const err = error as {
    name?: string
    message?: string
    code?: number
    errors?: Record<string, { message?: string }>
  }

  if (err.name === "ValidationError" && err.errors) {
    const parts = Object.values(err.errors)
      .map((e) => e?.message)
      .filter(Boolean)
    if (parts.length) return parts.join(". ")
  }

  if (err.code === 11000) {
    return "Ya existe un registro con esos datos (ID o nombre duplicado)."
  }

  if (err.message?.includes("No hay conexión activa con MongoDB")) {
    return "No hay conexión con la base de datos. Intenta de nuevo en unos segundos."
  }

  if (err.message) return err.message

  return "Error al crear el tótem"
}
