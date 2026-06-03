import mongoose from "mongoose"
import Totem from "@/models/Totem"
import { getCampusIdVariants } from "@/lib/totem-labels"

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function findDuplicateTotemByName(
  nombre: string,
  campus_id: string,
  excludeTotemId?: string
) {
  const trimmed = nombre.trim()
  if (!trimmed) return null

  const filter: Record<string, unknown> = {
    campus_id: { $in: getCampusIdVariants(campus_id) },
    nombre: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") },
  }

  if (excludeTotemId && mongoose.Types.ObjectId.isValid(excludeTotemId)) {
    filter._id = { $ne: excludeTotemId }
  }

  return Totem.findOne(filter).select("_id nombre").lean()
}
