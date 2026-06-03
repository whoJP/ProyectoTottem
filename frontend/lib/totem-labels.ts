const SEDES = [
  { id: "cochabamba", name: "Cochabamba" },
  { id: "santa-cruz", name: "Santa Cruz" },
  { id: "la-paz", name: "La Paz" },
] as const

const PLANTILLAS = [
  { id: "clasica", name: "Plantilla Clásica" },
  { id: "eventos", name: "Plantilla Eventos" },
  { id: "promocional", name: "Plantilla Promocional" },
  { id: "minimal", name: "Plantilla Minimal" },
  { id: "corporativa", name: "Plantilla Corporativa" },
  { id: "directorio", name: "Plantilla Directorio" },
] as const

const SEDE_NAME_TO_ID: Record<string, string> = {
  Cochabamba: "cochabamba",
  "Santa Cruz": "santa-cruz",
  "La Paz": "la-paz",
}

/** Variantes de texto que pueden existir en MongoDB (legacy / importación). */
const CAMPUS_ALIASES: Record<string, string[]> = {
  cochabamba: ["cochabamba", "Cochabamba", "COCHABAMBA", "cochabamba_bolivia"],
  "santa-cruz": [
    "santa-cruz",
    "santa_cruz",
    "santacruz",
    "Santa Cruz",
    "SANTA CRUZ",
    "SantaCruz",
  ],
  "la-paz": ["la-paz", "la_paz", "lapaz", "La Paz", "LA PAZ", "LaPaz"],
}

const PLANTILLA_NAME_TO_ID: Record<string, string> = {
  "Plantilla Clásica": "clasica",
  "Plantilla Eventos": "eventos",
  "Plantilla Promocional": "promocional",
  "Plantilla Minimal": "minimal",
  "Plantilla Corporativa": "corporativa",
  "Plantilla Directorio": "directorio",
}

function slugCampusKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]+/g, "-")
}

export function normalizeCampusId(value: string | undefined | null): string {
  if (!value?.trim()) return "cochabamba"
  const trimmed = value.trim()
  if (SEDE_NAME_TO_ID[trimmed]) return SEDE_NAME_TO_ID[trimmed]
  if (SEDES.some((s) => s.id === trimmed)) return trimmed

  const slug = slugCampusKey(trimmed)
  if (slug.includes("santa") && slug.includes("cruz")) return "santa-cruz"
  if (slug.includes("la") && slug.includes("paz")) return "la-paz"
  if (slug.includes("cochabamba")) return "cochabamba"

  for (const sede of SEDES) {
    if (CAMPUS_ALIASES[sede.id].some((alias) => slugCampusKey(alias) === slug)) {
      return sede.id
    }
  }

  return "cochabamba"
}

/** Valores posibles de campus_id en BD para consultas $in. */
export function getCampusIdVariants(normalizedCampusId: string): string[] {
  const id = normalizeCampusId(normalizedCampusId)
  const name = getSedeNameFromId(id)
  const fromMap = CAMPUS_ALIASES[id] ?? []
  return [...new Set([id, name, ...fromMap])]
}

export function normalizePlantillaId(value: string | undefined | null): string {
  if (!value?.trim()) return "clasica"
  const trimmed = value.trim()
  if (PLANTILLA_NAME_TO_ID[trimmed]) return PLANTILLA_NAME_TO_ID[trimmed]
  if (PLANTILLAS.some((p) => p.id === trimmed)) return trimmed
  return "clasica"
}

export function getSedeNameFromId(id: string): string {
  return SEDES.find((s) => s.id === id)?.name ?? id
}

export function getPlantillaNameFromId(id: string): string {
  return PLANTILLAS.find((p) => p.id === id)?.name ?? id
}

/** Texto que el admin debe escribir para confirmar borrado según sede */
export function getSedeDeleteConfirmation(campusId: string): string {
  const normalized = normalizeCampusId(campusId)
  const map: Record<string, string> = {
    cochabamba: "COCHABAMBA",
    "la-paz": "LA PAZ",
    "santa-cruz": "SANTA CRUZ",
  }
  return map[normalized] ?? getSedeNameFromId(normalized).toUpperCase()
}

export { SEDES, PLANTILLAS }
