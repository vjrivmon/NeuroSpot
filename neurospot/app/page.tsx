import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Header } from "@/components/header"
import { ArrowRight, BarChart3 } from "lucide-react"
import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 container max-w-xl mx-auto px-4 py-8 flex flex-col justify-center">
        <Card className="border-none shadow-lg overflow-hidden rounded-xl">
          <div className="bg-white flex justify-center items-center py-8">
            <div className="relative" style={{ width: "65px", height: "65px" }}>
              <Image 
                src="/logo.svg" 
                alt="NeuroSpot Logo" 
                width={65}
                height={65}
                priority
              />
            </div>
          </div>
          
          <CardContent className="p-6 pt-4">
            <div className="space-y-6 text-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Bienvenid@ a NeuroSpot</h1>
                <p className="text-muted-foreground text-base">
                  Evaluación interactiva para detectar posibles indicadores de TDAH en niños, mediante juegos cognitivos
                  breves.
                </p>
              </div>

              <div className="pt-4 space-y-4">
                <Button size="lg" className="w-full shadow-md" asChild>
                  <Link href="/registro">
                    Comenzar Evaluación
                    <ArrowRight className="ml-1" />
                  </Link>
                </Button>

                <Button variant="outline" size="lg" className="w-full" asChild>
                  <Link href="/resultados">
                    <BarChart3 className="mr-1" />
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
