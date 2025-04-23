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

type RawTestResult = {
  id: string;
  name: string;
  rawScore: number;
  maxPossibleScore: number;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
};

type TestResult = {
  id: string;
  name: string;
  score: number; // Normalizado a escala 0-100
  maxScore: number; // Siempre 100
  description: string;
  feedback: string;
  icon: React.ReactNode;
  colorClass: string;
};

// Función para normalizar un puntaje a escala 0-100
const normalizeScore = (rawScore: number, maxPossibleScore: number): number => {
  return Math.round((rawScore / maxPossibleScore) * 100);
};

// Función para generar retroalimentación basada en el puntaje normalizado
const generateFeedback = (id: string, score: number): string => {
  if (score >= 90) {
    switch (id) {
      case "stroop":
        return "Excelente capacidad para inhibir respuestas automáticas. Muy buen control atencional.";
      case "lectura":
        return "Fluidez lectora sobresaliente. Lectura clara y bien articulada, con buen ritmo y entonación.";
      case "atencion":
        return "Atención sostenida excelente. Capacidad superior para mantener la concentración durante periodos prolongados.";
      case "memoria":
        return "Memoria de trabajo visual excepcional. Capacidad superior para recordar y manipular información visual.";
      case "observacion":
        return "Atención a detalles visuales excepcional. Procesamiento visual rápido y preciso.";
      default:
        return "Resultados excelentes en esta prueba.";
    }
  } else if (score >= 75) {
    switch (id) {
      case "stroop":
        return "Buena capacidad para inhibir respuestas automáticas en favor de respuestas menos automáticas.";
      case "lectura":
        return "Fluidez lectora adecuada. Buena articulación y ritmo durante la lectura.";
      case "atencion":
        return "Buena atención sostenida. Capacidad adecuada para mantener la concentración durante el tiempo requerido.";
      case "memoria":
        return "Buena memoria de trabajo visual. Capacidad de recordar y manipular información visual adecuada para su edad.";
      case "observacion":
        return "Buena atención a los detalles. Buen procesamiento visual.";
      default:
        return "Buenos resultados en esta prueba.";
    }
  } else if (score >= 50) {
    switch (id) {
      case "stroop":
        return "Capacidad moderada para inhibir respuestas automáticas. Se observan algunas dificultades de control inhibitorio.";
      case "lectura":
        return "Fluidez lectora moderada. Se detectaron algunas pausas y repeticiones durante la lectura.";
      case "atencion":
        return "Atención sostenida en el rango medio. Se observaron distracciones ocasionales.";
      case "memoria":
        return "Memoria de trabajo visual en el rango medio. Algunas dificultades para recordar y manipular información visual.";
      case "observacion":
        return "Atención a detalles visuales moderada. Algunas dificultades con la velocidad de procesamiento visual.";
      default:
        return "Resultados moderados en esta prueba. Podría beneficiarse de algunas estrategias de apoyo.";
    }
  } else {
    switch (id) {
      case "stroop":
        return "Dificultades significativas con el control inhibitorio. Podría beneficiarse de intervención específica.";
      case "lectura":
        return "Dificultades con la fluidez lectora. Se recomienda apoyo específico para mejorar la lectura.";
      case "atencion":
        return "Dificultades para mantener la atención sostenida. Se recomienda estrategias específicas.";
      case "memoria":
        return "Dificultades con la memoria de trabajo visual. Se recomienda apoyo específico.";
      case "observacion":
        return "Dificultades con la atención a detalles visuales. Se recomienda actividades de apoyo.";
      default:
        return "Se observan dificultades en esta área. Se recomienda apoyo específico.";
    }
  }
};

