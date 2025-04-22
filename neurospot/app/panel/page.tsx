import { Header } from "@/components/header"
import { ExerciseCard } from "@/components/exercise-card"
import { Brain, BookOpen, Eye, Clock, Camera } from "lucide-react"

export default function PanelPage() {
  const exercises = [
    {
      id: "stroop",
      title: "Test de Stroop",
      description: "Evalúa la atención selectiva y la capacidad de inhibir respuestas automáticas",
      icon: <Brain className="h-6 w-6" />,
      time: "5 min",
      color: "bg-blue-50 dark:bg-blue-950",
      iconColor: "text-blue-500",
    },
    {
      id: "atencion",
      title: "Juego de Atención Sostenida",
      description: "Mide la capacidad de mantener la atención durante un período prolongado",
      icon: <Clock className="h-6 w-6" />,
      time: "7 min",
      color: "bg-green-50 dark:bg-green-950",
      iconColor: "text-green-500",
    },
    {
      id: "lectura",
      title: "Lectura en voz alta",
      description: "Evalúa la fluidez lectora y la comprensión",
      icon: <BookOpen className="h-6 w-6" />,
      time: "4 min",
      color: "bg-purple-50 dark:bg-purple-950",
      iconColor: "text-purple-500",
    },
    {
      id: "memoria",
      title: "Prueba de Memoria Visual",
      description: "Evalúa la capacidad de recordar información visual",
      icon: <Eye className="h-6 w-6" />,
      time: "6 min",
      color: "bg-amber-50 dark:bg-amber-950",
      iconColor: "text-amber-500",
    },
    {
      id: "observacion",
      title: "Ejercicio de Observación",
      description: "Evalúa la capacidad de atención a detalles visuales",
      icon: <Camera className="h-6 w-6" />,
      time: "5 min",
      color: "bg-rose-50 dark:bg-rose-950",
      iconColor: "text-rose-500",
    },
  ]

  return (
    <main className="min-h-screen flex flex-col pb-8">
      <Header showBackButton />

      <div className="container max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Hola, Leo 👋</h1>

        <div className="space-y-4">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              id={exercise.id}
              title={exercise.title}
              description={exercise.description}
              icon={exercise.icon}
              time={exercise.time}
              color={exercise.color}
              iconColor={exercise.iconColor}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
