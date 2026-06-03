import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { GridFSBucket, ObjectId } from "mongodb"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()

    const { id } = await params

    const db = mongoose.connection.db

    if (!db) {
      return NextResponse.json(
        { error: "No hay conexión con MongoDB" },
        { status: 500 }
      )
    }

    const bucket = new GridFSBucket(db, {
      bucketName: "uploads",
    })

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

    const url = new URL(req.url)
    const asDownload = url.searchParams.get("download") === "1"
    const disposition = asDownload ? "attachment" : "inline"

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${file.filename}"`,
      },
    })
  } catch (error) {
    console.error("Error obteniendo archivo:", error)

    return NextResponse.json(
      { error: "Error al obtener archivo" },
      { status: 500 }
    )
  }
}