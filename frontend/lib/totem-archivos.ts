export type TotemArchivoMeta = {
  slot: string
  tipo: string
  url: string
  contentId?: string
}

export function slotToImageIndex(slot: string): number | null {
  const match = slot.match(/Imagen Carrusel (\d+)/i)
  return match ? Number.parseInt(match[1], 10) : null
}

export function slotToVideoIndex(slot: string): number | null {
  const match = slot.match(/Video Principal (\d+)/i)
  return match ? Number.parseInt(match[1], 10) : null
}

export function buildMediaMapsFromArchivos(archivos: TotemArchivoMeta[]) {
  const baselineImages: Record<number, string> = {}
  const baselineVideos: Record<number, string> = {}

  for (const archivo of archivos) {
    const imgIdx = slotToImageIndex(archivo.slot)
    if (imgIdx != null) {
      baselineImages[imgIdx] = archivo.url
      continue
    }
    const vidIdx = slotToVideoIndex(archivo.slot)
    if (vidIdx != null) {
      baselineVideos[vidIdx] = archivo.url
    }
  }

  return { baselineImages, baselineVideos }
}
