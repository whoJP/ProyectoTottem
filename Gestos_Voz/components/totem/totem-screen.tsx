"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AdCarousel } from "@/components/totem/ad-carousel"
import { FaqView } from "@/components/totem/faq-view"
import { GestureDetector } from "@/components/totem/gesture-detector"
import { VoiceAssistant } from "@/components/totem/voice-assistant"
import { TotemLogin } from "@/components/totem/totem-login"
import { fetchKioskTotem, getActiveTotemId } from "@/lib/fetch-kiosk"
import { clearStoredTotemId } from "@/lib/kiosk-session"
import type { KioskTotemPayload } from "@/lib/kiosk-totem"

const FAQ_TIMEOUT_MS = 15000

export function TotemScreen() {
  const [totemId, setTotemId] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [showFaq, setShowFaq] = useState(false)
  const [data, setData] = useState<KioskTotemPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = getActiveTotemId()
    if (!id) {
      setNeedsLogin(true)
      setLoading(false)
      return
    }
    setTotemId(id)
    setNeedsLogin(false)
  }, [])

  useEffect(() => {
    if (!totemId || needsLogin) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const payload = await fetchKioskTotem(totemId)
        if (!cancelled) {
          setData(payload)
          console.info(
            "[FAQ]",
            payload.faq?.items?.length ?? 0,
            "preguntas —",
            payload.faq?.title
          )
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Error al cargar"
          setError(message)
          setData(null)
          if (
            message.includes("no encontrado") ||
            message.includes("incorrectas") ||
            message.includes("inactivo") ||
            message.includes("mantenimiento")
          ) {
            clearStoredTotemId()
            setTotemId(null)
            setNeedsLogin(true)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [totemId, needsLogin])

  useEffect(() => {
    if (!totemId || needsLogin) return

    const refresh = async () => {
      try {
        const payload = await fetchKioskTotem(totemId)
        setData(payload)
      } catch {
        /* mantener datos actuales si falla el refresco en segundo plano */
      }
    }

    const interval = setInterval(refresh, 60_000)
    return () => clearInterval(interval)
  }, [totemId, needsLogin])

  const activarFAQ = useCallback(() => {
    setShowFaq(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowFaq(false), FAQ_TIMEOUT_MS)
  }, [])

  const handleLoginSuccess = (id: string) => {
    setTotemId(id)
    setNeedsLogin(false)
    setLoading(true)
  }

  const handleDisconnect = () => {
    clearStoredTotemId()
    setTotemId(null)
    setData(null)
    setNeedsLogin(true)
    setError(null)
  }

  const handleExitClick = () => {
    const ok = window.confirm(
      "¿Deseas salir del tótem?\n\nSe desvinculará este equipo y volverás a la pantalla de activación."
    )
    if (ok) handleDisconnect()
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (needsLogin) {
    return <TotemLogin onSuccess={handleLoginSuccess} />
  }

  if (loading) {
    return (
      <div className="screen-center">
        <h1>Cargando información del tótem...</h1>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="screen-center">
        <h1>{error ?? "Tótem no disponible"}</h1>
        <p style={{ opacity: 0.8, maxWidth: 420, textAlign: "center" }}>
          Usa el usuario y contraseña del tótem en tu panel web (al crear o
          editar el tótem). Debe estar en estado <strong>Activo</strong>.
        </p>
        <button
          type="button"
          onClick={handleDisconnect}
          style={{
            marginTop: 16,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "#a8bbd0",
            cursor: "pointer",
          }}
        >
          Volver a activar equipo
        </button>
      </div>
    )
  }

  if (!data.contentActive) {
    return (
      <div className="screen-center">
        <h1>Contenido no disponible</h1>
        <p style={{ opacity: 0.8 }}>
          {data.contentExpiryLabel ??
            "El contenido de este tótem no está vigente en este momento."}
        </p>
        <button type="button" onClick={handleDisconnect} style={disconnectBtnStyle}>
          Volver a activar equipo
        </button>
      </div>
    )
  }

  return (
    <div className="totem-screen">
      <div className="totem-screen-main">
        {showFaq ? (
          <FaqView faq={data.faq} totemId={totemId ?? data.id} />
        ) : (
          <AdCarousel
            slides={data.carousel}
            videos={data.videos}
            notifications={data.notifications}
            totemName={data.nombre}
            sede={data.sede}
            contentExpiryLabel={data.contentExpiryLabel}
            slotAssistantCamera={
              data.camara ? (
                <GestureDetector compact onDetect={activarFAQ} />
              ) : undefined
            }
          />
        )}
      </div>

      {data.microfono ? (
        <div className="totem-voice-dock" aria-label="Asistente de voz">
          <VoiceAssistant
            compact
            onActivarFaq={activarFAQ}
            faqData={data.faq}
          />
        </div>
      ) : null}

      <button
        type="button"
        className="totem-exit-btn"
        onClick={handleExitClick}
        title="Salir del tótem"
        aria-label="Salir del tótem"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
          <path
            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}

const disconnectBtnStyle: React.CSSProperties = {
  marginTop: 16,
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "transparent",
  color: "#a8bbd0",
  cursor: "pointer",
}
