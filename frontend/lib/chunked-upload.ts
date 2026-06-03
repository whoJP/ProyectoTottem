import { GridFSBucket } from "mongodb"
import mongoose from "mongoose"
import Content from "@/models/Content"
import UploadChunk from "@/models/UploadChunk"
import { TOTEM_MEDIA_FIELDS } from "@/lib/totem-media-fields"
import type { UploadedTotemMedia } from "@/lib/totem-media-upload"

export function resolveFieldBySlot(slot: string) {
  return TOTEM_MEDIA_FIELDS.find((item) => item.slot === slot) ?? null
}

export async function saveUploadChunk(params: {
  uploadId: string
  index: number
  totalChunks: number
  fileName: string
  contentType: string
  slot: string
  nombreTotem: string
  data: Buffer
}) {
  await UploadChunk.findOneAndUpdate(
    { uploadId: params.uploadId, index: params.index },
    {
      uploadId: params.uploadId,
      index: params.index,
      totalChunks: params.totalChunks,
      fileName: params.fileName,
      contentType: params.contentType,
      slot: params.slot,
      nombreTotem: params.nombreTotem,
      data: params.data,
    },
    { upsert: true, new: true }
  )
}

export async function finalizeChunkedUpload(
  uploadId: string
): Promise<UploadedTotemMedia> {
  const chunks = await UploadChunk.find({ uploadId }).sort({ index: 1 }).lean()

  if (!chunks.length) {
    throw new Error("No se encontraron partes de la subida.")
  }

  const { totalChunks, fileName, contentType, slot, nombreTotem } = chunks[0]

  if (chunks.length !== totalChunks) {
    throw new Error(
      `Subida incompleta: faltan partes (${chunks.length}/${totalChunks}).`
    )
  }

  const field = resolveFieldBySlot(slot)
  if (!field) {
    throw new Error("Tipo de archivo de tótem no reconocido.")
  }

  const db = mongoose.connection.db
  if (!db) {
    throw new Error("No hay conexión activa con MongoDB")
  }

  const buffer = Buffer.concat(chunks.map((c) => c.data as Buffer))
  const bucket = new GridFSBucket(db, { bucketName: "uploads" })

  const fileId = await new Promise<import("mongodb").ObjectId>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(fileName, {
      metadata: { nombre: slot, contentType },
    })
    uploadStream.end(buffer)
    uploadStream.on("finish", () => resolve(uploadStream.id))
    uploadStream.on("error", reject)
  })

  await UploadChunk.deleteMany({ uploadId })

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
    contentId: content._id as import("mongoose").Types.ObjectId,
  }
}
