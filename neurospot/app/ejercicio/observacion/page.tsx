"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { PauseCircle, CheckCircle2 } from "lucide-react"
import { useDynamo } from "@/hooks/use-dynamo"

// Símbolos del juego
const SYMBOLS = ["⭐", "🔵", "🟥", "🌙", "🔺"]
const GAME_DURATION = 90 // segundos
const COLS_MOBILE = 6
const COLS_TABLET = 7
const ROWS = 8
const TARGET_RATIO = 0.30 // 30% de los items son targets

type ItemState = "idle" | "found" | "error"

interface GridItem {
  id: number
  symbol: string
  isTarget: boolean
  state: ItemState
  tappedAt?: number
}

interface CancelacionResults {
  totalTargets: number
  targetsFound: number
  omissionErrors: number
  commissionErrors: number
  omissionRate: number
  commissionRate: number
  timeToComplete: number
  itemLatencies: number[]
  reactionTimeVariability: number
}

function buildGrid(cols: number, rows: number, targetSymbol: string): GridItem[] {
  const total = cols * rows
  const numTargets = Math.round(total * TARGET_RATIO)
  const items: GridItem[] = []

  for (let i = 0; i < total; i++) {
    items.push({
      id: i,
      symbol: SYMBOLS.filter(s => s !== targetSymbol)[Math.floor(Math.random() * (SYMBOLS.length - 1))],
      isTarget: false,
      state: "idle",
    })
  }

  // Insertar targets en posiciones aleatorias
  const targetPositions = new Set<number>()
  while (targetPositions.size < numTargets) {
    targetPositions.add(Math.floor(Math.random() * total))
  }
  targetPositions.forEach(pos => {
    items[pos] = { ...items[pos], symbol: targetSymbol, isTarget: true }
  })

  return items
}

