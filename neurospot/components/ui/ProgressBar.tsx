"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressBarProps {
  value: number // 0-100
  max?: number
  color?: "primary" | "success" | "warning" | "danger"
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const colorMap = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-red-500",
} as const

const sizeMap = {
  sm: "h-2",
  md: "h-4",
  lg: "h-6",
} as const

export function ProgressBar({
  value,
  max = 100,
  color = "primary",
  showLabel = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  // Auto-color based on progress
  const autoColor =
    color === "primary"
      ? pct >= 75
        ? "bg-success"
        : pct >= 40
          ? "bg-warning"
          : "bg-primary"
      : colorMap[color]

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-sm font-medium text-gray-600">
          <span>Progreso</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-gray-200",
          sizeMap[size],
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            autoColor,
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}
