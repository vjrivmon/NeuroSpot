"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Header } from "@/components/header"
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
import { PauseCircle, CheckCircle2 } from "lucide-react"
import { useDynamo } from "@/hooks/use-dynamo"

const COLORS = [
  { name: "Rojo", value: "#EF4444", bg: "bg-red-500", hover: "hover:bg-red-600", ring: "ring-red-300" },
  { name: "Verde", value: "#10B981", bg: "bg-emerald-500", hover: "hover:bg-emerald-600", ring: "ring-emerald-300" },
  { name: "Azul", value: "#3B82F6", bg: "bg-blue-500", hover: "hover:bg-blue-600", ring: "ring-blue-300" },
  { name: "Amarillo", value: "#F59E0B", bg: "bg-amber-400", hover: "hover:bg-amber-500", ring: "ring-amber-300" },
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
  wordIndex: number
  colorIndex: number
}

function generateItem(phase: "words" | "colors" | "interference"): StroopItem {
  const wordIndex = Math.floor(Math.random() * COLORS.length)
  let colorIndex: number
  if (phase === "interference") {
    do { colorIndex = Math.floor(Math.random() * COLORS.length) } while (colorIndex === wordIndex)
  } else {
    colorIndex = wordIndex
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

  const [phaseResults, setPhaseResults] = useState<PhaseResult[]>([])
  const [currentPhaseData, setCurrentPhaseData] = useState<{ correct: number; errors: number; latencies: number[] }>({
    correct: 0, errors: 0, latencies: [],
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

    let correctIndex: number
    if (activePhase === "words") correctIndex = currentItem.wordIndex
    else if (activePhase === "colors") correctIndex = currentItem.wordIndex
    else correctIndex = currentItem.colorIndex

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
        if (!isPractice) {
          const mean = newData.latencies.reduce((a, b) => a + b, 0) / newData.latencies.length
          const result: PhaseResult = { phase: activePhase, ...newData, meanLatency: Math.round(mean) }
          setPhaseResults((prev) => [...prev, result])
        }
        if (activePhase === "words" && isPractice) { setIsPractice(false); startPhase("words") }
        else if (activePhase === "words") setPhase("transition_colors")
        else if (activePhase === "colors" && isPractice) { setIsPractice(false); startPhase("colors") }
        else if (activePhase === "colors") setPhase("transition_interference")
        else if (activePhase === "interference" && isPractice) { setIsPractice(false); startPhase("interference") }
        else setPhase("results")
      } else {
        setItemIndex(nextIndex)
        nextItem(activePhase)
      }
    }, 400)
  }, [feedback, itemStartTime, phase, currentItem, currentPhaseData, isPractice, itemIndex, nextItem, startPhase])

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
        nivelInterferencia: interferenceIndex < -50 ? "alto" : interferenceIndex < 0 ? "medio" : "bajo",
      },
    }).catch(console.error)

    try {
      const completed = JSON.parse(localStorage.getItem("completedExercises") || "[]")
      if (!completed.includes("stroop")) {
        completed.push("stroop")
        localStorage.setItem("completedExercises", JSON.stringify(completed))
      }
    } catch {}
  }, [phase, phaseResults, dynamo, startTime])

  const handleContinue = () => router.push("/ejercicio/memoria")

  // ── Phase indicator ──
  const phaseNumber = phase === "words" || phase === "transition_colors" ? 1
    : phase === "colors" || phase === "transition_interference" ? 2
    : phase === "interference" || phase === "results" ? 3
    : 0

  const renderPhaseIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-2">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg transition-all ${
            n === phaseNumber
              ? "bg-primary text-white scale-110 shadow-md"
              : n < phaseNumber
                ? "bg-success text-white"
                : "bg-gray-200 text-gray-400"
          }`}
        >
          {n < phaseNumber ? "✓" : n}
        </div>
      ))}
    </div>
  )

  // ── Color buttons ──
  const renderColorButtons = (onSelect: (i: number) => void) => (
    <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto">
      {COLORS.map((color, i) => (
        <button
          key={i}
          className={`
            ${color.bg} ${color.hover}
            rounded-2xl active:scale-95 transition-all duration-100
            shadow-md focus-visible:outline-none focus-visible:ring-4 ${color.ring}
            flex items-center justify-center
          `}
          style={{ minHeight: "72px" }}
          onClick={() => onSelect(i)}
        >
          <span className="text-white font-bold text-lg">{color.name}</span>
        </button>
      ))}
    </div>
  )

  // ── Stimulus ──
  const renderStimulus = () => {
    if (phase === "words") {
      return (
        <div className="text-5xl md:text-6xl font-black tracking-tight text-gray-800 select-none text-center">
          {COLORS[currentItem.wordIndex].name.toUpperCase()}
        </div>
      )
    }
    if (phase === "colors") {
      return (
        <div className="text-5xl md:text-6xl font-black tracking-tight select-none text-center" style={{ color: COLORS[currentItem.wordIndex].value }}>
          XXXX
        </div>
      )
    }
    return (
      <div className="text-5xl md:text-6xl font-black tracking-tight select-none text-center" style={{ color: COLORS[currentItem.colorIndex].value }}>
        {COLORS[currentItem.wordIndex].name.toUpperCase()}
      </div>
    )
  }

  // ── INSTRUCTIONS ──
  if (phase === "instructions") return (
    <main className="min-h-screen bg-bg flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-lg p-8 w-full space-y-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Test de Colores</h1>
          <p className="text-lg text-gray-500">
            Este juego tiene <strong>3 partes</strong>. En cada una tendrás que tocar el color correcto.
          </p>

          <div className="space-y-4 text-left">
            {[
              { n: 1, label: "Lee la palabra y toca ese color", desc: "Parte 1: Palabras" },
              { n: 2, label: "Toca el color que ves (las letras XXXX)", desc: "Parte 2: Colores" },
              { n: 3, label: "Toca el COLOR en que está pintada la palabra (¡ignora lo que dice!)", desc: "Parte 3: Interferencia" },
            ].map(({ n, label, desc }) => (
              <div key={n} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                  {n}
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-gray-700">{desc}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-400">Primero harás 2 intentos de práctica en cada parte.</p>

          <NSButton
            size="lg"
            className="w-full"
            onClick={() => { setIsPractice(true); startPhase("words") }}
          >
            ¡Empezar!
          </NSButton>
        </div>
      </div>
    </main>
  )

  // ── TRANSITIONS ──
  if (phase === "transition_colors" || phase === "transition_interference") {
    const isColors = phase === "transition_colors"
    return (
      <main className="min-h-screen bg-bg flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6 max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-3xl shadow-lg p-8 w-full text-center space-y-6">
            {renderPhaseIndicator()}

            <h2 className="text-3xl font-bold text-gray-800">
              {isColors ? "¡Parte 2: Colores!" : "¡Parte 3: Interferencia!"}
            </h2>
            <p className="text-lg text-gray-500">
              {isColors
                ? "Ahora verás XXXX pintadas de un color. Toca el color que ves."
                : "Verás palabras pintadas de un color diferente. Toca el COLOR en que está pintada, ¡no lo que dice!"}
            </p>

            {!isColors && (
              <div className="bg-surface rounded-2xl p-4 space-y-2">
                <span style={{ color: COLORS[2].value, fontWeight: "bold", fontSize: "1.8rem" }}>ROJO</span>
                <p className="text-sm text-gray-500">La palabra dice &quot;ROJO&quot; pero está pintada de azul. Toca el botón azul.</p>
              </div>
            )}

            <NSButton
              size="lg"
              className="w-full"
              onClick={() => { setIsPractice(true); startPhase(isColors ? "colors" : "interference") }}
            >
              Entendido, ¡vamos!
            </NSButton>
          </div>
        </div>
      </main>
    )
  }

  // ── RESULTS ──
  if (phase === "results" && phaseResults.length >= 3) {
    const [wR, cR, iR] = phaseResults
    const P = wR.meanLatency, C = cR.meanLatency, PC = iR.meanLatency
    const intIdx = Math.round(PC - (P * C) / (P + C))
    const intLevel =
      intIdx < -50
        ? { label: "Alta dificultad de inhibición", color: "text-red-500" }
        : intIdx < 0
          ? { label: "Dificultad moderada", color: "text-warning" }
          : { label: "Buena inhibición", color: "text-success" }

    return (
      <main className="min-h-screen bg-bg flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-3xl shadow-lg p-8 w-full space-y-6">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <h2 className="text-2xl font-bold text-gray-800">¡Completado!</h2>
            </div>

            {renderPhaseIndicator()}

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Palabras", r: wR },
                { label: "Colores", r: cR },
                { label: "Interferencia", r: iR },
              ].map(({ label, r }) => (
                <div key={label} className="bg-surface rounded-2xl p-4 text-center">
                  <div className="text-xs font-semibold text-gray-400 uppercase">{label}</div>
                  <div className="text-3xl font-bold text-gray-800 mt-1">{r.correct}/{ITEMS_PER_PHASE}</div>
                  <div className="text-sm text-gray-500">{r.meanLatency}ms</div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-2xl p-5 text-center space-y-1">
              <div className={`text-xl font-bold ${intLevel.color}`}>{intLevel.label}</div>
              <div className="text-sm text-gray-400">Índice de interferencia: {intIdx}</div>
            </div>

            <NSButton size="lg" className="w-full" onClick={handleContinue}>
              Continuar al siguiente ejercicio
            </NSButton>
          </div>
        </div>
      </main>
    )
  }

  // ── ACTIVE GAME ──
  const activePhase = phase as "words" | "colors" | "interference"
  const phaseLabel = activePhase === "words" ? "Parte 1: Palabras" : activePhase === "colors" ? "Parte 2: Colores" : "Parte 3: Interferencia"
  const phaseInstruction = activePhase === "words"
    ? "Toca el color que dice la palabra"
    : activePhase === "colors"
      ? "Toca el color que ves"
      : "Toca el COLOR en que está pintada (ignora la palabra)"
  const maxItems = isPractice ? PRACTICE_ITEMS : ITEMS_PER_PHASE

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      <Header />

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir del ejercicio?</AlertDialogTitle>
            <AlertDialogDescription>Perderás tu progreso actual.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDialog(false)}>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/panel")}>Salir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-1 flex flex-col items-center px-4 py-4 gap-4 max-w-2xl mx-auto w-full">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between">
          <div>
            {renderPhaseIndicator()}
            <div className="text-sm font-bold text-gray-700 mt-1">{phaseLabel}</div>
            {isPractice && <div className="text-xs font-medium text-warning">Práctica — {itemIndex + 1}/{PRACTICE_ITEMS}</div>}
          </div>
          <button onClick={() => setShowDialog(true)} className="p-2 text-gray-400 hover:text-gray-600 transition">
            <PauseCircle className="w-7 h-7" />
          </button>
        </div>

        {!isPractice && (
          <ProgressBar value={itemIndex} max={maxItems} size="sm" color="primary" />
        )}

        {/* Instruction */}
        <p className="text-base text-center text-gray-500 font-medium px-2">{phaseInstruction}</p>

        {/* Stimulus area */}
        <div
          className={`
            flex items-center justify-center rounded-3xl w-full
            transition-all duration-200 p-8
            ${feedback === "correct" ? "bg-green-50 ring-4 ring-success/30" : feedback === "wrong" ? "bg-red-50 ring-4 ring-red-300" : "bg-white shadow-md"}
          `}
          style={{ minHeight: "160px" }}
        >
          {renderStimulus()}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`text-2xl font-bold ${feedback === "correct" ? "text-success" : "text-red-500"}`}>
            {feedback === "correct" ? "✓ ¡Correcto!" : "✗ Incorrecto"}
          </div>
        )}

        {/* Color buttons */}
        {renderColorButtons(handleAnswer)}

        {/* Counter */}
        {!isPractice && (
          <div className="text-base font-medium text-gray-400">{itemIndex + 1} / {ITEMS_PER_PHASE}</div>
        )}
      </div>
    </main>
  )
}
