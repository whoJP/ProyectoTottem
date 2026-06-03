export type ContentExpiryStatus =
  | { kind: "none" }
  | { kind: "expired"; label: string }
  | { kind: "warning"; label: string; daysLeft: number }

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getContentExpiryInfo(
  mostrarHasta: string | null | undefined
): ContentExpiryStatus {
  if (!mostrarHasta?.trim()) return { kind: "none" }

  const end = startOfDay(new Date(mostrarHasta))
  if (Number.isNaN(end.getTime())) return { kind: "none" }

  const today = startOfDay(new Date())
  const diffMs = end.getTime() - today.getTime()
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    const daysAgo = Math.abs(daysLeft)
    return {
      kind: "expired",
      label:
        daysAgo === 1
          ? "Contenido vencido hace 1 día"
          : `Contenido vencido hace ${daysAgo} días`,
    }
  }

  if (daysLeft <= 7) {
    const fecha = end.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

    if (daysLeft === 0) {
      return { kind: "warning", daysLeft: 0, label: `Vence hoy (${fecha})` }
    }

    if (daysLeft === 1) {
      return { kind: "warning", daysLeft: 1, label: `Vence mañana (${fecha})` }
    }

    return {
      kind: "warning",
      daysLeft,
      label: `Vence en ${daysLeft} días (${fecha})`,
    }
  }

  return { kind: "none" }
}
