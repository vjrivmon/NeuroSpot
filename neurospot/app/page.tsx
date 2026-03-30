"use client"

import { ExerciseCard } from "@/components/ui/ExerciseCard"
import { NSButton } from "@/components/ui/NSButton"
import { Header } from "@/components/header"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Eye, Palette, BookOpen, Brain, Camera, Video } from "lucide-react"

const EXERCISES = [
  {
    id: "atencion",
    title: "Atención",
    description: "Pulsa solo cuando veas la letra objetivo",
    icon: <Eye className="h-8 w-8" />,
    color: "bg-primary",
    href: "/ejercicio/atencion",
  },
  {
    id: "stroop",
    title: "Colores",
    description: "Identifica colores y palabras rápidamente",
    icon: <Palette className="h-8 w-8" />,
    color: "bg-success",
    href: "/ejercicio/stroop",
  },
  {
    id: "lectura",
    title: "Lectura",
    description: "Lee en voz alta y mide tu fluidez",
    icon: <BookOpen className="h-8 w-8" />,
    color: "bg-warning",
    href: "/ejercicio/lectura",
  },
  {
    id: "memoria",
    title: "Memoria",
    description: "Recuerda secuencias de elementos",
    icon: <Brain className="h-8 w-8" />,
    color: "bg-purple-500",
    href: "/ejercicio/memoria",
  },
  {
    id: "observacion",
    title: "Observación",
    description: "Encuentra las diferencias entre imágenes",
    icon: <Camera className="h-8 w-8" />,
    color: "bg-rose-500",
    href: "/ejercicio/observacion",
  },
  {
    id: "video",
    title: "Vídeo",
    description: "Grabación para análisis de comportamiento",
    icon: <Video className="h-8 w-8" />,
    color: "bg-cyan-500",
    href: "/ejercicio/video",
  },
]

export default function Home() {
  const [completed, setCompleted] = useState<string[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("completedExercises")
      if (saved) setCompleted(JSON.parse(saved))
    } catch {}
  }, [])

  return (
    <main className="min-h-screen flex flex-col bg-bg">
      <Header />

      <div className="flex-1 container max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Hero */}
        <section className="text-center space-y-4 pt-4">
          <div className="flex justify-center">
            <div className="relative" style={{ width: "80px", height: "80px" }}>
              <Image
                src="/logo.svg"
                alt="NeuroSpot Logo"
                width={80}
                height={80}
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            NeuroSpot
          </h1>
          <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
            Juegos cognitivos para explorar cómo funciona tu atención.
            ¡Elige un ejercicio o haz la sesión completa!
          </p>
        </section>

        {/* Exercise grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {EXERCISES.map((ex) => (
            <Link key={ex.id} href={ex.href}>
              <ExerciseCard
                title={ex.title}
                description={ex.description}
                icon={ex.icon}
                color={ex.color}
                completed={completed.includes(ex.id)}
              />
            </Link>
          ))}
        </section>

        {/* Full session CTA */}
        <section className="text-center space-y-3 pb-6">
          <Link href="/login">
            <NSButton size="lg" className="w-full max-w-md mx-auto">
              Comenzar sesión completa
              <svg
                className="h-5 w-5 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </NSButton>
          </Link>
          {completed.length > 0 && (
            <Link href="/resultados">
              <NSButton variant="secondary" size="md" className="w-full max-w-md mx-auto mt-3">
                Ver resultados anteriores
              </NSButton>
            </Link>
          )}
        </section>
      </div>
    </main>
  )
}
