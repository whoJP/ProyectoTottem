import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { finalizeChunkedUpload } from "@/lib/chunked-upload"
import { formatApiError } from "@/lib/totem-campus-storage"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()

    let body: { uploadId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
    }

    const uploadId = String(body.uploadId ?? "").trim()
    if (!uploadId) {
      return NextResponse.json({ error: "Falta uploadId." }, { status: 400 })
    }

    const uploaded = await finalizeChunkedUpload(uploadId)

    return NextResponse.json({
      slot: uploaded.slot,
      tipo: uploaded.tipo,
      contentId: String(uploaded.contentId),
    })
  } catch (error) {
    console.error("Error POST /api/contents/upload-complete:", error)
    return NextResponse.json({ error: formatApiError(error) }, { status: 500 })
  }
}
