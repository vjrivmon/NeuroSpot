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
import { ProgressBar } from "@/components/progress-bar"

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

      <div className="container max-w-full mx-auto p-6 flex-1">
        {/* Barra de progreso mejorada */}
        <ProgressBar />

        <div className="max-w-7xl mx-auto mt-8">
          <h1 className="text-2xl font-bold text-center">¡Vamos a realizar algunas pruebas divertidas!</h1>
          
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
