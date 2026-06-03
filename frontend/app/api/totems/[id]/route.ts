import { NextResponse } from "next/server"
import mongoose from "mongoose"
import connectDB from "@/lib/mongodb"
import { requireAuth, canAccessCampus, resolveCampusIdForWrite } from "@/lib/auth"
import { eliminarArchivoGridFS } from "@/lib/gridfs"
import { processTotemMediaFromForm, type TotemArchivoRef } from "@/lib/totem-media"
import { normalizeCampusId, normalizePlantillaId } from "@/lib/totem-labels"
import { getTemplateRequirements } from "@/lib/totem-templates"
import Totem from "@/models/Totem"
import Content from "@/models/Content"
import { findDuplicateTotemByName } from "@/lib/totem-duplicate-name"
import { resolveCampusIdForStorage } from "@/lib/totem-campus-storage"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: RouteContext) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de tótem inválido" }, { status: 400 })
    }

    const totem = await Totem.findById(id)
    if (!totem) {
      return NextResponse.json({ error: "Tótem no encontrado" }, { status: 404 })
    }

    if (!canAccessCampus(authResult.auth, String(totem.campus_id))) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar tótems de otra sede." },
        { status: 403 }
      )
    }

    const contentType = request.headers.get("content-type") || ""

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Se requiere FormData para actualizar el tótem" },
        { status: 400 }
      )
    }

    const formData = await request.formData()

    const nombre = (formData.get("nombre") as string)?.trim()
    const campusNormalized = resolveCampusIdForWrite(
      authResult.auth,
      formData.get("campus_id") as string
    )
    if (!campusNormalized) {
      return NextResponse.json(
        { error: "No tienes permiso para asignar otra sede a este tótem." },
        { status: 403 }
      )
    }
    const campus_id = await resolveCampusIdForStorage(campusNormalized)
    const plantilla = normalizePlantillaId(formData.get("plantilla") as string)
    const estado = formData.get("estado") as string
    const usuario = (formData.get("usuario") as string)?.trim()
    const contraseña = formData.get("contraseña") as string
    const mostrarDesde = formData.get("mostrarDesde") as string
    const mostrarHasta = formData.get("mostrarHasta") as string

    if (!nombre || !estado || !usuario || !contraseña) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para actualizar" },
        { status: 400 }
      )
    }

    const existingArchivos: TotemArchivoRef[] = (totem.contenido?.archivos ?? []).map(
      (a: { slot: string; tipo: string; contentId: mongoose.Types.ObjectId }) => ({
        slot: a.slot,
        tipo: a.tipo,
        contentId: a.contentId,
      })
    )

    const archivos = await processTotemMediaFromForm(
      formData,
      nombre,
      existingArchivos
    )

    const req = getTemplateRequirements(plantilla)
    const imageCount = archivos.filter((a) => a.tipo === "imagen").length
    const videoCount = archivos.filter((a) => a.tipo === "video").length

    if (imageCount < req.images || videoCount < req.videos) {
      return NextResponse.json(
        {
          error: `La plantilla seleccionada requiere ${req.images} imagen(es) y ${req.videos} video(s). Sube los archivos faltantes.`,
        },
        { status: 400 }
      )
    }

    const duplicateName = await findDuplicateTotemByName(nombre, campusNormalized, id)
    if (duplicateName) {
      return NextResponse.json(
        {
          error: `Ya existe un tótem con el nombre "${nombre}" en esta sede.`,
        },
        { status: 409 }
      )
    }

    totem.nombre = nombre
    totem.campus_id = campus_id
    totem.plantilla = plantilla
    totem.estado = estado
    totem.credenciales = { usuario, contraseña }
    totem.contenido = {
      mostrarDesde: mostrarDesde ? new Date(mostrarDesde) : null,
      mostrarHasta: mostrarHasta ? new Date(mostrarHasta) : null,
      archivos,
    }
    totem.contenido_count = archivos.length

    await totem.save()

    const updated = await Totem.findById(id).populate("contenido.archivos.contentId")
    const obj = updated!.toObject()
    obj.campus_id = normalizeCampusId(obj.campus_id as string)
    obj.plantilla = normalizePlantillaId(obj.plantilla as string)

    return NextResponse.json(obj)
  } catch (error) {
    console.error("Error PUT totem:", error)
    const message =
      error instanceof Error ? error.message : "Error al actualizar el tótem"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de tótem inválido" }, { status: 400 })
    }

    const totem = await Totem.findById(id)
    if (!totem) {
      return NextResponse.json({ error: "Tótem no encontrado" }, { status: 404 })
    }

    if (!canAccessCampus(authResult.auth, String(totem.campus_id))) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar tótems de otra sede." },
        { status: 403 }
      )
    }

    const archivos = totem.contenido?.archivos ?? []

    for (const archivo of archivos) {
      if (!archivo.contentId) continue

      const content = await Content.findById(archivo.contentId)
      if (content?.fileId) {
        await eliminarArchivoGridFS(content.fileId)
      }
      await Content.findByIdAndDelete(archivo.contentId)
    }

    await Totem.findByIdAndDelete(id)

    return NextResponse.json({ message: "Tótem eliminado correctamente" })
  } catch (error) {
    console.error("Error DELETE totem:", error)
    const message =
      error instanceof Error ? error.message : "Error al eliminar el tótem"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
