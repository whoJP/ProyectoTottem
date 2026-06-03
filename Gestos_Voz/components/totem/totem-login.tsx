"use client"

import { useState } from "react"
import { TotemLogo } from "@/components/totem/totem-logo"
import { loginKioskTotem } from "@/lib/fetch-kiosk"
import { setStoredTotemId } from "@/lib/kiosk-session"

type TotemLoginProps = {
  onSuccess: (totemId: string) => void
}

export function TotemLogin({ onSuccess }: TotemLoginProps) {
  const [usuario, setUsuario] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { totemId } = await loginKioskTotem(usuario, contraseña)
      setStoredTotemId(totemId)
      onSuccess(totemId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión"
      setError(
        msg.includes("incorrectas")
          ? "Usuario o contraseña incorrectos. Cópialos desde el panel web del tótem."
          : msg
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen-center" style={{ padding: 24 }}>
      <div
        className="info-card"
        style={{ maxWidth: 400, width: "100%", padding: 24 }}
      >
        <div className="topbar-left" style={{ marginBottom: 16 }}>
          <TotemLogo size={28} />
          <span className="totem-brand">TOTEM</span>
        </div>

        <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>Activar este equipo</h1>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: "#9fbbd7" }}>
          Usa el usuario y contraseña que configuró el administrador para este
          tótem. Es la misma app para todos los equipos; cada pantalla solo
          muestra su tótem.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: 11, color: "#a8bbd0" }}>
            Usuario del tótem
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              required
              style={inputStyle}
            />
          </label>
          <label style={{ fontSize: 11, color: "#a8bbd0" }}>
            Contraseña
            <input
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </label>

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: "#ff7b7b" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #00c9b7, #4f7cff)",
              color: "white",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Conectando..." : "Iniciar pantalla del tótem"}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(72, 208, 255, 0.2)",
  background: "rgba(0, 0, 0, 0.25)",
  color: "white",
  fontSize: 14,
  boxSizing: "border-box",
}
