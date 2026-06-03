"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  getSessionId,
  isSessionStillValid,
  logoutAndRedirectToLogin,
  registerSession,
} from "@/lib/session"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const sessionAtMount = useRef<string | null>(null)

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

    const validate = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        logoutAndRedirectToLogin()
        return false
      }

      if (!isSessionStillValid(sessionAtMount.current)) {
        logoutAndRedirectToLogin()
        return false
      }

      return true
    }

    if (localStorage.getItem("token") && !getSessionId()) {
      registerSession()
    }
    sessionAtMount.current = getSessionId()

    if (!validate()) return

    setChecking(false)

    const onPageShow = (event: PageTransitionEvent) => {
      if (!validate()) return

      if (event.persisted) {
        window.location.reload()
      }
    }

    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
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
