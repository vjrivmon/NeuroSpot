"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PauseCircle, Check } from "lucide-react"

const colors = [
  { name: "Rojo", value: "#ef4444" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#22c55e" },
  { name: "Amarillo", value: "#eab308" },
]

export default function StroopTestPage() {
  const [currentWord, setCurrentWord] = useState({ text: "", color: "" })
  const [progress, setProgress] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    generateNewWord()

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          completeTest()
          return 0
        }
        return prev - 1
      })

      setProgress((prev) => {
        const newProgress = prev + 100 / 60
        return newProgress > 100 ? 100 : newProgress
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const generateNewWord = () => {
    const randomWordIndex = Math.floor(Math.random() * colors.length)
    const randomColorIndex = Math.floor(Math.random() * colors.length)

    setCurrentWord({
      text: colors[randomWordIndex].name,
      color: colors[randomColorIndex].value,
    })
  }

  const handleColorSelect = (selectedColor: string) => {
    setTotal((prev) => prev + 1)

    // Check if the selected color matches the displayed color
    const correctColor = colors.find((c) => c.value === currentWord.color)?.name
    if (selectedColor === correctColor) {
      setScore((prev) => prev + 1)
    }

    generateNewWord()
  }

  const completeTest = () => {
    setTestCompleted(true)
    
    // Guardar este ejercicio como completado en localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem("completedExercises") 
        let completedExercises = saved ? JSON.parse(saved) : []
        
        if (!completedExercises.includes("stroop")) {
          completedExercises.push("stroop")
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
        }
      } catch (e) {
        console.error("Error updating completedExercises:", e)
      }
    }
  }

  const handleContinue = () => {
    router.push("/ejercicio/lectura")
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="container max-w-full mx-auto px-6 py-8 flex-1 flex flex-col">
        <Card className="border-none shadow-lg flex-1 flex flex-col w-full max-w-6xl mx-auto">
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Test de Stroop</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDialog(true)} aria-label="Pausar ejercicio">
                <PauseCircle className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tiempo: {timeLeft}s</span>
              <span>
                Puntuación: {score}/{total}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-center items-center space-y-8 py-8">
            {!testCompleted ? (
              <>
                <div className="text-center space-y-6">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Selecciona el COLOR en que está escrita la palabra, NO lo que dice la palabra.
                    </p>
                  </div>

                  <div className="flex justify-center items-center h-24">
                    <h2 className="text-4xl font-bold" style={{ color: currentWord.color }}>
                      {currentWord.text}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  {colors.map((color) => (
                    <Button
                      key={color.name}
                      className="h-14 text-white font-medium"
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleColorSelect(color.name)}
                    >
                      {color.name}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center py-6 text-center space-y-6">
                <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/20">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-2">¡Prueba completada!</h2>
                  <p className="text-muted-foreground mb-6">
                    Has obtenido una puntuación de {score} sobre {total} ({Math.round((score / total) * 100)}%)
                  </p>
                </div>
                
                <Button 
                  className="w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                  onClick={handleContinue}
                >
                  Continuar con el siguiente ejercicio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deseas abandonar el ejercicio?</AlertDialogTitle>
            <AlertDialogDescription>Si abandonas ahora, perderás el progreso actual.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar ejercicio</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/panel")}>Abandonar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
