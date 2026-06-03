"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StatsCardsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6"
      aria-busy="true"
      aria-label="Cargando estadísticas"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Card
          key={i}
          className="flex flex-row items-center gap-4 p-4 bg-card border-border border py-4"
        >
          <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-4 w-28" />
          </div>
        </Card>
      ))}
    </div>
  )
}
