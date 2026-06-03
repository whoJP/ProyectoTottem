/**
 * URL pública de esta app (enlaces a /api/contents/file/...).
 * En Vercel usa VERCEL_URL si no defines NEXT_PUBLIC_APP_URL.
 */
export function getAppBaseUrl(request?: Request): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, "")

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (productionHost) {
    const host = productionHost.replace(/^https?:\/\//, "").replace(/\/$/, "")
    return `https://${host}`
  }

  const vercelHost = process.env.VERCEL_URL?.trim()
  if (vercelHost) {
    const host = vercelHost.replace(/^https?:\/\//, "").replace(/\/$/, "")
    return `https://${host}`
  }

  if (request) {
    return new URL(request.url).origin
  }

  return "http://localhost:3001"
}
