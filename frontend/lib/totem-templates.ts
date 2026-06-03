import { PLANTILLAS } from "@/lib/totem-labels"

export type TotemTemplateDef = {
  id: string
  name: string
  color: string
  req: { images: number; videos: number }
}

export const TOTEM_TEMPLATES: TotemTemplateDef[] = [
  { id: "clasica", name: "Plantilla Clásica", color: "bg-emerald-600", req: { images: 3, videos: 1 } },
  { id: "eventos", name: "Plantilla Eventos", color: "bg-purple-600", req: { images: 5, videos: 2 } },
  { id: "promocional", name: "Plantilla Promocional", color: "bg-amber-600", req: { images: 2, videos: 1 } },
  { id: "minimal", name: "Plantilla Minimal", color: "bg-teal-600", req: { images: 4, videos: 0 } },
  { id: "corporativa", name: "Plantilla Corporativa", color: "bg-blue-600", req: { images: 3, videos: 2 } },
  { id: "directorio", name: "Plantilla Directorio", color: "bg-pink-600", req: { images: 0, videos: 1 } },
]

export function getTemplateById(id: string | null | undefined) {
  return TOTEM_TEMPLATES.find((t) => t.id === id) ?? null
}

export function getTemplateRequirements(plantillaId: string) {
  return getTemplateById(plantillaId)?.req ?? { images: 0, videos: 0 }
}

/** Nombres de plantilla desde totem-labels para consistencia */
export const PLANTILLA_IDS = PLANTILLAS.map((p) => p.id)
