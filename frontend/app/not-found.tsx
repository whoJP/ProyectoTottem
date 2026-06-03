"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const router = useRouter()
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/login")
      return
    }
    setHasSession(true)
  }, [router])

  if (hasSession !== true) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Redirigiendo...
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <img
        src="/logo.svg"
        alt="TOTEM"
        width={64}
        height={64}
        className="w-16 h-16 rounded-2xl shadow-md shadow-blue-600/20 ring-1 ring-border/50 mb-6"
      />
      <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        La página que buscas no existe o fue movida.
      </p>
      <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
        <Link href="/dashboard">Ir al panel</Link>
      </Button>
    </main>
  )
}
