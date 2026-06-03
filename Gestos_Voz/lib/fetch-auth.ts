"use client"

import { toast } from "sonner"

export type StoredAdmin = {
  id?: string
  admin_id?: string
  nombre?: string
  correo?: string
  rol?: string
  campus_id?: string | null
}

export function getStoredAdmin(): StoredAdmin | null {
  try {
    const raw = localStorage.getItem("admin")
    if (!raw) return null
    return JSON.parse(raw) as StoredAdmin
  } catch {
    return null
  }
}

export function isStoredSuperAdmin(admin: StoredAdmin | null = getStoredAdmin()): boolean {
  return admin?.rol === "superadmin"
}

export function clearSessionAndRedirectToLogin(message?: string) {
  localStorage.removeItem("token")
  localStorage.removeItem("admin")
  if (message) {
    sessionStorage.setItem("login_redirect_message", message)
  }
  window.location.href = "/login"
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("token")
  const headers = new Headers(init.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(input, { ...init, headers })

  if (response.status === 401) {
    clearSessionAndRedirectToLogin(
      "Sesión expirada. Por seguridad debes iniciar sesión de nuevo."
    )
    throw new Error("SESSION_EXPIRED")
  }

  return response
}

export function toastError(message: string) {
  toast.error(message)
}

export function toastSuccess(message: string) {
  toast.success(message)
}
