import "@/login/styles/login.css"
import LoginBodyTheme from "@/login/components/LoginBodyTheme"
import PageLoadOverlay from "@/login/components/PageLoadOverlay"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LoginBodyTheme>
      <PageLoadOverlay />
      <div className="totem-login-theme-slot">
        <ThemeToggle />
      </div>
      <div className="totem-login-container">{children}</div>
    </LoginBodyTheme>
  )
}
