import AuthGuard from "@/components/auth-guard"
import { LoadingOverlayProvider } from "@/components/dashboard/loading-overlay-context"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <LoadingOverlayProvider>{children}</LoadingOverlayProvider>
    </AuthGuard>
  )
}
