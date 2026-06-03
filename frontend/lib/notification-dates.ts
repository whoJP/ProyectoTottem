/** Convierte fechas guardadas a formato YYYY-MM-DD para input type="date". */
export function toDateInputValue(value: string | undefined): string {
  if (!value?.trim()) return ""
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0]
  }
  return trimmed
}

export function validateNotificationDateRange(
  fechaInicio: string,
  fechaFin: string
): string | null {
  if (!fechaInicio || !fechaFin) {
    return "Indica fecha de inicio y fecha de fin."
  }
  if (fechaInicio > fechaFin) {
    return "La fecha de inicio no puede ser posterior a la fecha de fin."
  }
  return null
}
