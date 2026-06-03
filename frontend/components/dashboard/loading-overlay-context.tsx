"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { GlobalLoadingOverlay } from "./global-loading-overlay"

type LoadingOverlayContextValue = {
  showLoading: (message?: string) => void
  hideLoading: () => void
  isLoading: boolean
}

const LoadingOverlayContext = createContext<LoadingOverlayContextValue | null>(
  null
)

export function LoadingOverlayProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState<string>()

  const showLoading = useCallback((msg?: string) => {
    setMessage(msg)
    setVisible(true)
  }, [])

  const hideLoading = useCallback(() => {
    setVisible(false)
    setMessage(undefined)
  }, [])

  const value = useMemo(
    () => ({
      showLoading,
      hideLoading,
      isLoading: visible,
    }),
    [showLoading, hideLoading, visible]
  )

  return (
    <LoadingOverlayContext.Provider value={value}>
      {children}
      <GlobalLoadingOverlay visible={visible} message={message} />
    </LoadingOverlayContext.Provider>
  )
}

export function useLoadingOverlay() {
  const ctx = useContext(LoadingOverlayContext)
  if (!ctx) {
    throw new Error("useLoadingOverlay debe usarse dentro de LoadingOverlayProvider")
  }
  return ctx
}
