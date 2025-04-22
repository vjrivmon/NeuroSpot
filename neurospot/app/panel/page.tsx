"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { ExerciseCard } from "@/components/exercise-card"
import { 
  BrainCog, 
  BookOpenText, 
  Eye, 
  Clock, 
  Database, 
  Video,
  LucideIcon
} from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { ReactNode } from "react"

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
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [progressPercentage, setProgressPercentage] = useState(0)

  useEffect(() => {
    // Obtener ejercicios completados del localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem("completedExercises")
        const completed = saved ? JSON.parse(saved) : []
        setCompletedExercises(completed)
        
        // Calcular porcentaje de progreso
        const totalExercises = ejercicios.length
        const completedCount = completed.length
        setProgressPercentage(Math.round((completedCount / totalExercises) * 100))
      } catch (e) {
        console.error("Error reading completedExercises:", e)
      }
    }
  }, [])

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
      iconColor: "text-purple-600",
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
      iconColor: "text-blue-600",
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
      iconColor: "text-green-600", 
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
      iconColor: "text-orange-600",
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
      iconColor: "text-teal-600",
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
      iconColor: "text-pink-600",
      completed: completedExercises.includes("video"),
      isAvailable: completedExercises.includes("observacion")
    }
  ]

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="container max-w-full mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
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
              <Link 
                key={ejercicio.id}
                href={ejercicio.isAvailable ? `/ejercicio/${ejercicio.id}` : "#"}
                className={!ejercicio.isAvailable ? "pointer-events-none" : ""}
              >
                <div className={!ejercicio.isAvailable && !ejercicio.completed ? "opacity-40 filter grayscale" : ""}>
                  <ExerciseCard
                    key={ejercicio.id}
                    id={ejercicio.id}
                    title={ejercicio.title}
                    description={ejercicio.description}
                    icon={ejercicio.icon}
                    time={ejercicio.time}
                    color={ejercicio.color}
                    iconColor={ejercicio.iconColor}
                  />
                </div>
              </Link>
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
