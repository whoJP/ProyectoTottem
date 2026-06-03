import "@/lib/register-models"
import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Totem from "@/models/Totem"
import Notification from "@/models/Notification"
import { getAppBaseUrl } from "@/lib/app-base-url"
import { loadKioskFaqForTotem } from "@/lib/kiosk-faq"
import {
  buildKioskPayload,
  resolveTotemQuery,
  type KioskFaqPayload,
  type KioskNotificationItem,
} from "@/lib/kiosk-totem"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isNotificationActive(fechaInicio: string, fechaFin: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(fechaInicio)
  const end = new Date(fechaFin)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return today >= start && today <= end
}

async function loadNotifications(
  totemMongoId: string,
  totemIdStr: string,
  baseUrl: string
): Promise<KioskNotificationItem[]> {
  const totemIds = [...new Set([totemIdStr, totemMongoId].filter(Boolean))]
  const docs = await Notification.find({ totem_id: { $in: totemIds } })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()

  return docs
    .filter((doc) =>
      isNotificationActive(String(doc.fechaInicio), String(doc.fechaFin))
    )
    .map((doc) => {
      let archivoUrl: string | null = null
      if (doc.archivo === "si" && doc.archivoFileId) {
        archivoUrl = `${baseUrl}/api/contents/file/${String(doc.archivoFileId)}`
      }
      return {
        id: String(doc._id),
        mensaje: String(doc.mensaje),
        fechaInicio: String(doc.fechaInicio),
        fechaFin: String(doc.fechaFin),
        archivoUrl,
      }
    })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const baseUrl = getAppBaseUrl(request)

    const totem = await Totem.findOne(resolveTotemQuery(id)).populate({
      path: "contenido.archivos.contentId",
      strictPopulate: false,
    })

    if (!totem) {
      return NextResponse.json({ error: "Tótem no encontrado" }, { status: 404 })
    }

    if (totem.estado === "Inactivo") {
      return NextResponse.json(
        { error: "Este tótem está inactivo. Contacte al administrador." },
        { status: 403 }
      )
    }

    if (totem.estado === "En Mantenimiento") {
      return NextResponse.json(
        { error: "Tótem en mantenimiento. Vuelva más tarde." },
        { status: 503 }
      )
    }

    const totemObj = totem.toObject() as Record<string, unknown>
    const mongoId = String(totem._id)
    const totemIdStr = String(totem.totem_id || mongoId)
    const campusId = String(totemObj.campus_id ?? "")

    let faq: KioskFaqPayload | null = null
    let notifications: KioskNotificationItem[] = []

    try {
      const loadedFaq = await loadKioskFaqForTotem(mongoId, totemIdStr, campusId)
      if (loadedFaq) faq = loadedFaq
      console.info(
        "[FAQ kiosk]",
        totemIdStr,
        "items:",
        loadedFaq?.items?.length ?? 0
      )
    } catch (faqError) {
      console.error("FAQ kiosk (no bloquea):", faqError)
    }

    try {
      notifications = await loadNotifications(mongoId, totemIdStr, baseUrl)
    } catch (notifError) {
      console.error("Notificaciones kiosk (no bloquea):", notifError)
    }

    const payload = buildKioskPayload(totemObj, {
      baseUrl,
      faq,
      notifications,
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Error GET kiosk totem:", error)
    const detail =
      error instanceof Error ? error.message : "Error al cargar el tótem"
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? detail
            : "Error al cargar el tótem",
      },
      { status: 500 }
    )
  }
}
