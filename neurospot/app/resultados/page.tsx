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
import { useDynamo } from "@/hooks/use-dynamo"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

// Este tipo se mantiene para compatibilidad, pero no se usa actualmente
// type RawTestResult = {
//   id: string;
//   name: string;
//   rawScore: number;
//   maxPossibleScore: number;
//   description: string;
//   icon: React.ReactNode;
//   colorClass: string;
// };

type TestResult = {
  id: string;
  tipo?: string; // Mantener el tipo original para agrupar resultados
  name: string;
  score: number; // Normalizado a escala 0-100
  maxScore: number; // Siempre 100
  description: string;
  feedback: string;
  icon: React.ReactNode;
  colorClass: string;
  rawScore?: number; // Opcional para compatibilidad con datos antiguos
  maxPossibleScore?: number; // Opcional para compatibilidad con datos antiguos
  timestamp?: string; // Para ordenar resultados
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
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([])
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const dynamoDB = useDynamo()
  
  // Obtener datos de DynamoDB
  useEffect(() => {
    async function fetchData() {
      if (!dynamoDB.isLoading && dynamoDB.userId) {
        setIsLoading(true)
        try {
          // Obtener información del perfil
          const profile = await dynamoDB.getUserProfile()
          setUserProfile(profile)
          
          // Obtener resultados de ejercicios
          const allResults = await dynamoDB.getExerciseResults()
          
          // Convertir resultados de DynamoDB al formato esperado por el componente
          if (allResults && allResults.length > 0) {
            const testIds = new Set<string>()
            const convertedResults: TestResult[] = []
            
            // Procesar resultados por tipo
            allResults.forEach((result: any) => {
              testIds.add(result.tipo)
              
              // Obtener icono según el tipo
                let icon;
                let colorClass;
                
                switch (result.tipo) {
                  case "stroop":
                    icon = <Brain className="h-5 w-5" />;
                    colorClass = "bg-purple-600";
                    break;
                  case "lectura":
                    icon = <BookOpen className="h-5 w-5" />;
                    colorClass = "bg-blue-600";
                    break;
                  case "atencion":
                    icon = <Eye className="h-5 w-5" />;
                    colorClass = "bg-green-600";
                    break;
                  case "memoria":
                    icon = <Brain className="h-5 w-5" />;
                    colorClass = "bg-orange-600";
                    break;
                  case "observacion":
                    icon = <Camera className="h-5 w-5" />;
                    colorClass = "bg-indigo-600";
                    break;
                  default:
                    icon = <Info className="h-5 w-5" />;
                    colorClass = "bg-gray-600";
                }
                
                // Normalizar puntuación a escala 0-100 si es necesario
                const score = result.detalles?.porcentajeAciertos || 
                  normalizeScore(result.puntuacion, result.detalles?.total || 100);
                
                // Generar retroalimentación basada en el puntaje
                const feedback = generateFeedback(result.tipo, score);
                
                // Mapear nombres de tipos a nombres más amigables
                let name;
                let description;
                
                switch (result.tipo) {
                  case "stroop":
                    name = "Test de Stroop";
                    description = "Evaluación de control inhibitorio y atención selectiva";
                    break;
                  case "lectura":
                    name = "Lectura Fluida";
                    description = "Evaluación de fluidez y comprensión lectora";
                    break;
                  case "atencion":
                    name = "Atención Sostenida";
                    description = "Evaluación de la capacidad para mantener la atención durante un periodo prolongado";
                    break;
                  case "memoria":
                    name = "Memoria Visual";
                    description = "Evaluación de memoria de trabajo y recordación visual";
                    break;
                  case "observacion":
                    name = "Atención Visual";
                    description = "Evaluación de la capacidad para detectar detalles visuales";
                    break;
                  default:
                    name = result.tipo.charAt(0).toUpperCase() + result.tipo.slice(1);
                    description = "Evaluación de habilidades cognitivas";
                }
                
                convertedResults.push({
                id: result.tipo + "_" + result.timestamp, // Añadir timestamp para hacer el ID único
                tipo: result.tipo, // Mantener el tipo original para agrupar
                  name: name,
                  score: score,
                  maxScore: 100,
                  description: description,
                  feedback: feedback,
                  icon: icon,
                  colorClass: colorClass,
                  rawScore: result.puntuacion,
                maxPossibleScore: result.detalles?.total || 100,
                timestamp: result.timestamp // Guardar el timestamp para ordenar
              });
                });
            
            // Ordenar resultados por tipo y fecha (más reciente primero)
            convertedResults.sort((a, b) => {
              if (a.tipo === b.tipo) {
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
              }
              return a.tipo.localeCompare(b.tipo);
            });
            
            // Actualizar estado con los resultados convertidos
            setTestResults(convertedResults);
            setFilteredResults(convertedResults);
            setCompletedTests(Array.from(testIds));
            
            // Calcular puntuación total (promedio de todos los resultados)
            const total = convertedResults.reduce((sum, result) => sum + result.score, 0) / convertedResults.length;
            setTotalScore(Math.round(total));
            
            // Determinar nivel de riesgo basado en la puntuación total
            if (total >= 75) {
              setRiskLevel('bajo');
            } else if (total >= 50) {
              setRiskLevel('moderado');
            } else {
              setRiskLevel('alto');
            }
          }
        } catch (error) {
          console.error("Error al obtener datos de DynamoDB:", error);
          
          // Si hay un error, intentar usar los datos de localStorage como respaldo
          loadDataFromLocalStorage();
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    fetchData();
  }, [dynamoDB.isLoading, dynamoDB.userId]);
  
  // Función para cargar datos desde localStorage como respaldo
  const loadDataFromLocalStorage = () => {
    // Formatear fecha actual
    const now = new Date()
    setCurrentDate(now.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
    
    // Cargar ejercicios completados desde localStorage
    if (typeof window !== 'undefined') {
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
          const formattedResults = loadedResults.map((result: Record<string, unknown>) => {
            // Resto del código original para procesar resultados de localStorage
            // ... existing code to process localStorage results ...
          });
          
          setTestResults(formattedResults);
          setFilteredResults(formattedResults);
          
          // Calcular puntuación total (promedio de todos los resultados)
          const totalScore = formattedResults.reduce((sum, result) => sum + (result.score as number), 0) / formattedResults.length;
          setTotalScore(Math.round(totalScore));
          
          // Determinar nivel de riesgo basado en la puntuación total
          if (totalScore >= 75) {
            setRiskLevel('bajo');
          } else if (totalScore >= 50) {
            setRiskLevel('moderado');
          } else {
            setRiskLevel('alto');
          }
        } catch (e) {
          console.error("Error parsing testResultsData:", e)
        }
      }
    }
  };

  // Función para generar y descargar informe PDF
  const handleDownloadReport = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Si usamos DynamoDB, pedir el informe completo
      if (dynamoDB.userId && !isLoading) {
        // Generar informe completo desde DynamoDB
        const reportData = await dynamoDB.generateReport();
        
        if (reportData) {
          // Crear el PDF con los datos
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          // Datos del usuario
          const profile = reportData.profile;
          pdf.setFontSize(20);
          pdf.text('Informe de Evaluación NeuroSpot', 20, 20);
          
          pdf.setFontSize(12);
          pdf.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 30);
          
          // Información del participante
          pdf.setFontSize(16);
          pdf.text('Datos del Participante', 20, 40);
          
          pdf.setFontSize(10);
          pdf.text(`Nombre: ${profile?.nombreNino || 'No disponible'}`, 20, 50);
          pdf.text(`Nivel Educativo: ${profile?.nivelEducativo || 'No disponible'}`, 20, 55);
          pdf.text(`Curso: ${profile?.curso || 'No disponible'}`, 20, 60);
          pdf.text(`Tutor: ${profile?.nombre || 'No disponible'}`, 20, 65);
          
          // Resultados de las pruebas
          pdf.setFontSize(16);
          pdf.text('Resultados de la Evaluación', 20, 80);
          
          pdf.setFontSize(10);
          let yPosition = 90;
          testResults.forEach((result, index) => {
            pdf.text(`${result.name}: ${result.score}/100`, 20, yPosition);
            yPosition += 5;
            pdf.text(`${result.feedback}`, 30, yPosition);
            yPosition += 10;
          });
          
          // Puntuación global
          pdf.setFontSize(16);
          pdf.text('Puntuación Global', 20, yPosition + 10);
          
          pdf.setFontSize(14);
          pdf.text(`${totalScore}/100 - Nivel de riesgo: ${riskLevel.toUpperCase()}`, 20, yPosition + 20);
          
          // Recomendaciones generales
          pdf.setFontSize(16);
          pdf.text('Recomendaciones', 20, yPosition + 35);
          
          pdf.setFontSize(10);
          pdf.text('Se recomienda revisar los resultados con un profesional de la educación', 20, yPosition + 45);
          pdf.text('para recibir orientación específica sobre cómo apoyar al estudiante.', 20, yPosition + 50);
          
          // Guardar PDF
          pdf.save('Informe_NeuroSpot.pdf');
        }
      } else {
        // Si no hay datos de DynamoDB, usar el método original
        // ... resto del código original para generar PDF ...
      }
    } catch (error) {
      console.error("Error al generar PDF:", error);
      // Usar método alternativo si falla
      // ... resto del código original para generar PDF ...
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  // Datos para el gráfico
  const chartData = (() => {
    // Agrupar resultados por tipo y quedarnos con el más reciente de cada tipo
    const latestByType: Record<string, TestResult> = {};
    
    filteredResults.forEach(result => {
      const tipo = result.tipo || result.id;
      if (!latestByType[tipo] || 
          (result.timestamp && latestByType[tipo].timestamp && 
           new Date(result.timestamp) > new Date(latestByType[tipo].timestamp))) {
        latestByType[tipo] = result;
      }
    });
    
    // Convertir a formato para el gráfico
    return Object.values(latestByType).map(result => {
    // Usar las puntuaciones originales para las barras
    const originalScore = result.rawScore !== undefined ? result.rawScore : result.score;
    const maxOriginalScore = result.maxPossibleScore || 100;
    
    return {
      name: result.name,
        puntuación: completedTests.includes(result.tipo || result.id) ? originalScore : 0,
      maxPuntuación: maxOriginalScore,
    };
  });
  })();
  
  // Estado para almacenar el nombre del participante
  const [participantName] = useState<string>("")
  
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
                    : `Has completado ${completedTests.length} de 6 pruebas`}
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
                              domain={[0, 'dataMax']}
                              allowDecimals={false}
                            >
                              <Label
                                value="Puntuación"
                                position="insideLeft"
                                angle={-90}
                                style={{ textAnchor: 'middle' }}
                              />
                            </YAxis>
                            <Tooltip 
                              formatter={(value, name, props) => {
                                return [`${value}/${props.payload.maxPuntuación}`, name];
                              }}
                            />
                            <Bar dataKey="puntuación" name="Tu puntuación">
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#3876F4" />
                              ))}
                            </Bar>
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
            
            {/* Resultados detallados */}
            {filteredResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultados detallados</CardTitle>
                  <CardDescription>
                    Análisis individual de cada prueba realizada
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-6">
                    {/* Agrupar resultados por tipo */}
                    {(() => {
                      // Crear un mapa de tipo -> resultados
                      const resultsByType: Record<string, TestResult[]> = {};
                      
                      // Agrupar resultados por tipo
                      filteredResults.forEach(result => {
                        const tipo = result.tipo || result.id;
                        if (!resultsByType[tipo]) {
                          resultsByType[tipo] = [];
                        }
                        resultsByType[tipo].push(result);
                      });
                      
                      // Renderizar por cada tipo
                      return Object.entries(resultsByType).map(([tipo, resultados]) => {
                        // Ordenar resultados por fecha (más reciente primero)
                        resultados.sort((a, b) => {
                          if (a.timestamp && b.timestamp) {
                            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                          }
                          return 0;
                        });
                        
                        // Resultado más reciente
                        const latestResult = resultados[0];
                        
                        return (
                          <div key={tipo} className="space-y-4">
                            {/* Encabezado del tipo de prueba */}
                            <div 
                              className={`p-4 rounded-lg border ${latestResult.colorClass}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-full bg-white dark:bg-gray-800">
                                  {latestResult.icon}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                                    <h3 className="font-medium">{latestResult.name}</h3>
                                    <span className="text-sm text-white dark:text-white bg-white/20 px-2 py-1 rounded-full">
                                      {resultados.length} {resultados.length === 1 ? 'intento' : 'intentos'}
                              </span>
                                  </div>
                                  
                                  <p className="text-sm text-white/90 dark:text-white/90 mt-1">
                                    {latestResult.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Listado de todos los intentos */}
                            <div className="space-y-3 pl-4">
                              {resultados.map((result, index) => (
                                <div 
                                  key={result.id}
                                  className="p-3 rounded-lg border bg-muted/30"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium">Intento {index + 1}</h4>
                                      {result.timestamp && (
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(result.timestamp).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                    
                                    <div className="text-right">
                                      <span className="font-bold">
                                        {result.rawScore !== undefined && result.maxPossibleScore
                                          ? `${result.rawScore}/${result.maxPossibleScore}`
                                          : `${result.score}/${result.maxScore}`}
                                      </span>
                                      <p className="text-xs text-muted-foreground">
                                        {Math.round(result.score)}%
                                      </p>
                                    </div>
                            </div>

                                  <div className="mt-2">
                                    <p className="text-sm text-muted-foreground">
                                      {result.feedback}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
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
                      <span>&quot;El cerebro del niño&quot; - Daniel J. Siegel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-muted p-1 mt-0.5">
                        <BookOpen className="h-3 w-3" />
                      </div>
                      <span>&quot;Entender el TDAH&quot; - Isabel Orjales</span>
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
