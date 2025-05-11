"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"
import { ChevronLeft, LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface HeaderProps {
  showBackButton?: boolean
}

export function Header({ showBackButton = false }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    const loginStatus = localStorage.getItem("isLoggedIn") === "true"
    setIsLoggedIn(loginStatus)
  }, [])
  
  // Función para determinar la URL de regreso según la ruta actual
  const getBackUrl = (): string => {
    // Rutas de juegos específicos
    const gameRoutes = ["/stroop", "/lectura", "/atencion", "/memoria", "/observacion", "/video"];
    
    // Verificar si estamos en una página de juego
    const isInGameRoute = gameRoutes.some(route => pathname.startsWith(route));
    
    // Verificar si estamos en una página de resultados de juego
    const isInResultsRoute = pathname.includes("/resultados");
    
    // Estructura de navegación específica
    if (pathname === "/formulario") {
      return "/bienvenido";
    } else if (pathname === "/antes-de-empezar") {
      return "/formulario";
    } else if (pathname === "/juegos") {
      return "/antes-de-empezar";
    } else if (isInGameRoute) {
      return "/juegos";
    } else if (pathname === "/resultados") {
      return "/panel";
    } else if (pathname === "/login") {
      return "/";
    } else if (pathname === "/registro") {
      return "/login";
    } else {
      // Por defecto, volver a la página principal
      return "/";
    }
  }
  
  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userDNI")
    localStorage.removeItem("authProvider")
    
    // Redirigir a la página principal
    router.push("/")
  }
  
  // Mostrar botón de logout solo en las rutas donde el usuario está logueado y la app está montada en el cliente
  const shouldShowLogout = isClient && isLoggedIn && (
    pathname === "/panel" || 
    pathname.startsWith("/ejercicio") || 
    pathname.startsWith("/resultados")
  )

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-12 w-12 mr-2"
            >
              <Link href={getBackUrl()} aria-label="Volver">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-9 w-9">
              <Image 
                src="/logo.svg" 
                alt="NeuroSpot Logo" 
                fill 
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block">NeuroSpot</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {shouldShowLogout && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="mr-2"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que deseas cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder a tu evaluación.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>
                    Cerrar sesión
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
