import "@/login/styles/login.css"
import LoginBodyTheme from "@/login/components/LoginBodyTheme"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LoginBodyTheme>
      <div className="totem-login-theme-slot">
        <ThemeToggle />
      </div>
      <div className="totem-login-container">{children}</div>
    </LoginBodyTheme>
  )
}
