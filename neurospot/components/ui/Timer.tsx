"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TimerProps {
  seconds: number
  totalSeconds?: number
  className?: string
}

export function Timer({ seconds, totalSeconds, className }: TimerProps) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}s`

  // Urgency levels
  const isUrgent = totalSeconds ? seconds <= totalSeconds * 0.15 : seconds <= 5
  const isWarning = totalSeconds ? seconds <= totalSeconds * 0.3 : seconds <= 15

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-mono",
        "transition-colors duration-300",
        isUrgent
          ? "bg-red-100 text-red-600 animate-pulse"
          : isWarning
            ? "bg-amber-100 text-amber-700"
            : "bg-surface text-gray-700",
        className,
      )}
    >
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span className="text-3xl font-bold tabular-nums leading-none">
        {display}
      </span>
    </div>
  )
}
