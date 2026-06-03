"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <img
        src="/logo.svg"
        alt="TOTEM"
        width={64}
        height={64}
        className="w-16 h-16 rounded-2xl shadow-md shadow-amber-500/20 ring-1 ring-border/50 mb-6"
      />
      <h1 className="text-3xl font-bold text-foreground mb-2">Algo salió mal</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Ocurrió un error inesperado. Puedes intentar de nuevo o volver al panel.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="border-border" onClick={() => reset()}>
          Reintentar
        </Button>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/dashboard">Ir al panel</Link>
        </Button>
      </div>
    </main>
  )
}
