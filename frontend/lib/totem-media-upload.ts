import { Types } from "mongoose"
import Content from "@/models/Content"
import { subirArchivoAGridFS } from "@/lib/gridfs"
import { removeArchivoEntry, type TotemArchivoRef } from "@/lib/totem-media"
import { TOTEM_MEDIA_FIELDS } from "@/lib/totem-media-fields"
import {
  formatMaxMediaSizeMessage,
  isMediaWithinDirectLimit,
} from "@/lib/upload-limits"

export type UploadedTotemMedia = {
  slot: string
  tipo: string
  contentId: Types.ObjectId
}

export async function uploadTotemMediaFile(
  file: File,
  slot: string,
  nombreTotem: string
): Promise<UploadedTotemMedia> {
  if (!isMediaWithinDirectLimit(file.size)) {
    throw new Error(formatMaxMediaSizeMessage())
  }

  const field =
    TOTEM_MEDIA_FIELDS.find((item) => item.slot === slot) ??
    TOTEM_MEDIA_FIELDS.find((item) => item.key === slot)

  if (!field) {
    throw new Error("Tipo de archivo de tótem no reconocido.")
  }

  if (field.tipo === "imagen" && !file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen válida.")
  }

  if (field.tipo === "video" && !file.type.startsWith("video/")) {
    throw new Error("El archivo no es un video válido.")
  }

  const fileId = await subirArchivoAGridFS(file, field.slot)
  const content = await Content.create({
    content_id: `CONTENT-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    tipo: field.tipo,
    nombre: field.slot,
    fileId,
    url_contenido: `/api/contents/file/${fileId}`,
    descripcion: `${field.slot} del tótem ${nombreTotem}`,
  })

  return {
    slot: field.slot,
    tipo: field.tipo,
    contentId: content._id as Types.ObjectId,
  }
}

export function parseArchivosPayload(
  archivos: unknown
): Array<{ slot: string; tipo: string; contentId: Types.ObjectId }> {
  if (!Array.isArray(archivos)) return []

  const parsed: Array<{ slot: string; tipo: string; contentId: Types.ObjectId }> = []

  for (const item of archivos) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const slot = String(row.slot ?? "").trim()
    const tipo = String(row.tipo ?? "").trim()
    const contentIdRaw = row.contentId

    if (!slot || !tipo || !Types.ObjectId.isValid(String(contentIdRaw))) {
      continue
    }

    parsed.push({
      slot,
      tipo,
      contentId: new Types.ObjectId(String(contentIdRaw)),
    })
  }

  return parsed
}

export async function replaceTotemArchivos(
  nextArchivos: TotemArchivoRef[],
  previousArchivos: TotemArchivoRef[] = []
): Promise<TotemArchivoRef[]> {
  const nextIds = new Set(nextArchivos.map((a) => a.contentId.toString()))

  for (const prev of previousArchivos) {
    if (!nextIds.has(prev.contentId.toString())) {
      await removeArchivoEntry(prev.contentId)
    }
  }

  return nextArchivos
}
