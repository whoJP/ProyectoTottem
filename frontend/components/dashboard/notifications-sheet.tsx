"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Bell,
  Calendar,
  Loader2,
  Monitor,
  Pencil,
  Trash2,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { fetchWithAuth, toastError, toastSuccess } from "@/lib/fetch-auth"
import { NotificationFileActions } from "./notification-file-actions"

export type NotificationItem = {
  _id: string
  totem_id: string
  fechaInicio: string
  fechaFin: string
  mensaje: string
  archivo?: string
  archivoFileId?: string | null
  archivoContentType?: string | null
  archivoDisponible?: boolean
  createdAt?: string
}

type NotificationsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCountChange?: (count: number) => void
}

function formatDate(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function NotificationsSheet({
  open,
  onOpenChange,
  onCountChange,
}: NotificationsSheetProps) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editing, setEditing] = useState<NotificationItem | null>(null)
  const [editForm, setEditForm] = useState({
    totem_id: "",
    fechaInicio: "",
    fechaFin: "",
    mensaje: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetchWithAuth("/api/notificaciones")
      const data = await res.json()
      if (!res.ok) {
        toastError(
          typeof data === "object" && data && "error" in data
            ? (data as { error: string }).error
            : "Error al cargar notificaciones"
        )
        setItems([])
        onCountChange?.(0)
        return
      }
      const list = Array.isArray(data?.items) ? data.items : []
      setItems(list)
      if (typeof data?.count === "number") {
        onCountChange?.(data.count)
      } else {
        onCountChange?.(list.length)
      }
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") return
      setItems([])
      onCountChange?.(0)
    } finally {
      setIsLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    if (!open) return
    loadNotifications()
  }, [open, loadNotifications])

  const openEdit = (item: NotificationItem) => {
    setEditing(item)
    setEditForm({
      totem_id: item.totem_id,
      fechaInicio: item.fechaInicio,
      fechaFin: item.fechaFin,
      mensaje: item.mensaje,
    })
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    if (!editForm.totem_id.trim() || !editForm.fechaInicio || !editForm.fechaFin) {
      toastError("Completa tótem, fecha inicio y fecha fin.")
      return
    }
    if (!editForm.mensaje.trim()) {
      toastError("El mensaje no puede estar vacío.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetchWithAuth(`/api/notificaciones/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toastError(
          typeof data === "object" && data && "error" in data
            ? (data as { error: string }).error
            : "No se pudo guardar la notificación"
        )
        return
      }
      toastSuccess("Notificación actualizada")
      setEditing(null)
      await loadNotifications()
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") return
      toastError("Error de conexión al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetchWithAuth(`/api/notificaciones/${deleteTarget._id}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toastError(
          typeof data === "object" && data && "error" in data
            ? (data as { error: string }).error
            : "No se pudo eliminar"
        )
        return
      }
      toastSuccess("Notificación eliminada")
      setDeleteTarget(null)
      await loadNotifications()
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") return
      toastError("Error de conexión al eliminar")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-card border-border flex flex-col gap-0 p-0"
        >
          <SheetHeader className="border-b border-border px-6 py-5 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/15">
                <Bell className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <SheetTitle className="text-foreground">Notificaciones</SheetTitle>
                <SheetDescription>
                  Mensajes de tus tótems. Puedes editar o eliminar cada una.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 py-4">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                <Bell className="h-8 w-8 opacity-40" />
                <p className="text-sm">No hay notificaciones en tu sede.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item._id}
                    className="rounded-lg border border-border bg-muted/20 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Monitor className="h-4 w-4 shrink-0 text-blue-400" />
                        <span className="text-sm font-medium text-foreground truncate">
                          {item.totem_id}
                        </span>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          title="Eliminar"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-foreground leading-relaxed">
                      {item.mensaje}
                    </p>

                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {item.fechaInicio} → {item.fechaFin}
                    </span>

                    {item.createdAt && (
                      <p className="text-[10px] text-muted-foreground">
                        Registrada: {formatDate(item.createdAt)}
                      </p>
                    )}

                    {item.archivo && item.archivo !== "no" && (
                      <NotificationFileActions
                        notificationId={item._id}
                        fileName={item.archivo}
                        contentType={item.archivoContentType}
                        archivoDisponible={
                          item.archivoDisponible ?? Boolean(item.archivoFileId)
                        }
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(editing)} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar notificación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>ID / referencia del tótem</Label>
              <Input
                value={editForm.totem_id}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, totem_id: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={editForm.fechaInicio}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, fechaInicio: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input
                  type="date"
                  value={editForm.fechaFin}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, fechaFin: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mensaje</Label>
              <Input
                value={editForm.mensaje}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, mensaje: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar notificación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el mensaje
              {deleteTarget?.archivo && deleteTarget.archivo !== "no"
                ? " y su archivo adjunto"
                : ""}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
