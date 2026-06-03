# Panel de administración TOTEM

Aplicación web para gestionar tótems (alta, edición, contenido, notificaciones y administradores). Está hecha con **Next.js** y guarda la información en **MongoDB**.

---

## Requisitos

- **Node.js** 18 o superior (recomendado 20+)
- Cuenta en **MongoDB Atlas** (o MongoDB accesible desde tu red)
- Para recuperar contraseña: cuenta de correo (en el proyecto se usa Gmail con contraseña de aplicación)

---

## Instalación

1. Clonar el repositorio e ingresar a la carpeta del frontend:

```bash
cd frontend
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear el archivo de variables de entorno (copiar y completar a mano):

```bash
# En Windows (PowerShell), desde la carpeta frontend:
copy .env.example .env.local
```

Editar `.env.local` con tus valores:

| Variable | Descripción |
|----------|-------------|
| `MONGO_URI` | Cadena de conexión a MongoDB |
| `JWT_SECRET` | Texto secreto para firmar las sesiones |
| `JWT_EXPIRES_IN` | Duración del token, por ejemplo `2h` |
| `EMAIL_USER` | Correo que envía el reset de contraseña |
| `EMAIL_PASS` | Contraseña de aplicación del correo |
| `FRONTEND_URL` | URL base del sitio (`http://localhost:3000` en local) |

El archivo `.env.local` **no** debe subirse a GitHub (ya está ignorado en `.gitignore`).

---

## Desarrollo (uso diario)

```bash
npm run dev
```

Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

La raíz redirige al panel (`/dashboard`). Si no hay sesión, el sistema envía al login.

---

## Producción (servidor o hosting)

Sirve para cuando despliegas el proyecto 

```bash
npm run build
npm start
```

- `build` genera la versión optimizada.
- `start` levanta el servidor en el puerto **3000** (o el que defina la variable `PORT` del hosting).

En el panel del proveedor debes configurar **las mismas variables** que en `.env.local`. En producción cambia `FRONTEND_URL` por la URL real para que el enlace del correo de recuperación funcione.

---

## Scripts disponibles

| Comando | Uso |
|---------|-----|
| `npm run dev` | Modo desarrollo con recarga automática |
| `npm run build` | Compilar para producción |
| `npm start` | Ejecutar después de `build` |
| `npm run lint` | Revisar estilo/código con ESLint |

---

## MongoDB Atlas

Si al iniciar sesión aparece error de conexión o de IP:

1. Entrar a [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Network Access** → agregar tu IP o permitir acceso desde cualquier IP (solo para pruebas académicas)

---

## Estructura breve

- `app/` — páginas y rutas API (`/api/login`, `/api/totems`, etc.)
- `components/` — interfaz del panel y login
- `lib/` — conexión a base de datos, autenticación, utilidades
- `models/` — esquemas de Mongoose
- `login/` — pantallas de inicio de sesión y recuperación de contraseña
- `public/` — iconos y logos estáticos

