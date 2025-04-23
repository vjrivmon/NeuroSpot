"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function ConsentimientoPage() {
  const [accepted, setAccepted] = useState(false)
  const [showError, setShowError] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (accepted) {
      router.push("/panel")
    } else {
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
    }
  }

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden">
      <Header showBackButton />

      <div className="flex-1 w-full px-4 py-8 flex flex-col justify-center">
        <div className="w-full max-w-4xl mx-auto p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm dark:bg-yellow-900/20 dark:border-yellow-800">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">¿Cómo funciona?</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Completa todas las pruebas en orden. Cada prueba te ayudará a evaluar diferentes aspectos de tu atención.
            Al terminar todas las pruebas, podrás ver tus resultados y descargarlos.
          </p>
        </div>
        
        <Card className="border-none shadow-lg w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Consentimiento Legal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  Como tutor legal, autorizo el uso de esta aplicación para evaluar posibles indicadores de TDAH en el
                  niño bajo mi tutela.
                </p>
                <p>
                  Entiendo que los datos recopilados serán utilizados únicamente con fines de evaluación y que los
                  resultados no constituyen un diagnóstico clínico oficial.
                </p>
                <p>
                  La información será tratada con confidencialidad según la normativa vigente de protección de datos.
                </p>

                <div className="flex items-center space-x-3 pt-4">
                  <Checkbox
                    id="terms"
                    checked={accepted}
                    onCheckedChange={(checked) => setAccepted(checked as boolean)}
                    aria-required="true"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Acepto los términos y condiciones como tutor legal del menor
                  </label>
                </div>
              </div>

              {showError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Debes aceptar los términos para continuar</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                disabled={!accepted}
              >
                Acepto y continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
