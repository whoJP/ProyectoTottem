import { Types } from "mongoose"
import Content from "@/models/Content"
import { subirArchivoAGridFS, eliminarArchivoGridFS } from "@/lib/gridfs"

export const TOTEM_MEDIA_FIELDS = [
  { key: "imagen1", slot: "Imagen Carrusel 1", tipo: "imagen" as const },
  { key: "imagen2", slot: "Imagen Carrusel 2", tipo: "imagen" as const },
  { key: "imagen3", slot: "Imagen Carrusel 3", tipo: "imagen" as const },
  { key: "imagen4", slot: "Imagen Carrusel 4", tipo: "imagen" as const },
  { key: "imagen5", slot: "Imagen Carrusel 5", tipo: "imagen" as const },
  { key: "video1", slot: "Video Principal 1", tipo: "video" as const },
  { key: "video2", slot: "Video Principal 2", tipo: "video" as const },
] as const

export type TotemArchivoRef = {
  slot: string
  tipo: string
  contentId: Types.ObjectId
}

async function removeArchivoEntry(contentId: Types.ObjectId) {
  const content = await Content.findById(contentId)
  if (content?.fileId) {
    await eliminarArchivoGridFS(content.fileId)
  }
  await Content.findByIdAndDelete(contentId)
}

export async function processTotemMediaFromForm(
  formData: FormData,
  nombreTotem: string,
  existingArchivos: TotemArchivoRef[] = []
): Promise<TotemArchivoRef[]> {
  const archivos: TotemArchivoRef[] = existingArchivos.map((a) => ({
    slot: a.slot,
    tipo: a.tipo,
    contentId: a.contentId,
  }))

  for (const item of TOTEM_MEDIA_FIELDS) {
    const file = formData.get(item.key) as File | null
    if (!file || file.size === 0) continue

    const existingIndex = archivos.findIndex((a) => a.slot === item.slot)
    if (existingIndex >= 0) {
      await removeArchivoEntry(archivos[existingIndex].contentId)
      archivos.splice(existingIndex, 1)
    }

    const fileId = await subirArchivoAGridFS(file, item.slot)
    const content = await Content.create({
      content_id: `CONTENT-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      tipo: item.tipo,
      nombre: item.slot,
      fileId,
      url_contenido: `/api/contents/file/${fileId}`,
      descripcion: `${item.slot} del tótem ${nombreTotem}`,
    })

    archivos.push({
      slot: item.slot,
      tipo: item.tipo,
      contentId: content._id as Types.ObjectId,
    })
  }

  return archivos
}
