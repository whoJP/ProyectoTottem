import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  FilesetResolver,
  GestureRecognizer,
} from "@mediapipe/tasks-vision";

export default function GestureDetector({ onDetect }) {
  const webcamRef = useRef(null);
  const recognizerRef = useRef(null);
  const animationRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const lastTriggerRef = useRef(0);

  const [status, setStatus] = useState("Inicializando cámara...");
  const [cameraError, setCameraError] = useState("");
  const [gestureName, setGestureName] = useState("Sin gesto");

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        setStatus("Cargando modelo de reconocimiento...");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        if (!isMounted) return;

        recognizerRef.current = recognizer;
        setStatus("Esperando cámara...");

        startLoop();
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setCameraError("No se pudo cargar el modelo de gestos.");
        setStatus("Error");
      }
    };

    const startLoop = () => {
      const detect = () => {
        const webcam = webcamRef.current;
        const recognizer = recognizerRef.current;

        if (
          webcam &&
          webcam.video &&
          webcam.video.readyState === 4 &&
          recognizer
        ) {
          const video = webcam.video;

          if (lastVideoTimeRef.current !== video.currentTime) {
            lastVideoTimeRef.current = video.currentTime;

            const now = performance.now();
            const result = recognizer.recognizeForVideo(video, now);

            const topGesture =
              result?.gestures?.[0]?.[0]?.categoryName || "Sin gesto";

            setGestureName(topGesture);
            setStatus("Cámara activa");

            if (topGesture === "Open_Palm") {
              const currentTime = Date.now();

              if (currentTime - lastTriggerRef.current > 2500) {
                lastTriggerRef.current = currentTime;
                onDetect();
              }
            }
          }
        }

        animationRef.current = requestAnimationFrame(detect);
      };

      detect();
    };

    setup();

    return () => {
      isMounted = false;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (recognizerRef.current) {
        recognizerRef.current.close?.();
      }
    };
  }, [onDetect]);

  return (
    <div className="gesture-camera-box">
      <div className="gesture-camera-header">
        <span>Cámara del Tótem</span>
        <span className="gesture-status">{status}</span>
      </div>

      <div className="gesture-camera-body">
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={true}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "user",
            width: 640,
            height: 480,
          }}
          onUserMedia={() => {
            setCameraError("");
            setStatus("Cámara conectada");
          }}
          onUserMediaError={(error) => {
            console.error(error);
            setCameraError(
              "No se pudo acceder a la cámara. Verifica permisos, HTTPS o el dispositivo."
            );
            setStatus("Sin acceso a cámara");
          }}
          className="gesture-webcam"
        />

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
  );
}