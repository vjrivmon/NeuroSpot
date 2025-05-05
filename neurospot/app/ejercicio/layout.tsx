"use client"

import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function ExerciseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoggedIn, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <>
      {children}
    </>
  )
} 