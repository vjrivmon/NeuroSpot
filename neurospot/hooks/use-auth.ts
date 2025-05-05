"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export function useAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si el usuario está logueado
    const loginStatus = localStorage.getItem("isLoggedIn") === "true"
    setIsLoggedIn(loginStatus)
    setIsLoading(false)

    // Redirigir según el estado de autenticación y la ruta actual
    const protectedRoutes = ['/panel', '/ejercicio']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    
    const authRoutes = ['/login', '/registro']
    const isAuthRoute = authRoutes.some(route => pathname === route)

    if (!loginStatus && isProtectedRoute) {
      // Si no está logueado y trata de acceder a una ruta protegida, redirigir a login
      router.push('/login')
    } else if (loginStatus && isAuthRoute) {
      // Si está logueado y trata de acceder a login o registro, redirigir al panel
      router.push('/panel')
    }
  }, [pathname, router])

  return { isLoggedIn, isLoading }
} 