"use client"

import * as React from "react"
import { Header } from "@/components/header"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { Timer } from "@/components/ui/Timer"
import { NSButton } from "@/components/ui/NSButton"
import { cn } from "@/lib/utils"

export interface ExerciseShellProps {
  title: string
  /** 0-100 progress */
  progress: number
  /** Remaining seconds */
  timeLeft: number
  /** Total time for urgency calculation */
  totalTime: number
  /** Current level or phase label */
  phaseLabel?: string
  /** Show instructions overlay before starting */
  instructions?: {
    steps: string[]
    onStart: () => void
    buttonLabel?: string
  }
  /** Show a "next" button at the bottom */
  onNext?: () => void
  nextLabel?: string
  children: React.ReactNode
  className?: string
}

export function ExerciseShell({
  title,
  progress,
  timeLeft,
  totalTime,
  phaseLabel,
  instructions,
  onNext,
  nextLabel = "Siguiente",
  children,
  className,
}: ExerciseShellProps) {
  if (instructions) {
    return (
      <main className="min-h-screen flex flex-col bg-bg">
        <Header showBackButton />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-3xl shadow-lg p-8 w-full space-y-6 text-center">
            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>

            <div className="space-y-4 text-left">
              {instructions.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                    {i + 1}
                  </div>
                  <p className="text-base text-gray-600 pt-2 leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <NSButton
              size="lg"
              className="w-full mt-4"
              onClick={instructions.onStart}
            >
              {instructions.buttonLabel ?? "Comenzar"}
            </NSButton>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-bg">
      <Header showBackButton />

      {/* Top bar: progress + timer + phase */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-4 py-3 space-y-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800 truncate">{title}</h2>
            {phaseLabel && (
              <span className="text-sm font-medium text-primary">{phaseLabel}</span>
            )}
          </div>
          <Timer seconds={timeLeft} totalSeconds={totalTime} />
        </div>
        <div className="max-w-4xl mx-auto">
          <ProgressBar value={progress} size="sm" showLabel={false} />
        </div>
      </div>

      {/* Central area */}
      <div
        className={cn(
          "flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-4xl mx-auto w-full",
          className,
        )}
      >
        {children}
      </div>

      {/* Bottom next button */}
      {onNext && (
        <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <NSButton size="lg" className="w-full" onClick={onNext}>
              {nextLabel}
              <svg className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M9 5l7 7-7 7" />
              </svg>
            </NSButton>
          </div>
        </div>
      )}
    </main>
  )
}
