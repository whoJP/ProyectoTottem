import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { requireAuth, getTotemListFilter, resolveCampusIdForWrite, canAccessCampus } from "@/lib/auth"
import { processTotemMediaFromForm } from "@/lib/totem-media"
import { parseArchivosPayload } from "@/lib/totem-media-upload"
import { normalizeCampusId, normalizePlantillaId } from "@/lib/totem-labels"
import { getTemplateRequirements } from "@/lib/totem-templates"
import Totem from "@/models/Totem"
import { findDuplicateTotemByName } from "@/lib/totem-duplicate-name"
import {
  generateTotemCredentials,
  readPasswordFromFormData,
} from "@/lib/totem-credentials"
import {
  formatApiError,
  resolveCampusIdForStorage,
} from "@/lib/totem-campus-storage"

export const runtime = "nodejs"
export const maxDuration = 60

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

type TotemCreatePayload = {
  nombre?: string
  totem_id?: string
  campus_id?: string
  plantilla?: string
  estado?: string
  usuario?: string
  contraseña?: string
  contrasena?: string
  mostrarDesde?: string
  mostrarHasta?: string
  archivos?: unknown
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  try {
    await connectDB()

    const contentType = request.headers.get("content-type") || ""
    const isJson = contentType.includes("application/json")

    let nombre = ""
    let totem_id = ""
    let campusInput = ""
    let plantilla = ""
    let estado = "Activo"
    let usuario = ""
    let contraseña = ""
    let mostrarDesde = ""
    let mostrarHasta = ""
    let archivosGuardados: Awaited<ReturnType<typeof processTotemMediaFromForm>> = []

    if (isJson) {
      let body: TotemCreatePayload
      try {
        body = (await request.json()) as TotemCreatePayload
      } catch {
        return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
      }

      nombre = (body.nombre || "").trim()
      totem_id = (body.totem_id || "").trim()
      campusInput = body.campus_id || ""
      plantilla = normalizePlantillaId(body.plantilla || "")
      estado = (body.estado || "Activo").trim()
      usuario = (body.usuario || "").trim()
      contraseña = (body.contraseña || body.contrasena || "").trim()
      mostrarDesde = body.mostrarDesde || ""
      mostrarHasta = body.mostrarHasta || ""
      archivosGuardados = parseArchivosPayload(body.archivos)
    } else {
      const formData = await request.formData()

      nombre = ((formData.get("nombre") as string) || "").trim()
      totem_id = (formData.get("totem_id") as string)?.trim() || ""
      campusInput = (formData.get("campus_id") as string) || ""
      plantilla = normalizePlantillaId(formData.get("plantilla") as string)
      estado = ((formData.get("estado") as string) || "Activo").trim()
      usuario = ((formData.get("usuario") as string) || "").trim()
      contraseña = readPasswordFromFormData(formData).trim()
      mostrarDesde = (formData.get("mostrarDesde") as string) || ""
      mostrarHasta = (formData.get("mostrarHasta") as string) || ""
      archivosGuardados = await processTotemMediaFromForm(formData, nombre)
    }

    if (!totem_id) {
      totem_id = `TOTEM-${crypto.randomUUID()}`
    }

    const campusNormalized = resolveCampusIdForWrite(authResult.auth, campusInput)
    if (!campusNormalized) {
      return NextResponse.json(
        { error: "No tienes permiso para crear tótems en esta sede." },
        { status: 403 }
      )
    }
    const campus_id = await resolveCampusIdForStorage(campusNormalized)

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

    const duplicateName = await findDuplicateTotemByName(nombre, campusNormalized)
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
      { error: formatApiError(error) },
      { status: 500 }
    )
  }
}
