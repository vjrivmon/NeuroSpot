"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ExerciseShell } from "@/components/ExerciseShell"
import { NSButton } from "@/components/ui/NSButton"
import { ProgressBar } from "@/components/ui/ProgressBar"
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
import { CheckCircle2, AlertCircle } from "lucide-react"
import { useDynamo } from "@/hooks/use-dynamo"

type ResultsType = {
  correctResponses: number
  commissionErrors: number
  omissionErrors: number
  reactionTimes: number[]
  reactionTimeVariability: number
  omissionRate: number
}

type LevelType = {
  name: string
  duration: number
  interval: number
  targetProbability: number
}

export default function AtencionPage() {
  const TOTAL_TIME = 60

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
    reactionTimes: [],
    reactionTimeVariability: 0,
    omissionRate: 0,
  })
  const [stimulusStartTime, setStimulusStartTime] = useState<number | null>(null)
  const [targetLetter] = useState("X")

  const [currentLevel, setCurrentLevel] = useState(0)
  const [showLevelTransition, setShowLevelTransition] = useState(false)

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const letterTimerRef = useRef<NodeJS.Timeout | null>(null)
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()
  const dynamo = useDynamo()
  const [startTime, setStartTime] = useState<number>(0)

  const levels: LevelType[] = [
    { name: "Nivel 1: Fácil", duration: 25, interval: 1000, targetProbability: 0.25 },
    { name: "Nivel 2: Medio", duration: 20, interval: 500, targetProbability: 0.15 },
    { name: "Nivel 3: Difícil", duration: 15, interval: 250, targetProbability: 0.1 },
  ]

  const letters = ["A","B","C","D","E","F","G","H","J","K","L","M","N","P","Q","R","S","T","U","V","W","Z"]

  const clearAllTimers = useCallback(() => {
    if (letterTimerRef.current) { clearInterval(letterTimerRef.current); letterTimerRef.current = null }
    if (gameTimerRef.current) { clearInterval(gameTimerRef.current); gameTimerRef.current = null }
    if (transitionTimerRef.current) { clearTimeout(transitionTimerRef.current); transitionTimerRef.current = null }
  }, [])

  const generateLetter = useCallback(() => {
    if (gamePaused || gameFinished || showLevelTransition) return

    let showTarget = Math.random() < levels[currentLevel].targetProbability
    if (currentLetter === targetLetter) showTarget = false

    const newLetter = showTarget
      ? targetLetter
      : letters[Math.floor(Math.random() * letters.filter((l) => l !== targetLetter).length)]

    setPreviousLetter(currentLetter)
    setCurrentLetter(newLetter)
    setStimulusStartTime(Date.now())

    if (previousLetter === targetLetter && stimulusStartTime !== null) {
      const timeSinceStimulus = Date.now() - stimulusStartTime
      if (timeSinceStimulus > levels[currentLevel].interval * 0.8) {
        setResults((prev) => ({ ...prev, omissionErrors: prev.omissionErrors + 1 }))
      }
    }
  }, [currentLetter, previousLetter, targetLetter, letters, stimulusStartTime, currentLevel, levels, gamePaused, gameFinished, showLevelTransition])

  const startLetterTimer = useCallback(() => {
    if (letterTimerRef.current) { clearInterval(letterTimerRef.current); letterTimerRef.current = null }
    generateLetter()
    letterTimerRef.current = setInterval(() => { generateLetter() }, levels[currentLevel].interval)
  }, [generateLetter, currentLevel, levels])

  const startLevel = useCallback((level: number) => {
    if (letterTimerRef.current) { clearInterval(letterTimerRef.current); letterTimerRef.current = null }
    if (transitionTimerRef.current) { clearTimeout(transitionTimerRef.current); transitionTimerRef.current = null }
    setCurrentLevel(level)
    setShowLevelTransition(true)
    setCurrentLetter(null)
    transitionTimerRef.current = setTimeout(() => {
      setShowLevelTransition(false)
      startLetterTimer()
    }, 1200)
  }, [startLetterTimer])

  const startGame = useCallback(() => {
    setGameStarted(true)
    setGamePaused(false)
    setGameFinished(false)
    setTimeLeft(TOTAL_TIME)
    setProgress(0)
    setCurrentLevel(0)
    setResults({ correctResponses: 0, commissionErrors: 0, omissionErrors: 0, reactionTimes: [], reactionTimeVariability: 0, omissionRate: 0 })
    setStartTime(Date.now())

    if (gameTimerRef.current) { clearInterval(gameTimerRef.current); gameTimerRef.current = null }
    setCurrentLevel(0)
    startLetterTimer()

    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1
        const elapsedTime = TOTAL_TIME - newTime
        setProgress(Math.min(100, (elapsedTime / TOTAL_TIME) * 100))

        if (newTime <= 0) {
          setGameFinished(true)
          clearAllTimers()
          return 0
        }
        if (elapsedTime === 30 && currentLevel === 0) startLevel(1)
        else if (elapsedTime === 50 && currentLevel === 1) startLevel(2)
        return newTime
      })
    }, 1000)
  }, [clearAllTimers, startLevel, TOTAL_TIME, currentLevel, startLetterTimer])

  const pauseGame = useCallback(() => {
    setGamePaused(true)
    clearAllTimers()
    setShowDialog(true)
  }, [clearAllTimers])

  const resumeGame = useCallback(() => {
    setGamePaused(false)
    setShowDialog(false)

    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1
        const elapsedTime = TOTAL_TIME - newTime
        setProgress(Math.min(100, (elapsedTime / TOTAL_TIME) * 100))
        if (newTime <= 0) {
          setGameFinished(true)
          clearAllTimers()
          return 0
        }
        if (elapsedTime === 30 && currentLevel === 0) startLevel(1)
        else if (elapsedTime === 50 && currentLevel === 1) startLevel(2)
        return newTime
      })
    }, 1000)
    startLetterTimer()
  }, [clearAllTimers, startLetterTimer, TOTAL_TIME, currentLevel, startLevel])

  const handleButtonPress = useCallback(() => {
    if (!gameStarted || gamePaused || gameFinished || stimulusStartTime === null || showLevelTransition || !currentLetter) return
    const reactionTime = Date.now() - stimulusStartTime

    if (currentLetter === targetLetter) {
      setResults((prev) => ({
        ...prev,
        correctResponses: prev.correctResponses + 1,
        reactionTimes: [...prev.reactionTimes, reactionTime],
      }))
      setFeedbackType("success")
    } else {
      setResults((prev) => ({ ...prev, commissionErrors: prev.commissionErrors + 1 }))
      setFeedbackType("error")
    }
    setShowFeedback(true)
    setTimeout(() => setShowFeedback(false), 500)
  }, [gameStarted, gamePaused, gameFinished, currentLetter, targetLetter, stimulusStartTime, showLevelTransition])

  const finishGame = useCallback(async () => {
    clearAllTimers()
    setGameFinished(true)
    setCurrentLetter(null)

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("completedExercises")
        const completedExercises = saved ? JSON.parse(saved) : []
        if (!completedExercises.includes("atencion")) {
          completedExercises.push("atencion")
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
        }
      } catch {}
    }

    const avgReactionTime =
      results.reactionTimes.length > 0
        ? results.reactionTimes.reduce((sum, time) => sum + time, 0) / results.reactionTimes.length
        : 0

    const medianReactionTime = results.reactionTimes.length > 0 ? calculateMedian(results.reactionTimes) : 0

    const vtr =
      results.reactionTimes.length > 1
        ? Math.sqrt(results.reactionTimes.reduce((acc, t) => acc + Math.pow(t - avgReactionTime, 2), 0) / results.reactionTimes.length)
        : 0
    const totalTargets = results.correctResponses + results.omissionErrors
    const omissionRate = totalTargets > 0 ? results.omissionErrors / totalTargets : 0

    try {
      const totalTrials = results.correctResponses + results.omissionErrors + results.commissionErrors
      const comisionPenalty = results.commissionErrors * 1.5
      const omisionPenalty = results.omissionErrors * 1
      let puntuacionFinal = Math.max(0, Math.min(100, 100 - (comisionPenalty + omisionPenalty)))
      if (avgReactionTime > 1000) puntuacionFinal = Math.max(0, puntuacionFinal - 10)
      const endTime = Date.now()
      const durationInSec = Math.floor((endTime - startTime) / 1000)

      const exerciseData = {
        tipo: "atencion",
        puntuacion: Math.round(puntuacionFinal),
        duracion: durationInSec,
        detalles: {
          correctas: results.correctResponses,
          errorComision: results.commissionErrors,
          errorOmision: results.omissionErrors,
          tiempoReaccionMedio: Math.round(avgReactionTime),
          tiempoReaccionMediana: Math.round(medianReactionTime),
          nivelAlcanzado: currentLevel + 1,
          tiempoTotal: durationInSec,
          variabilidadTiempoReaccion: Math.round(vtr),
          tasaOmision: Math.round(omissionRate * 100) / 100,
          consistenciaAtencional: vtr < 150 ? "alta" : vtr < 300 ? "media" : "baja",
        },
      }

      const result = await dynamo.saveExerciseResult(exerciseData)
      if (!result.success) console.error("Error saving results:", result.error)
    } catch (error) {
      console.error("Error processing attention results:", error)
    }
  }, [clearAllTimers, results, currentLevel, dynamo, startTime])

  const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
  }

  useEffect(() => {
    if (showLevelTransition) {
      const safetyTimer = setTimeout(() => {
        setShowLevelTransition(false)
        if (gameStarted && !gamePaused && !gameFinished) startLetterTimer()
      }, 1500)
      return () => clearTimeout(safetyTimer)
    }
  }, [showLevelTransition, gameStarted, gamePaused, gameFinished, startLetterTimer])

  useEffect(() => { return () => { clearAllTimers() } }, [clearAllTimers])

  const handleContinue = async () => {
    if (!gameFinished) await finishGame()
    router.push("/ejercicio/memoria")
  }

  // ── Instructions screen ──
  if (!gameStarted) {
    return (
      <ExerciseShell
        title="Prueba de Atención"
        progress={0}
        timeLeft={TOTAL_TIME}
        totalTime={TOTAL_TIME}
        instructions={{
          steps: [
            `Pulsa el botón SOLO cuando veas la letra "${targetLetter}"`,
            "La prueba dura 1 minuto y tiene 3 niveles de dificultad",
            "Las letras aparecerán cada vez más rápido. ¡Concéntrate!",
          ],
          onStart: startGame,
          buttonLabel: "¡Empezar!",
        }}
      >
        <div />
      </ExerciseShell>
    )
  }

  // ── Results screen ──
  if (gameFinished) {
    const avg =
      results.reactionTimes.length > 0
        ? results.reactionTimes.reduce((a, b) => a + b, 0) / results.reactionTimes.length
        : 0
    const vtr =
      results.reactionTimes.length > 1
        ? Math.sqrt(results.reactionTimes.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / results.reactionTimes.length)
        : 0
    const totalT = results.correctResponses + results.omissionErrors
    const omRate = totalT > 0 ? Math.round((results.omissionErrors / totalT) * 100) : 0
    const consistencia = vtr < 150 ? "Alta" : vtr < 300 ? "Media" : "Baja"
    const consistenciaColor = vtr < 150 ? "text-success" : vtr < 300 ? "text-warning" : "text-red-500"

    return (
      <ExerciseShell
        title="Prueba de Atención"
        progress={100}
        timeLeft={0}
        totalTime={TOTAL_TIME}
        onNext={handleContinue}
        nextLabel="Continuar al siguiente ejercicio"
      >
        <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-lg space-y-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <h2 className="text-2xl font-bold text-gray-800">¡Prueba completada!</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-2xl p-4">
              <div className="text-3xl font-bold text-success">{results.correctResponses}</div>
              <div className="text-sm text-gray-500 mt-1">Aciertos</div>
            </div>
            <div className="bg-red-50 rounded-2xl p-4">
              <div className="text-3xl font-bold text-red-500">
                {results.commissionErrors + results.omissionErrors}
              </div>
              <div className="text-sm text-gray-500 mt-1">Errores</div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="text-3xl font-bold text-primary">
                {results.reactionTimes.length > 0 ? `${Math.round(avg)}` : "—"}
              </div>
              <div className="text-sm text-gray-500 mt-1">ms reacción</div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Consistencia atencional</span>
              <span className={`font-bold ${consistenciaColor}`}>{consistencia}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Estímulos perdidos</span>
              <span className="font-bold text-gray-800">{omRate}%</span>
            </div>
          </div>
        </div>
      </ExerciseShell>
    )
  }

  // ── Level transition ──
  if (showLevelTransition) {
    return (
      <ExerciseShell
        title="Prueba de Atención"
        progress={progress}
        timeLeft={timeLeft}
        totalTime={TOTAL_TIME}
        phaseLabel={levels[currentLevel].name}
      >
        <div className="text-center space-y-6 animate-pulse">
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">{currentLevel + 1}</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">{levels[currentLevel].name}</h2>
          <p className="text-lg text-gray-500">
            {currentLevel === 0
              ? "Letras más lentas, fácil de seguir"
              : currentLevel === 1
                ? "Velocidad moderada, mantén el ritmo"
                : "Velocidad rápida, máxima concentración"}
          </p>
        </div>
      </ExerciseShell>
    )
  }

  // ── Active game ──
  return (
    <ExerciseShell
      title="Prueba de Atención"
      progress={progress}
      timeLeft={timeLeft}
      totalTime={TOTAL_TIME}
      phaseLabel={levels[currentLevel].name}
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-lg">
        {/* Target reminder */}
        <div className="bg-primary/5 rounded-2xl px-6 py-2 text-base text-gray-600">
          Pulsa cuando veas{" "}
          <span className="text-2xl font-extrabold text-primary inline-block mx-1">{targetLetter}</span>
        </div>

        {/* Stimulus circle */}
        <div className="relative flex items-center justify-center h-48 w-48 rounded-full bg-white shadow-lg border-4 border-surface">
          <span
            className={`text-8xl font-black transition-all duration-100 ${
              currentLetter === targetLetter ? "text-primary scale-110" : "text-gray-800"
            }`}
          >
            {currentLetter}
          </span>

          {/* Feedback overlay */}
          {showFeedback && (
            <div
              className={`absolute inset-0 flex items-center justify-center rounded-full transition-all ${
                feedbackType === "success"
                  ? "bg-success/20"
                  : "bg-red-500/20"
              }`}
            >
              {feedbackType === "success" ? (
                <CheckCircle2 className="h-20 w-20 text-success" />
              ) : (
                <AlertCircle className="h-20 w-20 text-red-500" />
              )}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="flex gap-6 text-base text-gray-500">
          <span>
            Aciertos: <strong className="text-success">{results.correctResponses}</strong>
          </span>
          <span>
            Errores:{" "}
            <strong className="text-red-500">
              {results.commissionErrors + results.omissionErrors}
            </strong>
          </span>
        </div>

        {/* Action button */}
        <NSButton
          size="lg"
          className="w-full text-2xl font-bold"
          onClick={handleButtonPress}
          disabled={gamePaused || showLevelTransition}
        >
          ¡PULSAR!
        </NSButton>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Pausar el ejercicio?</AlertDialogTitle>
            <AlertDialogDescription>Puedes continuar o abandonar el ejercicio.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resumeGame}>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/panel")}>Abandonar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ExerciseShell>
  )
}
