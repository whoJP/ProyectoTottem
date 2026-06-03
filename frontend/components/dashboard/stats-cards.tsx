"use client"

import { useEffect, useState } from "react"
import { Monitor, MonitorOff, Wrench, Upload, Bell, ChevronRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { fetchWithAuth } from "@/lib/fetch-auth"
import { cn } from "@/lib/utils"
import { NotificationsSheet } from "./notifications-sheet"
import type { Totem } from "./totems-table"

interface StatCardProps {
  icon: React.ReactNode
  value: number
  label: string
  iconBgColor: string
  iconColor: string
  onClick?: () => void
  interactive?: boolean
}

function StatCard({
  icon,
  value,
  label,
  iconBgColor,
  iconColor,
  onClick,
  interactive,
}: StatCardProps) {
  const content = (
    <>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${iconBgColor}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      {interactive && (
        <div className="flex items-center gap-1 shrink-0 text-purple-500">
          <span className="text-[10px] font-medium uppercase tracking-wide hidden sm:inline">
            Ver lista
          </span>
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </>
  )

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group flex items-center gap-4 p-4 w-full rounded-xl border-2 border-purple-500/35 bg-card text-left cursor-pointer",
          "transition-all hover:border-purple-500/60 hover:shadow-md hover:shadow-purple-500/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
        )}
        aria-label={`${label}: ${value}. Pulsa para ver el listado.`}
      >
        {content}
      </button>
    )
  }

  return (
    <Card className="flex flex-row items-center gap-4 p-4 bg-card border-border border py-4">
      {content}
    </Card>
  )
}

export function StatsCards({
  totems = [],
  onRefresh,
  isRefreshing = false,
}: {
  totems: Totem[]
  onRefresh?: () => void
  isRefreshing?: boolean
}) {
  const [notificationCount, setNotificationCount] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchWithAuth("/api/notificaciones")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data?.count === "number") {
          setNotificationCount(data.count)
        }
      })
      .catch(() => {
        if (!cancelled) setNotificationCount(0)
      })

    return () => {
      cancelled = true
    }
  }, [totems.length])

  const stats = [
    {
      icon: <Monitor className="w-6 h-6" />,
      value: totems.filter((t) => t.estado === "Activo").length,
      label: "Tótems Activos",
      iconBgColor: "bg-emerald-500/20",
      iconColor: "text-emerald-500",
    },
    {
      icon: <MonitorOff className="w-6 h-6" />,
      value: totems.filter((t) => t.estado === "Inactivo").length,
      label: "Tótems Inactivos",
      iconBgColor: "bg-slate-500/20",
      iconColor: "text-slate-400",
    },
    {
      icon: <Wrench className="w-6 h-6" />,
      value: totems.filter((t) => t.estado === "En Mantenimiento").length,
      label: "En Mantenimiento",
      iconBgColor: "bg-amber-500/20",
      iconColor: "text-amber-500",
    },
    {
      icon: <Upload className="w-6 h-6" />,
      value: totems.reduce((acc, t) => acc + (t.contenido ?? 0), 0),
      label: "Contenidos Subidos",
      iconBgColor: "bg-blue-500/20",
      iconColor: "text-blue-500",
    },
    {
      icon: <Bell className="w-6 h-6" />,
      value: notificationCount,
      label: "Notificaciones",
      iconBgColor: "bg-purple-500/20",
      iconColor: "text-purple-500",
      onClick: () => setNotificationsOpen(true),
      interactive: true,
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Resumen
        </p>
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-border text-xs"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
            />
            Actualizar
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6 pt-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <NotificationsSheet
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        onCountChange={setNotificationCount}
      />
    </>
  )
}
