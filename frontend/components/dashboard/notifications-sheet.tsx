"use client"

import { useEffect, useState } from "react"
import { Bell, Calendar, Loader2, Monitor } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchWithAuth } from "@/lib/fetch-auth"
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

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setIsLoading(true)

    fetchWithAuth("/api/notificaciones")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data?.items) ? data.items : []
        setItems(list)
        if (typeof data?.count === "number") {
          onCountChange?.(data.count)
        } else {
          onCountChange?.(list.length)
        }
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, onCountChange])

  return (
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
                Mensajes enviados a los tótems
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
              <p className="text-sm">No hay notificaciones registradas.</p>
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
                    {item.createdAt && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDate(item.createdAt)}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-foreground leading-relaxed">
                    {item.mensaje}
                  </p>

                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {item.fechaInicio} → {item.fechaFin}
                  </span>

                  {item.archivo && item.archivo !== "no" && (
                    <NotificationFileActions
                      notificationId={item._id}
                      fileName={item.archivo}
                      contentType={item.archivoContentType}
                      archivoDisponible={item.archivoDisponible ?? Boolean(item.archivoFileId)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
