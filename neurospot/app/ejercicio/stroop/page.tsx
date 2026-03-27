"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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

const COLORS = [
  { name: "Rojo",     value: "#EF4444", bg: "bg-red-500",    hover: "hover:bg-red-600"    },
  { name: "Verde",    value: "#10B981", bg: "bg-emerald-500", hover: "hover:bg-emerald-600" },
  { name: "Azul",     value: "#3B82F6", bg: "bg-blue-500",   hover: "hover:bg-blue-600"   },
  { name: "Amarillo", value: "#F59E0B", bg: "bg-amber-400",  hover: "hover:bg-amber-500"  },
]

const ITEMS_PER_PHASE = 20
const PRACTICE_ITEMS = 2

type Phase = "instructions" | "practice" | "words" | "transition_colors" | "colors" | "transition_interference" | "interference" | "results"

interface PhaseResult {
  phase: "words" | "colors" | "interference"
  correct: number
  errors: number
  latencies: number[]
  meanLatency: number
}

interface StroopItem {
  wordIndex: number   // índice de la palabra mostrada
  colorIndex: number  // índice del color en que está pintada
}

function generateItem(phase: "words" | "colors" | "interference"): StroopItem {
  const wordIndex = Math.floor(Math.random() * COLORS.length)
  let colorIndex: number
  if (phase === "interference") {
    // En interferencia: color SIEMPRE distinto a la palabra
    do { colorIndex = Math.floor(Math.random() * COLORS.length) } while (colorIndex === wordIndex)
  } else {
    colorIndex = wordIndex // En palabras y colores no importa (se usan de forma diferente)
  }
  return { wordIndex, colorIndex }
}

