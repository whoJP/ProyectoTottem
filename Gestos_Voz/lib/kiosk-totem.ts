import mongoose from "mongoose"
import {
  buildMediaMapsFromArchivos,
  type TotemArchivoMeta,
} from "@/lib/totem-archivos"
import { getContentExpiryInfo } from "@/lib/totem-content-expiry"
import { getTemplateById } from "@/lib/totem-templates"
import {
  normalizeCampusId,
  normalizePlantillaId,
  getSedeNameFromId,
} from "@/lib/totem-labels"

/** Sustituye {{SEDE}} en respuestas FAQ según el campus_id del tótem. */
export function resolveFaqSedeAnswers(
  faq: KioskFaqPayload,
  campusId: string | undefined | null
): KioskFaqPayload {
  const sede = getSedeNameFromId(normalizeCampusId(campusId))
  return {
    ...faq,
    items: faq.items.map((item) => ({
      question: item.question,
      keyword: item.keyword,
      answer: item.answer.replace(/\{\{SEDE\}\}/g, sede),
    })),
  }
}

export type KioskCarouselSlide = {
  id: number
  tag: string
  title: string
  subtitle: string
  image: string
  tipo: "imagen" | "video"
}

export type KioskNotificationItem = {
  id: string
  mensaje: string
  fechaInicio: string
  fechaFin: string
  archivoUrl: string | null
}

export type KioskFaqItem = {
  question: string
  answer: string
  keyword: string
}

export type KioskFaqPayload = {
  title: string
  items: KioskFaqItem[]
}

export type KioskTotemPayload = {
  id: string
  totem_id: string
  nombre: string
  estado: string
  campusId: string
  sede: string
  plantillaId: string
  plantilla: string
  camara: boolean
  microfono: boolean
  contentActive: boolean
  contentExpiryLabel: string | null
  carousel: KioskCarouselSlide[]
  videos: { index: number; url: string }[]
  notifications: KioskNotificationItem[]
  faq: KioskFaqPayload
}

const EMPTY_FAQ: KioskFaqPayload = {
  title: "Preguntas Frecuentes",
  items: [],
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function isContentScheduleActive(
  mostrarDesde?: Date | string | null,
  mostrarHasta?: Date | string | null
): boolean {
  const today = startOfDay(new Date())

  if (mostrarDesde) {
    const desde = startOfDay(new Date(mostrarDesde))
    if (!Number.isNaN(desde.getTime()) && today < desde) return false
  }

  if (mostrarHasta) {
    const hasta = startOfDay(new Date(mostrarHasta))
    if (!Number.isNaN(hasta.getTime()) && today > hasta) return false
  }

  return true
}

function resolveFileUrl(
  content: { fileId?: unknown; url_contenido?: string } | null | undefined,
  baseUrl: string
): string {
  if (!content) return ""
  const fileId = content.fileId
  if (fileId) {
    const id = String(fileId)
    return `${baseUrl}/api/contents/file/${id}`
  }
  const url = content.url_contenido || ""
  if (url.startsWith("http")) return url
  if (url.startsWith("/")) return `${baseUrl}${url}`
  return url
}

export function mapArchivosToMeta(
  archivosRaw: Array<Record<string, unknown>>,
  baseUrl: string
): TotemArchivoMeta[] {
  return archivosRaw
    .map((a) => {
      const content = a.contentId as
        | { fileId?: unknown; url_contenido?: string }
        | undefined
      const url = resolveFileUrl(content, baseUrl)
      if (!url) return null
      return {
        slot: String(a.slot),
        tipo: String(a.tipo),
        url,
      }
    })
    .filter((a): a is TotemArchivoMeta => a !== null)
}

export function buildKioskCarousel(
  archivos: TotemArchivoMeta[],
  nombreTotem: string
): KioskCarouselSlide[] {
  const { baselineImages } = buildMediaMapsFromArchivos(archivos)
  const indices = Object.keys(baselineImages)
    .map(Number)
    .sort((a, b) => a - b)

  if (indices.length === 0) return []

  const total = indices.length
  return indices.map((idx, i) => ({
    id: i + 1,
    tag: "ANUNCIO",
    title: nombreTotem,
    subtitle: total > 1 ? `Imagen ${i + 1} de ${total}` : "Imagen 1",
    image: baselineImages[idx],
    tipo: "imagen" as const,
  }))
}

export function buildKioskVideos(archivos: TotemArchivoMeta[]) {
  const { baselineVideos } = buildMediaMapsFromArchivos(archivos)
  return Object.keys(baselineVideos)
    .map(Number)
    .sort((a, b) => a - b)
    .map((index) => ({ index, url: baselineVideos[index] }))
}

export function buildKioskPayload(
  totem: Record<string, unknown>,
  options: {
    baseUrl: string
    faq?: KioskFaqPayload | null
    notifications?: KioskNotificationItem[]
  }
): KioskTotemPayload {
  const campusId = normalizeCampusId(totem.campus_id as string)
  const plantillaId = normalizePlantillaId(totem.plantilla as string)
  const template = getTemplateById(plantillaId)
  const contenido = (totem.contenido as Record<string, unknown>) || {}
  const mostrarDesde = contenido.mostrarDesde as string | undefined
  const mostrarHasta = contenido.mostrarHasta as string | undefined
  const archivosRaw =
    (contenido.archivos as Array<Record<string, unknown>>) ?? []

  const archivos = mapArchivosToMeta(archivosRaw, options.baseUrl)
  const scheduleActive = isContentScheduleActive(mostrarDesde, mostrarHasta)
  const expiry = getContentExpiryInfo(
    mostrarHasta ? String(mostrarHasta).split("T")[0] : null
  )
  const contentExpiryLabel =
    expiry.kind === "expired" || expiry.kind === "warning"
      ? expiry.label
      : null

  const nombre = String(totem.nombre || "Tótem")
  const carousel = scheduleActive ? buildKioskCarousel(archivos, nombre) : []
  const videos = scheduleActive ? buildKioskVideos(archivos) : []

  return {
    id: String(totem._id),
    totem_id: String(totem.totem_id || totem._id),
    nombre,
    estado: String(totem.estado || "Activo"),
    campusId,
    sede: getSedeNameFromId(campusId),
    plantillaId,
    plantilla: template?.name ?? plantillaId,
    camara: totem.camara !== false,
    microfono: totem.microfono !== false,
    contentActive: scheduleActive && totem.estado === "Activo",
    contentExpiryLabel,
    carousel,
    videos,
    notifications: options.notifications ?? [],
    faq:
      options.faq && options.faq.items.length > 0
        ? options.faq
        : (options.faq ?? EMPTY_FAQ),
  }
}

export function resolveTotemQuery(id: string) {
  const trimmed = id.trim()
  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    return { _id: trimmed }
  }
  return { $or: [{ totem_id: trimmed }, { nombre: trimmed }] }
}
