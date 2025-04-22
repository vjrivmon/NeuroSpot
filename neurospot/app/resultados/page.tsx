"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label
} from "recharts"
import { 
  Download, 
  Brain, 
  BookOpen, 
  Eye, 
  Clock, 
  Camera,
  AlertTriangle,
  Check,
  Info
} from "lucide-react"
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

type TestResult = {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  description: string;
  feedback: string;
  icon: React.ReactNode;
  colorClass: string;
};

export default function ResultadosPage() {
  const [currentDate, setCurrentDate] = useState('')
  const [totalScore, setTotalScore] = useState(0)
  const [riskLevel, setRiskLevel] = useState<'bajo' | 'moderado' | 'alto'>('bajo')
  const [completedTests, setCompletedTests] = useState<string[]>([])
  
  useEffect(() => {
    // Formatear fecha actual
    const now = new Date()
    setCurrentDate(now.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
    
    // Cargar ejercicios completados (simulado)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("completedExercises")
      if (saved) {
        try {
          setCompletedTests(JSON.parse(saved))
        } catch (e) {
          console.error("Error parsing completedExercises:", e)
        }
      }
    }
    
    // En una implementación real, aquí cargaríamos los resultados desde una API o base de datos
  }, [])
  
  // Resultados simulados para los ejercicios
  // En una implementación real, esto vendría de una API o base de datos
  const testResults: TestResult[] = [
    {
      id: "stroop",
      name: "Test de Stroop",
      score: 85,
      maxScore: 100,
      description: "Evalúa la atención selectiva y el control inhibitorio.",
      feedback: "Buena capacidad para inhibir respuestas automáticas en favor de respuestas menos automáticas.",
      icon: <Brain className="h-6 w-6" />,
      colorClass: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
    },
    {
      id: "lectura",
      name: "Lectura en voz alta",
      score: 70,
      maxScore: 100,
      description: "Evalúa la fluidez lectora y comprensión.",
      feedback: "Fluidez lectora adecuada. Se detectaron algunas pausas y repeticiones durante la lectura.",
      icon: <BookOpen className="h-6 w-6" />,
      colorClass: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950",
    },
    {
      id: "atencion",
      name: "Juego de Atención Sostenida",
      score: 65,
      maxScore: 100,
      description: "Evalúa la capacidad de mantener la atención durante un tiempo prolongado.",
      feedback: "Atención sostenida en el rango medio. Se observaron distracciones ocasionales.",
      icon: <Clock className="h-6 w-6" />,
      colorClass: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
    },
    {
      id: "memoria",
      name: "Prueba de Memoria Visual",
      score: 80,
      maxScore: 100,
      description: "Evalúa la memoria de trabajo visual.",
      feedback: "Buena memoria de trabajo visual. Capacidad de recordar y manipular información visual adecuada para su edad.",
      icon: <Eye className="h-6 w-6" />,
      colorClass: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
    },
    {
      id: "observacion",
      name: "Ejercicio de Observación",
      score: 75,
      maxScore: 100,
      description: "Evalúa la capacidad de atención a detalles visuales.",
      feedback: "Buena atención a los detalles. Algunas dificultades con la velocidad de procesamiento visual.",
      icon: <Camera className="h-6 w-6" />,
      colorClass: "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950",
    },
  ];
  
  // Filtrar solo las pruebas completadas
  const filteredResults = testResults.filter(test => 
    completedTests.includes(test.id)
  );
  
  // Calcular puntuación total y nivel de riesgo
  useEffect(() => {
    if (filteredResults.length > 0) {
      const avgScore = filteredResults.reduce((acc, curr) => acc + curr.score, 0) / filteredResults.length;
      setTotalScore(Math.round(avgScore));
      
      if (avgScore >= 80) {
        setRiskLevel('bajo');
      } else if (avgScore >= 60) {
        setRiskLevel('moderado');
      } else {
        setRiskLevel('alto');
      }
    }
  }, [filteredResults]);
  
  // Datos para el gráfico
  const chartData = filteredResults.map(result => ({
    name: result.name,
    puntuación: result.score,
    promedio: 75, // Promedio ficticio para comparación
  }));
  
  // Generar y descargar PDF con los resultados
  const handleDownloadReport = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      import('html2canvas').then(({ default: html2canvas }) => {
        const reportElement = document.getElementById('report-content');
        if (!reportElement) return;
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        html2canvas(reportElement).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210; // A4 width en mm
          const imgHeight = canvas.height * imgWidth / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          pdf.save(`informe-neurospot-${new Date().toISOString().slice(0, 10)}.pdf`);
        });
      });
    });
  };
  
  // Determinar el color del riesgo
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'bajo': return 'text-green-600 dark:text-green-400';
      case 'moderado': return 'text-amber-600 dark:text-amber-400';
      case 'alto': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };
  
  // Determinar el icono del riesgo
  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'bajo': return <Check className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'moderado': return <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'alto': return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default: return null;
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="container max-w-full mx-auto px-4 py-6 flex-1">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 max-w-7xl mx-auto">
          <div className="w-full lg:w-2/3 space-y-6" id="report-content">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Resultados de la evaluación</h1>
              <span className="text-sm text-muted-foreground">{currentDate}</span>
            </div>
            
            {/* Resumen */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de resultados</CardTitle>
                <CardDescription>
                  {completedTests.length === 0 
                    ? "No has completado ninguna prueba todavía"
                    : `Has completado ${completedTests.length} de 5 pruebas`}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {completedTests.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">Puntuación global</h3>
                        <p className="text-sm text-muted-foreground">Basado en todas las pruebas realizadas</p>
                      </div>
                      <div className="text-3xl font-bold">{totalScore}/100</div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2">
                        {getRiskIcon()}
                        <div>
                          <h4 className="font-medium">Nivel de riesgo</h4>
                          <p className={`text-sm font-medium ${getRiskColor()}`}>
                            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                          </p>
                        </div>
                      </div>
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Este indicador muestra una estimación del riesgo de presencia de TDAH basado en las pruebas 
                              realizadas. No es un diagnóstico definitivo y siempre debe consultarse con un profesional.
                            </p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </div>
                    
                    {/* Gráfico de resultados */}
                    {filteredResults.length > 0 && (
                      <div className="h-72 mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={70}
                            />
                            <YAxis 
                              domain={[0, 100]}
                              ticks={[0, 25, 50, 75, 100]}
                            >
                              <Label
                                value="Puntuación"
                                position="insideLeft"
                                angle={-90}
                                style={{ textAnchor: 'middle' }}
                              />
                            </YAxis>
                            <Tooltip />
                            <Bar dataKey="puntuación" name="Tu puntuación">
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#3876F4" />
                              ))}
                            </Bar>
                            <Bar dataKey="promedio" name="Promedio" fill="#94a3b8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      Completa al menos una prueba para ver tus resultados
                    </p>
                  </div>
                )}
              </CardContent>
              
              {filteredResults.length > 0 && (
                <CardFooter>
                  <Button 
                    className="w-full bg-[#3876F4] hover:bg-[#3876F4]/90 text-white" 
                    onClick={handleDownloadReport}
                  >
                    <Download className="mr-2 h-4 w-4" /> Descargar informe
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            {/* Gráfico y resultados detallados */}
            {filteredResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultados detallados</CardTitle>
                  <CardDescription>
                    Análisis individual de cada prueba realizada
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {filteredResults.map((result) => (
                      <div 
                        key={result.id}
                        className={`p-4 rounded-lg border ${result.colorClass}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-full bg-white dark:bg-gray-800">
                            {result.icon}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{result.name}</h3>
                              <span className="font-bold">{result.score}/{result.maxScore}</span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {result.description}
                            </p>
                            
                            <div className="mt-1 text-sm font-medium">
                              {result.feedback}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar con recomendaciones */}
          <div className="w-full lg:w-1/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Próximos pasos</CardTitle>
                <CardDescription>
                  Recomendaciones basadas en tus resultados
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Recuerda que estos resultados son orientativos y no constituyen un diagnóstico médico. 
                  Si los resultados indican un riesgo moderado o alto de TDAH, te recomendamos:
                </p>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-[#3876F4]/10 p-1 mt-0.5">
                      <Check className="h-3 w-3 text-[#3876F4]" />
                    </div>
                    <span>Consultar con un psicólogo o psiquiatra infantil especializado en TDAH</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-[#3876F4]/10 p-1 mt-0.5">
                      <Check className="h-3 w-3 text-[#3876F4]" />
                    </div>
                    <span>Hablar con el centro educativo para establecer estrategias de apoyo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-[#3876F4]/10 p-1 mt-0.5">
                      <Check className="h-3 w-3 text-[#3876F4]" />
                    </div>
                    <span>Establecer rutinas claras en casa que ayuden a la organización</span>
                  </li>
                </ul>
                
                <div className="mt-4 p-3 rounded-lg bg-[#3876F4]/5 border border-[#3876F4]/20">
                  <h4 className="font-medium text-[#3876F4] mb-1">Seguimiento y apoyo</h4>
                  <p className="text-sm">
                    Puedes repetir estas pruebas en 3 meses para evaluar la evolución. 
                    Recuerda que el apoyo familiar es fundamental en el proceso.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recursos adicionales</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Lecturas recomendadas</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-muted p-1 mt-0.5">
                        <BookOpen className="h-3 w-3" />
                      </div>
                      <span>"El cerebro del niño" - Daniel J. Siegel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-muted p-1 mt-0.5">
                        <BookOpen className="h-3 w-3" />
                      </div>
                      <span>"Entender el TDAH" - Isabel Orjales</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Asociaciones de apoyo</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-muted p-1 mt-0.5">
                        <Info className="h-3 w-3" />
                      </div>
                      <span>FEAADAH - Federación Española de Asociaciones de TDAH</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
