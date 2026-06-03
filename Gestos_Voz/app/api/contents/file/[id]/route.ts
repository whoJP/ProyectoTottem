import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { GridFSBucket, ObjectId } from "mongodb"
import connectDB from "@/lib/mongodb"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Archivos de contenido accesibles desde el tótem (sin sesión de admin). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de archivo inválido" }, { status: 400 })
    }

    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: "No hay conexión con MongoDB" },
        { status: 500 }
      )
    }

    const bucket = new GridFSBucket(db, { bucketName: "uploads" })
    const fileId = new ObjectId(id)

    const files = await db
      .collection("uploads.files")
      .find({ _id: fileId })
      .toArray()

    if (!files.length) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      )
    }

    const file = files[0]
    const chunks: Buffer[] = []
    const stream = bucket.openDownloadStream(fileId)

    for await (const chunk of stream) {
      chunks.push(chunk as Buffer)
    }

    const buffer = Buffer.concat(chunks)
    const contentType =
      file.metadata?.contentType || "application/octet-stream"

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${file.filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Error obteniendo archivo kiosk:", error)
    return NextResponse.json(
      { error: "Error al obtener archivo" },
      { status: 500 }
    )
  }
}
