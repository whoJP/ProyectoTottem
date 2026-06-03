"use client"

import { useState } from "react"
import { Key, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  getStoredAdmin,
  isStoredSuperAdmin,
  clearSessionAndRedirectToLogin,
  fetchWithAuth,
  toastError,
  toastSuccess,
  type StoredAdmin,
} from "@/lib/fetch-auth"
import { getSedeNameFromId } from "@/lib/totem-labels"
import {
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from "@/lib/password-validation"

type UserProfileModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const admin: StoredAdmin | null = getStoredAdmin()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [contrasenaActual, setContrasenaActual] = useState("")
  const [nuevaContrasena, setNuevaContrasena] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [loading, setLoading] = useState(false)

  const rolLabel = isStoredSuperAdmin(admin)
    ? "Superadministrador"
    : admin?.campus_id
      ? `Administrador · ${getSedeNameFromId(admin.campus_id)}`
      : "Administrador"

  const handleChangePassword = async () => {
    if (!contrasenaActual || !nuevaContrasena || !confirmar) {
      toastError("Completa todos los campos de contraseña.")
      return
    }

    if (!isStrongPassword(nuevaContrasena)) {
      toastError(STRONG_PASSWORD_MESSAGE)
      return
    }

    if (nuevaContrasena !== confirmar) {
      toastError("La nueva contraseña y la confirmación no coinciden.")
      return
    }

    setLoading(true)
    try {
      const response = await fetchWithAuth("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contrasenaActual,
          nuevaContrasena,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toastError(data.message || "No se pudo cambiar la contraseña.")
        return
      }

      toastSuccess(data.message || "Contraseña actualizada.")
      onOpenChange(false)
      clearSessionAndRedirectToLogin(
        "Contraseña actualizada. Inicia sesión con tu nueva contraseña."
      )
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") return
      toastError("Error de conexión al cambiar la contraseña.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <User className="h-5 w-5 text-blue-500" />
            Mi perfil
          </DialogTitle>
          <DialogDescription>Datos de tu cuenta en el panel TOTEM</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium text-foreground text-right">
                {admin?.nombre ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Usuario</span>
              <span className="font-mono text-foreground text-right">
                {admin?.admin_id ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Correo</span>
              <span className="text-foreground text-right break-all">
                {admin?.correo ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4 items-center">
              <span className="text-muted-foreground">Rol</span>
              <Badge variant="outline" className="border-border">
                {rolLabel}
              </Badge>
            </div>
          </div>

          {!showPasswordForm ? (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-border"
              onClick={() => setShowPasswordForm(true)}
            >
              <Key className="h-4 w-4" />
              Cambiar contraseña
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">
                Usa una contraseña segura (mayúscula, minúscula, número y símbolo).
                Al guardar cerrarás sesión y deberás entrar de nuevo.
              </p>
              <div className="space-y-2">
                <Label className="text-xs">Contraseña actual</Label>
                <Input
                  type="password"
                  value={contrasenaActual}
                  onChange={(e) => setContrasenaActual(e.target.value)}
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nueva contraseña</Label>
                <Input
                  type="password"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Confirmar nueva contraseña</Label>
                <Input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setContrasenaActual("")
                    setNuevaContrasena("")
                    setConfirmar("")
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar contraseña"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
