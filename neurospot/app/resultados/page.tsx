import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, AlertTriangle } from "lucide-react"
import { ResultCard } from "@/components/result-card"

export default function ResultadosPage() {
  const results = [
    {
      id: "stroop",
      title: "Test de Stroop",
      score: 85,
      status: "success", // success, warning, danger
    },
    {
      id: "atencion",
      title: "Juego de Atención Sostenida",
      score: 65,
      status: "warning",
    },
    {
      id: "lectura",
      title: "Lectura en voz alta",
      score: 92,
      status: "success",
    },
    {
      id: "memoria",
      title: "Prueba de Memoria Visual",
      score: 45,
      status: "danger",
    },
    {
      id: "observacion",
      title: "Ejercicio de Observación",
      score: 78,
      status: "success",
    },
  ]

  return (
    <main className="min-h-screen flex flex-col pb-8">
      <Header showBackButton />

      <div className="container max-w-md mx-auto px-4 py-6">
        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Resultados de la Evaluación</CardTitle>
            <CardDescription>Completado el 22 de abril de 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                ¡Has completado la evaluación! A continuación se muestran los resultados de los ejercicios realizados.
              </p>

              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Descargar informe PDF
              </Button>

              <Alert className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Estos resultados son orientativos y no constituyen un diagnóstico clínico. Consulte con un profesional
                  de la salud para una evaluación completa.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold mb-4">Resumen por ejercicio</h2>

        <div className="space-y-4">
          {results.map((result) => (
            <ResultCard key={result.id} title={result.title} score={result.score} status={result.status} />
          ))}
        </div>
      </div>
    </main>
  )
}
