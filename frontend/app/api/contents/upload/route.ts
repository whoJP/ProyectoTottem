import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { uploadTotemMediaFile } from "@/lib/totem-media-upload"
import {
  formatMaxMediaSizeMessage,
  isMediaWithinDirectLimit,
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
    const file = formData.get("file")
    const slot = String(formData.get("slot") ?? "").trim()
    const nombreTotem = String(formData.get("nombreTotem") ?? "tótem").trim()

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Debes enviar un archivo válido." },
        { status: 400 }
      )
    }

    if (!slot) {
      return NextResponse.json(
        { error: "Falta el identificador del slot de media." },
        { status: 400 }
      )
    }

    if (!isMediaWithinDirectLimit(file.size)) {
      return NextResponse.json(
        { error: formatMaxMediaSizeMessage() },
        { status: 413 }
      )
    }

    const uploaded = await uploadTotemMediaFile(file, slot, nombreTotem)

    return NextResponse.json({
      slot: uploaded.slot,
      tipo: uploaded.tipo,
      contentId: String(uploaded.contentId),
    })
  } catch (error) {
    console.error("Error POST /api/contents/upload:", error)
    const message = formatApiError(error)
    const status = message.includes("MB") ? 413 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
