import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { GridFSBucket, ObjectId } from "mongodb"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { resolveNotificationFileId } from "@/lib/resolve-notification-file"
import Notification from "@/models/Notification"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Notificación inválida" }, { status: 400 })
    }

    const notification = await Notification.findById(id).lean()
    if (!notification) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 })
    }

    const fileIdStr = await resolveNotificationFileId(notification)
    if (!fileIdStr) {
      return NextResponse.json(
        {
          error:
            "El archivo de esta notificación no está disponible. Vuelve a enviar la notificación con el adjunto.",
        },
        { status: 404 }
      )
    }

    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json({ error: "Sin conexión a la base de datos" }, { status: 500 })
    }

    const fileObjectId = new ObjectId(fileIdStr)
    const bucket = new GridFSBucket(db, { bucketName: "uploads" })

    const files = await db
      .collection("uploads.files")
      .find({ _id: fileObjectId })
      .toArray()

    if (!files.length) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }

    const file = files[0]
    const chunks: Buffer[] = []
    const stream = bucket.openDownloadStream(fileObjectId)

    for await (const chunk of stream) {
      chunks.push(chunk as Buffer)
    }

    const buffer = Buffer.concat(chunks)
    const contentType =
      (notification.archivoContentType as string) ||
      (file.metadata?.contentType as string) ||
      "application/octet-stream"

    const url = new URL(request.url)
    const asDownload = url.searchParams.get("download") === "1"
    const fileName = (notification.archivo as string) || file.filename || "archivo"
    const disposition = asDownload ? "attachment" : "inline"

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Error GET notificación archivo:", error)
    return NextResponse.json({ error: "Error al obtener el archivo" }, { status: 500 })
  }
}
