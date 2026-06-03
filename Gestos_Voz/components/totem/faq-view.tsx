import { TotemLogo } from "@/components/totem/totem-logo"
import type { KioskFaqPayload } from "@/lib/kiosk-totem"

type FaqViewProps = {
  faq: KioskFaqPayload
  totemId?: string
}

export function FaqView({ faq, totemId }: FaqViewProps) {
  const items = faq.items ?? []

  return (
    <div className="faq-layout">
      <header className="totem-topbar">
        <div className="topbar-left">
          <TotemLogo />
          <span className="totem-brand">TOTEM</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-time">Preguntas Frecuentes</span>
          <span className="topbar-dot">•</span>
          <span className="topbar-icon">ℹ️</span>
        </div>
      </header>

      <section className="faq-hero">
        <div className="faq-hero-overlay" />
        <div className="faq-hero-content">
          <span className="faq-hero-tag">AYUDA</span>
          <h1>{faq.title || "Preguntas Frecuentes"}</h1>
          <p>
            Encuentra respuestas rápidas a las dudas más comunes de la comunidad
            universitaria.
          </p>
        </div>
      </section>

      <section className="faq-section">
        <h2 className="section-title">Consultas Disponibles</h2>
        {items.length === 0 ? (
          <div className="faq-empty-card">
            <h3>No hay preguntas frecuentes disponibles</h3>
            <p>
              No se cargaron preguntas desde la base de datos. Vuelva a ejecutar
              el script en mongosh y recargue esta página.
            </p>
            {totemId ? (
              <p className="faq-empty-totem-id">
                Tótem en sesión: <code>{totemId}</code>
              </p>
            ) : null}
          </div>
        ) : (
          <div className="faq-dashboard-grid">
            {items.map((item, index) => (
              <article className="faq-dashboard-card" key={index}>
                <div className="faq-card-top">
                  <span className="faq-bullet">•</span>
                  <span className="faq-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="faq-keyword-label">
                  Palabra clave: <strong>{item.keyword}</strong>
                </p>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
