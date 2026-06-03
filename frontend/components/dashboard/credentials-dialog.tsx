"use client"

import { useState } from "react"
import { KeyRound, User, Lock, Eye, EyeOff, Copy, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { toastError, toastSuccess } from "@/lib/fetch-auth"

interface CredentialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totemName: string
  username: string
  password: string
}

export function CredentialsDialog({
  open,
  onOpenChange,
  totemName,
  username,
  password,
}: CredentialsDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedUser, setCopiedUser] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const handleCopy = async (text: string, type: "user" | "password") => {
    const ok = await copyToClipboard(text)
    if (!ok) {
      toastError("No se pudo copiar. Intenta seleccionar el texto manualmente.")
      return
    }
    toastSuccess(type === "user" ? "Usuario copiado" : "Contraseña copiada")
    if (type === "user") {
      setCopiedUser(true)
      setTimeout(() => setCopiedUser(false), 2000)
    } else {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Credenciales del Totem
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {totemName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Usuario del Totem
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border border-border">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-mono">
                  {username}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 border-border"
                onClick={() => handleCopy(username, "user")}
                title="Copiar usuario"
              >
                {copiedUser ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Contraseña del Totem
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border border-border">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-mono">
                  {showPassword ? password : "••••••••••"}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 border-border"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 border-border"
                onClick={() => handleCopy(password, "password")}
                title="Copiar contraseña"
              >
                {copiedPassword ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border">
            <Lock className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Estas credenciales se generan automáticamente al crear el totem y
              se utilizan para conectar el dispositivo.
            </p>
          </div>
        </div>

        <div className="p-6 pt-0">
          <Button
            type="button"
            variant="outline"
            className="w-full border-border"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
