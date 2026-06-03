"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type GlobalLoadingOverlayProps = {
  visible: boolean
  message?: string
}

export function GlobalLoadingOverlay({
  visible,
  message = "Procesando, por favor espera...",
}: GlobalLoadingOverlayProps) {
  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/75 backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
      aria-busy="true"
    >
      <div
        className={cn(
          "mx-4 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-border",
          "bg-card px-8 py-8 shadow-2xl shadow-black/20"
        )}
      >
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/30">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">{message}</p>
          <p className="text-xs text-muted-foreground">
            No cierres ni recargues esta página.
          </p>
        </div>
      </div>
    </div>
  )
}
