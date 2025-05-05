"use client"

import { useState, useEffect, ReactNode } from "react"
import { Header } from "@/components/header"
import { ExerciseCard } from "@/components/exercise-card"
import { 
  BrainCog, 
  BookOpenText, 
  Eye, 
  Clock, 
  Database, 
  Video,
  LucideIcon,
  Loader2,
  X
} from "lucide-react"
import Link from "next/link"
import { useLocalAuth } from "../providers/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface Ejercicio {
  id: string
  title: string
  description: string
  icon: ReactNode
  time: string
  color: string
  iconColor: string
  completed: boolean
  isAvailable: boolean
}

export default function PanelPage() {
  const localAuth = useLocalAuth()
  const router = useRouter()
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [progressPercentage, setProgressPercentage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showSessionMessage, setShowSessionMessage] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  // Función para cerrar sesión
  const handleLogout = () => {
    localAuth.logout();
    router.push("/login");
  };

  useEffect(() => {
    // Verificar autenticación
    if (!localAuth.isAuthenticated) {
      router.push("/login")
      return
    }
    
    // Si pasa las verificaciones, ya no está cargando
    setIsLoading(false)
    
    // Obtener ejercicios completados del localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem("completedExercises")
        const completed = saved ? JSON.parse(saved) : []
        setCompletedExercises(completed)
        
        // Calcular porcentaje de progreso
        const completedCount = completed.length
        setProgressPercentage(Math.round((completedCount / ejercicios.length) * 100))
      } catch (e) {
        console.error("Error reading completedExercises:", e)
      }
    }
    
    // Iniciar el efecto de desvanecimiento después de 2 segundos
    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true)
    }, 2000)
    
    // Ocultar el mensaje después del desvanecimiento completo (1s adicional)
    const hideTimer = setTimeout(() => {
      setShowSessionMessage(false)
    }, 3000)
    
    return () => {
      clearTimeout(fadeOutTimer)
      clearTimeout(hideTimer)
    }
  }, [localAuth.isAuthenticated, router])

  const createIconElement = (Icon: LucideIcon): ReactNode => {
    return <Icon />
  }

  const ejercicios: Ejercicio[] = [
    {
      id: "stroop",
      title: "Test de Stroop",
      description: "Evalúa la atención selectiva y la capacidad de inhibición cognitiva.",
      icon: createIconElement(BrainCog),
      time: "5 min",
      color: "bg-purple-500", 
      iconColor: "text-white",
      completed: completedExercises.includes("stroop"),
      isAvailable: true // El primer ejercicio siempre está disponible
    },
    {
      id: "lectura",
      title: "Lectura en Voz Alta",
      description: "Evalúa la fluidez lectora y concentración mientras lees un texto.",
      icon: createIconElement(BookOpenText),
      time: "3 min",
      color: "bg-blue-500",
      iconColor: "text-white",
      completed: completedExercises.includes("lectura"),
      isAvailable: completedExercises.includes("stroop") || completedExercises.length > 0
    },
    {
      id: "atencion",
      title: "Test de Atención Continua",
      description: "Mide la capacidad de mantener la concentración durante un período prolongado.",
      icon: createIconElement(Clock),
      time: "4 min",
      color: "bg-green-500",
      iconColor: "text-white", 
      completed: completedExercises.includes("atencion"),
      isAvailable: completedExercises.includes("lectura")
    },
    {
      id: "memoria",
      title: "Memoria Visual",
      description: "Evalúa la capacidad de memoria de trabajo visual y secuencial.",
      icon: createIconElement(Database),
      time: "3 min",
      color: "bg-orange-500",
      iconColor: "text-white",
      completed: completedExercises.includes("memoria"),
      isAvailable: completedExercises.includes("atencion")
    },
    {
      id: "observacion",
      title: "Observación",
      description: "Evalúa la capacidad de observación y atención al detalle.",
      icon: createIconElement(Eye),
      time: "4 min", 
      color: "bg-teal-500",
      iconColor: "text-white",
      completed: completedExercises.includes("observacion"),
      isAvailable: completedExercises.includes("memoria")
    },
    {
      id: "video",
      title: "Análisis de Emociones",
      description: "Evalúa las expresiones faciales y el reconocimiento de emociones.",
      icon: createIconElement(Video),
      time: "3 min",
      color: "bg-pink-500",
      iconColor: "text-white",
      completed: completedExercises.includes("video"),
      isAvailable: completedExercises.includes("observacion")
    }
  ]

  // Mostrar la pantalla de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="container max-w-full mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Información del usuario autenticado */}
          {showSessionMessage && (
            <div className={`bg-green-50 dark:bg-green-950 py-4 px-6 border border-green-200 dark:border-green-800 rounded-lg mb-4 transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex justify-between items-center">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Sesión iniciada como: {localAuth.email || "Usuario local"}
                </p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  className="h-8 w-8 text-gray-500 hover:bg-green-100 dark:hover:bg-green-900"
                  aria-label="Cerrar sesión"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Barra de progreso global */}
          <div className="bg-blue-50 dark:bg-blue-950 py-4 px-6 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="container max-w-full mx-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Tu progreso</h3>
                <span className="text-xs text-blue-600 dark:text-blue-300">{progressPercentage}% completado</span>
              </div>
              <div className="w-full bg-white dark:bg-gray-800 rounded-full h-2.5 border border-blue-100 dark:border-blue-900">
                <div 
                  className="bg-[#3876F4] h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-6 text-center">¡Vamos a realizar algunas pruebas divertidas!</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            {ejercicios.map((ejercicio) => (
              <div 
                key={ejercicio.id} 
                className={!ejercicio.isAvailable && !ejercicio.completed ? "opacity-40 filter grayscale" : ""}
              >
                <ExerciseCard
                  id={ejercicio.id}
                  title={ejercicio.title}
                  description={ejercicio.description}
                  icon={ejercicio.icon}
                  time={ejercicio.time}
                  color={ejercicio.color}
                  iconColor={ejercicio.iconColor}
                  isAvailable={ejercicio.isAvailable}
                  completed={ejercicio.completed}
                />
              </div>
            ))}
          </div>
          
          {ejercicios.every(e => e.completed) && (
            <div className="mt-8 text-center">
              <Link 
                href="/resultados"
                className="inline-block bg-[#3876F4] text-white py-3 px-6 rounded-lg font-medium transition-all hover:bg-[#3876F4]/90"
              >
                Ver mis resultados finales
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
