"use client"

import { useEffect } from "react"

export default function LoginBodyTheme({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    document.body.classList.add("totem-login-page")
    return () => document.body.classList.remove("totem-login-page")
  }, [])

  return <>{children}</>
}
