"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ExerciseCardProps {
  title: string
  description: string
  icon: React.ReactNode
  color?: string
  completed?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export function ExerciseCard({
  title,
  description,
  icon,
  color = "bg-primary",
  completed = false,
  disabled = false,
  onClick,
  className,
}: ExerciseCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-center gap-3 rounded-3xl bg-white p-6",
        "border-2 border-transparent shadow-md",
        "transition-all duration-200 ease-in-out",
        "min-h-[180px] w-full text-center",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        !disabled && "hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 active:scale-[0.98] cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        completed && "ring-2 ring-success",
        className,
      )}
    >
      {completed && (
        <span className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white text-xs font-bold">
          ✓
        </span>
      )}

      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl text-white text-3xl",
          "transition-transform duration-200 group-hover:scale-110",
          color,
        )}
      >
        {icon}
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-gray-800 leading-tight">{title}</h3>
        <p className="text-sm text-gray-500 leading-snug line-clamp-2">{description}</p>
      </div>
    </button>
  )
}
