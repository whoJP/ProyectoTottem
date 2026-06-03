export type SpeechState =
  | "iniciando"
  | "escuchando"
  | "detectado"
  | "esperando"
  | "error"
  | "no_soportado"

export type FaqItem = { question: string; answer: string; keyword?: string }
export type FaqData = { title?: string; items?: FaqItem[] }

export type DeteccionVoz = {
  transcript: string
  tokens: string[]
  palabraClave: string | null
  coincidio: boolean
  esFinal: boolean
}

import {
  buscarEnFaqPorPalabraClave,
  tokensDesdeTranscript,
} from "@/lib/faq-voice"

let recognitionInstance: SpeechRecognition | null = null
let reinicioTimer: ReturnType<typeof setTimeout> | null = null

function limpiarReinicioTimer() {
  if (reinicioTimer) {
    clearTimeout(reinicioTimer)
    reinicioTimer = null
  }
}

function leerTranscript(event: SpeechRecognitionEvent): {
  mensaje: string
  esFinal: boolean
} {
  let mensaje = ""
  let esFinal = false
  const start = event.resultIndex ?? 0

  for (let i = start; i < event.results.length; i++) {
    const chunk = event.results[i]
    if (!chunk?.[0]) continue
    mensaje += chunk[0].transcript
    if (chunk.isFinal) esFinal = true
  }

  return { mensaje: mensaje.trim(), esFinal }
}

function hablar(texto: string, alTerminar?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    alTerminar?.()
    return
  }
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(texto)
  utterance.lang = "es-ES"
  utterance.rate = 0.9
  utterance.onend = () => alTerminar?.()
  utterance.onerror = () => alTerminar?.()
  speechSynthesis.speak(utterance)
}

export function iniciarReconocimiento(
  setEstado: (s: SpeechState) => void,
  onDeteccion: (d: DeteccionVoz) => void,
  onCoincidencia: (respuesta: string) => void,
  onActivarFaq: () => void,
  getFaqData: () => FaqData | null | undefined
) {
  if (typeof window === "undefined") return

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    setEstado("no_soportado")
    return
  }

  limpiarReinicioTimer()

  if (recognitionInstance) {
    try {
      recognitionInstance.onend = null
      recognitionInstance.onresult = null
      recognitionInstance.onerror = null
      recognitionInstance.stop()
    } catch {
      /* ignore */
    }
    recognitionInstance = null
  }

  const recognition = new SpeechRecognition()
  recognition.lang = "es-ES"
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1
  recognitionInstance = recognition

  let claveAbiertaEnFrase = ""
  let hablando = false

  const programarReinicio = (ms = 1200) => {
    limpiarReinicioTimer()
    reinicioTimer = setTimeout(() => {
      if (hablando) return
      try {
        recognition.start()
      } catch {
        /* ya escuchando */
      }
    }, ms)
  }

  const iniciar = () => {
    try {
      recognition.start()
      setEstado("escuchando")
    } catch {
      programarReinicio(400)
    }
  }

  iniciar()

  recognition.onstart = () => {
    claveAbiertaEnFrase = ""
    setEstado("escuchando")
  }

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    if (!event.results?.length) return

    const { mensaje, esFinal } = leerTranscript(event)
    if (!mensaje) return

    const faqData = getFaqData()
    const items = faqData?.items ?? []
    const tokens = tokensDesdeTranscript(mensaje)
    const match = items.length
      ? buscarEnFaqPorPalabraClave(mensaje, items)
      : null

    setEstado("detectado")

    onDeteccion({
      transcript: mensaje,
      tokens,
      palabraClave: match?.keyword ?? null,
      coincidio: Boolean(match),
      esFinal,
    })

    if (match && match.keyword !== claveAbiertaEnFrase) {
      claveAbiertaEnFrase = match.keyword
      onCoincidencia(match.answer)
      onActivarFaq()

      hablando = true
      try {
        recognition.stop()
      } catch {
        /* ignore */
      }

      hablar(match.answer, () => {
        hablando = false
        claveAbiertaEnFrase = ""
        programarReinicio(500)
      })
    }

    if (esFinal && !match) {
      claveAbiertaEnFrase = ""
    }
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === "no-speech" || event.error === "aborted") {
      setEstado("esperando")
      programarReinicio(800)
      return
    }
    if (event.error === "not-allowed") {
      setEstado("error")
      return
    }
    setEstado("error")
    programarReinicio(2000)
  }

  recognition.onend = () => {
    if (hablando) return
    setEstado("esperando")
    programarReinicio(600)
  }
}

export function detenerReconocimiento() {
  limpiarReinicioTimer()
  if (typeof window !== "undefined") {
    speechSynthesis.cancel()
  }
  if (recognitionInstance) {
    try {
      recognitionInstance.onend = null
      recognitionInstance.onresult = null
      recognitionInstance.onerror = null
      recognitionInstance.stop()
      recognitionInstance = null
    } catch {
      /* ignore */
    }
  }
}
