import type { AuthPayload } from "@/lib/auth"
import { getTotemListFilter, isSuperAdmin } from "@/lib/auth"
import Totem from "@/models/Totem"
import Notification from "@/models/Notification"

/** Identificadores de tótems visibles para el admin (null = todos, superadmin). */
export async function getAllowedTotemIdentifiers(
  auth: AuthPayload
): Promise<string[] | null> {
  if (isSuperAdmin(auth)) return null

  const totems = await Totem.find(getTotemListFilter(auth))
    .select("totem_id nombre")
    .lean()

  const ids = new Set<string>()
  for (const t of totems) {
    if (t.totem_id) ids.add(String(t.totem_id))
    if (t.nombre) ids.add(String(t.nombre))
    if (t._id) ids.add(String(t._id))
  }
  return [...ids]
}

export function notificationFilterForTotemIds(
  totemIds: string[] | null
): Record<string, unknown> {
  if (totemIds === null) return {}
  if (totemIds.length === 0) return { totem_id: "__none__" }
  return { totem_id: { $in: totemIds } }
}

export async function canAccessNotification(
  auth: AuthPayload,
  notificationId: string
): Promise<boolean> {
  const doc = await Notification.findById(notificationId).select("totem_id").lean()
  if (!doc?.totem_id) return false

  const allowed = await getAllowedTotemIdentifiers(auth)
  if (allowed === null) return true
  return allowed.includes(String(doc.totem_id))
}
