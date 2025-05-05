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
import { useLocalAuth } from "../../providers/auth-provider"

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
  const [gameStarted, setGameStarted] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (gameStarted) {
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
    }
  }, [gameStarted])

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
        const completedExercises = saved ? JSON.parse(saved) : []
        
        if (!completedExercises.includes("stroop")) {
          completedExercises.push("stroop")
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
          console.log("Ejercicio Stroop completado y guardado en localStorage")
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

      <div className="container max-w-full mx-auto px-6 pt-6 pb-4 flex flex-col">
        <Card className="border-none shadow-lg flex flex-col w-full max-w-6xl mx-auto h-auto">
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Test de Stroop</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowDialog(true)} 
                aria-label="Pausar ejercicio"
                disabled={!gameStarted}
              >
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

          <CardContent className="px-4 pt-3 pb-6 flex flex-col items-center space-y-3 min-h-0">
            {!testCompleted ? (
              <>
                <div className="text-center w-full">
                  <div className="bg-muted/30 p-2 rounded-lg mb-4">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-[#3876F4] text-white flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="font-bold">1</span>
                        </div>
                        <p className="text-sm text-muted-foreground text-left">
                          Selecciona el COLOR en que está escrita la palabra.
                        </p>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-[#3876F4] text-white flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="font-bold">2</span>
                        </div>
                        <p className="text-sm text-muted-foreground text-left">
                          NO selecciones lo que dice la palabra.
                        </p>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-[#3876F4] text-white flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="font-bold">3</span>
                        </div>
                        <p className="text-sm text-muted-foreground text-left">
                          Responde lo más rápido posible.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center items-center my-2">
                    <h2 className="text-3xl font-bold" style={{ color: currentWord.color }}>
                      {currentWord.text}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  {colors.map((color) => (
                    <Button
                      key={color.name}
                      className="h-12 text-white font-medium"
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleColorSelect(color.name)}
                    >
                      {color.name}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center space-y-3 w-full">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                
                <div>
                  <h2 className="text-lg font-bold mb-1">¡Prueba completada!</h2>
                  <p className="text-muted-foreground text-sm mb-3">
                    Has obtenido una puntuación de {score} sobre {total} ({Math.round((score / total) * 100)}%)
                  </p>
                </div>
                
                <Button 
                  className="w-full h-10 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
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
