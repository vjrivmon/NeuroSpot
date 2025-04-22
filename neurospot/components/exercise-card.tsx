import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

interface ExerciseCardProps {
  id: string
  title: string
  description: string
  icon: ReactNode
  time: string
  color: string
  iconColor: string
}

export function ExerciseCard({ id, title, description, icon, time, color, iconColor }: ExerciseCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="flex">
        <div className={`${color} ${iconColor} p-4 flex items-center justify-center`}>
          <div className="w-12 h-12 flex items-center justify-center">{icon}</div>
        </div>

        <div className="flex-1">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs line-clamp-2">{description}</CardDescription>
          </CardHeader>

          <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{time}</span>
            </div>

            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" asChild>
              <Link href={`/ejercicio/${id}`}>Jugar</Link>
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  )
}
