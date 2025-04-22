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
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="flex-1 container max-w-md mx-auto px-4 py-8 flex flex-col justify-center">
        <Card className="border-none shadow-lg">
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

                <div className="flex items-start space-x-3 pt-4">
                  <Checkbox
                    id="terms"
                    checked={accepted}
                    onCheckedChange={(checked) => setAccepted(checked as boolean)}
                    aria-required="true"
                    className="mt-1"
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

              <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-medium">
                Acepto y continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
