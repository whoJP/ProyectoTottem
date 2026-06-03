"use client"

import { useEffect, useState } from "react"
import { Download, Eye, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { fetchWithAuth } from "@/lib/fetch-auth"

type NotificationFileActionsProps = {
  notificationId: string
  fileName: string
  contentType?: string | null
  archivoDisponible?: boolean
}

function isImageType(type: string, name: string) {
  if (type.startsWith("image/")) return true
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name)
}

function isVideoType(type: string, name: string) {
  if (type.startsWith("video/")) return true
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(name)
}

export function NotificationFileActions({
  notificationId,
  fileName,
  contentType,
  archivoDisponible = true,
}: NotificationFileActionsProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const mime = contentType || "application/octet-stream"
  const canPreview = isImageType(mime, fileName) || isVideoType(mime, fileName)

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  const fetchBlob = async (download = false) => {
    const url = `/api/notificaciones/${notificationId}/archivo${
      download ? "?download=1" : ""
    }`
    const response = await fetchWithAuth(url)
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      const message =
        typeof data === "object" && data && "error" in data
          ? (data as { error: string }).error
          : "No se pudo obtener el archivo."
      throw new Error(message)
    }
    return response.blob()
  }

  const handleDownload = async () => {
    setDownloading(true)
    setFetchError(null)
    try {
      const blob = await fetchBlob(true)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = fileName
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setFetchError(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el archivo."
      )
    } finally {
      setDownloading(false)
    }
  }

  const handlePreview = async () => {
    setPreviewOpen(true)
    setPreviewError(false)
    setFetchError(null)
    setLoadingPreview(true)

    try {
      if (!blobUrl) {
        const blob = await fetchBlob(false)
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
      }
    } catch (error) {
      setPreviewError(true)
      setFetchError(
        error instanceof Error
          ? error.message
          : "No se pudo previsualizar este archivo."
      )
    } finally {
      setLoadingPreview(false)
    }
  }

  if (!archivoDisponible) {
    return (
      <div className="w-full space-y-1 pt-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <FileText className="h-3 w-3 shrink-0" />
          <span className="truncate">{fileName}</span>
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Archivo no guardado en el servidor (notificación antigua). Envía de nuevo la
          notificación con el adjunto para poder verlo y descargarlo.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2 pt-2 border-t border-border/50">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <FileText className="h-3 w-3 shrink-0" />
        <span className="truncate">{fileName}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {canPreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-border"
            onClick={handlePreview}
          >
            <Eye className="h-3.5 w-3.5" />
            Previsualizar
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 border-border"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Descargar
        </Button>
      </div>

      {fetchError && (
        <p className="text-xs text-amber-600 dark:text-amber-400">{fetchError}</p>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm truncate pr-6">
              {fileName}
            </DialogTitle>
          </DialogHeader>

          {loadingPreview ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : previewError || !blobUrl ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
              No se pudo previsualizar este archivo.
            </div>
          ) : isImageType(mime, fileName) ? (
            <img
              src={blobUrl}
              alt={fileName}
              className="max-h-[60vh] w-full rounded-md object-contain"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <video
              src={blobUrl}
              controls
              className="max-h-[60vh] w-full rounded-md"
              onError={() => setPreviewError(true)}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border gap-1"
              onClick={handleDownload}
            >
              <Download className="h-3 w-3" />
              Descargar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
