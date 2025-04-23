import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: false
})

export const metadata: Metadata = {
  title: "NeuroSpot - Evaluación interactiva para niños",
  description:
    "Evaluación interactiva para detectar posibles indicadores de TDAH en niños, mediante juegos cognitivos breves",
  generator: 'v0.dev',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
    shortcut: '/logo.svg'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
