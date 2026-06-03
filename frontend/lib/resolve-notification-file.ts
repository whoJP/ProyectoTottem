import mongoose from "mongoose"
import { ObjectId } from "mongodb"

export async function findGridFsFileIdByFilename(
  filename: string
): Promise<ObjectId | null> {
  const db = mongoose.connection.db
  if (!db || !filename?.trim()) return null

  const file = await db
    .collection("uploads.files")
    .findOne({ filename: filename.trim() }, { sort: { uploadDate: -1 } })

  if (!file?._id) return null
  return file._id instanceof ObjectId ? file._id : new ObjectId(String(file._id))
}

export async function resolveNotificationFileId(doc: {
  archivo?: string | null
  archivoFileId?: mongoose.Types.ObjectId | string | null
}): Promise<string | null> {
  if (doc.archivoFileId) {
    return String(doc.archivoFileId)
  }

  if (!doc.archivo || doc.archivo === "no") {
    return null
  }

  const fromGrid = await findGridFsFileIdByFilename(doc.archivo)
  return fromGrid ? String(fromGrid) : null
}
