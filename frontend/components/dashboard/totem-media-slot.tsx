"use client"

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { Image as ImageIconFile, Video as VideoIconFile, Loader2, Upload, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuthMediaUrl } from "@/hooks/use-auth-media-url"
import { cn } from "@/lib/utils"

type TotemMediaSlotProps = {
  tipo: "imagen" | "video"
  label: string
  serverUrl?: string | null
  draftFile?: File | null
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
}

function fileMatchesTipo(file: File, tipo: "imagen" | "video") {
  if (tipo === "imagen") return file.type.startsWith("image/")
  return file.type.startsWith("video/")
}

export function TotemMediaSlot({
  tipo,
  label,
  serverUrl,
  draftFile,
  onFileChange,
  onClear,
}: TotemMediaSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { blobUrl: serverBlob, loading } = useAuthMediaUrl(
    draftFile ? null : serverUrl ?? null
  )
  const [draftBlob, setDraftBlob] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!draftFile) {
      setDraftBlob(null)
      return
    }
    const url = URL.createObjectURL(draftFile)
    setDraftBlob(url)
    return () => URL.revokeObjectURL(url)
  }, [draftFile])

  const displayUrl = draftBlob ?? serverBlob
  const fileName = draftFile?.name
  const hoverColor =
    tipo === "imagen"
      ? "hover:border-cyan-500/50 hover:bg-cyan-500/5"
      : "hover:border-purple-500/50 hover:bg-purple-500/5"
  const iconHover = tipo === "imagen" ? "group-hover:text-cyan-400" : "group-hover:text-purple-400"
  const dragColor =
    tipo === "imagen"
      ? "border-cyan-500/60 bg-cyan-500/10 ring-2 ring-cyan-500/25"
      : "border-purple-500/60 bg-purple-500/10 ring-2 ring-purple-500/25"

  const applyFile = (file: File | null | undefined) => {
    if (!file || !fileMatchesTipo(file, tipo)) return
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    const syntheticEvent = {
      target: { files: dataTransfer.files },
    } as ChangeEvent<HTMLInputElement>
    onFileChange(syntheticEvent)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    applyFile(event.dataTransfer.files?.[0])
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-dashed border-border transition-all group overflow-hidden min-h-[120px]",
        hoverColor,
        isDragging && dragColor
      )}
    >
      <Input
        ref={inputRef}
        type="file"
        accept={tipo === "imagen" ? "image/*" : "video/*"}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        onChange={onFileChange}
      />

      {draftFile && onClear && (
        <button
          type="button"
          title="Quitar archivo seleccionado"
          className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/40 shadow-sm"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            if (inputRef.current) inputRef.current.value = ""
            onClear()
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {loading && !draftFile && serverUrl ? (
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      ) : displayUrl && tipo === "imagen" ? (
        <img
          src={displayUrl}
          alt={label}
          className="w-full h-20 object-cover rounded-md pointer-events-none"
        />
      ) : displayUrl && tipo === "video" ? (
        <video
          src={displayUrl}
          className="w-full h-20 object-cover rounded-md pointer-events-none"
          muted
          playsInline
        />
      ) : tipo === "imagen" ? (
        <ImageIconFile
          className={cn("w-6 h-6 text-muted-foreground transition-colors", iconHover)}
        />
      ) : (
        <VideoIconFile
          className={cn("w-6 h-6 text-muted-foreground transition-colors", iconHover)}
        />
      )}

      <span className="text-sm text-foreground text-center z-[1] px-1">
        {fileName
          ? fileName.length > 22
            ? `${fileName.slice(0, 22)}...`
            : fileName
          : label}
      </span>
      <span className="text-xs text-muted-foreground z-[1] text-center px-1">
        {isDragging
          ? "Suelta el archivo aquí"
          : draftFile
            ? "Nuevo archivo"
            : displayUrl
              ? "Arrastra o clic para reemplazar"
              : "Arrastra o clic para subir"}
      </span>
      {!displayUrl && !isDragging && (
        <Upload className="w-3.5 h-3.5 text-muted-foreground/60 z-[1]" />
      )}
    </div>
  )
}
