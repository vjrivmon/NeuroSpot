"use client"

import { useState, useEffect } from "react"
import { userService, exerciseResultService, sessionService, reportService } from "@/lib/dynamo-service"
import { useAuth } from "./use-auth"

// Hook personalizado para usar los servicios de DynamoDB
export function useDynamo() {
  const { isLoggedIn } = useAuth()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Obtener el ID del usuario (email) del localStorage al iniciar
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoggedIn) {
      const email = localStorage.getItem("userEmail")
      setUserId(email)
    }
    setIsLoading(false)
  }, [isLoggedIn])
  
  // Iniciar sesión en DynamoDB
  const startDynamoSession = async () => {
    if (!userId) return { success: false, error: "Usuario no autenticado" }
    try {
      return await sessionService.startSession(userId)
    } catch (error) {
      console.error("Error al iniciar sesión en DynamoDB:", error)
      return { success: false, error }
    }
  }
  
  // Finalizar sesión en DynamoDB
  const endDynamoSession = async () => {
    if (!userId) return { success: false, error: "Usuario no autenticado" }
    try {
      return await sessionService.endSession(userId)
    } catch (error) {
      console.error("Error al finalizar sesión en DynamoDB:", error)
      return { success: false, error }
    }
  }
  
  // Guardar resultados de un ejercicio
  const saveExerciseResult = async (exerciseData: any) => {
    if (!userId) return { success: false, error: "Usuario no autenticado" }
    try {
      return await exerciseResultService.saveExerciseResult(userId, exerciseData)
    } catch (error) {
      console.error("Error al guardar resultados del ejercicio:", error)
      return { success: false, error }
    }
  }
  
  // Obtener resultados de ejercicios por tipo
  const getExerciseResults = async (tipo?: string) => {
    if (!userId) return []
    try {
      if (tipo) {
        return await exerciseResultService.getExerciseResultsByType(userId, tipo)
      } else {
        return await exerciseResultService.getExerciseResultsByUser(userId)
      }
    } catch (error) {
      console.error("Error al obtener resultados de ejercicios:", error)
      return []
    }
  }
  
  // Obtener datos del perfil del usuario
  const getUserProfile = async () => {
    if (!userId) return null
    try {
      return await userService.getUserById(userId)
    } catch (error) {
      console.error("Error al obtener perfil de usuario:", error)
      return null
    }
  }
  
  // Actualizar datos del perfil del usuario
  const updateUserProfile = async (userData: any) => {
    if (!userId) return { success: false, error: "Usuario no autenticado" }
    try {
      return await userService.updateUser(userId, userData)
    } catch (error) {
      console.error("Error al actualizar perfil de usuario:", error)
      return { success: false, error }
    }
  }
  
  // Generar informe completo
  const generateReport = async () => {
    if (!userId) return null
    try {
      return await reportService.generateUserReport(userId)
    } catch (error) {
      console.error("Error al generar informe:", error)
      return null
    }
  }
  
  return {
    isLoading,
    userId,
    startDynamoSession,
    endDynamoSession,
    saveExerciseResult,
    getExerciseResults,
    getUserProfile,
    updateUserProfile,
    generateReport
  }
} 