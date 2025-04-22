import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Header } from "@/components/header"
import { ArrowRight, BarChart3, Brain } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 container max-w-xl mx-auto px-4 py-8 flex flex-col justify-center">
        <Card className="border-none shadow-lg overflow-hidden rounded-xl">
          <div className="bg-white-50 flex justify-center">
            <Brain className="h-16 w-16 text-primary" />
          </div>
          
          <CardContent className="p-6 pt-6">
            <div className="space-y-6 text-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Bienvenid@ a NeuroSpot</h1>
                <p className="text-muted-foreground text-base">
                  Evaluación interactiva para detectar posibles indicadores de TDAH en niños, mediante juegos cognitivos
                  breves.
                </p>
              </div>

              <div className="pt-4 space-y-4">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-base rounded-lg shadow-md transition-all" asChild>
                  <Link href="/consentimiento">
                    Comenzar Evaluación
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                <Button variant="outline" size="lg" className="w-full border-muted-foreground/20 py-6 text-base" asChild>
                  <Link href="/resultados">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Ver resultados anteriores
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
