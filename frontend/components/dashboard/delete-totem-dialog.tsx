"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSedeDeleteConfirmation } from "@/lib/totem-labels"
import type { Totem } from "./totems-table"

type DeleteTotemDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  totem: Totem | null
  onConfirm: () => Promise<void>
}

export function DeleteTotemDialog({
  open,
  onOpenChange,
  totem,
  onConfirm,
}: DeleteTotemDialogProps) {
  const [confirmation, setConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const requiredText = totem ? getSedeDeleteConfirmation(totem.campusId) : ""
  const canDelete = confirmation === requiredText && !isDeleting

  useEffect(() => {
    if (!open) {
      setConfirmation("")
      setIsDeleting(false)
    }
  }, [open])

  const handleDelete = async () => {
    if (!canDelete) return
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto sm:mx-0 mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-red-500/25">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <AlertDialogTitle className="text-foreground">
            Eliminar tótem
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p>
                Vas a eliminar permanentemente{" "}
                <span className="font-medium text-foreground">
                  {totem?.nombre ?? "este tótem"}
                </span>
                . Esta acción no se puede deshacer.
              </p>
              <p>
                Para confirmar, escribe la sede en{" "}
                <span className="font-semibold text-foreground">MAYÚSCULAS</span>:
              </p>
              <p className="rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-center font-mono text-base font-bold tracking-wide text-red-600 dark:text-red-400">
                {requiredText}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="delete-sede-confirm" className="text-xs text-muted-foreground">
            Escribe la sede exactamente como se muestra arriba
          </Label>
          <Input
            id="delete-sede-confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={requiredText}
            autoComplete="off"
            className="bg-muted/50 border-border font-mono uppercase tracking-wide"
            disabled={isDeleting}
          />
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={isDeleting} className="border-border">
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={!canDelete}
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar tótem"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
