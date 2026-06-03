import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { saveUploadChunk } from "@/lib/chunked-upload"
import {
  CHUNK_UPLOAD_SIZE_BYTES,
  MAX_TOTEM_MEDIA_CHUNKED_BYTES,
  formatMaxChunkedMediaSizeMessage,
} from "@/lib/upload-limits"
import { formatApiError } from "@/lib/totem-campus-storage"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()

    const formData = await request.formData()
    const chunk = formData.get("chunk")
    const uploadId = String(formData.get("uploadId") ?? "").trim()
    const indexRaw = formData.get("index")
    const totalChunksRaw = formData.get("totalChunks")
    const fileName = String(formData.get("fileName") ?? "archivo").trim()
    const contentType = String(formData.get("contentType") ?? "application/octet-stream")
    const slot = String(formData.get("slot") ?? "").trim()
    const nombreTotem = String(formData.get("nombreTotem") ?? "tótem").trim()
    const fileSizeRaw = formData.get("fileSize")

    const index = Number(indexRaw)
    const totalChunks = Number(totalChunksRaw)
    const fileSize = Number(fileSizeRaw)

    if (!(chunk instanceof Blob) || chunk.size === 0) {
      return NextResponse.json({ error: "Parte de archivo inválida." }, { status: 400 })
    }

    if (chunk.size > CHUNK_UPLOAD_SIZE_BYTES + 512 * 1024) {
      return NextResponse.json(
        { error: "La parte enviada supera el tamaño permitido." },
        { status: 413 }
      )
    }

    if (!uploadId || !slot || !Number.isInteger(index) || !Number.isInteger(totalChunks)) {
      return NextResponse.json({ error: "Datos de subida incompletos." }, { status: 400 })
    }

    if (Number.isFinite(fileSize) && fileSize > MAX_TOTEM_MEDIA_CHUNKED_BYTES) {
      return NextResponse.json(
        { error: formatMaxChunkedMediaSizeMessage() },
        { status: 413 }
      )
    }

    const buffer = Buffer.from(await chunk.arrayBuffer())

    await saveUploadChunk({
      uploadId,
      index,
      totalChunks,
      fileName,
      contentType,
      slot,
      nombreTotem,
      data: buffer,
    })

    return NextResponse.json({ ok: true, index })
  } catch (error) {
    console.error("Error POST /api/contents/upload-chunk:", error)
    return NextResponse.json({ error: formatApiError(error) }, { status: 500 })
  }
}
