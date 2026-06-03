import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { canAccessNotification } from "@/lib/notification-access"
import { validateNotificationDateRange } from "@/lib/notification-dates"
import { eliminarArchivoGridFS, subirArchivoAGridFS } from "@/lib/gridfs"
import Notification from "@/models/Notification"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

async function deleteNotificationFile(fileId: unknown) {
  if (!fileId) return
  try {
    await eliminarArchivoGridFS(fileId as import("mongodb").ObjectId)
  } catch (err) {
    console.warn("No se pudo eliminar archivo anterior de notificación:", err)
  }
}

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

    const existing = await Notification.findById(id)
    if (!existing) {
      return NextResponse.json(
        { error: "Notificación no encontrada." },
        { status: 404 }
      )
    }

    const contentType = request.headers.get("content-type") || ""
    let fechaInicio = existing.fechaInicio as string
    let fechaFin = existing.fechaFin as string
    let mensaje = existing.mensaje as string
    let archivoFile: File | null = null
    let removeArchivo = false

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const fi = (formData.get("fechaInicio") as string)?.trim()
      const ff = (formData.get("fechaFin") as string)?.trim()
      const msg = (formData.get("mensaje") as string)?.trim()
      if (fi) fechaInicio = fi
      if (ff) fechaFin = ff
      if (msg) mensaje = msg
      removeArchivo = formData.get("removeArchivo") === "1"
      const file = formData.get("archivo")
      if (file instanceof File && file.size > 0) {
        archivoFile = file
      }
    } else {
      const body = await request.json()
      if (body.fechaInicio?.trim()) fechaInicio = body.fechaInicio.trim()
      if (body.fechaFin?.trim()) fechaFin = body.fechaFin.trim()
      if (body.mensaje?.trim()) mensaje = body.mensaje.trim()
      if (body.removeArchivo === true || body.removeArchivo === "1") {
        removeArchivo = true
      }
    }

    const dateError = validateNotificationDateRange(fechaInicio, fechaFin)
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 })
    }

    if (!mensaje.trim()) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío." },
        { status: 400 }
      )
    }

    existing.fechaInicio = fechaInicio
    existing.fechaFin = fechaFin
    existing.mensaje = mensaje

    if (removeArchivo) {
      await deleteNotificationFile(existing.archivoFileId)
      existing.archivo = "no"
      existing.archivoFileId = null
      existing.archivoContentType = null
    } else if (archivoFile) {
      await deleteNotificationFile(existing.archivoFileId)
      const fileId = await subirArchivoAGridFS(
        archivoFile,
        String(existing.totem_id)
      )
      existing.archivoFileId = fileId
      existing.archivoContentType =
        archivoFile.type || "application/octet-stream"
      existing.archivo = archivoFile.name
    }

    await existing.save()

    const doc = existing.toObject()
    return NextResponse.json({
      ...doc,
      _id: String(doc._id),
      archivoDisponible: Boolean(doc.archivoFileId),
    })
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

    await deleteNotificationFile(doc.archivoFileId)
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
