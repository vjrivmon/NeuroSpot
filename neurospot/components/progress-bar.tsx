"use client"

import { useEffect, useState } from "react"

export function ProgressBar() {
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  
  // Total de ejercicios en la aplicación
  const TOTAL_EXERCISES = 6
  
  // Cargar los ejercicios completados desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadCompletedExercises = () => {
        try {
          const saved = localStorage.getItem("completedExercises")
          if (saved) {
            const exercises = JSON.parse(saved)
            setCompletedExercises(exercises)
            
            // Calcular progreso
            const uniqueExercises = new Set(exercises)
            const progressValue = Math.min(100, Math.round((uniqueExercises.size / TOTAL_EXERCISES) * 100))
            setProgress(progressValue)
          }
        } catch (e) {
          console.error("Error loading completed exercises:", e)
        }
      }
      
      // Cargar ejercicios al inicio
      loadCompletedExercises()
      
      // Configurar listener para cambios en localStorage
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "completedExercises") {
          loadCompletedExercises()
        }
      }
      
      window.addEventListener('storage', handleStorageChange)
      
      return () => {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [])
  
  return (
    <div className="container max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Tu progreso</h3>
        <span className="text-xs text-blue-600 dark:text-blue-300">{progress}% completado</span>
      </div>
      <div className="w-full bg-white dark:bg-gray-800 rounded-full h-2.5">
        <div 
          className="bg-[#3876F4] h-2.5 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
} 