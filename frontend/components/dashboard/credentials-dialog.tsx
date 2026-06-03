"use client"

import { useState } from "react"
import { KeyRound, User, Lock, Eye, EyeOff, Copy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 gap-0">
        {/* Header */}
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Username Field */}
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
                variant="outline"
                size="icon"
                className="h-12 w-12 border-border"
                onClick={() => copyToClipboard(username)}
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Password Field */}
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
                variant="outline"
                size="icon"
                className="h-12 w-12 border-border"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 border-border"
                onClick={() => copyToClipboard(password)}
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border">
            <Lock className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Estas credenciales se generan automáticamente al crear el totem y
              se utilizan para conectar el dispositivo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <Button
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
