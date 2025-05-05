"use client"

import { useLocalAuth } from "../providers/auth-provider"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ExerciseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const localAuth = useLocalAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar autenticación
    if (!localAuth.isAuthenticated) {
      router.push("/login")
      return
    }
    
    setIsLoading(false)
  }, [localAuth.isAuthenticated, router])

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