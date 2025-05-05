import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGoogle, faApple } from '@fortawesome/free-brands-svg-icons'
import { faFingerprint } from '@fortawesome/free-solid-svg-icons'
import { faFaceSmile } from '@fortawesome/free-regular-svg-icons'

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: false
})

// Prevent Font Awesome from adding its CSS since we did it manually above
config.autoAddCss = false

// Add icons to the library
library.add(faGoogle, faApple, faFingerprint, faFaceSmile)

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
