"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0d1117",
          color: "#e6edf3",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Error del sistema</h1>
        <p style={{ color: "#8b949e", marginBottom: "24px", maxWidth: "400px" }}>
          No pudimos cargar la aplicación. Intenta recargar la página.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "12px 24px",
            borderRadius: "8px",
            border: "none",
            background: "#22c55e",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Recargar
        </button>
      </body>
    </html>
  )
}
