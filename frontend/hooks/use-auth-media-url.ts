"use client"

import { useEffect, useState } from "react"
import { fetchWithAuth } from "@/lib/fetch-auth"

/**
 * Carga un archivo protegido con JWT y devuelve una URL local (blob) para img/video.
 */
export function useAuthMediaUrl(apiPath: string | null | undefined) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!apiPath) {
      setBlobUrl(null)
      setError(false)
      return
    }

    let cancelled = false
    let objectUrl: string | null = null

    setLoading(true)
    setError(false)

    fetchWithAuth(apiPath)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed")
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setBlobUrl(null)
          setError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [apiPath])

  return { blobUrl, loading, error }
}
