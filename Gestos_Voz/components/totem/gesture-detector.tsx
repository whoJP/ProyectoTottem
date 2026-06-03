"use client"

import { useEffect, useRef, useState } from "react"
import Webcam from "react-webcam"
import {
  FilesetResolver,
  GestureRecognizer,
} from "@mediapipe/tasks-vision"

type GestureDetectorProps = {
  onDetect: () => void
  compact?: boolean
}

function safeCloseRecognizer(recognizer: GestureRecognizer | null) {
  if (!recognizer) return
  try {
    recognizer.close()
  } catch {
    /* ya cerrado o hot-reload de Next */
  }
}

async function hasVideoInput(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return false
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some((d) => d.kind === "videoinput")
  } catch {
    return false
  }
}

export function GestureDetector({ onDetect, compact = false }: GestureDetectorProps) {
  const webcamRef = useRef<Webcam>(null)
  const recognizerRef = useRef<GestureRecognizer | null>(null)
  const animationRef = useRef<number | null>(null)
  const lastVideoTimeRef = useRef(-1)
  const lastTriggerRef = useRef(0)
  const onDetectRef = useRef(onDetect)

  const [status, setStatus] = useState("Comprobando cámara...")
  const [cameraError, setCameraError] = useState("")
  const [gestureName, setGestureName] = useState("Sin gesto")
  const [cameraReady, setCameraReady] = useState(false)
  const [skipGestures, setSkipGestures] = useState(false)

  useEffect(() => {
    onDetectRef.current = onDetect
  }, [onDetect])

  useEffect(() => {
    let isMounted = true

    const startLoop = () => {
      const detect = () => {
        if (!isMounted) return

        const webcam = webcamRef.current
        const recognizer = recognizerRef.current
        const video = webcam?.video

        if (video && video.readyState === 4 && recognizer) {
          if (lastVideoTimeRef.current !== video.currentTime) {
            lastVideoTimeRef.current = video.currentTime
            const now = performance.now()
            const result = recognizer.recognizeForVideo(video, now)
            const topGesture =
              result?.gestures?.[0]?.[0]?.categoryName || "Sin gesto"

            setGestureName(topGesture)
            setStatus("Cámara activa")

            if (topGesture === "Open_Palm") {
              const currentTime = Date.now()
              if (currentTime - lastTriggerRef.current > 2500) {
                lastTriggerRef.current = currentTime
                onDetectRef.current()
              }
            }
          }
        }

        animationRef.current = requestAnimationFrame(detect)
      }

      detect()
    }

    const setup = async () => {
      const hasCamera = await hasVideoInput()
      if (!isMounted) return

      if (!hasCamera) {
        setSkipGestures(true)
        setCameraError(
          "No hay cámara en este equipo. Puedes usar el asistente de voz o el panel de FAQ."
        )
        setStatus("Sin cámara")
        return
      }

      setCameraReady(true)

      try {
        setStatus("Cargando modelo de reconocimiento...")
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        )

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          },
          runningMode: "VIDEO",
          numHands: 1,
        })

        if (!isMounted) {
          safeCloseRecognizer(recognizer)
          return
        }

        recognizerRef.current = recognizer
        setStatus("Esperando cámara...")
        startLoop()
      } catch {
        if (!isMounted) return
        setCameraError("No se pudo cargar el modelo de gestos.")
        setStatus("Error")
      }
    }

    setup()

    return () => {
      isMounted = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      safeCloseRecognizer(recognizerRef.current)
      recognizerRef.current = null
    }
  }, [])

  const handleMediaError = (error: string | DOMException) => {
    const name =
      typeof error === "object" && error && "name" in error
        ? String(error.name)
        : ""
    const message = String(error)

    if (
      name === "NotFoundError" ||
      message.includes("NotFound") ||
      message.includes("not found")
    ) {
      setCameraError(
        "No se encontró cámara. Conecta una webcam o usa voz para las preguntas."
      )
    } else if (name === "NotAllowedError" || message.includes("Permission")) {
      setCameraError("Permite el acceso a la cámara en el navegador.")
    } else {
      setCameraError(
        "No se pudo usar la cámara. Verifica permisos o prueba en HTTPS."
      )
    }
    setStatus("Sin acceso a cámara")
  }

  if (compact) {
    return (
      <div
        className="gesture-camera-box gesture-camera-compact"
        title={`Cámara: ${gestureName}`}
        aria-label="Cámara de gestos"
      >
        {cameraReady && !skipGestures ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user",
              width: { ideal: 320 },
              height: { ideal: 240 },
            }}
            onUserMedia={() => {
              setCameraError("")
              setStatus("Cámara conectada")
            }}
            onUserMediaError={handleMediaError}
            className="gesture-webcam gesture-webcam-compact"
          />
        ) : (
          <div className="gesture-webcam-compact gesture-webcam-placeholder">
            {cameraError ? "!" : "…"}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="gesture-camera-box">
      <div className="gesture-camera-header">
        <span>Cámara del Tótem</span>
        <span className="gesture-status">{status}</span>
      </div>
      <div className="gesture-camera-body">
        {cameraReady && !skipGestures ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 },
            }}
            onUserMedia={() => {
              setCameraError("")
              setStatus("Cámara conectada")
            }}
            onUserMediaError={handleMediaError}
            className="gesture-webcam"
          />
        ) : (
          <div
            className="gesture-webcam"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 72,
              background: "#0a1220",
              fontSize: 11,
              color: "#8ca8c5",
              padding: 16,
              textAlign: "center",
            }}
          >
            {cameraError || "Inicializando..."}
          </div>
        )}
        <div className="gesture-overlay">
          <div className="gesture-pill">
            Gesto detectado: <strong>{gestureName}</strong>
          </div>
          <div className="gesture-help">
            Abra la mano frente a la cámara para mostrar Preguntas Frecuentes.
          </div>
          {cameraError && <div className="gesture-error">{cameraError}</div>}
        </div>
      </div>
    </div>
  )
}
