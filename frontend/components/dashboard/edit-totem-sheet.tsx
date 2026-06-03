"use client"

import { useState, useEffect, ChangeEvent } from "react"
import {
  Pencil,
  Bell,
  Calendar,
  Send,
  Key,
  User,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ImageIcon,
  VideoIcon,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SEDES, getSedeNameFromId } from "@/lib/totem-labels"
import { TOTEM_TEMPLATES, getTemplateById } from "@/lib/totem-templates"
import { buildMediaMapsFromArchivos } from "@/lib/totem-archivos"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { fetchWithAuth, toastError, toastSuccess } from "@/lib/fetch-auth"
import { TotemMediaSlot } from "@/components/dashboard/totem-media-slot"
import { useLoadingOverlay } from "@/components/dashboard/loading-overlay-context"
import type { Totem } from "./totems-table"

type Estado = "Activo" | "Inactivo" | "En Mantenimiento"

interface EditTotemSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totem: Totem | null
  onSave: () => void | Promise<void>
  isSuperAdmin?: boolean
}

export function EditTotemSheet({
  open,
  onOpenChange,
  totem,
  onSave,
  isSuperAdmin = false,
}: EditTotemSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showLoading, hideLoading } = useLoadingOverlay()
  const [nombre, setNombre] = useState("")
  const [selectedSede, setSelectedSede] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedEstado, setSelectedEstado] = useState<Estado>("Activo")

  const [fechaInicioContenido, setFechaInicioContenido] = useState("")
  const [fechaFinContenido, setFechaFinContenido] = useState("")
  const [imagenes, setImagenes] = useState<Record<number, File | null>>({})
  const [videos, setVideos] = useState<Record<number, File | null>>({})
  const [baselineImages, setBaselineImages] = useState<Record<number, string>>({})
  const [baselineVideos, setBaselineVideos] = useState<Record<number, string>>({})

  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificacionInicio, setNotificacionInicio] = useState("")
  const [notificacionFin, setNotificacionFin] = useState("")
  const [notificacionArchivo, setNotificacionArchivo] = useState<File | null>(null)

  const [showPassword, setShowPassword] = useState(false)
  const [copiedUser, setCopiedUser] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [credentials, setCredentials] = useState({ username: "", password: "" })

  const selectedTemplateObj = getTemplateById(selectedTemplate)

  const resetDraftMedia = () => {
    setImagenes({})
    setVideos({})
  }

  useEffect(() => {
    if (!totem) return

    setNombre(totem.nombre)
    setSelectedSede(totem.campusId)
    setSelectedTemplate(totem.plantillaId)
    setSelectedEstado(totem.estado)
    setFechaInicioContenido(totem.mostrarDesde || "")
    setFechaFinContenido(totem.mostrarHasta || "")
    setNotificationMessage(totem.notificacion || "")
    setCredentials({
      username: totem.credenciales?.usuario || "",
      password: totem.credenciales?.contraseña || "",
    })

    const { baselineImages: imgs, baselineVideos: vids } = buildMediaMapsFromArchivos(
      totem.archivos ?? []
    )
    setBaselineImages(imgs)
    setBaselineVideos(vids)
    resetDraftMedia()
  }, [totem])

  const handleSheetOpenChange = (next: boolean) => {
    if (!next) resetDraftMedia()
    onOpenChange(next)
  }

  const countMediaForTemplate = () => {
    if (!selectedTemplateObj) return { images: 0, videos: 0 }
    let images = 0
    let videos = 0
    for (let i = 1; i <= selectedTemplateObj.req.images; i++) {
      if (imagenes[i] || baselineImages[i]) images++
    }
    for (let i = 1; i <= selectedTemplateObj.req.videos; i++) {
      if (videos[i] || baselineVideos[i]) videos++
    }
    return { images, videos }
  }

  const handleCopy = async (text: string, type: "user" | "password") => {
    const ok = await copyToClipboard(text)
    if (!ok) {
      toastError("No se pudo copiar.")
      return
    }
    toastSuccess(type === "user" ? "Usuario copiado" : "Contraseña copiada")
    if (type === "user") {
      setCopiedUser(true)
      setTimeout(() => setCopiedUser(false), 2000)
    } else {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const selectedFile = event.target.files?.[0] || null
    setImagenes((prev) => ({ ...prev, [index]: selectedFile }))
  }

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const selectedFile = event.target.files?.[0] || null
    setVideos((prev) => ({ ...prev, [index]: selectedFile }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setNotificacionArchivo(e.target.files[0])
    }
  }

  const handleEnviarNotificacion = async () => {
    if (!notificationMessage && !notificacionArchivo) {
      toastError("Debes incluir un mensaje o un archivo para la notificación.")
      return
    }

    if (!notificacionInicio || !notificacionFin) {
      toastError("Indica la fecha de inicio y fin de la notificación.")
      return
    }

    const formData = new FormData()
    formData.append("totem_id", totem?.id || "")
    formData.append("fechaInicio", notificacionInicio)
    formData.append("fechaFin", notificacionFin)
    formData.append("mensaje", notificationMessage)

    if (notificacionArchivo) {
      formData.append("archivo", notificacionArchivo)
    }

    try {
      const response = await fetchWithAuth("/api/notificaciones", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        toastSuccess("Notificación enviada correctamente")
        setNotificationMessage("")
        setNotificacionInicio("")
        setNotificacionFin("")
        setNotificacionArchivo(null)
      } else {
        const data = await response.json().catch(() => null)
        toastError(
          typeof data === "object" && data && "error" in data
            ? (data as { error: string }).error
            : "Hubo un error al enviar la notificación."
        )
      }
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") return
      toastError("Error de conexión al enviar la notificación.")
    }
  }

  const handleSave = async () => {
    if (!totem || !selectedTemplate || !selectedTemplateObj) return

    if (!credentials.username.trim() || !credentials.password) {
      toastError("Las credenciales del tótem son obligatorias.")
      return
    }

    const media = countMediaForTemplate()
    if (
      media.images < selectedTemplateObj.req.images ||
      media.videos < selectedTemplateObj.req.videos
    ) {
      toastError(
        `La plantilla requiere ${selectedTemplateObj.req.images} imagen(es) y ${selectedTemplateObj.req.videos} video(s). Sube los archivos que faltan.`
      )
      return
    }

    if (
      fechaInicioContenido &&
      fechaFinContenido &&
      fechaInicioContenido > fechaFinContenido
    ) {
      toastError("La fecha de inicio no puede ser posterior a la fecha de fin.")
      return
    }

    setIsSubmitting(true)
    showLoading("Guardando cambios...")

    try {
      const formData = new FormData()

      formData.append("nombre", nombre.trim())
      formData.append("campus_id", selectedSede)
      formData.append("plantilla", selectedTemplate)
      formData.append("estado", selectedEstado)
      formData.append("usuario", credentials.username.trim())
      formData.append("contraseña", credentials.password)
      formData.append("mostrarDesde", fechaInicioContenido)
      formData.append("mostrarHasta", fechaFinContenido)

      Object.entries(imagenes).forEach(([index, file]) => {
        if (file) formData.append(`imagen${index}`, file)
      })

      Object.entries(videos).forEach(([index, file]) => {
        if (file) formData.append(`video${index}`, file)
      })

      const response = await fetchWithAuth(`/api/totems/${totem.id}`, {
        method: "PUT",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        toastError(
          typeof errorData === "object" && errorData && "error" in errorData
            ? (errorData as { error: string }).error
            : "No se pudieron guardar los cambios del tótem."
        )
        return
      }

      toastSuccess("Cambios guardados correctamente")
      await onSave()
      handleSheetOpenChange(false)
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") return
      toastError("Error de conexión al guardar los cambios.")
    } finally {
      setIsSubmitting(false)
      hideLoading()
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg bg-card border-border p-0 flex flex-col h-full overflow-hidden"
      >
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Pencil className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <SheetTitle className="text-foreground">Editar Totem</SheetTitle>
              <p className="text-sm text-muted-foreground">
                Modifica los datos del totem seleccionado
              </p>
            </div>
          </div>
          <SheetDescription className="sr-only">
            Formulario para editar un totem
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nombre del Totem *
              </Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Totem Lobby Central"
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sede *
              </Label>
              {!isSuperAdmin && selectedSede ? (
                <Input
                  value={getSedeNameFromId(selectedSede)}
                  disabled
                  readOnly
                  className="bg-muted/50 border-border cursor-not-allowed opacity-100"
                />
              ) : (
                <Select value={selectedSede} onValueChange={setSelectedSede}>
                  <SelectTrigger className="w-full bg-muted/50 border-border">
                    <SelectValue placeholder="Selecciona una sede..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {SEDES.map((sede) => (
                      <SelectItem key={sede.id} value={sede.id}>
                        {sede.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Seleccionar Plantilla *
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {TOTEM_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-2 rounded-lg border transition-all",
                      selectedTemplate === template.id
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full aspect-[3/4] rounded-md flex items-center justify-center",
                        template.color
                      )}
                    >
                      <div className="w-3/4 h-3/4 rounded border-2 border-white/30 flex flex-col gap-1 p-1">
                        <div className="w-full h-2 bg-white/30 rounded-sm" />
                        <div className="w-2/3 h-2 bg-white/30 rounded-sm" />
                        <div className="flex-1 w-full bg-white/20 rounded-sm mt-1" />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-xs text-center leading-tight",
                        selectedTemplate === template.id
                          ? "text-cyan-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {template.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/10">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contenido de la Plantilla
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Mostrar desde</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={fechaInicioContenido}
                      onChange={(e) => setFechaInicioContenido(e.target.value)}
                      className="pl-10 bg-muted/50 border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Mostrar hasta</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={fechaFinContenido}
                      onChange={(e) => setFechaFinContenido(e.target.value)}
                      className="pl-10 bg-muted/50 border-border"
                    />
                  </div>
                </div>
              </div>

              {selectedTemplateObj ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: selectedTemplateObj.req.images }).map((_, i) => {
                    const index = i + 1
                    return (
                      <TotemMediaSlot
                        key={`img-${index}`}
                        tipo="imagen"
                        label={`Imagen Carrusel ${index}`}
                        serverUrl={baselineImages[index]}
                        draftFile={imagenes[index] ?? null}
                        onFileChange={(e) => handleImageChange(e, index)}
                        onClear={() =>
                          setImagenes((prev) => ({ ...prev, [index]: null }))
                        }
                      />
                    )
                  })}

                  {Array.from({ length: selectedTemplateObj.req.videos }).map((_, i) => {
                    const index = i + 1
                    return (
                      <TotemMediaSlot
                        key={`vid-${index}`}
                        tipo="video"
                        label={`Video Principal ${index}`}
                        serverUrl={baselineVideos[index]}
                        draftFile={videos[index] ?? null}
                        onFileChange={(e) => handleVideoChange(e, index)}
                        onClear={() =>
                          setVideos((prev) => ({ ...prev, [index]: null }))
                        }
                      />
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Selecciona una plantilla para ver los archivos multimedia.
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Solo se actualizan los archivos que vuelvas a subir. Los demás se mantienen.
              </p>
            </div>

            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Credenciales del Tótem
                  </Label>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30"
                >
                  Desde la base de datos
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Usuario del Tótem</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={credentials.username}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, username: e.target.value }))
                    }
                    className="pl-10 pr-10 bg-muted/50 border-border font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(credentials.username, "user")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedUser ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="pl-10 pr-20 bg-muted/50 border-border font-mono"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(credentials.password, "password")}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedPassword ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Estos valores se leen y guardan en MongoDB dentro del documento del tótem
                (campo <span className="font-mono">credenciales</span>).
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEstado("Activo")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border text-sm transition-all",
                    selectedEstado === "Activo"
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Activo
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEstado("Inactivo")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border text-sm transition-all",
                    selectedEstado === "Inactivo"
                      ? "border-slate-500 bg-slate-500/20 text-slate-400"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  Inactivo
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEstado("En Mantenimiento")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border text-sm transition-all",
                    selectedEstado === "En Mantenimiento"
                      ? "border-amber-500 bg-amber-500/20 text-amber-400"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  En Mantenimiento
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Enviar Notificación al Totem
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Fecha de Inicio</Label>
                  <Input
                    type="date"
                    value={notificacionInicio}
                    onChange={(e) => setNotificacionInicio(e.target.value)}
                    className="bg-muted/50 border-border text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Fecha de Fin</Label>
                  <Input
                    type="date"
                    value={notificacionFin}
                    onChange={(e) => setNotificacionFin(e.target.value)}
                    className="bg-muted/50 border-border text-sm"
                  />
                </div>
              </div>

              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Escribe el mensaje de la notificación..."
                className="bg-muted/50 border-border min-h-[80px] resize-none"
              />

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-border"
                    type="button"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Adjuntar imagen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-border"
                    type="button"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <VideoIcon className="w-3.5 h-3.5" />
                    Adjuntar video
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-border ml-auto hover:bg-slate-800"
                    type="button"
                    onClick={handleEnviarNotificacion}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar
                  </Button>
                </div>

                {notificacionArchivo && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-emerald-500">
                      ✓ Archivo listo: {notificacionArchivo.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => {
                        setNotificacionArchivo(null)
                        const input = document.getElementById(
                          "file-upload"
                        ) as HTMLInputElement | null
                        if (input) input.value = ""
                      }}
                    >
                      Quitar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="p-6 pt-4 border-t border-border flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 border-border"
            onClick={() => handleSheetOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
