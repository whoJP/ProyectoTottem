type TotemEstado = "Activo" | "Inactivo" | "En Mantenimiento"

export function formatSyncStatus(
  estado: TotemEstado,
  updatedAt?: string | Date | null
): string {
  if (estado === "Inactivo") return "Desconectado"
  if (estado === "En Mantenimiento") return "En mantenimiento"

  if (!updatedAt) return "En línea"

  const updated = updatedAt instanceof Date ? updatedAt : new Date(updatedAt)
  if (Number.isNaN(updated.getTime())) return "En línea"

  const diffMs = Date.now() - updated.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 5) return "En línea"
  if (diffMin < 60) return `Última sync: hace ${diffMin} min`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) {
    return diffHours === 1 ? "Última sync: hace 1 h" : `Última sync: hace ${diffHours} h`
  }

  const diffDays = Math.floor(diffHours / 24)
  return diffDays === 1 ? "Última sync: hace 1 día" : `Última sync: hace ${diffDays} días`
}
