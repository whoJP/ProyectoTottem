export const TOTEM_MEDIA_FIELDS = [
  { key: "imagen1", slot: "Imagen Carrusel 1", tipo: "imagen" as const },
  { key: "imagen2", slot: "Imagen Carrusel 2", tipo: "imagen" as const },
  { key: "imagen3", slot: "Imagen Carrusel 3", tipo: "imagen" as const },
  { key: "imagen4", slot: "Imagen Carrusel 4", tipo: "imagen" as const },
  { key: "imagen5", slot: "Imagen Carrusel 5", tipo: "imagen" as const },
  { key: "video1", slot: "Video Principal 1", tipo: "video" as const },
  { key: "video2", slot: "Video Principal 2", tipo: "video" as const },
] as const

export function resolveTotemMediaField(key: string) {
  return TOTEM_MEDIA_FIELDS.find((item) => item.key === key) ?? null
}
