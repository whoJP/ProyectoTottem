"use client"

import { useState, useEffect, ChangeEvent } from "react"
import {
  Plus,
  Calendar,
  Image as ImageIconFile,
  Video as VideoIconFile,
  Key,
  User,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ImageIcon,
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
import { TotemMediaSlot } from "@/components/dashboard/totem-media-slot"
import { ConfirmCreateTotemDialog } from "@/components/dashboard/confirm-create-totem-dialog"
import { useLoadingOverlay } from "@/components/dashboard/loading-overlay-context"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { fetchWithAuth, toastError, toastSuccess } from "@/lib/fetch-auth"

type Estado = "Activo" | "Inactivo" | "En Mantenimiento"

interface NewTotemSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (newTotem?: any) => void | Promise<void>
  lockedCampusId?: string | null
  isSuperAdmin?: boolean
}

export function NewTotemSheet({
  open,
  onOpenChange,
  onSave,
  lockedCampusId = null,
  isSuperAdmin = false,
}: NewTotemSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { showLoading, hideLoading } = useLoadingOverlay()
  const [nombre, setNombre] = useState("")
  const [selectedSede, setSelectedSede] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedEstado, setSelectedEstado] = useState<Estado>("Activo")

  const [fechaInicioContenido, setFechaInicioContenido] = useState("")
  const [fechaFinContenido, setFechaFinContenido] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [copiedUser, setCopiedUser] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const [credentials, setCredentials] = useState({ username: "", password: "" })

  const [imagenes, setImagenes] = useState<Record<number, File | null>>({})
  const [videos, setVideos] = useState<Record<number, File | null>>({})
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [imagePreviews, setImagePreviews] = useState<Array<string | null>>([])
  const [videoPreviews, setVideoPreviews] = useState<Array<string | null>>([])

  const selectedTemplateObj = getTemplateById(selectedTemplate)

  const generarCredenciales = () => {
    const randomId = Math.random().toString(36).substring(2, 6).toUpperCase()
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*"
    let pass = ""

    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return {
      username: `TOTEM_${randomId}`,
      password: pass,
    }
  }

  useEffect(() => {
    const urls: Array<string | null> = []
    const count = selectedTemplateObj?.req.images || 0
    for (let i = 1; i <= count; i += 1) {
      const file = imagenes[i]
      urls.push(file ? URL.createObjectURL(file) : null)
    }
    setImagePreviews(urls)

    return () => {
      urls.forEach((url) => url && URL.revokeObjectURL(url))
    }
  }, [imagenes, selectedTemplateObj?.req.images])

  useEffect(() => {
    const urls: Array<string | null> = []
    const count = selectedTemplateObj?.req.videos || 0
    for (let i = 1; i <= count; i += 1) {
      const file = videos[i]
      urls.push(file ? URL.createObjectURL(file) : null)
    }
    setVideoPreviews(urls)

    return () => {
      urls.forEach((url) => url && URL.revokeObjectURL(url))
    }
  }, [videos, selectedTemplateObj?.req.videos])

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const selectedFile = event.target.files?.[0] || null
    setImagenes((prev) => ({ ...prev, [index]: selectedFile }))
  }

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const selectedFile = event.target.files?.[0] || null
    setVideos((prev) => ({ ...prev, [index]: selectedFile }))
  }

  const openPreviewWindow = () => {
    const previewWindow = window.open("", "TotemPreview", "width=1200,height=900,scrollbars=yes")
    if (!previewWindow) {
      setPreviewError("No se pudo abrir la ventana de vista previa. Revisa tu bloqueador de ventanas emergentes.")
      return
    }

    const imageUrlsJson = JSON.stringify(imagePreviews.filter(Boolean))
    const videoUrlJson = JSON.stringify(videoPreviews[0] || null)
    const videoUrl2Json = JSON.stringify(videoPreviews[1] || null)
    const template = selectedTemplate || "clasica"

    const additionalContent =
      template === "eventos"
        ? `
        <div class="info-card agenda-card">
          <h2>Agenda del Día</h2>
          <ul>
            <li><strong>10:00</strong> - Taller de participación ciudadana</li>
            <li><strong>12:00</strong> - Feria de emprendedores</li>
            <li><strong>15:00</strong> - Charla informativa de salud</li>
            <li><strong>17:00</strong> - Jornada de capacitación</li>
          </ul>
        </div>
        <div class="info-card calendar-card">
          <h2>Calendario</h2>
          <div class="calendar" id="event-calendar"></div>
        </div>
      `
        : template === "promocional"
        ? `
        <div class="info-card">
          <h2>Oferta Especial</h2>
          <p>Descubre nuestro nuevo producto con beneficios exclusivos. Aprovecha la promoción por tiempo limitado y mejora tu experiencia con tecnología de punta.</p>
        </div>
      `
        : template === "minimal"
        ? `
        <div class="info-card">
          <h2>Agenda Semanal</h2>
          <ul>
            <li><strong>Lunes</strong> - Reunión de equipo</li>
            <li><strong>Miércoles</strong> - Revisión de proyectos</li>
            <li><strong>Viernes</strong> - Cierre semanal</li>
          </ul>
        </div>
      `
        : template === "corporativa"
        ? ``
        : template === "directorio"
        ? `
        <div class="info-card">
          <h2>Directorio de Servicios</h2>
          <ul>
            <li><strong>Recepción</strong> - Piso 1</li>
            <li><strong>Administración</strong> - Piso 2</li>
            <li><strong>Servicios</strong> - Piso 3</li>
            <li><strong>Soporte</strong> - Piso 4</li>
          </ul>
        </div>
      `
        : `
        <div class="info-card">
          <h2>Horario de Atención</h2>
          <p>Lun - Vie: 08:00 - 18:00<br>Sáb: 09:00 - 13:00<br>Dom: Cerrado</p>
        </div>
        <div class="info-card">
          <h2>Eventos y Avisos</h2>
          <p>Taller de participación ciudadana<br>Feria de emprendedores<br>Charlas de salud y capacitación</p>
        </div>
      `

    const previewHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vista Previa del Totem</title>
  <style>
    body { margin: 0; min-height: 100vh; background: #020617; color: #f8fafc; font-family: Inter, system-ui, sans-serif; }
    .page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .section { margin-bottom: 24px; }
    .card { border-radius: 24px; border: 1px solid rgba(148, 163, 184, 0.12); background: rgba(15, 23, 42, 0.95); box-shadow: 0 20px 60px rgba(15, 23, 42, 0.4); overflow: hidden; }
    .carousel { position: relative; min-height: 340px; display: flex; align-items: center; justify-content: center; background: #0f172a; }
    .carousel img { width: 100%; height: 360px; object-fit: cover; display: block; }
    .carousel button { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border: none; border-radius: 9999px; background: rgba(15, 23, 42, 0.75); color: white; cursor: pointer; }
    .carousel button:hover { background: rgba(30, 41, 59, 0.95); }
    .carousel button.prev { left: 16px; }
    .carousel button.next { right: 16px; }
    .dots { display: none; justify-content: center; gap: 8px; padding: 14px 0; }
    .dot { width: 10px; height: 10px; border-radius: 9999px; background: rgba(148, 163, 184, 0.35); }
    .dot.active { background: #38bdf8; }
    .promo-banner { position: relative; min-height: 420px; overflow: hidden; }
    .promo-banner img { width: 100%; height: 420px; object-fit: cover; display: block; }
    .promo-overlay { position: absolute; bottom: 24px; left: 24px; right: 24px; padding: 24px; border-radius: 18px; background: rgba(0, 0, 0, 0.45); }
    .promo-overlay h2 { font-size: 24px; color: #f8fafc; margin-bottom: 8px; }
    .promo-overlay p { color: #e2e8f0; line-height: 1.6; }
    .video-card video { width: 100%; height: 420px; object-fit: cover; display: block; cursor: pointer; background: black; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
    .info-card { border-radius: 24px; border: 1px solid rgba(148, 163, 184, 0.12); padding: 24px; background: rgba(15, 23, 42, 0.95); }
    .info-card ul { margin: 16px 0 0; padding-left: 18px; color: #cbd5e1; line-height: 1.7; }
    .info-card li { margin-bottom: 10px; }
    .calendar { display: grid; gap: 6px; margin-top: 16px; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; margin-top: 12px; }
    .calendar-day { text-align: center; padding: 10px 0; border-radius: 12px; background: rgba(148, 163, 184, 0.08); color: #cbd5e1; }
    .calendar-day.today { background: #38bdf8; color: #020617; font-weight: 700; }
    h1, h2, p { margin: 0; }
    h1 { font-size: 28px; margin-bottom: 10px; }
    h2 { font-size: 18px; margin-bottom: 10px; color: #94a3b8; }
    p { color: #cbd5e1; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="page">
    <div class="section">
      <h1>Vista Previa - Plantilla ${template === "eventos" ? "Eventos" : template === "promocional" ? "Promocional" : template === "minimal" ? "Minimal" : template === "corporativa" ? "Corporativa" : template === "directorio" ? "Directorio" : "Clásica"}</h1>
      <p>Estas son las imágenes ${template !== 'minimal' && template !== 'promocional' && template !== 'directorio' ? "y los " : ""}${template === 'corporativa' ? 'videos' : template === 'directorio' ? 'video' : 'video'} cargados para la vista previa del totem.</p>
    </div>
    ${template === 'directorio' ? `
      <div class="section card">
        <div style="padding: 24px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); min-height: 300px; display: flex; align-items: center; justify-content: center; border-radius: 24px;">
          <div style="text-align: center;">
            <h2 style="font-size: 32px; margin-bottom: 16px; color: #f8fafc;">Directorio de Servicios</h2>
            <p style="color: #cbd5e1; margin-bottom: 24px;">Accede a información de ubicaciones y contactos</p>
            <video id="preview-video" playsinline style="width: 100%; max-width: 400px; height: 300px; object-fit: cover; border-radius: 12px; margin-top: 16px;"></video>
          </div>
        </div>
      </div>
    ` : template === 'promocional' ? `
      <div class="section card promo-banner">
        <img id="promo-banner" src="" alt="Banner promocional" />
        <div class="promo-overlay">
          <h2>Banner Promocional</h2>
          <p>Descubre la oferta especial con contenido destacado y una experiencia visual envolvente.</p>
        </div>
      </div>
    ` : `
      <div class="section card carousel">
        <button class="prev">‹</button>
        <img id="carousel-image" src="" alt="Imagen del carrusel" />
        <button class="next">›</button>
        <div class="dots" id="carousel-dots"></div>
      </div>
    `}
    ${template !== 'minimal' && template !== 'directorio' ? `
      ${template === 'corporativa' ? `
        <div class="section card">
          <h2>Videos Institucionales</h2>
          <div class="grid-2" style="margin-top: 16px;">
            <div class="video-card">
              <video id="preview-video-1" playsinline></video>
              <p style="margin-top: 12px; color: #94a3b8; text-align: center;">Video 1</p>
            </div>
            <div class="video-card">
              <video id="preview-video-2" playsinline></video>
              <p style="margin-top: 12px; color: #94a3b8; text-align: center;">Video 2</p>
            </div>
          </div>
        </div>
      ` : `
        <div class="section card video-card">
          <h2>Video Informativo</h2>
          <video id="preview-video" playsinline></video>
          <p style="margin-top: 12px; color: #94a3b8;">Haz clic en el video para reproducir o pausar.</p>
        </div>
      `}
    ` : ``}
    <div class="section card">
      <h2>Contenido adicional</h2>
      <div class="grid-2" style="margin-top: 16px;">
        ${additionalContent}
      </div>
    </div>
  </div>
  <script>
    const images = ${imageUrlsJson};
    const video = ${videoUrlJson};
    const video2 = ${videoUrl2Json};
    const template = '${template}';
    const imgElement = document.getElementById('carousel-image');
    const promoBanner = document.getElementById('promo-banner');
    const videoElement = document.getElementById('preview-video');
    const videoElement1 = document.getElementById('preview-video-1');
    const videoElement2 = document.getElementById('preview-video-2');
    const dotsContainer = document.getElementById('carousel-dots');
    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');
    let index = 0;

    function renderCarousel() {
      if (imgElement) {
        imgElement.src = images[index];
      }
      if (dotsContainer) {
        dotsContainer.innerHTML = images.map((_, idx) => '<span class="dot ' + (idx === index ? 'active' : '') + '"></span>').join('');
      }
    }

    function goPrev() {
      index = (index - 1 + images.length) % images.length;
      renderCarousel();
    }

    function goNext() {
      index = (index + 1) % images.length;
      renderCarousel();
    }

    if (template === 'promocional') {
      if (images.length > 0 && promoBanner) {
        promoBanner.src = images[0];
      }
    } else if (template !== 'directorio' && images.length > 0) {
      renderCarousel();
    }

    if (template === 'directorio') {
      if (video && videoElement) {
        videoElement.src = video;
        videoElement.addEventListener('click', () => {
          if (videoElement.paused) {
            videoElement.play();
          } else {
            videoElement.pause();
          }
        });
      }
    } else if (template !== 'minimal' && template !== 'corporativa') {
      if (video && videoElement) {
        videoElement.src = video;
        videoElement.addEventListener('click', () => {
          if (videoElement.paused) {
            videoElement.play();
          } else {
            videoElement.pause();
          }
        });
      }
    } else if (template === 'corporativa') {
      if (video && videoElement1) {
        videoElement1.src = video;
        videoElement1.addEventListener('click', () => {
          if (videoElement1.paused) {
            videoElement1.play();
          } else {
            videoElement1.pause();
          }
        });
      }
      if (video2 && videoElement2) {
        videoElement2.src = video2;
        videoElement2.addEventListener('click', () => {
          if (videoElement2.paused) {
            videoElement2.play();
          } else {
            videoElement2.pause();
          }
        });
      }
    }

    if (prevButton) {
      prevButton.addEventListener('click', goPrev);
    }
    if (nextButton) {
      nextButton.addEventListener('click', goNext);
    }

    if (template === 'eventos') {
      const today = new Date();
      const month = today.getMonth();
      const year = today.getFullYear();
      const day = today.getDate();
      const startsOn = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const calendar = document.getElementById('event-calendar');
      if (calendar) {
        calendar.innerHTML = '<div class="calendar"><div>' + monthNames[month] + ' ' + year + '</div>' + '<div class="calendar-grid"></div></div>';
        const grid = calendar.querySelector('.calendar-grid');
        weekDays.forEach((weekday) => {
          const dayElement = document.createElement('div');
          dayElement.className = 'calendar-day';
          dayElement.textContent = weekday;
          grid.appendChild(dayElement);
        });
        for (let i = 0; i < startsOn; i += 1) {
          const empty = document.createElement('div');
          empty.className = 'calendar-day';
          empty.style.visibility = 'hidden';
          grid.appendChild(empty);
        }
        for (let date = 1; date <= daysInMonth; date += 1) {
          const dateElement = document.createElement('div');
          dateElement.className = 'calendar-day' + (date === day ? ' today' : '');
          dateElement.textContent = String(date);
          grid.appendChild(dateElement);
        }
      }
    }
  </script>
</body>
</html>`

    previewWindow.document.open()
    previewWindow.document.write(previewHtml)
    previewWindow.document.close()
  }

  const handleOpenPreview = () => {
    if (!selectedTemplateObj) {
      setPreviewError("Selecciona primero una plantilla para habilitar la vista previa.")
      return
    }

    const requiredImages = selectedTemplateObj.req.images
    const requiredVideos = selectedTemplateObj.req.videos
    const filledImages = Object.values(imagenes).filter(Boolean).length
    const filledVideos = Object.values(videos).filter(Boolean).length

    if (filledImages !== requiredImages) {
      setPreviewError(`La plantilla ${selectedTemplateObj.name} requiere ${requiredImages} imagen(es).`)
      return
    }

    if (filledVideos !== requiredVideos) {
      setPreviewError(`La plantilla ${selectedTemplateObj.name} requiere ${requiredVideos} video(s).`)
      return
    }

    setPreviewError(null)
    openPreviewWindow()
  }

  useEffect(() => {
    if (open) {
      setCredentials(generarCredenciales())
      setNombre("")
      setSelectedSede(isSuperAdmin ? "" : lockedCampusId ?? "")
      setSelectedTemplate(null)
      setSelectedEstado("Activo")
      setFechaInicioContenido("")
      setFechaFinContenido("")
      setImagenes({})
      setVideos({})
      setShowPassword(false)
      setCopiedUser(false)
      setCopiedPassword(false)
    }
  }, [open, isSuperAdmin, lockedCampusId])

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

  const validarArchivos = () => {
    if (!selectedTemplateObj) return false

    for (let i = 1; i <= selectedTemplateObj.req.images; i++) {
      if (!imagenes[i]) return false
    }

    for (let i = 1; i <= selectedTemplateObj.req.videos; i++) {
      if (!videos[i]) return false
    }

    return true
  }

  const handleSaveClick = () => {
    if (!nombre || !selectedSede || !selectedTemplate) {
      toastError("Completa nombre, sede y plantilla.")
      return
    }

    if (!fechaInicioContenido || !fechaFinContenido) {
      toastError("Debes seleccionar el rango de fechas del contenido.")
      return
    }

    if (fechaInicioContenido > fechaFinContenido) {
      toastError("La fecha de inicio no puede ser posterior a la fecha de fin.")
      return
    }

    if (!validarArchivos()) {
      toastError("Debes subir todos los archivos requeridos por la plantilla seleccionada.")
      return
    }

    setConfirmOpen(true)
  }

  const handleConfirmCreate = async () => {
    setIsSubmitting(true)
    showLoading("Creando tótem...")

    try {
      const formData = new FormData()

      formData.append("nombre", nombre)
      formData.append("totem_id", `TOTEM-${crypto.randomUUID()}`)
      formData.append("campus_id", selectedSede)
      formData.append("plantilla", selectedTemplate)
      formData.append("estado", selectedEstado)
      formData.append("usuario", credentials.username)
      formData.append("contraseña", credentials.password)
      formData.append("contrasena", credentials.password)
      formData.append("mostrarDesde", fechaInicioContenido)
      formData.append("mostrarHasta", fechaFinContenido)

      Object.entries(imagenes).forEach(([index, file]) => {
        if (file) formData.append(`imagen${index}`, file)
      })

      Object.entries(videos).forEach(([index, file]) => {
        if (file) formData.append(`video${index}`, file)
      })

      const response = await fetchWithAuth("/api/totems", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const message =
          typeof errorData === "object" && errorData && "error" in errorData
            ? String((errorData as { error: string }).error)
            : `Error al crear el tótem (${response.status}).`
        toastError(message)
        return
      }

      const newTotem = await response.json()
      toastSuccess("Tótem creado correctamente")
      setConfirmOpen(false)
      await onSave?.(newTotem)
      onOpenChange(false)
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") return
      toastError("Error de conexión al crear el tótem.")
    } finally {
      setIsSubmitting(false)
      hideLoading()
    }
  }

  const renderFileName = (file: File | null, fallback: string) => {
    if (!file) return fallback
    return file.name.length > 22 ? `${file.name.slice(0, 22)}...` : file.name
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg bg-card border-border p-0 flex flex-col h-full overflow-hidden"
      >
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <SheetTitle className="text-foreground">Nuevo Tótem</SheetTitle>
              <p className="text-sm text-muted-foreground">
                Configura un nuevo dispositivo y su contenido
              </p>
            </div>
          </div>
          <SheetDescription className="sr-only">
            Formulario para registrar un nuevo tótem con nombre, sede, plantilla y contenido.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nombre del Tótem *
              </Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Tótem Lobby Central"
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sede *
              </Label>
              {!isSuperAdmin && lockedCampusId ? (
                <Input
                  value={getSedeNameFromId(lockedCampusId)}
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
                    onClick={() => {
                      setSelectedTemplate(template.id)
                      setImagenes({})
                      setVideos({})
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-2 rounded-lg border transition-all",
                      selectedTemplate === template.id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full aspect-3/4 rounded-md flex items-center justify-center",
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
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {template.name}
                    </span>
                    {selectedTemplate === template.id && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Seleccionada
                      </span>
                    )}
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
                        draftFile={imagenes[index] ?? null}
                        onFileChange={(e) =>
                          handleImageChange(e as ChangeEvent<HTMLInputElement>, index)
                        }
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
                        draftFile={videos[index] ?? null}
                        onFileChange={(e) =>
                          handleVideoChange(e as ChangeEvent<HTMLInputElement>, index)
                        }
                        onClear={() =>
                          setVideos((prev) => ({ ...prev, [index]: null }))
                        }
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed border-border rounded-lg bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    Selecciona una plantilla arriba para ver qué archivos necesitas subir.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <Button
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full"
                  onClick={handleOpenPreview}
                  disabled={!selectedTemplateObj}
                >
                  <Eye className="w-4 h-4" />
                  Vista previa del Totem
                </Button>
                {previewError ? (
                  <p className="text-xs text-rose-400 mt-2">{previewError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedTemplateObj
                      ? `Revisa la vista previa de la plantilla ${selectedTemplateObj.name} con los archivos seleccionados.`
                      : "Selecciona primero una plantilla para habilitar la vista previa."}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado Inicial
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
                  Mantenimiento
                </button>
              </div>
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
                  className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                >
                  Auto-generadas y Únicas
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Usuario del Tótem
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={credentials.username}
                    readOnly
                    className="pl-10 pr-10 bg-muted/50 border-border font-mono cursor-default"
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
                <Label className="text-xs text-muted-foreground">
                  Contraseña Segura
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    readOnly
                    className="pl-10 pr-20 bg-muted/50 border-border font-mono cursor-default"
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
                Guarda o copia estas credenciales ahora. Se usarán para el login del tótem cliente.
              </p>
            </div>
          </div>
        </div>

        <SheetFooter className="p-6 pt-4 border-t border-border flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 border-border"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSaveClick}
            disabled={isSubmitting}
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? "Creando..." : "Crear Tótem"}
          </Button>
        </SheetFooter>
      </SheetContent>

      <ConfirmCreateTotemDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        nombre={nombre.trim()}
        sedeId={selectedSede}
        plantillaId={selectedTemplate || ""}
        estado={selectedEstado}
        onConfirm={handleConfirmCreate}
        isSubmitting={isSubmitting}
      />
    </Sheet>
  )
}
