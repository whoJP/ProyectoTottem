"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")

    if (hash) {
      const params = new URLSearchParams(hash)
      const token = params.get("token")
      const admin = params.get("admin")

      if (token) {
        localStorage.setItem("token", token)
      }

      if (admin) {
        localStorage.setItem("admin", decodeURIComponent(admin))
      }

      window.history.replaceState(null, "", window.location.pathname)
    }

    const tokenGuardado = localStorage.getItem("token")

    if (!tokenGuardado) {
      router.replace("/login")
      return
    }

    setChecking(false)
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Verificando sesión...
      </div>
    )
  }

  return <>{children}</>
}
