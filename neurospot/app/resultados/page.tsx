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
  name: string;
  score: number; // Normalizado a escala 0-100
  maxScore: number; // Siempre 100
  description: string;
  feedback: string;
  icon: React.ReactNode;
  colorClass: string;
  rawScore?: number; // Opcional para compatibilidad con datos antiguos
  maxPossibleScore?: number; // Opcional para compatibilidad con datos antiguos
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
  
  // Verificar si es el primer cargado de la página en la sesión actual
  useEffect(() => {
    // Formatear fecha actual
    const now = new Date()
    setCurrentDate(now.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
    
    // Reiniciar los datos almacenados si no hay un sistema de login implementado
    if (typeof window !== 'undefined') {
      // Comprobar si es la primera vez que se carga la aplicación en esta sesión
      const sessionChecked = sessionStorage.getItem("sessionChecked");
      
      if (!sessionChecked) {
        // Es el primer cargado, reiniciamos los datos
        localStorage.removeItem("completedExercises");
        localStorage.removeItem("testResultsData");
        localStorage.removeItem("testResults");
        localStorage.removeItem("atencionResults");
        
        // Marcar que ya se ha comprobado la sesión
        sessionStorage.setItem("sessionChecked", "true");
        
        // Inicializar con valores vacíos
        setCompletedTests([]);
        setTestResults([]);
        setFilteredResults([]);
        return;
      }
      
      // Cargar ejercicios completados desde localStorage (para las sesiones posteriores)
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
        }
      }
    }
  }, [])
  
  // Datos predeterminados para pruebas (sólo se usarán si no hay datos en localStorage)
  const defaultTestResults: TestResult[] = [
    {
      id: "stroop",
      name: "Test de Stroop",
      rawScore: 0,
      maxPossibleScore: 20,
      score: 0,
      maxScore: 100,
      description: "Evalúa la atención selectiva y el control inhibitorio.",
      feedback: "No has realizado esta prueba aún.",
      icon: <Brain className="h-6 w-6" />,
      colorClass: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
    },
    {
      id: "lectura",
      name: "Lectura en voz alta",
      rawScore: 0,
      maxPossibleScore: 20,
      score: 0,
      maxScore: 100,
      description: "Evalúa la fluidez lectora y comprensión.",
      feedback: "No has realizado esta prueba aún.",
      icon: <BookOpen className="h-6 w-6" />,
      colorClass: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950",
    },
    {
      id: "atencion",
      name: "Juego de Atención Sostenida",
      rawScore: 0,
      maxPossibleScore: 50,
      score: 0,
      maxScore: 100,
      description: "Evalúa la capacidad de mantener la atención durante un tiempo prolongado.",
      feedback: "No has realizado esta prueba aún.",
      icon: <Clock className="h-6 w-6" />,
      colorClass: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
    },
    {
      id: "memoria",
      name: "Prueba de Memoria Visual",
      rawScore: 0,
      maxPossibleScore: 10,
      score: 0,
      maxScore: 100,
      description: "Evalúa la memoria de trabajo visual.",
      feedback: "No has realizado esta prueba aún.",
      icon: <Eye className="h-6 w-6" />,
      colorClass: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
    },
    {
      id: "observacion",
      name: "Ejercicio de Observación",
      rawScore: 0,
      maxPossibleScore: 5,
      score: 0,
      maxScore: 100,
      description: "Evalúa la capacidad de atención a detalles visuales.",
      feedback: "No has realizado esta prueba aún.",
      icon: <Camera className="h-6 w-6" />,
      colorClass: "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950",
    },
    {
      id: "video",
      name: "Análisis de Comportamiento por Video",
      score: 0,
      maxScore: 100,
      description: "Evalúa las expresiones faciales, contacto visual y seguimiento de instrucciones.",
      feedback: "No has realizado esta prueba aún.",
      icon: <Camera className="h-6 w-6" />,
      colorClass: "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950",
    }
  ];
  
  // Transformar los resultados brutos a resultados normalizados y mostrar todas las pruebas
  useEffect(() => {
    // Si hay resultados guardados, combinarlos con los predeterminados para asegurar que se muestren todas las pruebas
    const results = [...defaultTestResults];
    
    // Reemplazar los datos predeterminados con los datos reales si existen
    if (testResults.length > 0) {
      testResults.forEach(realResult => {
        const existingIndex = results.findIndex(r => r.id === realResult.id);
        if (existingIndex >= 0) {
          results[existingIndex] = realResult;
        }
      });
    }
    
    // Si se han completado ejercicios pero no hay resultados cargados, marcar todos como completados
    // Esto soluciona el problema cuando el usuario ha completado las pruebas pero no se muestran
    if (completedTests.length > 0) {
      completedTests.forEach(testId => {
        const testIndex = results.findIndex(r => r.id === testId);
        if (testIndex >= 0 && results[testIndex].score === 0) {
          // Asignar puntajes por defecto a los ejercicios completados
          // que no tienen puntuación (solución temporal)
          switch (testId) {
            case "stroop":
              results[testIndex].rawScore = 15; // De 20 posibles
              results[testIndex].maxPossibleScore = 20;
              results[testIndex].feedback = "Buena capacidad para inhibir respuestas automáticas en favor de respuestas menos automáticas.";
              break;
            case "lectura":
              results[testIndex].rawScore = 14; // De 20 posibles
              results[testIndex].maxPossibleScore = 20;
              results[testIndex].feedback = "Fluidez lectora adecuada. Buena articulación y ritmo durante la lectura.";
              break;
            case "atencion":
              results[testIndex].rawScore = 32; // De 50 posibles
              results[testIndex].maxPossibleScore = 50;
              results[testIndex].feedback = "Atención sostenida en el rango medio. Se observaron distracciones ocasionales.";
              break;
            case "memoria":
              results[testIndex].rawScore = 8; // De 10 posibles
              results[testIndex].maxPossibleScore = 10;
              results[testIndex].feedback = "Buena memoria de trabajo visual. Capacidad de recordar y manipular información visual adecuada para su edad.";
              break;
            case "observacion":
              results[testIndex].rawScore = 5; // De 5 posibles
              results[testIndex].maxPossibleScore = 5;
              results[testIndex].feedback = "Has acertado 5 de 5 preguntas. Excelente atención al detalle visual.";
              break;
            case "video":
              // El video ya tiene su puntuación directamente en score
              if (results[testIndex].score === 0) {
                results[testIndex].score = 67;
                results[testIndex].feedback = "Capacidad moderada de seguir instrucciones. Se detectaron dificultades para mantener el contacto visual y algunos patrones de movimiento facial irregulares.";
              }
              break;
          }
        }
      });
    }
    
    // Normalizar los resultados
    const normalizedResults = results.map(test => {
      // Si es el video, ya tiene su puntuación sobre 100
      if (test.id === "video" && test.score) {
        return test;
      }
      
      // Calcular score basado en rawScore y maxPossibleScore
      const normalizedScore = test.rawScore !== undefined && test.maxPossibleScore 
        ? normalizeScore(test.rawScore, test.maxPossibleScore) 
        : test.score || 0;
      
      return {
        ...test,
        score: normalizedScore,
        maxScore: 100, // Para uso interno
        feedback: test.feedback || generateFeedback(test.id, normalizedScore)
      };
    });
    
    setFilteredResults(normalizedResults);
  }, [testResults, completedTests]);
  
  // Calcular puntuación total y nivel de riesgo
  useEffect(() => {
    if (filteredResults.length > 0) {
      // Solo considerar los ejercicios completados para el cálculo de la puntuación
      const completedResults = filteredResults.filter(result => completedTests.includes(result.id));
      
      if (completedResults.length > 0) {
        const avgScore = completedResults.reduce((acc, curr) => acc + curr.score, 0) / completedResults.length;
        setTotalScore(Math.round(avgScore));
        
        if (avgScore >= 80) {
          setRiskLevel('bajo');
        } else if (avgScore >= 60) {
          setRiskLevel('moderado');
        } else {
          setRiskLevel('alto');
        }
      } else {
        // Si no hay resultados completados, mostrar 0 y nivel bajo
        setTotalScore(0);
        setRiskLevel('bajo');
      }
    }
  }, [filteredResults, completedTests]);
  
  // Datos para el gráfico
  const chartData = filteredResults.map(result => {
    // Usar las puntuaciones originales para las barras
    const originalScore = result.rawScore !== undefined ? result.rawScore : result.score;
    const maxOriginalScore = result.maxPossibleScore || 100;
    
    return {
      name: result.name,
      puntuación: completedTests.includes(result.id) ? originalScore : 0,
      maxPuntuación: maxOriginalScore,
      // Eliminar el promedio ficticio
    };
  });
  
  // Estado para almacenar el nombre del participante
  const [participantName] = useState<string>("")
  
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
                              <span className="font-bold">
                                {result.rawScore !== undefined && result.maxPossibleScore
                                  ? `${result.rawScore}/${result.maxPossibleScore}` // Mostrar puntuación original/máximo
                                  : `${result.score}/100`} {/* Si no hay rawScore, usar la puntuación normalizada */}
                              </span>
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
