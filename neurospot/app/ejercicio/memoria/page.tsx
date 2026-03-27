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
import { useDynamo } from "@/hooks/use-dynamo"

type MemoryStep = "instructions" | "sequence" | "input" | "result" | "completed" | "phase_transition"
type MemoryPhase = "forward" | "backward"

export default function MemoriaPage() {
  const [step, setStep] = useState<MemoryStep>("instructions")
  const [phase, setPhase] = useState<MemoryPhase>("forward")
  const [sequence, setSequence] = useState<number[]>([])
  const [userInput, setUserInput] = useState<number[]>([])
  const [level, setLevel] = useState(2) // Empezamos con secuencias de 2 números
  const [showDialog, setShowDialog] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null)
  const [maxLevel, setMaxLevel] = useState(2)
  // Span máximo por fase (marcadores TDAH inatento)
  const [forwardSpan, setForwardSpan] = useState(0)
  const [backwardSpan, setBackwardSpan] = useState(0)
  const [startTime, setStartTime] = useState<number>(0)
  const router = useRouter()
  const dynamo = useDynamo()

  // Genera una nueva secuencia basada en el nivel actual
  const generateSequence = () => {
    const newSequence = []
    for (let i = 0; i < level; i++) {
      newSequence.push(Math.floor(Math.random() * 9) + 1) // Números del 1 al 9
    }
    setSequence(newSequence)
    setUserInput([])
    setResult(null)
    setStartTime(Date.now())
    
    // Mostrar los números secuencialmente
    setProgress(0)
    const intervalTime = 1000 // 1 segundo por número
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (level + 1))
        
        if (newProgress >= 100) {
          clearInterval(interval)
          setStep("input") // Pasar a la fase de input cuando se han mostrado todos los números
          return 100
        }
        
        return newProgress
      })
    }, intervalTime)
    
    return () => clearInterval(interval)
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

  // Comprueba la respuesta según la fase actual
  const checkAnswer = (input: number[]) => {
    const expected = phase === "forward"
      ? [...sequence]
      : [...sequence].reverse()
    const isCorrect = expected.every((num, index) => num === input[index])
    
    setResult(isCorrect ? "correct" : "incorrect")
    setStep("result")
    
    if (isCorrect) {
      const newMax = Math.max(maxLevel, level + 1)
      setMaxLevel(newMax)
      if (phase === "forward") setForwardSpan(Math.max(forwardSpan, level))
      else setBackwardSpan(Math.max(backwardSpan, level))
    }
  }

  // Avanza al siguiente nivel o cambia de fase o termina
  const handleNextLevel = () => {
    if (result === "correct") {
      setLevel(level + 1)
      setStep("sequence")
      generateSequence()
    } else {
      if (phase === "forward") {
        // Pasar a fase backward
        setForwardSpan(level - 1)
        setPhase("backward")
        setLevel(2)
        setMaxLevel(2)
        setStep("phase_transition")
      } else {
        setBackwardSpan(level - 1)
        setStep("completed")
      }
    }
  }

  // Inicia el juego
  const startGame = () => {
    generateSequence()
    setStep("sequence")
  }

  // Completa el ejercicio
  const completeExercise = async () => {
    const endTime = Date.now();
    const durationInMs = endTime - startTime;
    const durationInSec = Math.floor(durationInMs / 1000);
    
    // Guardar este ejercicio como completado en localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem("completedExercises") 
        let completedExercises = saved ? JSON.parse(saved) : []
        
        if (!completedExercises.includes("memoria")) {
          completedExercises.push("memoria")
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
          console.log("Ejercicio de Memoria completado y guardado en localStorage")
        }
      } catch (e) {
        console.error("Error updating completedExercises:", e)
      }
    }
    
    // Guardar los resultados en DynamoDB
    try {
      // Datos del ejercicio a guardar
      const exerciseData = {
        tipo: "memoria",
        puntuacion: maxLevel - 1, // El nivel máximo alcanzado
        duracion: durationInSec,
        detalles: {
          nivelMaximo: maxLevel - 1,
          secuenciaMaxima: maxLevel - 1,
          tiempoTotal: durationInSec,
          // Marcadores TDAH inatento (memoria de trabajo)
          spanDireto: forwardSpan,
          spanInverso: backwardSpan,
          diferenciaSpan: forwardSpan - backwardSpan,
          // Gap grande entre directo e inverso = dificultad en memoria de trabajo ejecutiva
        }
      }
      
      // Guardar en DynamoDB
      const result = await dynamo.saveExerciseResult(exerciseData)
      
      if (!result.success) {
        console.error("Error al guardar resultados en DynamoDB:", result.error)
      } else {
        console.log("Resultados de Memoria guardados correctamente en DynamoDB")
      }
    } catch (error) {
      console.error("Error al procesar resultados de memoria:", error)
    }
    
    router.push("/ejercicio/observacion")
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="container max-w-full mx-auto px-6 pt-6 pb-4 flex flex-col">
        <Card className="border-none shadow-lg flex flex-col w-full max-w-6xl mx-auto h-auto">
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Memoria de Trabajo</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDialog(true)} aria-label="Pausar ejercicio">
                <PauseCircle className="h-6 w-6" />
              </Button>
            </div>
            {step !== "instructions" && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Nivel actual: {level}</span>
                <span>Nivel máximo: {maxLevel}</span>
              </div>
            )}
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="px-4 pt-3 pb-6 flex flex-col items-center space-y-3 min-h-0">
            {step === "instructions" && (
              <div className="space-y-6 text-center w-full">
 <p className="text-sm text-muted-foreground mb-3 font-medium">
                    Instrucciones:
                  </p>                
                <div className="bg-muted/30 p-4 rounded-lg w-full">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-[#3876F4] text-white flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="font-bold">1</span>
                      </div>
                      <p className="text-left">Memoriza los <strong>números</strong> que aparezcan en pantalla.</p>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-[#3876F4] text-white flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="font-bold">2</span>
                      </div>
                      <p className="text-left">Introduce los números en <strong>orden inverso</strong> (del último al primero).</p>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-[#3876F4] text-white flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="font-bold">3</span>
                      </div>
                      <p className="text-left">Cada nivel añade <strong>un número más</strong> a la secuencia.</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full h-12 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                  onClick={startGame}
                >
                  Comenzar
                </Button>
              </div>
            )}

            {step === "sequence" && (
              <div className="w-full text-center">
                <h2 className="text-xl font-bold mb-4">Memoriza esta secuencia</h2>
                <div className="h-20 flex items-center justify-center">
                  <p className="text-5xl font-bold">
                    {sequence[Math.floor((progress / 100) * sequence.length) - 1] || ""}
                  </p>
                </div>
              </div>
            )}

            {step === "input" && (
              <div className="w-full">
                <h2 className="text-center text-xl font-bold mb-2">
                  {phase === "forward" ? "Repite los números en el mismo orden" : "Repite los números al revés 🔄"}
                </h2>
                <p className="text-center text-sm text-muted-foreground mb-3">
                  {phase === "forward" ? `Secuencia de ${sequence.length} números` : `Al revés — ${sequence.length} números`}
                </p>
                
                <div className="mb-4 h-12 bg-muted/20 rounded flex items-center justify-center">
                  <p className="text-2xl font-mono">
                    {userInput.map(num => num).join(' - ')}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <Button
                      key={num}
                      className="h-12 text-xl font-bold bg-[#3876F4] hover:bg-[#3876F4]/90 text-white"
                      onClick={() => handleNumberClick(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {step === "result" && (
              <div className="w-full space-y-4">
                <div className={`text-center p-4 rounded-lg ${result === "correct" ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}>
                  <h2 className="text-xl font-bold mb-2">
                    {result === "correct" ? "¡Correcto!" : "Incorrecto"}
                  </h2>
                  <p>
                    {result === "correct"
                      ? `¡Excelente! Avanzarás al nivel ${level + 1}.`
                      : `La secuencia correcta era: ${phase === "forward" ? sequence.join(' - ') : [...sequence].reverse().join(' - ')}`}
                  </p>
                </div>
                
                <Button 
                  className="w-full h-12 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                  onClick={handleNextLevel}
                >
                  {result === "correct" ? "Siguiente nivel" : "Finalizar prueba"}
                </Button>
              </div>
            )}

            {step === "phase_transition" && (
              <div className="w-full space-y-4 text-center">
                <div className="text-5xl mb-2">🔄</div>
                <h2 className="text-xl font-bold">¡Ahora al revés!</h2>
                <p className="text-muted-foreground">
                  Verás los números como antes, pero tendrás que repetirlos <strong>en orden inverso</strong>.
                </p>
                <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
                  <p>Por ejemplo, si ves: <strong>3 → 7 → 2</strong></p>
                  <p>Tienes que tocar: <strong>2 → 7 → 3</strong></p>
                </div>
                <Button
                  className="w-full h-14 text-lg font-semibold bg-[#3876F4] hover:bg-[#3876F4]/90 text-white"
                  onClick={() => { setStep("sequence"); generateSequence() }}
                >
                  ¡Entendido!
                </Button>
              </div>
            )}

            {step === "completed" && (
              <div className="w-full space-y-4 text-center">
                <h2 className="text-xl font-bold mb-2">¡Prueba completada!</h2>
                <div className="grid grid-cols-2 gap-3 my-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{forwardSpan}</div>
                    <div className="text-xs text-muted-foreground">Span directo</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">{backwardSpan}</div>
                    <div className="text-xs text-muted-foreground">Span inverso</div>
                  </div>
                </div>
                <Button 
                  className="w-full h-14 text-lg font-semibold bg-[#3876F4] hover:bg-[#3876F4]/90 text-white"
                  onClick={completeExercise}
                >
                  <ArrowRight className="mr-2 h-4 w-4" /> Continuar
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