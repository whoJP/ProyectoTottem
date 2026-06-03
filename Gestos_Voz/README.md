# TOTEM — Experiencia estudiantil (Gestos y Voz)

Aplicación **Next.js** para la pantalla del tótem que ven los estudiantes. Comparte la misma base de datos, modelos y reglas de contenido que el panel en `frontend/`.

## Requisitos

- Node.js 18+
- Misma base MongoDB que el panel de administración
- Cámara y micrófono (HTTPS en producción para permisos del navegador)

## Instalación

```bash
cd Gestos_Voz
npm install
copy .env.example .env.local
```

Variables en `.env.local`:

| Variable | Descripción |
|----------|-------------|
| `MONGO_URI` | Igual que en `frontend/.env.local` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` en local |
| `NEXT_PUBLIC_TOTEM_ID` | *(Opcional)* Solo si quieres saltar el login en ese equipo |

**No hace falta un proyecto por tótem.** Una sola app `Gestos_Voz` para todos los equipos. Cada pantalla física inicia sesión una vez con el **usuario y contraseña del tótem** que ves en el panel admin (al crear/editar el tótem). Eso vincula el dispositivo a su contenido.

`NEXT_PUBLIC_TOTEM_ID` queda solo para casos especiales (kiosk preconfigurado en fábrica).

## Desarrollo

```bash
npm run dev
```

Panel admin: puerto **3000** (`frontend`). Tótem estudiantes: puerto **3001** (esta app).

## Funcionalidades integradas desde `frontend`

- Contenido del tótem (imágenes carrusel, videos) vía GridFS y `/api/contents/file/[id]`
- Plantillas y slots (`totem-archivos`, `totem-templates`, `totem-media`)
- Vigencia de contenido (`mostrarDesde` / `mostrarHasta`, `totem-content-expiry`)
- Estados del tótem (Activo, Inactivo, En Mantenimiento)
- Notificaciones activas por `totem_id`
- FAQ desde colección `faqs` (compatible con el backend legado en `Gestos_Voz/backend`)
- **Gestos**: MediaPipe, palma abierta → FAQ
- **Voz**: reconocimiento y síntesis en español

## Estructura

- `app/` — página del tótem y APIs kiosk
- `components/totem/` — UI, gestos y voz
- `lib/` — utilidades compartidas con el panel (copiadas desde `frontend`)
- `models/` — Mongoose (Totem, Content, Notification, Faq)
- `frontend-totem/` — app Vite anterior (referencia; usar esta app Next.js)

## API pública del kiosk

- `GET /api/kiosk/totems/[id]` — payload completo del tótem
- `GET /api/kiosk/faq/[totemId]` — solo FAQ
- `GET /api/contents/file/[id]` — archivos multimedia (sin login admin)

## Despliegue en Vercel (tótem estudiantes)

Esta app **no necesita** el backend Express (`Gestos_Voz/backend` en puerto 4000). En Vercel solo despliegas **`Gestos_Voz`** (Next.js).

### Pasos en Vercel

1. Importa el repositorio en [vercel.com](https://vercel.com).
2. **Root Directory:** `Gestos_Voz`
3. **Framework Preset:** Next.js (detecta `vercel.json` automáticamente).
4. **Environment Variables** (Production y Preview):

   | Variable | Valor |
   |----------|--------|
   | `MONGO_URI` | La misma cadena que en `frontend/.env.local` |
   | `NEXT_PUBLIC_APP_URL` | *(Opcional)* `https://tu-proyecto.vercel.app` — si no la pones, la app usa `VERCEL_URL` en runtime |

5. Deploy.

### MongoDB Atlas

En **Network Access** permite `0.0.0.0/0` (o las IPs de Vercel) para que las funciones serverless puedan conectar.

### HTTPS, cámara y micrófono

El tótem físico debe abrir la URL **`https://...`** de Vercel. Los navegadores solo permiten cámara/micrófono en contexto seguro (HTTPS o localhost).

### FAQ y sede en producción

- Las preguntas viven en MongoDB (`faqs.items`).
- La respuesta con `{{SEDE}}` se reemplaza automáticamente leyendo `campus_id` del tótem (funciona igual en local y en Vercel).
- Carga/actualiza el FAQ con `scripts/update-faq-totem-tiquipaya.mongosh.js` en `mongosh` (no forma parte del deploy).

### Panel admin (`frontend`)

Sigue en otro proyecto Vercel (o local puerto 3000) con la misma `MONGO_URI`. Son **dos despliegues**: admin + kiosk.
