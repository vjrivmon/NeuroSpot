"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PauseCircle, ArrowRight } from "lucide-react"
import Image from "next/image"
import { useMediaQuery } from "@/hooks/use-media-query"

// Definición de tipos para las preguntas
type Question = {
  image: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function ObservacionPage() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  // Función para obtener la ruta de imagen correcta según el tamaño de pantalla
  const getImagePath = (index: number) => {
    return isMobile 
      ? `/ejercicios/observacion/mobile/imagen${index}.jpg` 
      : `/ejercicios/observacion/imagen${index}.jpg`
  }
  
  // Preguntas para el ejercicio de observación
  const questions: Question[] = [
    {
      image: getImagePath(1),
      question: "¿Cuántos objetos circulares hay en la imagen?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 2
    },
    {
      image: getImagePath(2),
      question: "¿Qué color predomina en la esquina superior derecha?",
      options: ["Azul", "Verde", "Rojo", "Amarillo"],
      correctAnswer: 0
    },
    {
      image: getImagePath(3),
      question: "¿Cuántas personas aparecen en la imagen?",
      options: ["Ninguna", "1", "2", "3 o más"],
      correctAnswer: 2
    },
    {
      image: getImagePath(4),
      question: "¿Qué elemento está fuera de lugar en esta imagen?",
      options: ["El reloj", "El libro", "La planta", "El vaso"],
      correctAnswer: 3
    },
    {
      image: getImagePath(5),
      question: "¿Cuántos elementos de color rojo hay en la imagen?",
      options: ["Ninguno", "1", "2", "3"],
      correctAnswer: 2
    }
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30) // 30 segundos por pregunta
  const [progress, setProgress] = useState(0)
  const [score, setScore] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [completed, setCompleted] = useState(false)
  const router = useRouter()

  // Temporizador para cada pregunta
  useEffect(() => {
    if (showAnswer || completed) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // Si el tiempo se acaba y no ha seleccionado respuesta, mostrar la respuesta correcta
          if (selectedOption === null) {
            setShowAnswer(true)
          }
          return 0
        }
        setProgress(prev => {
          const newProgress = 100 - ((prev - 1) / 30) * 100
          return newProgress > 100 ? 100 : newProgress
        })
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showAnswer, selectedOption, completed])

  // Manejar la selección de una opción
  const handleOptionSelect = (optionIndex: number) => {
    if (showAnswer || selectedOption !== null) return
    
    setSelectedOption(optionIndex)
    setShowAnswer(true)
    
    // Sumar punto si la respuesta es correcta
    if (optionIndex === questions[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 1)
    }
  }

  // Pasar a la siguiente pregunta
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedOption(null)
      setShowAnswer(false)
      setTimeLeft(30)
      setProgress(0)
    } else {
      // Ha terminado todas las preguntas
      setCompleted(true)
    }
  }

  // Completar el ejercicio y pasar a resultados
  const completeExercise = () => {
    // Guardar este ejercicio como completado en localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem("completedExercises") 
        let completedExercises = saved ? JSON.parse(saved) : []
        
        if (!completedExercises.includes("observacion")) {
          completedExercises.push("observacion")
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
        }
        
        // Guardar el resultado del ejercicio en testResultsData
        const observacionResult = {
          id: "observacion",
          name: "Ejercicio de Observación",
          score: score,  // Puntuación obtenida en el ejercicio
          maxScore: 100,
          description: "Evalúa la capacidad de atención a detalles visuales.",
          feedback: `Has acertado ${score} de ${questions.length} preguntas. ${
            score >= 4 ? "Excelente atención al detalle visual." : 
            score >= 2 ? "Buena atención al detalle con algunas dificultades." : 
            "Se recomienda practicar ejercicios de atención visual."
          }`,
          date: new Date().toISOString()
        };
        
        // Actualizar testResultsData
        try {
          const savedResultsData = localStorage.getItem("testResultsData");
          let resultsData = savedResultsData ? JSON.parse(savedResultsData) : [];
          
          // Buscar si ya existe un resultado para este test
          const existingIndex = resultsData.findIndex((test: any) => test.id === "observacion");
          
          if (existingIndex >= 0) {
            // Actualizar el resultado existente
            resultsData[existingIndex] = observacionResult;
          } else {
            // Añadir el nuevo resultado
            resultsData.push(observacionResult);
          }
          
          // Guardar los resultados actualizados
          localStorage.setItem("testResultsData", JSON.stringify(resultsData));
        } catch (e) {
          console.error("Error updating testResultsData:", e);
        }
      } catch (e) {
        console.error("Error updating completedExercises:", e)
      }
    }
    
    router.push("/ejercicio/video")
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="container max-w-full mx-auto px-0 md:px-4 py-8 flex-1 flex flex-col">
        <Card className="border-none shadow-lg flex-1 flex flex-col w-full mx-auto">
          <CardHeader className="pb-4 border-b px-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Ejercicio de Observación</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDialog(true)} aria-label="Pausar ejercicio">
                <PauseCircle className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tiempo: {timeLeft}s</span>
              <span>
                Puntuación: {score}/{questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="p-4 md:p-6 flex flex-col items-center justify-center w-full">
            {!completed ? (
              <>
                <div className="space-y-6 text-center w-full">
                  {/* Contenedor de la imagen con altura fija pero ancho adaptable */}
                  <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 bg-white rounded-lg overflow-hidden mx-auto max-w-5xl">
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <span>Cargando imagen...</span>
                    </div>
                    <Image 
                      src={questions[currentQuestionIndex].image} 
                      alt={`Imagen para observación ${currentQuestionIndex + 1}`}
                      fill
                      style={{ 
                        objectFit: "contain", 
                        backgroundColor: "white" 
                      }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                      priority
                    />
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg max-w-4xl mx-auto w-full">
                    <p className="text-base font-medium">
                      {questions[currentQuestionIndex].question}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto w-full">
                    {questions[currentQuestionIndex].options.map((option, index) => (
                      <Button
                        key={index}
                        className={`h-12 justify-start px-4 ${
                          showAnswer 
                            ? index === questions[currentQuestionIndex].correctAnswer 
                              ? "bg-green-500 hover:bg-green-500 text-white" 
                              : selectedOption === index 
                                ? "bg-red-500 hover:bg-red-500 text-white" 
                                : "bg-muted hover:bg-muted text-muted-foreground"
                            : "bg-[#3876F4] hover:bg-[#3876F4]/90 text-white"
                        }`}
                        onClick={() => handleOptionSelect(index)}
                        disabled={showAnswer}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>

                {showAnswer && (
                  <Button 
                    className="w-full max-w-4xl h-14 text-white font-medium mt-6 bg-[#3876F4] hover:bg-[#3876F4]/90"
                    onClick={handleNextQuestion}
                  >
                    {currentQuestionIndex < questions.length - 1 ? "Siguiente pregunta" : "Ver resultados"}
                  </Button>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center space-y-6 w-full">
                <div className="text-center max-w-4xl w-full">
                  <h2 className="text-2xl font-bold mb-3">¡Ejercicio completado!</h2>
                  <p className="text-muted-foreground mb-6">
                    Has respondido correctamente {score} de {questions.length} preguntas.
                  </p>
                  
                  <Button 
                    className="w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                    onClick={completeExercise}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" /> Siguiente ejercicio
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deseas abandonar el ejercicio?</AlertDialogTitle>
            <AlertDialogDescription>Si abandonas ahora, perderás el progreso actual.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar ejercicio</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/panel")}>Abandonar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
} 