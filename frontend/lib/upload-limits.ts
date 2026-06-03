/** Tamaño de cada parte en subidas grandes (por debajo del límite de Vercel). */
export const CHUNK_UPLOAD_SIZE_BYTES = 3 * 1024 * 1024

/** Subida directa en una petición (límite Vercel ~4.5 MB). */
export const MAX_TOTEM_MEDIA_BYTES = 4 * 1024 * 1024

/** Videos/archivos grandes: subida por partes (varias peticiones pequeñas). */
export const MAX_TOTEM_MEDIA_CHUNKED_BYTES = 50 * 1024 * 1024

export const MAX_TOTEM_MEDIA_MB = 4
export const MAX_TOTEM_VIDEO_MB = 50

export function formatMaxMediaSizeMessage(): string {
  return `Las imágenes deben pesar como máximo ${MAX_TOTEM_MEDIA_MB} MB. Los videos pueden llegar a ${MAX_TOTEM_VIDEO_MB} MB (se suben por partes).`
}

export function formatMaxChunkedMediaSizeMessage(): string {
  return `El archivo supera el máximo permitido (${MAX_TOTEM_VIDEO_MB} MB).`
}

export function isMediaWithinDirectLimit(size: number): boolean {
  return size > 0 && size <= MAX_TOTEM_MEDIA_BYTES
}

export function isMediaWithinChunkedLimit(size: number): boolean {
  return size > 0 && size <= MAX_TOTEM_MEDIA_CHUNKED_BYTES
}

/** @deprecated usar isMediaWithinDirectLimit o isMediaWithinChunkedLimit */
export function isMediaWithinLimit(size: number): boolean {
  return isMediaWithinChunkedLimit(size)
}

export function needsChunkedUpload(size: number): boolean {
  return size > MAX_TOTEM_MEDIA_BYTES
}
