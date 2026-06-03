"use client"

import { useMemo, useState, useEffect } from "react"
import {
  Monitor,
  MapPin,
  FileText,
  Eye,
  Pencil,
  Trash2,
  Plus,
  List,
  Search,
  RotateCcw,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NewTotemSheet } from "./new-totem-sheet"
import { EditTotemSheet } from "./edit-totem-sheet"
import { CredentialsDialog } from "./credentials-dialog"
import { DeleteTotemDialog } from "./delete-totem-dialog"
import { useLoadingOverlay } from "./loading-overlay-context"
import { SEDES } from "@/lib/totem-labels"
import { getContentExpiryInfo } from "@/lib/totem-content-expiry"
import type { TotemArchivoMeta } from "@/lib/totem-archivos"
import { fetchWithAuth, getStoredAdmin, isStoredSuperAdmin, toastError, toastSuccess } from "@/lib/fetch-auth"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export interface Totem {
  id: string
  /** Identificador de negocio del tótem (TOTEM-xxx), para notificaciones y kiosk */
  totemRefId: string
  nombre: string
  tiempoTranscurrido: string
  sede: string
  campusId: string
  plantilla: string
  plantillaId: string
  estado: "Activo" | "Inactivo" | "En Mantenimiento"
  contenido: number
  notificacion: string | null
  mostrarDesde: string
  mostrarHasta: string
  archivos?: TotemArchivoMeta[]
  credenciales?: {
    usuario: string
    contraseña: string
  }
}

const ESTADOS = ["Activo", "Inactivo", "En Mantenimiento"] as const
const FILTER_ALL = "__all__"

function getStatusBadge(estado: Totem["estado"]) {
  switch (estado) {
    case "Activo":
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Activo
        </Badge>
      )
    case "Inactivo":
      return (
        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5" />
          Inactivo
        </Badge>
      )
    case "En Mantenimiento":
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          En Mantenimiento
        </Badge>
      )
    default:
      return null
  }
}

function ContentExpiryBadge({ mostrarHasta }: { mostrarHasta: string }) {
  const info = getContentExpiryInfo(mostrarHasta)
  if (info.kind === "none") return null

  if (info.kind === "expired") {
    return (
      <Badge className="mt-1 bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-[10px] font-normal">
        {info.label}
      </Badge>
    )
  }

  return (
    <Badge className="mt-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-normal">
      {info.label}
    </Badge>
  )
}

