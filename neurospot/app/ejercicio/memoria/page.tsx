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
import { PauseCircle, ArrowRight } from "lucide-react"

type MemoryStep = "instructions" | "sequence" | "input" | "result" | "completed"

export default function MemoriaPage() {
  const [step, setStep] = useState<MemoryStep>("instructions")
  const [sequence, setSequence] = useState<number[]>([])
  const [userInput, setUserInput] = useState<number[]>([])
  const [level, setLevel] = useState(2) // Empezamos con secuencias de 2 números
  const [showDialog, setShowDialog] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null)
  const [maxLevel, setMaxLevel] = useState(2)
  const router = useRouter()

  // Genera una nueva secuencia basada en el nivel actual
  const generateSequence = () => {
    const newSequence = []
    for (let i = 0; i < level; i++) {
      newSequence.push(Math.floor(Math.random() * 9) + 1) // Números del 1 al 9
    }
    setSequence(newSequence)
    setUserInput([])
    setProgress(0)
  }

  // Efecto para mostrar la secuencia
  useEffect(() => {
    if (step !== "sequence") return

    let currentIndex = 0
    const intervalId = setInterval(() => {
      if (currentIndex < sequence.length) {
        setProgress((currentIndex + 1) * (100 / sequence.length))
        currentIndex++
      } else {
        clearInterval(intervalId)
        setStep("input")
        setProgress(0)
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [step, sequence])

  // Maneja el click en un número durante la fase de input
  const handleNumberClick = (num: number) => {
    if (step !== "input") return

    const newInput = [...userInput, num]
    setUserInput(newInput)
    
    // Si el usuario ha completado la entrada (ingresó tantos números como la secuencia)
    if (newInput.length === sequence.length) {
      checkAnswer(newInput)
    }
  }

  // Comprueba si la secuencia inversa es correcta
  const checkAnswer = (input: number[]) => {
    // Compara la entrada del usuario con la secuencia invertida
    const reversedSequence = [...sequence].reverse()
    const isCorrect = reversedSequence.every((num, index) => num === input[index])
    
    setResult(isCorrect ? "correct" : "incorrect")
    setStep("result")
    
    if (isCorrect) {
      setMaxLevel(Math.max(maxLevel, level + 1)) // Actualizamos el máximo nivel alcanzado
    }
  }

  // Avanza al siguiente nivel o termina el juego
  const handleNextLevel = () => {
    if (result === "correct") {
      // Subir al siguiente nivel
      setLevel(level + 1)
      setStep("sequence")
      generateSequence()
    } else {
      // El juego termina, vamos a la página de detección de video
      setStep("completed")
    }
  }

  // Inicia el juego
  const startGame = () => {
    generateSequence()
    setStep("sequence")
  }

  // Completa el ejercicio
  const completeExercise = () => {
    // Guardar este ejercicio como completado en localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem("completedExercises") 
        let completedExercises = saved ? JSON.parse(saved) : []
        
        if (!completedExercises.includes("memoria")) {
          completedExercises.push("memoria")
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
        }
      } catch (e) {
        console.error("Error updating completedExercises:", e)
      }
    }
    
    router.push("/ejercicio/observacion")
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="container max-w-full mx-auto px-6 py-8 flex-1 flex flex-col">
        <Card className="border-none shadow-lg flex-1 flex flex-col w-full max-w-6xl mx-auto">
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Memoria de Trabajo</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDialog(true)} aria-label="Pausar ejercicio">
                <PauseCircle className="h-6 w-6" />
              </Button>
            </div>
            {step !== "instructions" && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Nivel: {level}</span>
                <span>Máximo: {maxLevel}</span>
              </div>
            )}
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between py-6">
            {step === "instructions" && (
              <div className="space-y-6 text-center flex-1 flex flex-col justify-center">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Memoriza la secuencia de números que aparecerá y luego introdúcela en orden inverso.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ejemplo: Si ves 5-8-2, deberás introducir 2-8-5.
                  </p>
                </div>
                <Button 
                  className="w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                  onClick={startGame}
                >
                  Comenzar
                </Button>
              </div>
            )}

            {step === "sequence" && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Memoriza esta secuencia</h2>
                  <div className="h-24 flex items-center justify-center">
                    <p className="text-5xl font-bold">
                      {sequence[Math.floor((progress / 100) * sequence.length) - 1] || ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === "input" && (
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-center text-xl font-bold mb-6">Introduce la secuencia en orden inverso</h2>
                
                <div className="mb-6 h-12 bg-muted/20 rounded flex items-center justify-center">
                  <p className="text-2xl font-mono">
                    {userInput.map(num => num).join(' - ')}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <Button
                      key={num}
                      className="h-14 text-xl font-bold bg-[#3876F4] hover:bg-[#3876F4]/90 text-white"
                      onClick={() => handleNumberClick(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {step === "result" && (
              <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                <div className={`text-center p-6 rounded-lg ${result === "correct" ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}>
                  <h2 className="text-xl font-bold mb-3">
                    {result === "correct" ? "¡Correcto!" : "Incorrecto"}
                  </h2>
                  <p>
                    {result === "correct" 
                      ? `¡Excelente! Avanzarás al nivel ${level + 1}.` 
                      : `La secuencia correcta era: ${[...sequence].reverse().join(' - ')}`}
                  </p>
                </div>
                
                <Button 
                  className="w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                  onClick={handleNextLevel}
                >
                  {result === "correct" ? "Siguiente nivel" : "Finalizar prueba"}
                </Button>
              </div>
            )}

            {step === "completed" && (
              <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-3">¡Prueba completada!</h2>
                  <p className="text-muted-foreground mb-6">
                    Has alcanzado el nivel {maxLevel - 1}. Tu memoria de trabajo visual puede recordar {maxLevel - 1} elementos.
                  </p>
                  
                  <Button 
                    className="w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                    onClick={completeExercise}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" /> Continuar
                  </Button>
                </div>
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