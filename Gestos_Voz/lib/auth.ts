import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { normalizeCampusId } from "@/lib/totem-labels"
import Admin from "@/models/Admin"

export type AuthPayload = {
  adminId: string
  admin_id: string
  rol: string
  campus_id?: string | null
  tokenVersion: number
}

export function isSuperAdmin(auth: AuthPayload): boolean {
  return auth.rol === "superadmin"
}

export function getTotemListFilter(auth: AuthPayload): Record<string, string> {
  if (isSuperAdmin(auth)) return {}
  const campusId = auth.campus_id ? normalizeCampusId(auth.campus_id) : null
  if (!campusId) return { campus_id: "__none__" }
  return { campus_id: campusId }
}

export function canAccessCampus(auth: AuthPayload, campusId: string): boolean {
  if (isSuperAdmin(auth)) return true
  const adminCampus = auth.campus_id ? normalizeCampusId(auth.campus_id) : null
  if (!adminCampus) return false
  return adminCampus === normalizeCampusId(campusId)
}

export function resolveCampusIdForWrite(
  auth: AuthPayload,
  requestedCampusId: string | undefined | null
): string | null {
  if (isSuperAdmin(auth)) {
    return normalizeCampusId(requestedCampusId)
  }
  if (!auth.campus_id) return null
  return normalizeCampusId(auth.campus_id)
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null
  const token = header.slice(7).trim()
  return token || null
}

export function verifyAuthToken(token: string): AuthPayload | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null

  try {
    const decoded = jwt.verify(token, secret) as AuthPayload
    if (!decoded?.adminId) return null
    const tokenVersion =
      typeof decoded.tokenVersion === "number" ? decoded.tokenVersion : 0
    return { ...decoded, tokenVersion }
  } catch {
    return null
  }
}

/** Devuelve el admin autenticado o una respuesta 401 lista para retornar. */
export async function requireAuth(
  request: Request
): Promise<{ auth: AuthPayload } | { response: NextResponse }> {
  const token = getBearerToken(request)
  if (!token) {
    return {
      response: NextResponse.json(
        { error: "No autorizado. Inicia sesión nuevamente." },
        { status: 401 }
      ),
    }
  }

  const auth = verifyAuthToken(token)
  if (!auth) {
    return {
      response: NextResponse.json(
        { error: "Sesión inválida o expirada." },
        { status: 401 }
      ),
    }
  }

  await connectDB()
  const admin = await Admin.findById(auth.adminId).select("tokenVersion").lean()
  const currentVersion =
    typeof admin?.tokenVersion === "number" ? admin.tokenVersion : 0

  if (!admin || currentVersion !== auth.tokenVersion) {
    return {
      response: NextResponse.json(
        { error: "Sesión inválida o expirada." },
        { status: 401 }
      ),
    }
  }

  return { auth }
}
