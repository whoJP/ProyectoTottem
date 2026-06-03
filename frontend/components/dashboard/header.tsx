"use client"

import { useEffect, useState } from "react"
import { LogOut, LayoutDashboard, User, ChevronDown } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSedeNameFromId } from "@/lib/totem-labels"
import { getStoredAdmin, isStoredSuperAdmin } from "@/lib/fetch-auth"
import { logoutAndRedirectToLogin } from "@/lib/session"
import { UserProfileModal } from "./user-profile-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function Header() {
  const [adminNombre, setAdminNombre] = useState<string | null>(null)
  const [adminRolLabel, setAdminRolLabel] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    try {
      const admin = getStoredAdmin()
      if (admin?.nombre) setAdminNombre(admin.nombre)
      if (isStoredSuperAdmin(admin)) {
        setAdminRolLabel("Superadministrador")
      } else if (admin?.campus_id) {
        setAdminRolLabel(getSedeNameFromId(admin.campus_id))
      } else {
        setAdminRolLabel(null)
      }
    } catch {
      setAdminNombre(null)
      setAdminRolLabel(null)
    }
  }, [])

  const handleLogout = () => {
    logoutAndRedirectToLogin()
  }

  const initials = adminNombre
    ? adminNombre
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "?"

  return (
    <>
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4 lg:gap-6 flex-1 min-w-0">
            <div className="flex items-center gap-3 shrink-0">
              <img
                src="/logo.svg"
                alt="TOTEM"
                width={44}
                height={44}
                className="w-11 h-11 rounded-xl shadow-md shadow-blue-600/20 ring-1 ring-border/50"
              />
              <div className="leading-tight">
                <h1 className="text-base font-bold tracking-tight text-foreground">TOTEM</h1>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Administración
                </p>
              </div>
            </div>

            <div className="hidden md:flex flex-1 min-w-0 items-center gap-5 pl-5 border-l border-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 border border-border">
                <LayoutDashboard className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Panel de control
                </p>
                <h2 className="text-base font-semibold text-foreground leading-snug tracking-tight">
                  Administración de Tótems
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Gestiona tus dispositivos de información digital
                </p>
              </div>

              {adminNombre && (
                <div
                  className="shrink-0 hidden lg:flex items-center gap-2.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 shadow-sm"
                  title={`Sesión: ${adminNombre}`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <p className="text-sm leading-none whitespace-nowrap">
                    <span className="text-muted-foreground">Bienvenido, </span>
                    <span className="font-medium text-foreground">{adminNombre}</span>
                    {adminRolLabel && (
                      <>
                        <span className="text-muted-foreground"> · </span>
                        <span className="text-muted-foreground">{adminRolLabel}</span>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-border bg-muted/40 pl-1 pr-2 py-1",
                    "hover:bg-muted hover:border-blue-500/30 transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                  aria-label="Menú de usuario"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      "bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-600/25"
                    )}
                  >
                    {initials}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                {adminNombre && (
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">{adminNombre}</p>
                    {adminRolLabel && (
                      <p className="text-xs text-muted-foreground truncate">{adminRolLabel}</p>
                    )}
                  </div>
                )}
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => setProfileOpen(true)}
                >
                  <User className="h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {adminNombre && (
          <div className="md:hidden px-6 pb-3 -mt-1">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Bienvenido, <span className="font-medium text-foreground">{adminNombre}</span>
              </p>
            </div>
          </div>
        )}
      </header>

      <UserProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  )
}