export default function CancelacionVisualPage() {
  const router = useRouter()
  const dynamo = useDynamo()

  const [gameStarted, setGameStarted] = useState(false)
  const [gamePaused, setGamePaused] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [targetSymbol] = useState(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
  const [cols, setCols] = useState(COLS_TABLET)
  const [grid, setGrid] = useState<GridItem[]>([])
  const [results, setResults] = useState<CancelacionResults | null>(null)
  const [lastTapTime, setLastTapTime] = useState<number | null>(null)
  const [itemLatencies, setItemLatencies] = useState<number[]>([])
  const [commissionErrors, setCommissionErrors] = useState(0)
  const [startTime, setStartTime] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Detectar columnas según ancho de pantalla
  useEffect(() => {
    const updateCols = () => setCols(window.innerWidth < 600 ? COLS_MOBILE : COLS_TABLET)
    updateCols()
    window.addEventListener("resize", updateCols)
    return () => window.removeEventListener("resize", updateCols)
  }, [])

  // Construir grid cuando se conocen las columnas
  useEffect(() => {
    if (cols > 0) setGrid(buildGrid(cols, ROWS, targetSymbol))
  }, [cols, targetSymbol])

  // Timer principal
  useEffect(() => {
    if (!gameStarted || gamePaused || gameFinished) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          finishGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameStarted, gamePaused, gameFinished])

  const finishGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setGameFinished(true)
  }, [])

  const handleStart = () => {
    setGameStarted(true)
    setStartTime(Date.now())
  }

  const handleTap = useCallback((item: GridItem) => {
    if (!gameStarted || gamePaused || gameFinished || item.state !== "idle") return

    const now = Date.now()
    if (lastTapTime !== null) {
      setItemLatencies(prev => [...prev, now - lastTapTime])
    }
    setLastTapTime(now)

    if (item.isTarget) {
      setGrid(prev => prev.map(g => g.id === item.id ? { ...g, state: "found", tappedAt: now } : g))
    } else {
      setCommissionErrors(prev => prev + 1)
      setGrid(prev => prev.map(g => g.id === item.id ? { ...g, state: "error" } : g))
      // Resetear error visual tras 600ms
      setTimeout(() => {
        setGrid(prev => prev.map(g => g.id === item.id ? { ...g, state: "idle" } : g))
      }, 600)
    }
  }, [gameStarted, gamePaused, gameFinished, lastTapTime])

  // Calcular y guardar resultados cuando termina
  useEffect(() => {
    if (!gameFinished || grid.length === 0) return

    const totalTargets = grid.filter(g => g.isTarget).length
    const targetsFound = grid.filter(g => g.isTarget && g.state === "found").length
    const omissionErrors = totalTargets - targetsFound
    const totalDistractors = grid.filter(g => !g.isTarget).length
    const omissionRate = totalTargets > 0 ? omissionErrors / totalTargets : 0
    const commissionRate = totalDistractors > 0 ? commissionErrors / totalDistractors : 0
    const timeToComplete = Date.now() - startTime

    const avg = itemLatencies.length > 0
      ? itemLatencies.reduce((a, b) => a + b, 0) / itemLatencies.length : 0
    const vtr = itemLatencies.length > 1
      ? Math.sqrt(itemLatencies.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / itemLatencies.length)
      : 0

    const finalResults: CancelacionResults = {
      totalTargets,
      targetsFound,
      omissionErrors,
      commissionErrors,
      omissionRate: Math.round(omissionRate * 100) / 100,
      commissionRate: Math.round(commissionRate * 100) / 100,
      timeToComplete,
      itemLatencies,
      reactionTimeVariability: Math.round(vtr),
    }
    setResults(finalResults)

    // Guardar en DynamoDB
    const puntuacion = Math.max(0, Math.round(
      100 - (omissionErrors * 3) - (commissionErrors * 2)
    ))
    dynamo.saveExerciseResult({
      tipo: "cancelacion_visual",
      puntuacion,
      duracion: Math.floor(timeToComplete / 1000),
      detalles: {
        ...finalResults,
        simboloObjetivo: targetSymbol,
        tasaOmisionPct: Math.round(omissionRate * 100),
        consistenciaAtencional: vtr < 200 ? "alta" : vtr < 400 ? "media" : "baja",
      }
    }).catch(console.error)

    // Marcar como completado
    try {
      const completed = JSON.parse(localStorage.getItem("completedExercises") || "[]")
      if (!completed.includes("observacion")) {
        completed.push("observacion")
        localStorage.setItem("completedExercises", JSON.stringify(completed))
      }
    } catch (_) {}
  }, [gameFinished])

  const handleContinue = () => router.push("/ejercicio/stroop")

  const totalTargets = grid.filter(g => g.isTarget).length
  const targetsFound = grid.filter(g => g.isTarget && g.state === "found").length
  const timerPct = (timeLeft / GAME_DURATION) * 100
  const timerColor = timeLeft > 30 ? "#3876F4" : timeLeft > 10 ? "#f59e0b" : "#ef4444"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir del ejercicio?</AlertDialogTitle>
            <AlertDialogDescription>Perderás tu progreso actual.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDialog(false); setGamePaused(false) }}>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/panel")}>Salir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="flex-1 flex flex-col items-center px-3 py-4 gap-4 max-w-2xl mx-auto w-full">

        {/* Header del juego */}
        <Card className="w-full">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between gap-3">
              {/* Objetivo */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Busca</span>
                <span className="text-5xl leading-none select-none">{targetSymbol}</span>
              </div>

              {/* Timer circular */}
              <div className="flex flex-col items-center gap-1">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r="28" fill="none"
                    stroke={timerColor} strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - timerPct / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                  />
                  <text x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="bold" fill={timerColor}>{timeLeft}</text>
                </svg>
                <span className="text-xs text-muted-foreground">seg</span>
              </div>

              {/* Progreso */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Encontrados</span>
                <span className="text-3xl font-bold text-[#3876F4]">{targetsFound}</span>
                <span className="text-xs text-muted-foreground">de {totalTargets}</span>
              </div>

              {/* Pausa */}
              {gameStarted && !gameFinished && (
                <button
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground active:scale-95"
                  onClick={() => { setGamePaused(p => !p); if (!gamePaused) setShowDialog(true) }}
                >
                  <PauseCircle className="w-7 h-7" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instrucción */}
        {!gameStarted && (
          <div className="text-center space-y-3 px-2">
            <p className="text-lg font-semibold">Toca todos los <span className="text-3xl">{targetSymbol}</span> que veas</p>
            <p className="text-sm text-muted-foreground">Hazlo lo más rápido que puedas. ¡No toques los otros!</p>
            <Button
              className="w-full h-14 text-lg font-semibold bg-[#3876F4] hover:bg-[#3876F4]/90 text-white"
              onClick={handleStart}
            >
              ¡Empezar!
            </Button>
          </div>
        )}

        {/* Grid de juego */}
        {gameStarted && !gameFinished && (
          <div
            className="w-full grid gap-1.5 select-none"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {grid.map(item => (
              <button
                key={item.id}
                className={`
                  flex items-center justify-center rounded-lg text-2xl
                  transition-all duration-150 active:scale-90
                  min-h-[44px] aspect-square
                  ${item.state === "found"
                    ? "bg-green-100 dark:bg-green-900/30 opacity-40 scale-90"
                    : item.state === "error"
                    ? "bg-red-100 dark:bg-red-900/30 scale-95"
                    : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
                onClick={() => handleTap(item)}
                disabled={item.state === "found"}
              >
                {item.state === "found" ? "✓" : item.symbol}
              </button>
            ))}
          </div>
        )}

        {/* Pantalla de resultados */}
        {gameFinished && results && (
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-6 h-6" />
                ¡Ejercicio completado!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <div className="text-3xl font-bold text-green-700 dark:text-green-400">{results.targetsFound}</div>
                  <div className="text-xs text-muted-foreground mt-1">de {results.totalTargets} encontrados</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{results.omissionErrors}</div>
                  <div className="text-xs text-muted-foreground mt-1">perdidos</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{results.commissionErrors}</div>
                  <div className="text-xs text-muted-foreground mt-1">errores</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {results.reactionTimeVariability < 200 ? "🟢" : results.reactionTimeVariability < 400 ? "🟡" : "🔴"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">consistencia</div>
                </div>
              </div>
              <Button
                className="w-full h-14 text-lg font-semibold bg-[#3876F4] hover:bg-[#3876F4]/90 text-white"
                onClick={handleContinue}
              >
                Continuar →
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