export default function ResultadosPage() {
  const [currentDate, setCurrentDate] = useState('')
  const [totalScore, setTotalScore] = useState(0)
  const [riskLevel, setRiskLevel] = useState<'bajo' | 'moderado' | 'alto'>('bajo')
  const [completedTests, setCompletedTests] = useState<string[]>([])
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([])
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  useEffect(() => {
    // Formatear fecha actual
    const now = new Date()
    setCurrentDate(now.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
    
    // Cargar ejercicios completados
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("completedExercises")
      if (saved) {
        try {
          setCompletedTests(JSON.parse(saved))
        } catch (e) {
          console.error("Error parsing completedExercises:", e)
        }
      }
      
      // Cargar datos del participante si existen
      const participantData = localStorage.getItem("datosParticipante")
      if (participantData) {
        try {
          const data = JSON.parse(participantData)
          setParticipantName(data.nombreNino || "")
        } catch (e) {
          console.error("Error parsing datosParticipante:", e)
        }
      }
    }
  }, [])
  
  // Resultados reales de cada test
  const rawTestResults: RawTestResult[] = [
    {
      id: "stroop",
      name: "Test de Stroop",
      rawScore: 17, // Ejemplo: 17 respuestas correctas de 20
      maxPossibleScore: 20,
      description: "Evalúa la atención selectiva y el control inhibitorio.",
      icon: <Brain className="h-6 w-6" />,
      colorClass: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
    },
    {
      id: "lectura",
      name: "Lectura en voz alta",
      rawScore: 14, // Ejemplo: 14 puntos de 20 posibles en la evaluación
      maxPossibleScore: 20,
      description: "Evalúa la fluidez lectora y comprensión.",
      icon: <BookOpen className="h-6 w-6" />,
      colorClass: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950",
    },
    {
      id: "atencion",
      name: "Juego de Atención Sostenida",
      rawScore: 32, // Ejemplo: 32 aciertos de 50 posibles
      maxPossibleScore: 50,
      description: "Evalúa la capacidad de mantener la atención durante un tiempo prolongado.",
      icon: <Clock className="h-6 w-6" />,
      colorClass: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
    },
    {
      id: "memoria",
      name: "Prueba de Memoria Visual",
      rawScore: 8, // Ejemplo: recordó 8 elementos de 10
      maxPossibleScore: 10,
      description: "Evalúa la memoria de trabajo visual.",
      icon: <Eye className="h-6 w-6" />,
      colorClass: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
    },
    {
      id: "observacion",
      name: "Ejercicio de Observación",
      rawScore: 3, // Ejemplo: 3 respuestas correctas de 5 preguntas
      maxPossibleScore: 5,
      description: "Evalúa la capacidad de atención a detalles visuales.",
      icon: <Camera className="h-6 w-6" />,
      colorClass: "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950",
    },
  ];
  
  // Transformar los resultados brutos a resultados normalizados
  useEffect(() => {
    const normalizedResults = rawTestResults
      .filter(test => completedTests.includes(test.id))
      .map(test => {
        const normalizedScore = normalizeScore(test.rawScore, test.maxPossibleScore);
        return {
          id: test.id,
          name: test.name,
          score: normalizedScore,
          maxScore: 100, // Siempre 100 ahora
          description: test.description,
          feedback: generateFeedback(test.id, normalizedScore),
          icon: test.icon,
          colorClass: test.colorClass
        };
      });
    
    setFilteredResults(normalizedResults);
  }, [completedTests]);
  
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
  
  // Estado para almacenar el nombre del participante
  const [participantName, setParticipantName] = useState<string>("")
  
  // Generar y descargar PDF con los resultados mejorado
  const handleDownloadReport = () => {
    setIsGeneratingPDF(true);
    
    import('jspdf').then(({ default: jsPDF }) => {
      import('html2canvas').then(({ default: html2canvas }) => {
        const reportElement = document.getElementById('report-content');
        if (!reportElement) {
          setIsGeneratingPDF(false);
          return;
        }
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Transformamos el contenido en imagen con mejores opciones de escala
        html2canvas(reportElement, { 
          scale: 1.5, // Reducimos la escala para mejor calidad sin exceso de tamaño
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff", // Aseguramos fondo blanco
          logging: false, // Desactivamos logs para mejor rendimiento
          windowWidth: 1000, // Ancho fijo para evitar distorsiones
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          
          // Definimos constantes de la página
          const pageWidth = 210;  // Ancho A4 en mm
          const pageHeight = 297; // Altura A4 en mm
          
          // Márgenes uniformes
          const margin = 15;
          const contentWidth = pageWidth - 2 * margin;
          
          // Calculamos dimensiones proporcionales
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Determinar si necesitamos dividir en múltiples páginas
          const maxContentHeight = pageHeight - 2 * margin - 15; // 15mm para pie de página
          
          if (imgHeight <= maxContentHeight) {
            // Si la imagen cabe en una sola página, simplemente la agregamos
            pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
          } else {
            // Si la imagen es más grande, la dividimos en varias páginas
            // Estrategia: Crear múltiples imágenes más pequeñas a partir de la original
            
            // Calcular cuántas páginas necesitamos
            const pagesNeeded = Math.ceil(imgHeight / maxContentHeight);
            
            // Para cada página
            for (let i = 0; i < pagesNeeded; i++) {
              if (i > 0) {
                pdf.addPage();
              }
              
              // Crear un nuevo canvas para esta sección
              const sectionCanvas = document.createElement('canvas');
              const ctx = sectionCanvas.getContext('2d');
              
              if (!ctx) continue;
              
              // Calcular qué parte de la imagen original mostrar en esta página
              const sourceY = (i * canvas.height / pagesNeeded);
              const sourceHeight = Math.min(canvas.height / pagesNeeded, canvas.height - sourceY);
              
              // Configurar el nuevo canvas
              sectionCanvas.width = canvas.width;
              sectionCanvas.height = sourceHeight;
              
              // Dibujar la sección correspondiente en el nuevo canvas
              ctx.drawImage(
                canvas, 
                0, sourceY, canvas.width, sourceHeight, // Fuente
                0, 0, canvas.width, sourceHeight        // Destino
              );
              
              // Convertir esta sección a imagen
              const sectionImgData = sectionCanvas.toDataURL('image/png');
              
              // Calcular altura proporcional para esta sección
              const sectionHeight = (sourceHeight * imgWidth) / canvas.width;
              
              // Añadir esta sección al PDF
              pdf.addImage(sectionImgData, 'PNG', margin, margin, imgWidth, sectionHeight);
            }
          }
          
          // Añadir pie de página en la última página
          pdf.setFontSize(10);
          pdf.setTextColor(120, 120, 120);
          const footerY = pageHeight - 10;
          pdf.text("Este informe es orientativo y no constituye un diagnóstico médico.", pageWidth / 2, footerY - 5, { align: 'center' });
          pdf.text("Se recomienda consultar con un profesional para una evaluación completa.", pageWidth / 2, footerY, { align: 'center' });
          
          // Guardar PDF
          pdf.save(`informe-neurospot-${participantName || "participante"}-${new Date().toISOString().slice(0, 10)}.pdf`);
          setIsGeneratingPDF(false);
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
            
            {/* Información del participante */}
            {participantName && (
              <div className="text-md font-medium">
                <span className="text-muted-foreground">Nombre del participante:</span> {participantName}
              </div>
            )}
            
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
                    disabled={isGeneratingPDF}
                  >
                    {isGeneratingPDF ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generando PDF...
                      </span>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" /> Descargar informe
                      </>
                    )}
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
                              <span className="font-bold">{result.score}/100</span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {result.description}
                            </p>
                            
                            <div className="mt-1 text-sm font-medium">
                              {result.feedback}
                            </div>

                            {/* Barra de progreso visual */}
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
                              <div 
                                className="bg-[#3876F4] h-2.5 rounded-full" 
                                style={{ width: `${result.score}%` }}
                              />
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
