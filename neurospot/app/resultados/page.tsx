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
  const [testResults, setTestResults] = useState<TestResult[]>([])
  
  useEffect(() => {
    // Formatear fecha actual
    const now = new Date()
    setCurrentDate(now.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
    
    // Cargar ejercicios completados desde localStorage
    if (typeof window !== 'undefined') {
      // Cargar ejercicios completados
      const saved = localStorage.getItem("completedExercises")
      if (saved) {
        try {
          setCompletedTests(JSON.parse(saved))
        } catch (e) {
          console.error("Error parsing completedExercises:", e)
        }
      }
      
      // Cargar resultados de pruebas desde localStorage
      const savedResultsData = localStorage.getItem("testResultsData")
      if (savedResultsData) {
        try {
          const loadedResults = JSON.parse(savedResultsData);
          // Asegurar que cada resultado tiene el icono y colorClass necesarios
          const formattedResults = loadedResults.map((result: any) => {
            // Asignar icono según el ID
            let icon;
            let colorClass;
            
            switch (result.id) {
              case "stroop":
                icon = <Brain className="h-6 w-6" />;
                colorClass = "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950";
                break;
              case "lectura":
                icon = <BookOpen className="h-6 w-6" />;
                colorClass = "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950";
                break;
              case "atencion":
                icon = <Clock className="h-6 w-6" />;
                colorClass = "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950";
                break;
              case "memoria":
                icon = <Eye className="h-6 w-6" />;
                colorClass = "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950";
                break;
              case "observacion":
                icon = <Eye className="h-6 w-6" />;
                colorClass = "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950";
                break;
              case "video":
                icon = <Camera className="h-6 w-6" />;
                colorClass = "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950";
                break;
              default:
                icon = <Info className="h-6 w-6" />;
                colorClass = "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950";
            }
            
            return {
              ...result,
              icon,
              colorClass
            };
          });
          
          setTestResults(formattedResults);
        } catch (e) {
          console.error("Error parsing testResultsData:", e);
          // Si hay error, usar datos de respaldo
          setTestResults(defaultTestResults.filter(test => completedTests.includes(test.id)));
        }
      } else {
        // Si no hay datos guardados, filtrar los datos por defecto según las pruebas completadas
        setTestResults(defaultTestResults.filter(test => completedTests.includes(test.id)));
      }
    }
  }, [])
  
  // Datos predeterminados para pruebas (sólo se usarán si no hay datos en localStorage)
  const defaultTestResults: TestResult[] = [
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
    {
      id: "video",
      name: "Análisis de Comportamiento por Video",
      score: 78,
      maxScore: 100,
      description: "Evalúa las expresiones faciales, contacto visual y seguimiento de instrucciones.",
      feedback: "Buen seguimiento de instrucciones. Movimientos faciales adecuados con algunas inconsistencias menores.",
      icon: <Camera className="h-6 w-6" />,
      colorClass: "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950",
    }
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
        
        // Crear una versión optimizada para PDF
        const pdfContainer = document.createElement('div');
        pdfContainer.style.width = '800px';
        pdfContainer.style.padding = '40px';
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.left = '-9999px';
        pdfContainer.style.backgroundColor = 'white';
        
        // Crear contenido personalizado para el PDF
        let testsHtml = '';
        filteredResults.forEach(test => {
          testsHtml += `
            <div style="margin-bottom: 25px; padding: 15px; border-radius: 8px; background-color: #f5f8ff; border: 1px solid #e2e8f0;">
              <h3 style="color: #3876F4; margin-top: 0; margin-bottom: 10px;">${test.name}</h3>
              <p style="margin-bottom: 8px;"><strong>Puntuación:</strong> ${test.score}/${test.maxScore}</p>
              <p style="margin-bottom: 8px;"><strong>Descripción:</strong> ${test.description}</p>
              <p style="margin-bottom: 0;"><strong>Observaciones:</strong> ${test.feedback}</p>
            </div>
          `;
        });
        
        // Obtener recomendaciones según el nivel de riesgo
        let recomendaciones = '';
        if (riskLevel === 'bajo') {
          recomendaciones = `
            <li>Continuar con las actividades actuales.</li>
            <li>Realizar evaluaciones periódicas cada 6 meses para monitorear el progreso.</li>
            <li>Mantener una rutina de ejercicios cognitivos regulares.</li>
          `;
        } else if (riskLevel === 'moderado') {
          recomendaciones = `
            <li>Establecer un programa regular de ejercicios de atención y concentración.</li>
            <li>Considerar la realización de evaluaciones más frecuentes (cada 3 meses).</li>
            <li>Implementar estrategias de organización y planificación en actividades diarias.</li>
          `;
        } else {
          recomendaciones = `
            <li>Consultar con un especialista en neuropsicología o psicopedagogía.</li>
            <li>Diseñar un plan de intervención personalizado.</li>
            <li>Realizar evaluaciones mensuales para monitorear avances.</li>
            <li>Considerar adaptaciones específicas en entornos de aprendizaje.</li>
          `;
        }
        
        // Añadir contenido al contenedor del PDF
        pdfContainer.innerHTML = `
          <div style="font-family: Arial, sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
              <h1 style="color: #3876F4; margin: 0;">Informe de Evaluación NeuroSpot</h1>
              <p style="margin: 0;">${currentDate}</p>
            </div>
            
            <div style="margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h2 style="color: #333; margin-top: 0; margin-bottom: 15px;">Resumen de Resultados</h2>
              <p style="margin-bottom: 10px;"><strong>Número de pruebas completadas:</strong> ${filteredResults.length}</p>
              <p style="margin-bottom: 10px;"><strong>Puntuación global:</strong> ${totalScore}/100</p>
              <p style="margin-bottom: 0;"><strong>Nivel de riesgo:</strong> <span style="color: ${
                riskLevel === 'bajo' ? '#16a34a' : riskLevel === 'moderado' ? '#d97706' : '#dc2626'
              };">${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}</span></p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Resultados Detallados</h2>
            ${testsHtml}
            
            <h2 style="color: #333; margin-bottom: 15px;">Recomendaciones</h2>
            <ul>
              ${recomendaciones}
            </ul>
            
            <div style="margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p style="color: #666; font-size: 0.9em;">Este informe ha sido generado automáticamente por la plataforma NeuroSpot el ${currentDate}.</p>
              <p style="color: #666; font-size: 0.9em;">Los resultados deben ser interpretados por un profesional calificado.</p>
            </div>
          </div>
        `;
        
        document.body.appendChild(pdfContainer);
        
        html2canvas(pdfContainer).then(canvas => {
          document.body.removeChild(pdfContainer);
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
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
