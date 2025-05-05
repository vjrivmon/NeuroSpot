"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { usePathname } from "next/navigation"

interface HeaderProps {
  showBackButton?: boolean
}

export function Header({ showBackButton = false }: HeaderProps) {
  const pathname = usePathname()
  
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
    } else {
      // Por defecto, volver a la página principal
      return "/";
    }
  }

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
        <ModeToggle />
      </div>
    </header>
  )
}
