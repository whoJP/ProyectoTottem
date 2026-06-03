import mongoose from "mongoose"
import Faq from "@/models/Faq"
import {
  resolveFaqSedeAnswers,
  type KioskFaqItem,
  type KioskFaqPayload,
} from "@/lib/kiosk-totem"

function mapFaqItems(
  raw: { question?: string; answer?: string; keyword?: string }[]
): KioskFaqItem[] {
  return raw
    .map((item) => {
      const question = String(item.question ?? "").trim()
      const answer = String(item.answer ?? "").trim()
      let keyword = String(item.keyword ?? "")
        .trim()
        .toLowerCase()
      if (!keyword && question) {
        const match = question.match(/[a-záéíóúñ]{3,}/i)
        keyword = match ? match[0].toLowerCase() : ""
      }
      return { question, answer, keyword }
    })
    .filter((i) => i.question && i.answer && i.keyword)
}

/** Variantes de totemId para que coincidan string y ObjectId en Mongo. */
function buildTotemIdOr(totemMongoId: string, totemIdStr: string) {
  const seen = new Set<string>()
  const or: Record<string, unknown>[] = [{ totemId: null }]

  for (const id of [totemMongoId, totemIdStr]) {
    const trimmed = id?.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    or.push({ totemId: trimmed })
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      or.push({ totemId: new mongoose.Types.ObjectId(trimmed) })
    }
  }

  return or
}

function hasRawItems(doc: Record<string, unknown>) {
  return Array.isArray(doc.items) && doc.items.length > 0
}

async function pickFaqDoc(
  totemMongoId: string,
  totemIdStr: string
): Promise<Record<string, unknown> | null> {
  const totemIdOr = buildTotemIdOr(totemMongoId, totemIdStr)
  const sort = { updatedAt: -1 as const, createdAt: -1 as const }

  const forTotem = await Faq.find({ isActive: true, $or: totemIdOr })
    .sort(sort)
    .lean()

  const totemWithItems = forTotem.find((doc) => hasRawItems(doc))
  if (totemWithItems) {
    return totemWithItems as Record<string, unknown>
  }

  const anyWithItems = await Faq.findOne({
    isActive: true,
    "items.0": { $exists: true },
  })
    .sort(sort)
    .lean()

  if (anyWithItems) {
    console.warn(
      "[FAQ] Sin FAQ para totem",
      totemMongoId,
      "— usando FAQ global:",
      anyWithItems._id
    )
    return anyWithItems as Record<string, unknown>
  }

  return (forTotem[0] as Record<string, unknown>) ?? null
}

export async function loadKioskFaqForTotem(
  totemMongoId: string,
  totemIdStr: string,
  campusId?: string | null
): Promise<KioskFaqPayload | null> {
  const faq = await pickFaqDoc(totemMongoId, totemIdStr)
  if (!faq) return null

  const items = mapFaqItems(
    (Array.isArray(faq.items) ? faq.items : []) as {
      question?: string
      answer?: string
      keyword?: string
    }[]
  )

  const payload: KioskFaqPayload = {
    title: String(faq.title || "Preguntas Frecuentes"),
    items,
  }

  if (!items.length) {
    console.warn(
      "[FAQ] Documento",
      faq._id,
      "tiene",
      Array.isArray(faq.items) ? faq.items.length : 0,
      "items en BD pero 0 tras mapear (falta keyword?)"
    )
    return payload
  }

  return resolveFaqSedeAnswers(payload, campusId ?? null)
}
