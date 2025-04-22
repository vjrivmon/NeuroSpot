import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ResultCardProps {
  title: string
  score: number
  status: "success" | "warning" | "danger"
}

export function ResultCard({ title, score, status }: ResultCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "bg-green-500"
      case "warning":
        return "bg-amber-500"
      case "danger":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "success":
        return "Normal"
      case "warning":
        return "A observar"
      case "danger":
        return "Posible indicador"
      default:
        return "Sin datos"
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">{title}</h3>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2`}></div>
            <span className="text-sm text-muted-foreground">{getStatusText()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={score} className="h-2" indicatorClassName={getStatusColor()} />
          <div className="text-right text-sm font-medium">{score}%</div>
        </div>
      </CardContent>
    </Card>
  )
}
