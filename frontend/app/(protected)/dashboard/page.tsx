"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { StatsCardsSkeleton } from "@/components/dashboard/stats-cards-skeleton"
import { TotemsTable } from "@/components/dashboard/totems-table"
import {
  getPlantillaNameFromId,
  getSedeNameFromId,
  normalizeCampusId,
  normalizePlantillaId,
} from "@/lib/totem-labels"
import { formatSyncStatus } from "@/lib/totem-sync-status"
import type { TotemArchivoMeta } from "@/lib/totem-archivos"
import { fetchWithAuth } from "@/lib/fetch-auth"
import { toastError } from "@/lib/fetch-auth"
import type { Totem } from "@/components/dashboard/totems-table"

export default function DashboardPage() {
  const [totems, setTotems] = useState<Totem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTotems = async () => {
    setIsLoading(true)
    const loadStartedAt = Date.now()
    const MIN_LOADING_MS = 550

    try {
      const response = await fetchWithAuth("/api/totems")
      const data = await response.json()

      if (!response.ok) {
        toastError(
          typeof data === "object" && data && "error" in data
            ? (data as { error: string }).error
            : "Error al cargar los tótems"
        )
        setTotems([])
        return
      }

      if (!Array.isArray(data)) {
        setTotems([])
        return
      }

      const mappedData: Totem[] = data.map((item: Record<string, unknown>) => {
        const campusId = normalizeCampusId(item.campus_id as string)
        const plantillaId = normalizePlantillaId(item.plantilla as string)
        const mostrarDesde = (item.contenido as { mostrarDesde?: string })?.mostrarDesde
          ? new Date((item.contenido as { mostrarDesde: string }).mostrarDesde)
              .toISOString()
              .split("T")[0]
          : ""
        const mostrarHasta = (item.contenido as { mostrarHasta?: string })?.mostrarHasta
          ? new Date((item.contenido as { mostrarHasta: string }).mostrarHasta)
              .toISOString()
              .split("T")[0]
          : ""

        const archivosRaw =
          (item.contenido as { archivos?: Array<Record<string, unknown>> })?.archivos ?? []

        const archivos: TotemArchivoMeta[] = archivosRaw
          .map((a) => {
            const content = a.contentId as
              | { fileId?: string; url_contenido?: string }
              | undefined
            const fileId = content?.fileId
            const url = fileId
              ? `/api/contents/file/${fileId}`
              : content?.url_contenido || ""
            if (!url) return null
            const contentId =
              typeof a.contentId === "object" && a.contentId && "_id" in a.contentId
                ? String((a.contentId as { _id: unknown })._id)
                : a.contentId
                  ? String(a.contentId)
                  : undefined

            return {
              slot: String(a.slot),
              tipo: String(a.tipo),
              url,
              contentId,
            }
          })
          .filter((a): a is TotemArchivoMeta => a !== null)

        const estado = item.estado as Totem["estado"]
        const updatedAt = (item.updatedAt as string) || (item.fecha_registro as string)

        return {
          id: String(item._id),
          totemRefId: String(item.totem_id ?? item._id),
          nombre: String(item.nombre),
          tiempoTranscurrido: formatSyncStatus(estado, updatedAt),
          campusId,
          sede: getSedeNameFromId(campusId),
          plantillaId,
          plantilla: getPlantillaNameFromId(plantillaId),
          estado,
          contenido:
            (item.contenido_count as number) ??
            archivos.length ??
            0,
          notificacion: null,
          mostrarDesde,
          mostrarHasta,
          archivos,
          credenciales: item.credenciales as Totem["credenciales"],
        }
      })

      setTotems(mappedData)
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") return
      toastError("No se pudieron cargar los tótems")
    } finally {
      const elapsed = Date.now() - loadStartedAt
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed)
      window.setTimeout(() => setIsLoading(false), remaining)
    }
  }

  useEffect(() => {
    fetchTotems()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <Header />
      {isLoading ? (
        <StatsCardsSkeleton />
      ) : (
        <div className="animate-in fade-in duration-500 fill-mode-both">
          <StatsCards
            totems={totems}
            onRefresh={fetchTotems}
            isRefreshing={isLoading}
          />
        </div>
      )}
      <TotemsTable
        totems={totems}
        setTotems={setTotems}
        fetchTotems={fetchTotems}
        isLoading={isLoading}
        isRefreshing={isLoading}
      />
    </main>
  )
}