function matchesSearch(nombre: string, query: string) {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (tokens.length === 0) return true
  const haystack = nombre.toLowerCase()
  return tokens.every((token) => haystack.includes(token))
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-4" aria-busy="true" aria-label="Cargando tótems">
      <p className="text-xs text-muted-foreground animate-pulse">Cargando lista de tótems...</p>

      {/* Escritorio: filas tipo tabla */}
      <div className="hidden lg:block space-y-0 rounded-lg border border-border overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-border bg-muted/30">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`h-${i}`} className="h-3 flex-1 max-w-[80px]" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-b-0"
          >
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 min-w-[120px]">
              <Skeleton className="h-4 w-[70%] max-w-[200px]" />
              <Skeleton className="h-3 w-[45%] max-w-[120px]" />
            </div>
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-6 w-24 shrink-0" />
            <Skeleton className="h-6 w-16 shrink-0" />
            <Skeleton className="h-4 w-8 shrink-0" />
            <Skeleton className="h-8 w-20 shrink-0" />
          </div>
        ))}
      </div>

      {/* Móvil: tarjetas */}
      <div className="lg:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-muted/10 p-4 space-y-3"
          >
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-3 w-[50%]" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full shrink-0" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TotemMobileCard({
  totem,
  onViewCredentials,
  onEdit,
  onDelete,
}: {
  totem: Totem
  onViewCredentials: (totem: Totem) => void
  onEdit: (totem: Totem) => void
  onDelete: (totem: Totem) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <Monitor className="w-5 h-5 text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-foreground truncate">{totem.nombre}</p>
          <p className="text-[10px] text-muted-foreground">{totem.tiempoTranscurrido}</p>
          {totem.mostrarHasta && (
            <ContentExpiryBadge mostrarHasta={totem.mostrarHasta} />
          )}
        </div>
        {getStatusBadge(totem.estado)}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{totem.sede}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span>{totem.contenido} contenidos</span>
        </div>
      </div>

      <Badge
        variant="outline"
        className="bg-blue-500/5 text-blue-400 border-blue-500/20 text-[10px]"
      >
        {totem.plantilla}
      </Badge>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-border flex-1 sm:flex-none"
          onClick={() => onViewCredentials(totem)}
        >
          <Eye className="w-3.5 h-3.5" />
          Credenciales
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-400 hover:bg-blue-500/10"
          onClick={() => onEdit(totem)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-400 hover:bg-red-500/10"
          onClick={() => onDelete(totem)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function TotemsTable({
  totems,
  setTotems,
  fetchTotems,
  isLoading,
  isRefreshing = false,
}: {
  totems: Totem[]
  setTotems: React.Dispatch<React.SetStateAction<Totem[]>>
  fetchTotems: () => Promise<void>
  isLoading: boolean
  isRefreshing?: boolean
}) {
  const { showLoading, hideLoading } = useLoadingOverlay()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false)

  const [selectedTotem, setSelectedTotem] = useState<Totem | null>(null)
  const [totemToEdit, setTotemToEdit] = useState<Totem | null>(null)
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [sedeFilter, setSedeFilter] = useState(FILTER_ALL)
  const [estadoFilter, setEstadoFilter] = useState(FILTER_ALL)
  const [clearFeedback, setClearFeedback] = useState(false)
  const [filterToolbarPulse, setFilterToolbarPulse] = useState(0)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [lockedCampusId, setLockedCampusId] = useState<string | null>(null)
  const [totemToDelete, setTotemToDelete] = useState<Totem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(isLoading)

  useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true)
      return
    }

    const timer = window.setTimeout(() => setShowSkeleton(false), 550)
    return () => window.clearTimeout(timer)
  }, [isLoading])

  useEffect(() => {
    const admin = getStoredAdmin()
    setIsSuperAdmin(isStoredSuperAdmin(admin))
    setLockedCampusId(admin?.campus_id ?? null)
  }, [])

  const filteredTotems = useMemo(() => {
    return totems.filter((totem) => {
      if (!matchesSearch(totem.nombre, searchQuery)) return false
      if (sedeFilter !== FILTER_ALL && totem.campusId !== sedeFilter) return false
      if (estadoFilter !== FILTER_ALL && totem.estado !== estadoFilter) return false
      return true
    })
  }, [totems, searchQuery, sedeFilter, estadoFilter])

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    (isSuperAdmin && sedeFilter !== FILTER_ALL) ||
    estadoFilter !== FILTER_ALL

  const pulseFilters = () => {
    setFilterToolbarPulse((n) => n + 1)
  }

  const handleClearFilters = () => {
    if (!hasActiveFilters) return

    setClearFeedback(true)
    setSearchQuery("")
    setSedeFilter(FILTER_ALL)
    setEstadoFilter(FILTER_ALL)
    pulseFilters()
    toastSuccess("Filtros restablecidos")

    window.setTimeout(() => setClearFeedback(false), 700)
  }

  const filterControlActive =
    "ring-2 ring-blue-500/45 border-blue-500/60 bg-blue-500/8 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]"

  const handleViewCredentials = (totem: Totem) => {
    setSelectedTotem(totem)
    setCredentials({
      username: totem.credenciales?.usuario || "No asignado",
      password: totem.credenciales?.contraseña || "No asignada",
    })
    setCredentialsDialogOpen(true)
  }

  const handleEditClick = (totem: Totem) => {
    setTotemToEdit(totem)
    setEditSheetOpen(true)
  }

  const handleDeleteClick = (totem: Totem) => {
    setTotemToDelete(totem)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!totemToDelete) return

    showLoading("Eliminando tótem...")

    try {
      const response = await fetchWithAuth(`/api/totems/${totemToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toastSuccess("Tótem eliminado correctamente")
        setTotems((prev) => prev.filter((t) => t.id !== totemToDelete.id))
        await fetchTotems()
      } else {
        const data = await response.json().catch(() => null)
        toastError(
          typeof data === "object" && data && "error" in data
            ? (data as { error: string }).error
            : "Error al eliminar el tótem"
        )
        throw new Error("delete_failed")
      }
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") return
      if (error instanceof Error && error.message === "delete_failed") return
      toastError("Error de conexión al eliminar")
      throw error
    } finally {
      hideLoading()
    }
  }

  const countLabel =
    filteredTotems.length === totems.length
      ? `${totems.length} registros`
      : `${filteredTotems.length} de ${totems.length} registros`

  return (
    <div className="px-6 pb-6">
      <NewTotemSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={fetchTotems}
        lockedCampusId={lockedCampusId}
        isSuperAdmin={isSuperAdmin}
      />

      <EditTotemSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        totem={totemToEdit}
        onSave={fetchTotems}
        isSuperAdmin={isSuperAdmin}
      />

      <CredentialsDialog
        open={credentialsDialogOpen}
        onOpenChange={setCredentialsDialogOpen}
        totemName={selectedTotem?.nombre || ""}
        username={credentials.username}
        password={credentials.password}
      />

      <DeleteTotemDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        totem={totemToDelete}
        onConfirm={handleConfirmDelete}
      />

      <Card className="bg-card border-border">
        <div className="flex flex-col gap-3 p-4 border-b border-border lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <List className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Lista de Tótems</h3>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              {countLabel}
            </Badge>
            {hasActiveFilters && (
              <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30 text-[10px]">
                Filtros activos
              </Badge>
            )}
          </div>

          <div
            key={filterToolbarPulse}
            className={cn(
              "flex flex-1 flex-wrap items-center gap-2 justify-end min-w-0 rounded-lg transition-shadow duration-300",
              clearFeedback && "ring-2 ring-emerald-500/35 bg-emerald-500/5 px-1 py-1 -mx-1"
            )}
          >
            <div className="relative w-full sm:w-[200px] lg:max-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  pulseFilters()
                }}
                placeholder="Buscar tótem..."
                className={cn(
                  "h-9 pl-8 bg-muted/50 border-border text-sm transition-all duration-200",
                  searchQuery.trim() !== "" && filterControlActive
                )}
              />
            </div>

            {isSuperAdmin && (
              <Select
                value={sedeFilter}
                onValueChange={(value) => {
                  setSedeFilter(value)
                  pulseFilters()
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-9 w-full sm:w-auto sm:min-w-[168px] bg-muted/50 border-border text-sm [&>span]:line-clamp-1 transition-all duration-200",
                    sedeFilter !== FILTER_ALL && filterControlActive
                  )}
                >
                  <SelectValue placeholder="Sede" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value={FILTER_ALL}>Todas las sedes</SelectItem>
                  {SEDES.map((sede) => (
                    <SelectItem key={sede.id} value={sede.id}>
                      {sede.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={estadoFilter}
              onValueChange={(value) => {
                setEstadoFilter(value)
                pulseFilters()
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-9 w-full sm:w-auto sm:min-w-[188px] bg-muted/50 border-border text-sm [&>span]:line-clamp-1 transition-all duration-200",
                  estadoFilter !== FILTER_ALL && filterControlActive
                )}
              >
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value={FILTER_ALL}>Todos los estados</SelectItem>
                {ESTADOS.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-1.5 border-border shrink-0 transition-all duration-300",
                hasActiveFilters &&
                  "border-blue-500/40 hover:bg-blue-500/10 hover:border-blue-500/50",
                clearFeedback &&
                  "scale-[0.98] ring-2 ring-emerald-500/50 border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              )}
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              <RotateCcw
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-500",
                  clearFeedback && "rotate-[-360deg]"
                )}
              />
              Limpiar
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-border shrink-0"
              onClick={() => fetchTotems()}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw
                className={cn(
                  "w-3.5 h-3.5",
                  (isLoading || isRefreshing) && "animate-spin"
                )}
              />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>

            <Button
              className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 hidden sm:flex"
              onClick={() => setSheetOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Nuevo Tótem
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[280px]">
          {showSkeleton ? (
            <TableSkeleton />
          ) : filteredTotems.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm px-4 text-center">
              {totems.length === 0
                ? "No hay tótems registrados."
                : "No hay tótems que coincidan con los filtros."}
            </div>
          ) : (
            <>
              <div className="lg:hidden space-y-3 p-4">
                {filteredTotems.map((totem) => (
                  <TotemMobileCard
                    key={totem.id}
                    totem={totem}
                    onViewCredentials={handleViewCredentials}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>

              <table className="w-full hidden lg:table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Nombre
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Sede
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Plantilla
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Estado
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Contenido
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Credenciales
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTotems.map((totem) => (
                  <tr
                    key={totem.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{totem.nombre}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {totem.tiempoTranscurrido}
                          </p>
                          {totem.mostrarHasta && (
                            <ContentExpiryBadge mostrarHasta={totem.mostrarHasta} />
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-sm">{totem.sede}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className="bg-blue-500/5 text-blue-400 border-blue-500/20 text-[10px]"
                      >
                        {totem.plantilla}
                      </Badge>
                    </td>

                    <td className="px-4 py-4">{getStatusBadge(totem.estado)}</td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-sm">{totem.contenido}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs hover:bg-emerald-500/10 hover:text-emerald-400"
                        onClick={() => handleViewCredentials(totem)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </Button>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-400 hover:bg-blue-500/10"
                          onClick={() => handleEditClick(totem)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeleteClick(totem)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}
        </div>
      </Card>

      <Button
        type="button"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg shadow-emerald-600/30 bg-emerald-600 hover:bg-emerald-700 text-white sm:hidden"
        onClick={() => setSheetOpen(true)}
        aria-label="Nuevo tótem"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  )
}
