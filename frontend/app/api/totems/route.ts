import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { requireAuth, getTotemListFilter, resolveCampusIdForWrite, canAccessCampus } from "@/lib/auth"
import { processTotemMediaFromForm } from "@/lib/totem-media"
import { normalizeCampusId, normalizePlantillaId } from "@/lib/totem-labels"
import { getTemplateRequirements } from "@/lib/totem-templates"
import Totem from "@/models/Totem"
import { findDuplicateTotemByName } from "@/lib/totem-duplicate-name"
import {
  generateTotemCredentials,
  readPasswordFromFormData,
} from "@/lib/totem-credentials"

export const runtime = "nodejs"

function normalizeTotemDocument(totem: {
  toObject: () => Record<string, unknown>
}) {
  const obj = totem.toObject()
  obj.campus_id = normalizeCampusId(obj.campus_id as string)
  obj.plantilla = normalizePlantillaId(obj.plantilla as string)
  return obj
}

export async function GET(request: Request) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()

    const totems = await Totem.find(getTotemListFilter(authResult.auth))
      .populate("contenido.archivos.contentId")
      .sort({ createdAt: -1 })

    return NextResponse.json(totems.map(normalizeTotemDocument))
  } catch (error) {
    console.error("Error GET:", error)
    return NextResponse.json(
      { error: "Error al obtener los tótems" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()

    const formData = await request.formData()

    const nombre = ((formData.get("nombre") as string) || "").trim()
    let totem_id = (formData.get("totem_id") as string)?.trim()
    if (!totem_id) {
      totem_id = `TOTEM-${crypto.randomUUID()}`
    }
    const campus_id = resolveCampusIdForWrite(
      authResult.auth,
      formData.get("campus_id") as string
    )
    if (!campus_id) {
      return NextResponse.json(
        { error: "No tienes permiso para crear tótems en esta sede." },
        { status: 403 }
      )
    }
    const plantilla = normalizePlantillaId(formData.get("plantilla") as string)
    const estado = ((formData.get("estado") as string) || "Activo").trim()
    let usuario = ((formData.get("usuario") as string) || "").trim()
    let contraseña = readPasswordFromFormData(formData).trim()
    const mostrarDesde = formData.get("mostrarDesde") as string
    const mostrarHasta = formData.get("mostrarHasta") as string

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del tótem es obligatorio." },
        { status: 400 }
      )
    }

    if (!["Activo", "Inactivo", "En Mantenimiento"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado del tótem inválido." },
        { status: 400 }
      )
    }

    if (!usuario || !contraseña) {
      const generated = generateTotemCredentials()
      usuario = usuario || generated.usuario
      contraseña = contraseña || generated.contraseña
    }

    const archivosGuardados = await processTotemMediaFromForm(formData, nombre)

    const req = getTemplateRequirements(plantilla)
    const imageCount = archivosGuardados.filter((a) => a.tipo === "imagen").length
    const videoCount = archivosGuardados.filter((a) => a.tipo === "video").length

    if (imageCount < req.images || videoCount < req.videos) {
      return NextResponse.json(
        {
          error: `La plantilla requiere ${req.images} imagen(es) y ${req.videos} video(s).`,
        },
        { status: 400 }
      )
    }

    const duplicateName = await findDuplicateTotemByName(nombre, campus_id)
    if (duplicateName) {
      return NextResponse.json(
        {
          error: `Ya existe un tótem con el nombre "${nombre.trim()}" en esta sede.`,
        },
        { status: 409 }
      )
    }

    const existingId = await Totem.findOne({ totem_id })
    if (existingId) {
      return NextResponse.json(
        { error: "El identificador del tótem ya existe. Intenta de nuevo." },
        { status: 409 }
      )
    }

    const newTotem = await Totem.create({
      nombre,
      totem_id,
      campus_id,
      plantilla,
      estado,
      credenciales: {
        usuario,
        contraseña,
      },
      contenido: {
        mostrarDesde: mostrarDesde ? new Date(mostrarDesde) : null,
        mostrarHasta: mostrarHasta ? new Date(mostrarHasta) : null,
        archivos: archivosGuardados,
      },
      contenido_count: archivosGuardados.length,
    })

    return NextResponse.json(normalizeTotemDocument(newTotem), { status: 201 })
  } catch (error) {
    console.error("Error POST:", error)
    return NextResponse.json(
      { error: "Error al crear el tótem" },
      { status: 500 }
    )
  }
}
