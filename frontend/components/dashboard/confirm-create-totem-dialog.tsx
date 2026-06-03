"use client"

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
import { getPlantillaNameFromId, getSedeNameFromId } from "@/lib/totem-labels"

type ConfirmCreateTotemDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nombre: string
  sedeId: string
  plantillaId: string
  estado: string
  onConfirm: () => void | Promise<void>
  isSubmitting?: boolean
}

export function ConfirmCreateTotemDialog({
  open,
  onOpenChange,
  nombre,
  sedeId,
  plantillaId,
  estado,
  onConfirm,
  isSubmitting = false,
}: ConfirmCreateTotemDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            ¿Crear este tótem?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p>Revisa los datos antes de confirmar:</p>
              <ul className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 text-foreground">
                <li>
                  <span className="text-muted-foreground">Nombre: </span>
                  <span className="font-medium">{nombre}</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Sede: </span>
                  {getSedeNameFromId(sedeId)}
                </li>
                <li>
                  <span className="text-muted-foreground">Plantilla: </span>
                  {getPlantillaNameFromId(plantillaId)}
                </li>
                <li>
                  <span className="text-muted-foreground">Estado inicial: </span>
                  {estado}
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border">Volver</AlertDialogCancel>
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isSubmitting}
            onClick={async () => {
              await onConfirm()
            }}
          >
            {isSubmitting ? "Creando..." : "Sí, crear tótem"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
