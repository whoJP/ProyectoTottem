"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className={cn("h-10 w-10 shrink-0", className)} aria-hidden />
  }

  const isDark = resolvedTheme !== "light"

  return (
    <button
      type="button"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        "border border-border bg-muted/40 text-foreground",
        "transition-colors hover:bg-muted hover:border-muted-foreground/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-600/10",
          "transition-opacity duration-500",
          isDark ? "opacity-100" : "opacity-0"
        )}
      />
      <Moon
        className={cn(
          "relative h-[18px] w-[18px] text-blue-300 transition-all duration-500 ease-out",
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-[70deg] scale-50 opacity-0"
        )}
      />
      <Sun
        className={cn(
          "absolute h-[18px] w-[18px] text-amber-500 transition-all duration-500 ease-out",
          !isDark
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-[70deg] scale-50 opacity-0"
        )}
      />
    </button>
  )
}