export default function StroopPage() {
  const router = useRouter()
  const dynamo = useDynamo()

  const [phase, setPhase] = useState<Phase>("instructions")
  const [currentItem, setCurrentItem] = useState<StroopItem>(generateItem("words"))
  const [itemIndex, setItemIndex] = useState(0)
  const [isPractice, setIsPractice] = useState(false)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [itemStartTime, setItemStartTime] = useState(0)
  const [startTime] = useState(Date.now())

  // Resultados por fase
  const [phaseResults, setPhaseResults] = useState<PhaseResult[]>([])
  const [currentPhaseData, setCurrentPhaseData] = useState<{ correct: number; errors: number; latencies: number[] }>({
    correct: 0, errors: 0, latencies: []
  })

  const feedbackTimer = useRef<NodeJS.Timeout | null>(null)

  const nextItem = useCallback((currentPhase: "words" | "colors" | "interference") => {
    setCurrentItem(generateItem(currentPhase))
    setItemStartTime(Date.now())
    setFeedback(null)
  }, [])

  const startPhase = useCallback((p: Phase) => {
    setPhase(p)
    setItemIndex(0)
    setCurrentPhaseData({ correct: 0, errors: 0, latencies: [] })
    setFeedback(null)
    if (p === "words" || p === "colors" || p === "interference") {
      setCurrentItem(generateItem(p))
      setItemStartTime(Date.now())
    }
  }, [])

  const handleAnswer = useCallback((selectedColorIndex: number) => {
    if (feedback !== null) return
    const latency = Date.now() - itemStartTime
    const activePhase = phase as "words" | "colors" | "interference"

    // Determinar respuesta correcta según fase
    let correctIndex: number
    if (activePhase === "words") {
      correctIndex = currentItem.wordIndex      // debe decir la palabra
    } else if (activePhase === "colors") {
      // El estímulo es XXXX en un color — colorIndex == wordIndex en esta fase
      correctIndex = currentItem.wordIndex
    } else {
      correctIndex = currentItem.colorIndex     // debe decir el COLOR, ignorar la palabra
    }

    const isCorrect = selectedColorIndex === correctIndex
    setFeedback(isCorrect ? "correct" : "wrong")

    const newData = {
      correct: currentPhaseData.correct + (isCorrect ? 1 : 0),
      errors: currentPhaseData.errors + (isCorrect ? 0 : 1),
      latencies: [...currentPhaseData.latencies, latency],
    }
    setCurrentPhaseData(newData)

    const maxItems = isPractice ? PRACTICE_ITEMS : ITEMS_PER_PHASE
    const nextIndex = itemIndex + 1

    feedbackTimer.current = setTimeout(() => {
      if (nextIndex >= maxItems) {
        // Fin de esta fase
        if (!isPractice) {
          const mean = newData.latencies.reduce((a, b) => a + b, 0) / newData.latencies.length
          const result: PhaseResult = { phase: activePhase, ...newData, meanLatency: Math.round(mean) }
          setPhaseResults(prev => [...prev, result])
        }

        // Siguiente fase
        if (activePhase === "words" && isPractice) {
          setIsPractice(false); startPhase("words")
        } else if (activePhase === "words") {
          setPhase("transition_colors")
        } else if (activePhase === "colors" && isPractice) {
          setIsPractice(false); startPhase("colors")
        } else if (activePhase === "colors") {
          setPhase("transition_interference")
        } else if (activePhase === "interference" && isPractice) {
          setIsPractice(false); startPhase("interference")
        } else {
          setPhase("results")
        }
      } else {
        setItemIndex(nextIndex)
        nextItem(activePhase)
      }
    }, 400)
  }, [feedback, itemStartTime, phase, currentItem, currentPhaseData, isPractice, itemIndex, nextItem, startPhase])

  // Guardar resultados finales
  useEffect(() => {
    if (phase !== "results" || phaseResults.length < 3) return

    const [wordsR, colorsR, intR] = phaseResults
    const P = wordsR.meanLatency, C = colorsR.meanLatency, PC = intR.meanLatency
    const interferenceIndex = PC - (P * C) / (P + C)

    const totalCorrect = phaseResults.reduce((a, r) => a + r.correct, 0)
    const totalItems = ITEMS_PER_PHASE * 3
    const puntuacion = Math.max(0, Math.round((totalCorrect / totalItems) * 100 - Math.max(0, interferenceIndex / 10)))

    dynamo.saveExerciseResult({
      tipo: "stroop",
      puntuacion,
      duracion: Math.floor((Date.now() - startTime) / 1000),
      detalles: {
        fasesPalabras: wordsR,
        faseColores: colorsR,
        faseInterferencia: intR,
        indiceInterferencia: Math.round(interferenceIndex),
        // Negativo = más interferencia (como en tu informe clínico R-Int T37)
        nivelInterferencia: interferenceIndex < -50 ? "alto" : interferenceIndex < 0 ? "medio" : "bajo",
      }
    }).catch(console.error)

    try {
      const completed = JSON.parse(localStorage.getItem("completedExercises") || "[]")
      if (!completed.includes("stroop")) {
        completed.push("stroop"); localStorage.setItem("completedExercises", JSON.stringify(completed))
      }
    } catch (_) {}
  }, [phase, phaseResults])

  const handleContinue = () => router.push("/ejercicio/memoria")

  // ── Renderizado ──

  const renderColorButtons = (onSelect: (i: number) => void) => (
    <div className="grid grid-cols-2 gap-3 w-full max-w-xs mx-auto">
      {COLORS.map((color, i) => (
        <button
          key={i}
          className={`
            ${color.bg} ${color.hover}
            rounded-2xl active:scale-95 transition-all duration-100
            shadow-md
          `}
          style={{ minHeight: "80px" }}
          onClick={() => onSelect(i)}
        >
          <span className="sr-only">{color.name}</span>
        </button>
      ))}
    </div>
  )

  const renderStimulus = () => {
    if (phase === "words") {
      return (
        <div className="text-6xl font-black tracking-tight text-foreground select-none">
          {COLORS[currentItem.wordIndex].name.toUpperCase()}
        </div>
      )
    }
    if (phase === "colors") {
      return (
        <div className="text-6xl font-black tracking-tight select-none" style={{ color: COLORS[currentItem.wordIndex].value }}>
          XXXX
        </div>
      )
    }
    // Interferencia: palabra en color distinto
    return (
      <div className="text-6xl font-black tracking-tight select-none" style={{ color: COLORS[currentItem.colorIndex].value }}>
        {COLORS[currentItem.wordIndex].name.toUpperCase()}
      </div>
    )
  }

  const progressBar = (current: number, total: number) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className="bg-[#3876F4] h-2 rounded-full transition-all duration-300"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  )

  // ── INSTRUCCIONES ──
  if (phase === "instructions") return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6 max-w-md mx-auto w-full">
        <Card className="w-full">
          <CardHeader><CardTitle className="text-center text-xl">Test de Colores 🎨</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-base">Este juego tiene <strong>3 partes</strong>. En cada una verás algo diferente y tendrás que tocar el color correcto.</p>
            <div className="space-y-2 text-left text-sm bg-muted rounded-lg p-4">
              <p>📝 <strong>Parte 1:</strong> Lee la palabra y toca ese color</p>
              <p>🎨 <strong>Parte 2:</strong> Toca el color que ves</p>
              <p>🧠 <strong>Parte 3:</strong> Toca el color en que está pintada la palabra (¡ignora lo que dice!)</p>
            </div>
            <p className="text-sm text-muted-foreground">Primero harás 2 intentos de práctica en cada parte.</p>
            <Button
              className="w-full h-14 text-lg font-semibold bg-[#3876F4] hover:bg-[#3876F4]/90 text-white"
              onClick={() => { setIsPractice(true); startPhase("words") }}
            >
              ¡Empezar!
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )

  // ── TRANSICIONES ──
  if (phase === "transition_colors" || phase === "transition_interference") {
    const isColors = phase === "transition_colors"
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6 max-w-md mx-auto w-full">
          <Card className="w-full text-center">
            <CardContent className="pt-6 pb-6 space-y-4">
              <div className="text-5xl">{isColors ? "🎨" : "🧠"}</div>
              <h2 className="text-xl font-bold">{isColors ? "¡Parte 2!" : "¡Parte 3 — La más difícil!"}</h2>
              <p className="text-base text-muted-foreground">
                {isColors
                  ? "Ahora verás XXXX pintadas de un color. Toca el color que ves."
                  : "Verás palabras pintadas de un color diferente. Toca el COLOR en que está pintada, ¡no lo que dice!"}
              </p>
              {!isColors && (
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <span style={{ color: COLORS[2].value, fontWeight: "bold", fontSize: "1.4rem" }}>ROJO</span>
                  <span className="block text-muted-foreground mt-1">→ Toca el botón azul (el color en que está pintado)</span>
                </div>
              )}
              <Button
                className="w-full h-14 text-lg font-semibold bg-[#3876F4] hover:bg-[#3876F4]/90 text-white"
                onClick={() => { setIsPractice(true); startPhase(isColors ? "colors" : "interference") }}
              >
                Entendido →
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // ── RESULTADOS ──
  if (phase === "results" && phaseResults.length >= 3) {
    const [wR, cR, iR] = phaseResults
    const P = wR.meanLatency, C = cR.meanLatency, PC = iR.meanLatency
    const intIdx = Math.round(PC - (P * C) / (P + C))
    const intLevel = intIdx < -50 ? { label: "Alta dificultad de inhibición", icon: "🔴" }
      : intIdx < 0 ? { label: "Dificultad moderada", icon: "🟡" }
      : { label: "Buena inhibición", icon: "🟢" }

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center px-4 py-6 gap-4 max-w-md mx-auto w-full">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-6 h-6" />¡Completado!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                {[
                  { label: "Palabras", r: wR },
                  { label: "Colores", r: cR },
                  { label: "Interferencia", r: iR },
                ].map(({ label, r }) => (
                  <div key={label} className="bg-muted rounded-lg p-2">
                    <div className="font-semibold text-xs text-muted-foreground">{label}</div>
                    <div className="text-xl font-bold">{r.correct}/{ITEMS_PER_PHASE}</div>
                    <div className="text-xs text-muted-foreground">{r.meanLatency}ms</div>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold">{intLevel.icon} {intLevel.label}</div>
                <div className="text-xs text-muted-foreground mt-1">Índice de interferencia: {intIdx}</div>
              </div>
              <Button
                className="w-full h-14 text-lg font-semibold bg-[#3876F4] hover:bg-[#3876F4]/90 text-white"
                onClick={handleContinue}
              >
                Continuar →
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // ── JUEGO ACTIVO (words / colors / interference) ──
  const activePhase = phase as "words" | "colors" | "interference"
  const phaseLabel = activePhase === "words" ? "Parte 1: Palabras" : activePhase === "colors" ? "Parte 2: Colores" : "Parte 3: Interferencia"
  const phaseInstruction = activePhase === "words" ? "Toca el color que dice la palabra"
    : activePhase === "colors" ? "Toca el color que ves"
    : "Toca el COLOR en que está pintada (ignora la palabra)"
  const maxItems = isPractice ? PRACTICE_ITEMS : ITEMS_PER_PHASE

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir?</AlertDialogTitle>
            <AlertDialogDescription>Perderás tu progreso.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDialog(false)}>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/panel")}>Salir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="flex-1 flex flex-col items-center px-4 py-4 gap-5 max-w-md mx-auto w-full">
        {/* Header fase */}
        <div className="w-full flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{phaseLabel}</div>
            {isPractice && <div className="text-xs text-amber-500 font-medium">Práctica — {itemIndex + 1}/{PRACTICE_ITEMS}</div>}
          </div>
          <button onClick={() => setShowDialog(true)} className="p-2 text-muted-foreground">
            <PauseCircle className="w-6 h-6" />
          </button>
        </div>

        {!isPractice && progressBar(itemIndex, maxItems)}

        {/* Instrucción */}
        <p className="text-sm text-center text-muted-foreground px-2">{phaseInstruction}</p>

        {/* Estímulo central */}
        <div className={`
          flex items-center justify-center rounded-2xl w-full
          transition-all duration-150
          ${feedback === "correct" ? "bg-green-50 dark:bg-green-900/20" : feedback === "wrong" ? "bg-red-50 dark:bg-red-900/20" : "bg-muted"}
        `} style={{ minHeight: "140px" }}>
          {renderStimulus()}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`text-2xl font-bold ${feedback === "correct" ? "text-green-600" : "text-red-500"}`}>
            {feedback === "correct" ? "✓ ¡Correcto!" : "✗ Incorrecto"}
          </div>
        )}

        {/* Botones de color */}
        {renderColorButtons(handleAnswer)}

        {/* Contador */}
        {!isPractice && (
          <div className="text-sm text-muted-foreground">{itemIndex + 1} / {ITEMS_PER_PHASE}</div>
        )}
      </main>
    </div>
  )
}
