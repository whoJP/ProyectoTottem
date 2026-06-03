"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { TotemLogo } from "@/components/totem/totem-logo"
import type {
  KioskCarouselSlide,
  KioskNotificationItem,
} from "@/lib/kiosk-totem"

const slidesDemo: KioskCarouselSlide[] = [
  {
    id: 1,
    tag: "ANUNCIO",
    title: "Eventos del Mes",
    subtitle: "Imagen 1 de 2",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    tipo: "imagen",
  },
  {
    id: 2,
    tag: "NOVEDAD",
    title: "Inscripciones Abiertas",
    subtitle: "Imagen 2 de 2",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    tipo: "imagen",
  },
]

type AdCarouselProps = {
  slides: KioskCarouselSlide[]
  videos: { index: number; url: string }[]
  notifications: KioskNotificationItem[]
  totemName: string
  sede: string
  contentExpiryLabel?: string | null
  slotAssistantMic?: ReactNode
  slotAssistantCamera?: ReactNode
}

function MediaSidePanel({
  side,
  src,
  isVideo,
}: {
  side: "left" | "right"
  src: string
  isVideo?: boolean
}) {
  return (
    <div className={`media-side-panel media-side-panel-${side}`} aria-hidden>
      {isVideo ? (
        <video
          src={src}
          className="media-side-bg"
          muted
          playsInline
          autoPlay
          loop
          disablePictureInPicture
          preload="auto"
        />
      ) : (
        <img src={src} alt="" className="media-side-bg" />
      )}
      <div className="media-side-gradient" />
    </div>
  )
}

function MediaDisplay({
  src,
  alt,
  isVideo = false,
}: {
  src: string
  alt: string
  isVideo?: boolean
}) {
  return (
    <div className="media-fill-frame media-fill-row">
      <MediaSidePanel side="left" src={src} isVideo={isVideo} />
      <div className="media-center-stage">
        {isVideo ? (
          <video
            src={src}
            className="media-center-media"
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
          />
        ) : (
          <img src={src} alt={alt} className="media-center-media" />
        )}
      </div>
      <MediaSidePanel side="right" src={src} isVideo={isVideo} />
    </div>
  )
}

function formatClock() {
  return new Date().toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function formatNotificationDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("es-BO", {
    day: "numeric",
    month: "short",
  })
}

export function AdCarousel({
  slides,
  videos,
  notifications,
  totemName,
  sede,
  contentExpiryLabel,
  slotAssistantMic,
  slotAssistantCamera,
}: AdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [clock, setClock] = useState(() => formatClock())

  const carouselSlides = slides.length > 0 ? slides : slidesDemo
  const primaryVideo = videos[0]?.url ?? null

  useEffect(() => {
    const timer = setInterval(() => setClock(formatClock()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!carouselSlides.length) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [carouselSlides.length])

  const currentSlide = carouselSlides[currentIndex]
  const slideLabel =
    currentSlide.subtitle ||
    (carouselSlides.length > 1
      ? `Imagen ${currentIndex + 1} de ${carouselSlides.length}`
      : "Imagen 1")

  const eventItems = useMemo(() => {
    return notifications.slice(0, 4).map((n) => ({
      id: n.id,
      title: n.mensaje,
      meta: `${formatNotificationDate(n.fechaInicio)} — ${formatNotificationDate(n.fechaFin)}`,
      imageUrl: n.archivoUrl,
    }))
  }, [notifications])

  const goPrev = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length
    )
  const goNext = () =>
    setCurrentIndex((prev) => (prev + 1) % carouselSlides.length)

  const fallbackVideoPoster =
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"

  return (
    <div className="ad-layout">
      <header className="totem-topbar">
        <div className="topbar-left">
          <TotemLogo />
          <span className="totem-brand">TOTEM</span>
          <span className="topbar-dot">•</span>
          <span className="topbar-sede">{sede}</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-time">{clock}</span>
          <span className="topbar-dot">•</span>
          <span className="topbar-signal" aria-hidden>
            <span className="signal-bar" />
            <span className="signal-bar" />
            <span className="signal-bar" />
            <span className="signal-bar" />
          </span>
        </div>
      </header>

      {contentExpiryLabel && (
        <p className="content-expiry-banner">{contentExpiryLabel}</p>
      )}

      <div className="media-showcase">
        <section className="hero-banner">
          <MediaDisplay
            src={currentSlide.image}
            alt={slideLabel}
          />
          <div className="hero-overlay" />
          <button
            type="button"
            className="hero-arrow left"
            onClick={goPrev}
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="hero-arrow right"
            onClick={goNext}
            aria-label="Siguiente"
          >
            ›
          </button>
          <div className="hero-content">
            <span className="hero-slide-label">{slideLabel}</span>
            <div className="hero-dots">
              {carouselSlides.map((_, index) => (
                <span
                  key={index}
                  className={`hero-dot ${index === currentIndex ? "active" : ""}`}
                />
              ))}
            </div>
          </div>
        </section>

        {(slotAssistantMic || slotAssistantCamera) && (
          <div className="media-widgets-row" aria-label="Controles del tótem">
            <div className="media-widget-slot media-widget-left">
              {slotAssistantMic}
            </div>
            <div className="media-widget-slot media-widget-right">
              {slotAssistantCamera}
            </div>
          </div>
        )}

        <section className="section-block video-section">
          <div className="video-card">
            <MediaDisplay
              src={primaryVideo ?? fallbackVideoPoster}
              alt="Contenido en video"
              isVideo={Boolean(primaryVideo)}
            />
            {!primaryVideo && <div className="play-button">▶</div>}
          </div>
        </section>
      </div>

      <section className="bottom-grid bottom-grid-compact">
        <div className="info-card info-card-compact">
          <h3 className="info-card-title">¿Necesitas ayuda?</h3>
          <div className="schedule-list">
            <div className="schedule-item">
              <span>Sede</span>
              <strong>{sede}</strong>
            </div>
            <div className="schedule-item">
              <span>Punto</span>
              <strong>{totemName}</strong>
            </div>
          </div>
        </div>

        <div className="info-card info-card-compact">
          <h3 className="info-card-title">Eventos y Avisos</h3>
          <div className="events-list">
            {eventItems.length > 0 ? (
              eventItems.map((item) => (
                <div
                  className={`event-item${item.imageUrl ? " event-item-with-thumb" : ""}`}
                  key={item.id}
                >
                  {item.imageUrl && (
                    <div className="event-thumb-square">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="event-thumb-img"
                      />
                    </div>
                  )}
                  <div className="event-copy">
                    <span>{item.title}</span>
                    <strong>{item.meta}</strong>
                  </div>
                </div>
              ))
            ) : (
              <div className="events-empty">
                Sin avisos activos.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
