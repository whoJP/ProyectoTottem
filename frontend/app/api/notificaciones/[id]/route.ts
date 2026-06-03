import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { canAccessNotification } from "@/lib/notification-access"
import { eliminarArchivoGridFS } from "@/lib/gridfs"
import Notification from "@/models/Notification"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()
    const { id } = await params

    if (!(await canAccessNotification(authResult.auth, id))) {
      return NextResponse.json(
        { error: "No tienes permiso para editar esta notificación." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { totem_id, fechaInicio, fechaFin, mensaje } = body as {
      totem_id?: string
      fechaInicio?: string
      fechaFin?: string
      mensaje?: string
    }

    const update: Record<string, string> = {}
    if (totem_id?.trim()) update.totem_id = totem_id.trim()
    if (fechaInicio?.trim()) update.fechaInicio = fechaInicio.trim()
    if (fechaFin?.trim()) update.fechaFin = fechaFin.trim()
    if (mensaje?.trim()) update.mensaje = mensaje.trim()

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar." },
        { status: 400 }
      )
    }

    const doc = await Notification.findByIdAndUpdate(id, update, {
      new: true,
    }).lean()

    if (!doc) {
      return NextResponse.json(
        { error: "Notificación no encontrada." },
        { status: 404 }
      )
    }

    return NextResponse.json({ ...doc, _id: String(doc._id) })
  } catch (error) {
    console.error("Error PATCH notificación:", error)
    return NextResponse.json(
      { error: "Error al actualizar la notificación" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()
    const { id } = await params

    if (!(await canAccessNotification(authResult.auth, id))) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta notificación." },
        { status: 403 }
      )
    }

    const doc = await Notification.findById(id)
    if (!doc) {
      return NextResponse.json(
        { error: "Notificación no encontrada." },
        { status: 404 }
      )
    }

    if (doc.archivoFileId) {
      try {
        await eliminarArchivoGridFS(doc.archivoFileId)
      } catch (err) {
        console.warn("No se pudo eliminar archivo de notificación:", err)
      }
    }

    await Notification.findByIdAndDelete(id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error DELETE notificación:", error)
    return NextResponse.json(
      { error: "Error al eliminar la notificación" },
      { status: 500 }
    )
  }
}
