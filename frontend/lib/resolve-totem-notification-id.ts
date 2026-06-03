import mongoose from "mongoose"
import Totem from "@/models/Totem"

/**
 * Guarda en notificaciones un identificador estable del tótem (totem_id de negocio).
 * Acepta Mongo _id o totem_id en el formulario.
 */
export async function resolveTotemNotificationId(
  rawTotemId: string
): Promise<string> {
  const trimmed = rawTotemId?.trim()
  if (!trimmed) return trimmed

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const byId = await Totem.findById(trimmed).select("totem_id").lean()
    if (byId?.totem_id) return String(byId.totem_id)
  }

  const byBusinessId = await Totem.findOne({ totem_id: trimmed })
    .select("totem_id")
    .lean()
  if (byBusinessId?.totem_id) return String(byBusinessId.totem_id)

  return trimmed
}
