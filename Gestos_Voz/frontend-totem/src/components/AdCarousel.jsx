import { useEffect, useState } from "react";

const slidesDemo = [
  {
    id: 1,
    tag: "ANUNCIO",
    title: "Eventos del Mes",
    subtitle: "Conoce las actividades programadas y únete a la comunidad.",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    tag: "NOVEDAD",
    title: "Inscripciones Abiertas",
    subtitle: "Consulta fechas, requisitos y horarios de atención.",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    tag: "COMUNIDAD",
    title: "Feria Universitaria",
    subtitle: "Descubre talleres, stands y charlas para estudiantes.",
    image:
      "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function AdCarousel({ ads = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = ads.length
    ? ads.map((ad, index) => ({
        id: index + 1,
        tag: ad.tag || "ANUNCIO",
        title: ad.title || "Publicidad",
        subtitle: ad.description || "Contenido informativo del tótem.",
        image: ad.mediaUrl,
      }))
    : slidesDemo;

  useEffect(() => {
    if (!slides.length) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[currentIndex];

  return (
    <div className="ad-layout">
      <header className="totem-topbar">
        <div className="topbar-left">
          <div className="totem-logo">T</div>
          <span className="totem-brand">TOTEM</span>
        </div>

        <div className="topbar-right">
          <span className="topbar-time">07:50 a. m.</span>
          <span className="topbar-dot">•</span>
          <span className="topbar-icon">📶</span>
          <span className="topbar-icon">🔋</span>
        </div>
      </header>

      <section
        className="hero-banner"
        style={{ backgroundImage: `url(${currentSlide.image})` }}
      >
        <div className="hero-overlay" />

        <button className="hero-arrow left">‹</button>
        <button className="hero-arrow right">›</button>

        <div className="hero-content">
          <span className="hero-tag">{currentSlide.tag}</span>
          <h1>{currentSlide.title}</h1>
          <p>{currentSlide.subtitle}</p>

          <div className="hero-dots">
            {slides.map((_, index) => (
              <span
                key={index}
                className={`hero-dot ${
                  index === currentIndex ? "active" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <h2 className="section-title">Video Informativo</h2>

        <div className="video-card">
          <img
            src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"
            alt="Video informativo"
            className="video-thumbnail"
          />

          <div className="play-button">▶</div>
          <div className="video-duration">3:45</div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">📹</span>
            <div>
              <h3>Video Informativo</h3>
              <p>Conoce los servicios y beneficios disponibles para la comunidad.</p>
            </div>
          </div>

          <div className="schedule-list">
            <div className="schedule-item">
              <span>Lunes - Viernes</span>
              <strong>08:00 - 18:00</strong>
            </div>
            <div className="schedule-item">
              <span>Sábado</span>
              <strong>09:00 - 13:00</strong>
            </div>
            <div className="schedule-item">
              <span>Domingo</span>
              <strong>Cerrado</strong>
            </div>
            <div className="schedule-item">
              <span>Feriados</span>
              <strong>Cerrado</strong>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">📅</span>
            <div>
              <h3>Eventos y Avisos</h3>
              <p>Información importante y actividades programadas.</p>
            </div>
          </div>

          <div className="events-list">
            <div className="event-item">
              <span>Taller de Participación Ci...</span>
              <strong>Mar 10 · 10:00 hs</strong>
            </div>
            <div className="event-item">
              <span>Feria de Emprendedores</span>
              <strong>Mar 15 · 09:00 hs</strong>
            </div>
            <div className="event-item">
              <span>Charla Informativa: Salud</span>
              <strong>Mar 20 · 17:00 hs</strong>
            </div>
            <div className="event-item">
              <span>Jornada de Capacitación</span>
              <strong>Mar 28 · 14:00 hs</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}