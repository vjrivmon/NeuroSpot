"use client"

import { ReactNode } from "react"
import { ThemeProvider as NextThemeProvider } from "@/components/theme-provider"

interface ThemeProviderProps {
  children: ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem 
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  )
} 