import type { Metadata } from "next"
import "./globals.css"
import "./totem-screen.css"

export const metadata: Metadata = {
  title: "TOTEM — Experiencia estudiantil",
  description:
    "Pantalla del tótem universitario con publicidad, gestos y asistente de voz",
  icons: {
    icon: "/icon.svg",
    apple: "/logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
