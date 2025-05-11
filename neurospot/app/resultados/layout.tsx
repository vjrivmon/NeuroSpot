"use client"

import React, { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import { useDynamo } from "@/hooks/use-dynamo"

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoggedIn, isLoading } = useAuth()
  const dynamoDB = useDynamo()

  // Script para asegurarse de que el localStorage esté actualizado
  useEffect(() => {
    if (typeof window !== 'undefined' && dynamoDB.userId) {
      // Función para actualizar localStorage si es necesario
      const updateLocalStorageFromDB = async () => {
        try {
          console.log("Verificando y actualizando completedExercises...");
          
          // Obtener resultados de ejercicios desde DynamoDB
          const allResults = await dynamoDB.getExerciseResults();
          
          if (!allResults || allResults.length === 0) {
            console.log("No hay resultados disponibles en DynamoDB");
            return;
          }
          
          // Obtener todos los tipos de ejercicios completados
          const completedTypes = new Set<string>();
          allResults.forEach((result: any) => {
            completedTypes.add(result.tipo);
          });
          
          // Actualizar localStorage
          const completedExercises = Array.from(completedTypes);
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises));
          
          console.log("localStorage actualizado con ejercicios completados:", completedExercises);
        } catch (error) {
          console.error("Error al actualizar localStorage:", error);
        }
      };
      
      // Ejecutar la actualización
      updateLocalStorageFromDB();
    }
  }, [dynamoDB.userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <>
      {children}
    </>
  )
} 