"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  detenerReconocimiento,
  iniciarReconocimiento,
  type DeteccionVoz,
  type SpeechState,
} from "@/lib/speech-service"
import {
  compactarVoz,
  palabrasClaveDelFaq,
  tokenEsPalabraClave,
} from "@/lib/faq-voice"
import type { KioskFaqPayload } from "@/lib/kiosk-totem"

type VoiceAssistantProps = {
  onActivarFaq: () => void
  faqData: KioskFaqPayload
  compact?: boolean
}

const colorEstado: Record<SpeechState, string> = {
  iniciando: "#a8bbd0",
  escuchando: "#00e8d0",
  detectado: "#52ffa8",
  esperando: "#a8bbd0",
  error: "#ff7b7b",
  no_soportado: "#ff7b7b",
}

const estadoInicial: DeteccionVoz = {
  transcript: "",
  tokens: [],
  palabraClave: null,
  coincidio: false,
  esFinal: false,
}

const etiquetaEstado: Record<SpeechState, string> = {
  iniciando: "Iniciando…",
  escuchando: "Escuchando",
  detectado: "Detectando",
  esperando: "En espera",
  error: "Sin permiso de micrófono",
  no_soportado: "Voz no soportada",
}

function PanelPalabrasDetectadas({
  deteccion,
  clavesFaq,
  estado,
}: {
  deteccion: DeteccionVoz
  clavesFaq: Set<string>
  estado: SpeechState
}) {
  const { tokens, transcript, palabraClave, coincidio } = deteccion
  const hayTexto = transcript.trim().length > 0

  return (
    <div className="voice-detect-panel" aria-live="polite">
      <span className="voice-detect-label">
        Palabras detectadas · {etiquetaEstado[estado]}
      </span>
      <p className="voice-detect-transcript">
        {hayTexto ? `"${transcript}"` : "Di una palabra clave…"}
      </p>
      {tokens.length > 0 ? (
        <div className="voice-detect-tokens">
          {tokens.map((token, index) => {
            const esClave = tokenEsPalabraClave(token, clavesFaq)
            const esMatch =
              coincidio &&
              palabraClave != null &&
              (token === palabraClave ||
                compactarVoz(token) === compactarVoz(palabraClave))
            return (
              <span
                key={`${token}-${index}`}
                className={[
                  "voice-detect-token",
                  esClave ? "is-keyword" : "",
                  esMatch ? "is-match" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {token}
              </span>
            )
          })}
        </div>
      ) : null}
      {coincidio && palabraClave ? (
        <p className="voice-detect-match">Clave: {palabraClave}</p>
      ) : null}
    </div>
  )
}

export function VoiceAssistant({
  onActivarFaq,
  faqData,
  compact = false,
}: VoiceAssistantProps) {
  const [estado, setEstado] = useState<SpeechState>("iniciando")
  const [deteccion, setDeteccion] = useState<DeteccionVoz>(estadoInicial)

  const onActivarFaqRef = useRef(onActivarFaq)
  const faqDataRef = useRef(faqData)

  const clavesFaq = useMemo(
    () => palabrasClaveDelFaq(faqData?.items ?? []),
    [faqData]
  )

  useEffect(() => {
    onActivarFaqRef.current = onActivarFaq
  }, [onActivarFaq])

  useEffect(() => {
    faqDataRef.current = faqData
  }, [faqData])

  useEffect(() => {
    iniciarReconocimiento(
      setEstado,
      setDeteccion,
      () => {},
      () => onActivarFaqRef.current(),
      () => faqDataRef.current
    )
    return () => detenerReconocimiento()
  }, [])

  const panel = (
    <PanelPalabrasDetectadas
      deteccion={deteccion}
      clavesFaq={clavesFaq}
      estado={estado}
    />
  )

  if (compact) {
    return (
      <div className="voice-assistant-compact-wrap">
        <div
          className="voice-assistant-box voice-assistant-compact"
          title="Asistente de voz activo"
          aria-label="Asistente de voz"
        >
          <span
            className="voice-compact-dot"
            style={{ background: colorEstado[estado] ?? "#a8bbd0" }}
            aria-hidden
          />
          <span className="voice-compact-mic" aria-hidden>
            🎙️
          </span>
        </div>
        {panel}
      </div>
    )
  }

  return (
    <div className="voice-assistant-box">
      <div className="voice-assistant-header">
        <span>Asistente de Voz</span>
        <span
          className="voice-status"
          style={{ color: colorEstado[estado] ?? "#a8bbd0" }}
        >
          {etiquetaEstado[estado]}
        </span>
      </div>
      {panel}
    </div>
  )
}
