import mongoose from "mongoose"
import { GridFSBucket, ObjectId } from "mongodb"

export async function subirArchivoAGridFS(file: File, nombre: string) {
  const db = mongoose.connection.db

  if (!db) {
    throw new Error("No hay conexión activa con MongoDB")
  }

  const bucket = new GridFSBucket(db, { bucketName: "uploads" })
  const buffer = Buffer.from(await file.arrayBuffer())

  return new Promise<ObjectId>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: { nombre, contentType: file.type },
    })

    uploadStream.end(buffer)
    uploadStream.on("finish", () => resolve(uploadStream.id))
    uploadStream.on("error", reject)
  })
}

export async function eliminarArchivoGridFS(fileId: ObjectId) {
  const db = mongoose.connection.db
  if (!db) return

  const bucket = new GridFSBucket(db, { bucketName: "uploads" })
  try {
    await bucket.delete(fileId)
  } catch {
    // El archivo puede no existir en GridFS
  }
}
