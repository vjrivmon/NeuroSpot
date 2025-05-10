"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { PauseCircle, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type ResultsType = {
  correctResponses: number;
  commissionErrors: number; // Presionó cuando no debía (impulsividad)
  omissionErrors: number;   // No presionó cuando debía (inatención)
  reactionTimes: number[];
}

type LevelType = {
  name: string;
  duration: number; // en segundos
  interval: number; // en milisegundos
  targetProbability: number; // probabilidad de mostrar la letra objetivo (0-1)
}

export default function AtencionPage() {
  // Tiempo total de la prueba (30 + 20 + 10 = 60 segundos)
  const TOTAL_TIME = 60;
  
  const [currentLetter, setCurrentLetter] = useState<string | null>(null)
  const [previousLetter, setPreviousLetter] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME) 
  const [progress, setProgress] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gamePaused, setGamePaused] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | null>(null)
  const [results, setResults] = useState<ResultsType>({
    correctResponses: 0,
    commissionErrors: 0,
    omissionErrors: 0,
    reactionTimes: []
  })
  const [stimulusStartTime, setStimulusStartTime] = useState<number | null>(null)
  const [targetLetter] = useState('X')
  
  // Control de niveles
  const [currentLevel, setCurrentLevel] = useState(0) // 0, 1, 2 para los tres niveles
  const [showLevelTransition, setShowLevelTransition] = useState(false)
  
  // Referencias para los intervalos
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const letterTimerRef = useRef<NodeJS.Timeout | null>(null)
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()

  // Definición de los niveles con la nueva duración solicitada
  const levels: LevelType[] = [
    {
      name: "Nivel 1: Fácil",
      duration: 25, // 30 segundos
      interval: 1000, // 4 segundos
      targetProbability: 0.25 // 20% de probabilidad
    },
    {
      name: "Nivel 2: Medio",
      duration: 20, // 20 segundos
      interval: 500, // 3 segundos
      targetProbability: 0.15 // 25% de probabilidad
    },
    {
      name: "Nivel 3: Difícil",
      duration: 15, // 10 segundos
      interval: 250, // 2 segundos
      targetProbability: 0.10 // 30% de probabilidad
    }
  ]

  // Letras que se mostrarán en el juego (excluyendo el target)
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Z']

  // Limpiar todos los temporizadores
  const clearAllTimers = useCallback(() => {
    if (letterTimerRef.current) {
      clearInterval(letterTimerRef.current)
      letterTimerRef.current = null
    }
    
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current)
      gameTimerRef.current = null
    }
    
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
    
    console.log("Todos los temporizadores limpiados")
  }, [])

  // Generar una nueva letra
  const generateLetter = useCallback(() => {
    if (gamePaused || gameFinished || showLevelTransition) return
    
    // Si la letra actual es la target, asegurarnos de que la siguiente no lo sea
    let showTarget = Math.random() < levels[currentLevel].targetProbability
    if (currentLetter === targetLetter) {
      showTarget = false
    }
    
    let newLetter;
    
    if (showTarget) {
      newLetter = targetLetter
    } else {
      // Elige una letra aleatoria que no sea la objetivo
      const availableLetters = letters.filter(l => l !== targetLetter)
      const randomIndex = Math.floor(Math.random() * availableLetters.length)
      newLetter = availableLetters[randomIndex]
    }
    
    setPreviousLetter(currentLetter)
    setCurrentLetter(newLetter)
    setStimulusStartTime(Date.now())
    
    // Si el anterior fue la letra objetivo y el usuario no presionó, contar como error de omisión
    if (previousLetter === targetLetter && stimulusStartTime !== null) {
      // Verificamos que no haya habido un correcto registrado recientemente
      const timeSinceStimulus = Date.now() - stimulusStartTime
      if (timeSinceStimulus > levels[currentLevel].interval * 0.8) { // Si pasó más del 80% del intervalo, fue omisión
        setResults(prev => ({
          ...prev,
          omissionErrors: prev.omissionErrors + 1
        }))
      }
    }
  }, [currentLetter, previousLetter, targetLetter, letters, stimulusStartTime, currentLevel, levels, gamePaused, gameFinished, showLevelTransition])

  // Iniciar un timer para cambiar la letra
  const startLetterTimer = useCallback(() => {
    if (letterTimerRef.current) {
      clearInterval(letterTimerRef.current)
      letterTimerRef.current = null
    }
    
    // Generar la primera letra inmediatamente
    generateLetter()
    
    // Configurar intervalo para cambiar letras según el nivel
    letterTimerRef.current = setInterval(() => {
      generateLetter()
    }, levels[currentLevel].interval)
    
    console.log(`Timer de letras iniciado para nivel ${currentLevel + 1}, intervalo: ${levels[currentLevel].interval}ms`)
  }, [generateLetter, currentLevel, levels])

  // Iniciar un nuevo nivel
  const startLevel = useCallback((level: number) => {
    console.log(`Iniciando nivel ${level + 1}, duración: ${levels[level].duration}s`)
    
    // Limpiar solo el timer de letras, no el timer principal
    if (letterTimerRef.current) {
      clearInterval(letterTimerRef.current)
      letterTimerRef.current = null
    }
    
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
    
    // Actualizar el nivel 
    setCurrentLevel(level)
    
    // Mostrar transición de nivel
    setShowLevelTransition(true)
    setCurrentLetter(null) // Ocultar letra durante la transición
    
    // Terminar la transición después de un tiempo
    transitionTimerRef.current = setTimeout(() => {
      setShowLevelTransition(false)
      
      // Iniciar el timer de letras con el intervalo del nivel actual
      startLetterTimer()
    }, 1200) // Mostrar transición por 1.2 segundos
    
  }, [levels, startLetterTimer])

  // Iniciar el juego completo
  const startGame = useCallback(() => {
    console.log("Iniciando juego")
    
    // Limpiar cualquier timer anterior
    clearAllTimers()
    
    // Resetear estados
    setGameStarted(true)
    setGamePaused(false)
    setGameFinished(false)
    setTimeLeft(TOTAL_TIME)
    setProgress(0)
    setCurrentLevel(0)
    setShowLevelTransition(false)
    setResults({
      correctResponses: 0,
      commissionErrors: 0,
      omissionErrors: 0,
      reactionTimes: []
    })
    
    // Iniciar el primer nivel sin borrar el timer principal
    setCurrentLevel(0)
    startLetterTimer()
    
    // Iniciar el timer principal del juego
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        
        // Actualizar la barra de progreso síncronamente
        const elapsedTime = TOTAL_TIME - newTime;
        const progressValue = (elapsedTime / TOTAL_TIME) * 100;
        setProgress(Math.min(100, progressValue));
        
        // Terminar juego si llega a 0
        if (newTime <= 0) {
          console.log("Tiempo total agotado, terminando juego");
          setGameFinished(true);
          clearAllTimers();
          return 0;
        }
        
        // Cambiar de nivel en los tiempos adecuados
        if (elapsedTime === 30 && currentLevel === 0) {
          console.log("Cambiando a nivel 2");
          startLevel(1);
        } else if (elapsedTime === 50 && currentLevel === 1) {
          console.log("Cambiando a nivel 3");
          startLevel(2);
        }
        
        return newTime;
      });
    }, 1000);
    
  }, [clearAllTimers, startLevel, TOTAL_TIME, startLetterTimer, currentLevel])

  // Pausar el juego
  const pauseGame = useCallback(() => {
    console.log("Juego pausado")
    setGamePaused(true)
    clearAllTimers()
    setShowDialog(true)
  }, [clearAllTimers])

  // Reanudar el juego
  const resumeGame = useCallback(() => {
    console.log("Reanudando juego")
    setGamePaused(false)
    setShowDialog(false)
    
    // Reiniciar el timer principal
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        
        // Actualizar la barra de progreso síncronamente
        const elapsedTime = TOTAL_TIME - newTime;
        const progressValue = (elapsedTime / TOTAL_TIME) * 100;
        setProgress(Math.min(100, progressValue));
        
        // Terminar juego si llega a 0
        if (newTime <= 0) {
          console.log("Tiempo total agotado, terminando juego");
          setGameFinished(true);
          clearAllTimers();
          return 0;
        }
        
        // Cambiar de nivel en los tiempos adecuados
        if (elapsedTime === 30 && currentLevel === 0) {
          console.log("Cambiando a nivel 2");
          startLevel(1);
        } else if (elapsedTime === 50 && currentLevel === 1) {
          console.log("Cambiando a nivel 3");
          startLevel(2);
        }
        
        return newTime;
      });
    }, 1000);
    
    // Reiniciar el timer de letras
    startLetterTimer()
    
  }, [clearAllTimers, startLetterTimer, TOTAL_TIME, currentLevel, startLevel])

  // Procesar clic del usuario
  const handleButtonPress = useCallback(() => {
    if (!gameStarted || gamePaused || gameFinished || stimulusStartTime === null || showLevelTransition || !currentLetter) return
    
    const reactionTime = Date.now() - stimulusStartTime
    
    // Respuesta correcta si la letra actual es la objetivo
    if (currentLetter === targetLetter) {
      setResults(prev => ({
        ...prev,
        correctResponses: prev.correctResponses + 1,
        reactionTimes: [...prev.reactionTimes, reactionTime]
      }))
      setFeedbackType("success")
    } else {
      // Error de comisión: presionó cuando no debía
      setResults(prev => ({
        ...prev,
        commissionErrors: prev.commissionErrors + 1
      }))
      setFeedbackType("error")
    }
    
    setShowFeedback(true)
    
    // Ocultar el feedback después de un tiempo
    setTimeout(() => {
      setShowFeedback(false)
    }, 500)
    
  }, [gameStarted, gamePaused, gameFinished, currentLetter, targetLetter, stimulusStartTime, showLevelTransition])

  // Completar la prueba
  const completeTest = useCallback(() => {
    console.log("Completando la prueba")
    // Guardar resultados y marcar como completado
    if (typeof window !== 'undefined') {
      try {
        // Guardar resultados para mostrarlos en la página de resultados
        localStorage.setItem("atencionResults", JSON.stringify(results))
        
        // Marcar como completado
        const saved = localStorage.getItem("completedExercises")
        const completedExercises = saved ? JSON.parse(saved) : []
        
        if (!completedExercises.includes("atencion")) {
          completedExercises.push("atencion")
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
        }
      } catch (e) {
        console.error("Error updating completedExercises:", e)
      }
    }
  }, [results])

  // Control para finalizar la prueba
  useEffect(() => {
    if (gameFinished && !gamePaused) {
      clearAllTimers()
      completeTest()
    }
  }, [gameFinished, gamePaused, clearAllTimers, completeTest])

  // Sistema de seguridad para evitar que se quede bloqueado en la transición
  useEffect(() => {
    if (showLevelTransition) {
      const safetyTimer = setTimeout(() => {
        console.log("Safety timer activated - forcing level transition to complete")
        setShowLevelTransition(false)
        
        // Asegurar que se genera una letra si el juego aún está activo
        if (gameStarted && !gamePaused && !gameFinished) {
          startLetterTimer()
        }
      }, 1500) // Reducir a 1.5 segundos para que sea más fluido
      
      return () => clearTimeout(safetyTimer)
    }
  }, [showLevelTransition, gameStarted, gamePaused, gameFinished, startLetterTimer])

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      clearAllTimers()
    }
  }, [clearAllTimers])

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />
      
      <div className="container max-w-full mx-auto px-6 pt-6 pb-4 flex flex-col">
        <Card className="border-none shadow-lg flex flex-col w-full max-w-6xl mx-auto h-auto">
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Prueba de Atención</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={gameStarted && !gameFinished ? pauseGame : () => setShowDialog(true)} 
                aria-label={gameStarted ? "Pausar ejercicio" : "Información"}
              >
                <PauseCircle className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Tiempo: {timeLeft}s</span>
              </div>
              <span>
                Aciertos: {results.correctResponses}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="px-4 pt-3 pb-6 flex flex-col items-center space-y-3 min-h-0">
            {!gameStarted ? (
              <div className="text-center space-y-6 w-full">
                <div className="bg-muted/30 p-4 rounded-lg w-full">
                  <p className="text-sm text-muted-foreground mb-3 font-medium">
                    Instrucciones:
                  </p>
                  <div className="flex items-start space-y-3 flex-col">
                    <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#3876F4] text-white flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="font-bold">1</span>
                      </div>
                                            <p className="text-sm">
                        Pulsa el botón <span className="font-bold">SOLO</span> cuando veas la letra <span className="font-bold text-primary">{targetLetter}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#3876F4] text-white flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="font-bold">2</span>
                      </div>
                                            <p className="text-sm">
                        La prueba dura 1 minuto y tiene 3 niveles de dificultad
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#3876F4] text-white flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="font-bold">3</span>
                      </div>                      <p className="text-sm">
                        Las letras aparecerán cada vez más rápido
                      </p>
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
            ) : gameFinished ? (
              <div className="text-center space-y-4 w-full">
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 w-full">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <div>
                    <AlertTitle className="text-green-800 dark:text-green-300">¡Prueba completada!</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
                      Aciertos: {results.correctResponses}<br />
                      Errores: {results.commissionErrors + results.omissionErrors}<br />
                      Tiempo de reacción promedio: {
                        results.reactionTimes.length > 0 
                          ? `${Math.round(results.reactionTimes.reduce((a, b) => a + b, 0) / results.reactionTimes.length)} ms` 
                          : "N/A"
                      }
                    </AlertDescription>
                  </div>
                </Alert>
                <Button 
                  className="w-full h-12 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                  onClick={() => router.push("/ejercicio/memoria")}
                >
                  Continuar al siguiente ejercicio
                </Button>
              </div>
            ) : showLevelTransition ? (
              <div className="text-center space-y-4 w-full animate-pulse">
                <h2 className="text-2xl font-bold">{levels[currentLevel].name}</h2>
                <p className="text-sm text-muted-foreground">
                  {currentLevel === 0 
                    ? "Letras más lentas, fácil de seguir"
                    : currentLevel === 1 
                      ? "Velocidad moderada, mantén el ritmo"
                      : "Velocidad rápida, máxima concentración"}
                </p>
                <div className="w-16 h-16 mx-auto bg-[#3876F4]/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">{currentLevel + 1}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center w-full">
                  <div className="flex flex-col items-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      Pulsa cuando veas la letra <span className="font-bold text-primary">{targetLetter}</span>
                    </div>
                  <div className="flex justify-center items-center h-40 w-40 mx-auto rounded-full bg-muted/20 relative">
                    <h1 className="text-8xl font-bold">{currentLetter}</h1>
                    {showFeedback && (
                      <div className={`absolute inset-0 flex items-center justify-center rounded-full ${
                        feedbackType === "success" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                      }`}>
                        {feedbackType === "success" ? (
                          <CheckCircle2 className="h-16 w-16 text-green-500 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                <div className="w-full">
                  <Button 
                    className="w-full h-12 text-white font-medium text-lg bg-[#3876F4] hover:bg-[#3876F4]/90 active:scale-95 transition-transform"
                    onClick={handleButtonPress}
                    disabled={gamePaused || showLevelTransition}
                  >
                    Pulsar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {gameStarted && !gameFinished 
                ? "¿Deseas pausar el ejercicio?" 
                : "¿Deseas abandonar el ejercicio?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {gameStarted && !gameFinished
                ? "Puedes continuar o abandonar el ejercicio."
                : "Si abandonas ahora, perderás el progreso actual."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {gameStarted && !gameFinished ? (
              <>
                <AlertDialogCancel onClick={resumeGame}>Continuar</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.push("/panel")}>Abandonar</AlertDialogAction>
              </>
            ) : (
              <>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.push("/panel")}>Abandonar</AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
} 