"use client"

import { useState, useEffect, useCallback } from "react"
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
import { PauseCircle, PlayCircle, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type ResultsType = {
  correctResponses: number;
  commissionErrors: number; // Presionó cuando no debía (impulsividad)
  omissionErrors: number;   // No presionó cuando debía (inatención)
  reactionTimes: number[];
}

export default function AtencionPage() {
  const [currentLetter, setCurrentLetter] = useState<string | null>(null)
  const [previousLetter, setPreviousLetter] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutos
  const [progress, setProgress] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gamePaused, setGamePaused] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | null>(null)
  const [results, setResults] = useState<ResultsType>({
    correctResponses: 0,
    commissionErrors: 0,
    omissionErrors: 0,
    reactionTimes: []
  })
  const [stimulusStartTime, setStimulusStartTime] = useState<number | null>(null)
  const [targetLetter, setTargetLetter] = useState('X')
  const [letterInterval, setLetterInterval] = useState<NodeJS.Timeout | null>(null)
  const [gameInterval, setGameInterval] = useState<NodeJS.Timeout | null>(null)
  
  const router = useRouter()

  // Letras que se mostrarán en el juego (excluyendo el target)
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Z']

  const generateLetter = useCallback(() => {
    // 20% de probabilidad de mostrar la letra objetivo
    const showTarget = Math.random() < 0.2
    
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
      if (timeSinceStimulus > 1000) { // Si pasó más de 1 segundo desde el estímulo, fue omisión
        setResults(prev => ({
          ...prev,
          omissionErrors: prev.omissionErrors + 1
        }))
      }
    }
  }, [currentLetter, previousLetter, targetLetter, letters, stimulusStartTime])

  // Control de los temporizadores
  useEffect(() => {
    if (!gameStarted || gamePaused || gameFinished) return;
    
    // Timer para el tiempo total
    const gameTimer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setGameFinished(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    setGameInterval(gameTimer);
    
    // Timer para cambiar la letra cada 3 segundos - generamos la primera letra inmediatamente
    generateLetter();
    
    const letterTimer = setInterval(() => {
      generateLetter();
    }, 3000); // Aumentar de 1.5s a 3s
    
    setLetterInterval(letterTimer);
    
    // Limpieza
    return () => {
      clearInterval(gameTimer);
      clearInterval(letterTimer);
    };
  }, [gameStarted, gamePaused, gameFinished, generateLetter]);

  // Actualizar el progreso cuando cambia el tiempo
  useEffect(() => {
    if (gameStarted && !gamePaused && !gameFinished) {
      const newProgress = ((120 - timeLeft) / 120) * 100;
      setProgress(newProgress > 100 ? 100 : newProgress);
    }
  }, [timeLeft, gameStarted, gamePaused, gameFinished]);

  // Finalizar la prueba cuando se acaba el tiempo
  useEffect(() => {
    if (gameFinished && !gamePaused) {
      if (letterInterval) clearInterval(letterInterval);
      if (gameInterval) clearInterval(gameInterval);
      completeTest();
    }
  }, [gameFinished, gamePaused]);

  const handleButtonPress = useCallback(() => {
    if (!gameStarted || gamePaused || gameFinished || stimulusStartTime === null) return;
    
    const reactionTime = Date.now() - stimulusStartTime;
    
    // Respuesta correcta si la letra actual es la objetivo
    if (currentLetter === targetLetter) {
      setResults(prev => ({
        ...prev,
        correctResponses: prev.correctResponses + 1,
        reactionTimes: [...prev.reactionTimes, reactionTime]
      }));
      setFeedbackType("success");
      setFeedbackText("¡Correcto!");
    } else {
      // Error de comisión: presionó cuando no debía
      setResults(prev => ({
        ...prev,
        commissionErrors: prev.commissionErrors + 1
      }));
      setFeedbackType("error");
      setFeedbackText("¡Incorrecto!");
    }
    
    setShowFeedback(true);
    
    // Ocultar el feedback después de un tiempo
    setTimeout(() => {
      setShowFeedback(false);
    }, 500);
    
  }, [gameStarted, gamePaused, gameFinished, currentLetter, targetLetter, stimulusStartTime]);

  const startGame = () => {
    setGameStarted(true);
    setGamePaused(false);
    setGameFinished(false);
    setTimeLeft(120);
    setProgress(0);
    setResults({
      correctResponses: 0,
      commissionErrors: 0,
      omissionErrors: 0,
      reactionTimes: []
    });
    generateLetter(); // Genera la primera letra
  };

  const pauseGame = () => {
    setGamePaused(true);
    if (letterInterval) clearInterval(letterInterval);
    if (gameInterval) clearInterval(gameInterval);
    setShowDialog(true);
  };

  const resumeGame = () => {
    setGamePaused(false);
    setShowDialog(false);
  };

  const completeTest = () => {
    // Guardar resultados y marcar como completado
    if (typeof window !== 'undefined') {
      try {
        // Guardar resultados para mostrarlos en la página de resultados
        localStorage.setItem("atencionResults", JSON.stringify(results));
        
        // Marcar como completado
        const saved = localStorage.getItem("completedExercises");
        let completedExercises = saved ? JSON.parse(saved) : [];
        
        if (!completedExercises.includes("atencion")) {
          completedExercises.push("atencion");
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises));
        }
      } catch (e) {
        console.error("Error updating completedExercises:", e);
      }
    }
    
    // Esperar 2 segundos antes de redirigir para que el usuario vea su puntuación final
    setTimeout(() => {
      router.push("/ejercicio/memoria");
    }, 2000);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />
      
      {/* Barra de progreso global - Oculta */}
      <div className="hidden">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Prueba 3 de 5: Test de Atención Continua</h3>
            <span className="text-xs text-blue-600 dark:text-blue-300">60% completado</span>
          </div>
          <div className="w-full bg-white dark:bg-gray-800 rounded-full h-2.5">
            <div className="bg-[#3876F4] h-2.5 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>

      <div className="container max-w-full mx-auto px-6 py-8 flex-1 flex flex-col">
        <Card className="border-none shadow-lg flex-1 flex flex-col w-full max-w-6xl mx-auto">
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
              <span>Tiempo: {timeLeft}s</span>
              <span>
                Aciertos: {results.correctResponses}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-center items-center space-y-8 py-8">
            {!gameStarted ? (
              <div className="text-center space-y-6 max-w-xs mx-auto">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    En esta prueba, verás diferentes letras que aparecerán en la pantalla.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tu tarea es pulsar el botón <span className="font-bold">SOLO</span> cuando veas la letra <span className="font-bold">{targetLetter}</span>.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Las letras cambiarán rápidamente, así que mantente atento.
                  </p>
                </div>
                <Button 
                  className="w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                  onClick={startGame}
                >
                  Comenzar
                </Button>
              </div>
            ) : gameFinished ? (
              <div className="text-center space-y-6 max-w-xs mx-auto">
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
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
                <p className="text-sm text-muted-foreground">
                  Redirigiendo a la siguiente prueba...
                </p>
              </div>
            ) : (
              <>
                <div className="text-center space-y-6 w-full">
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
                  <p className="text-sm text-muted-foreground">
                    Pulsa cuando veas la letra <span className="font-bold text-primary">{targetLetter}</span>
                  </p>
                </div>

                <Button 
                  className="w-full h-16 text-white font-medium text-xl bg-[#3876F4] hover:bg-[#3876F4]/90 active:scale-95 transition-transform"
                  onClick={handleButtonPress}
                  disabled={gamePaused}
                >
                  Pulsar
                </Button>
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