import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { subirArchivoAGridFS } from "@/lib/gridfs"
import { resolveNotificationFileId } from "@/lib/resolve-notification-file"
import Notification from "@/models/Notification"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()
    const count = await Notification.countDocuments()
    const itemsRaw = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const items = await Promise.all(
      itemsRaw.map(async (doc) => {
        const archivoFileId = await resolveNotificationFileId(doc)
        return {
          ...doc,
          _id: String(doc._id),
          archivoFileId,
          archivoDisponible: Boolean(archivoFileId),
        }
      })
    )

    return NextResponse.json({ count, items })
  } catch (error) {
    console.error("Error GET notificaciones:", error)
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()

    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const totem_id = (formData.get("totem_id") as string)?.trim()
      const fechaInicio = (formData.get("fechaInicio") as string)?.trim()
      const fechaFin = (formData.get("fechaFin") as string)?.trim()
      const mensaje = (formData.get("mensaje") as string)?.trim()
      const archivoFile = formData.get("archivo") as File | null

      if (!totem_id || !fechaInicio || !fechaFin) {
        return NextResponse.json(
          { error: "Faltan totem_id, fecha de inicio o fecha de fin." },
          { status: 400 }
        )
      }

      if (!mensaje && (!archivoFile || archivoFile.size === 0)) {
        return NextResponse.json(
          { error: "Debes incluir un mensaje o un archivo." },
          { status: 400 }
        )
      }

      let archivoFileId = null
      let archivoContentType = null
      let archivoNombre = "no"

      if (archivoFile && archivoFile.size > 0) {
        archivoFileId = await subirArchivoAGridFS(archivoFile, totem_id)
        archivoContentType = archivoFile.type || "application/octet-stream"
        archivoNombre = archivoFile.name
      }

      const doc = await Notification.create({
        totem_id,
        fechaInicio,
        fechaFin,
        mensaje: mensaje || "(notificación con archivo)",
        archivo: archivoNombre,
        archivoFileId,
        archivoContentType,
      })

      return NextResponse.json(doc, { status: 201 })
    }

    const body = await request.json()
    const { totem_id, fechaInicio, fechaFin, mensaje, archivo } = body

    if (!totem_id || !fechaInicio || !fechaFin || !mensaje) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      )
    }

    const doc = await Notification.create({
      totem_id,
      fechaInicio,
      fechaFin,
      mensaje,
      archivo: archivo ?? "no",
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error("Error POST notificaciones:", error)
    return NextResponse.json(
      { error: "Error al enviar la notificación" },
      { status: 500 }
    )
  }
}
