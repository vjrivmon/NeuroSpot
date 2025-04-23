"use client"

import { useState, useEffect, useRef } from "react"
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
import { PauseCircle, Video, Camera, ArrowRight, Download } from "lucide-react"

export default function VideoPage() {
  const [step, setStep] = useState<"instructions" | "recording" | "analyzing" | "completed">("instructions")
  const [timeLeft, setTimeLeft] = useState(60) // 1 minuto de grabación
  const [progress, setProgress] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [videoScore, setVideoScore] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<string>("")
  const [videoFrameSrc, setVideoFrameSrc] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Función para capturar un fotograma del video y convertirlo en una URL de datos
  const captureVideoFrame = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA o superior
      try {
        // Crear un canvas temporal para capturar el fotograma
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Dibujar el fotograma actual en el canvas
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          // Convertir el canvas a una URL de datos
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setVideoFrameSrc(dataUrl);
        }
      } catch (error) {
        console.error("Error al capturar fotograma:", error);
      }
    }
  };

  // Función para dibujar el video en el canvas (enfoque principal)
  const drawVideoToCanvas = () => {
    if (videoRef.current && canvasRef.current && streamRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        try {
          // Limpiar el canvas primero
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Ajustar el tamaño del canvas para que coincida con el elemento de video
          if (videoRef.current.videoWidth && videoRef.current.videoHeight) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            
            // Dibujar el frame actual del video en el canvas
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          }
          
          // Continuar con la animación
          animationRef.current = requestAnimationFrame(drawVideoToCanvas);
        } catch (error) {
          console.error("Error al dibujar en el canvas:", error);
        }
      }
    }
  };

  // Limpiar recursos cuando se desmonte el componente
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Verificar compatibilidad con getUserMedia
  useEffect(() => {
    // Verificar soporte de getUserMedia
    const checkMediaDevices = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError("Tu navegador no soporta acceso a la cámara.");
          return false;
        }
        
        // Verificar si hay dispositivos de video disponibles
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          setCameraError("No se detectó ninguna cámara en tu dispositivo.");
          return false;
        }
        
        return true;
      } catch (error) {
        console.error("Error al verificar dispositivos:", error);
        setCameraError("No se pudo acceder a los dispositivos multimedia.");
        return false;
      }
    };
    
    checkMediaDevices();
  }, []);

  // Función para analizar comportamiento (simulado)
  const analyzeVideoContent = () => {
    // En una aplicación real, esto enviaría el video a un servidor para análisis
    // Aquí simulamos un proceso de análisis y generamos resultados
    setStep("analyzing");
    
    // Simular tiempo de análisis (3 segundos)
    setTimeout(() => {
      // Generar puntuación aleatoria entre 60 y 95
      const score = Math.floor(Math.random() * 36) + 60;
      setVideoScore(score);
      
      // Generar retroalimentación basada en la puntuación
      let feedback;
      if (score >= 85) {
        feedback = "Excelente capacidad de seguir instrucciones. Movimientos faciales naturales y fluidos. Buen contacto visual.";
      } else if (score >= 75) {
        feedback = "Buena capacidad de seguir instrucciones. Algunos patrones de movimiento facial muestran ligeras inconsistencias.";
      } else {
        feedback = "Capacidad moderada de seguir instrucciones. Se detectaron dificultades para mantener el contacto visual y algunos patrones de movimiento facial irregulares.";
      }
      
      setAnalysisResult(feedback);
      setStep("completed");
      
      // Guardar resultados en localStorage
      if (typeof window !== 'undefined') {
        try {
          // Guardar ejercicio como completado
          const saved = localStorage.getItem("completedExercises") 
          let completedExercises = saved ? JSON.parse(saved) : []
          
          if (!completedExercises.includes("video")) {
            completedExercises.push("video")
            localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
          }
          
          // Guardar resultado específico en formato compatible con resultados.tsx
          const videoResult = {
            id: "video",
            name: "Análisis de Comportamiento por Video",
            score: score,
            maxScore: 100,
            description: "Evalúa las expresiones faciales, contacto visual y seguimiento de instrucciones.",
            feedback: feedback,
            date: new Date().toISOString()
          };
          
          // Actualizar testResults en localStorage
          try {
            // Primero intentamos obtener los resultados existentes
            const savedResultsData = localStorage.getItem("testResultsData");
            let resultsData = savedResultsData ? JSON.parse(savedResultsData) : [];
            
            // Buscar si ya existe un resultado para este test
            const existingIndex = resultsData.findIndex((test: any) => test.id === "video");
            
            if (existingIndex >= 0) {
              // Actualizar el resultado existente
              resultsData[existingIndex] = videoResult;
            } else {
              // Añadir el nuevo resultado
              resultsData.push(videoResult);
            }
            
            // Guardar los resultados actualizados
            localStorage.setItem("testResultsData", JSON.stringify(resultsData));
          } catch (e) {
            console.error("Error updating testResultsData:", e);
          }
          
          // También mantener el formato anterior para compatibilidad
          const savedResults = localStorage.getItem("testResults") 
          let testResults = savedResults ? JSON.parse(savedResults) : {}
          
          testResults.video = {
            score: score,
            feedback: feedback,
            date: new Date().toISOString()
          }
          
          localStorage.setItem("testResults", JSON.stringify(testResults))
        } catch (e) {
          console.error("Error updating results:", e)
        }
      }
    }, 3000);
  };

  // Solicitar permiso para la cámara y comenzar la grabación
  const startRecording = async () => {
    try {
      setCameraError(null);
      
      // Verificar compatibilidad
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Tu navegador no soporta acceso a la cámara");
      }
      
      // Solicitar acceso a la cámara con configuración explícita
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, // Usar configuración más simple para mayor compatibilidad
        audio: false 
      });
      
      // Guardar referencia al stream
      streamRef.current = stream;
      
      // Asignar el stream al elemento de video y reproducirlo
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Asegurarse de que el video se inicie
        try {
          await videoRef.current.play();
          console.log("Video playback started successfully");
          
          // Iniciar la renderización en el canvas como método principal
          requestAnimationFrame(drawVideoToCanvas);
          
          // También configurar un método de respaldo capturando fotogramas periódicamente
          frameIntervalRef.current = setInterval(captureVideoFrame, 1000); // Capturar un fotograma cada segundo
          
        } catch (playError) {
          console.error("Error starting video playback:", playError);
        }
      }
      
      // Configurar MediaRecorder con opciones más compatibles
      let options = {};
      // Detectar el formato más compatible según el navegador
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options = { mimeType: 'video/webm;codecs=vp9' };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        options = { mimeType: 'video/webm;codecs=vp8' };
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/webm' };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Determinar el tipo MIME correcto para el blob
        let mimeType = 'video/webm';
        if (options.mimeType) {
          // Usar el tipo MIME determinado anteriormente
          mimeType = options.mimeType;
        }
        
        const blob = new Blob(chunks, { type: mimeType });
        // Aquí enviaríamos el blob al servidor para análisis
        console.log("Video grabado:", blob);
        
        // Cancelar el loop de animación
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        
        // Detener la captura de fotogramas
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current);
          frameIntervalRef.current = null;
        }
        
        // Liberar recursos de la cámara
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Analizar el video (simulado)
        analyzeVideoContent();
      };
      
      // Solicitar datos cada segundo (no esperar hasta que termine)
      mediaRecorder.start(1000);
      setCameraPermission(true);
      setStep("recording");
      
      // Iniciar el temporizador
      const intervalId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            stopRecording();
            return 0;
          }
          setProgress(((60 - prev + 1) / 60) * 100);
          return prev - 1;
        });
      }, 1000);
      
    } catch (error: any) {
      console.error("Error al acceder a la cámara:", error);
      setCameraPermission(false);
      
      // Mensajes de error más específicos
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError("Permiso para usar la cámara denegado. Por favor, permite el acceso a la cámara.");
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError("No se pudo encontrar una cámara en tu dispositivo.");
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setCameraError("Tu cámara está siendo utilizada por otra aplicación.");
      } else {
        setCameraError(`Error al acceder a la cámara: ${error.message || "Error desconocido"}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const completeExercise = () => {
    router.push("/resultados");
  };

  // Generar y descargar PDF con los resultados
  const handleDownloadReport = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      import('html2canvas').then(({ default: html2canvas }) => {
        // Crear elemento temporal para el informe
        const reportContainer = document.createElement('div');
        reportContainer.style.width = '800px';
        reportContainer.style.padding = '40px';
        reportContainer.style.position = 'absolute';
        reportContainer.style.left = '-9999px';
        
        // Añadir contenido al informe
        reportContainer.innerHTML = `
          <div style="font-family: Arial, sans-serif;">
            <h1 style="color: #3876F4; margin-bottom: 20px;">Informe de Evaluación NeuroSpot</h1>
            <p style="margin-bottom: 10px;"><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
            <hr style="margin: 20px 0; border: 1px solid #eee;">
            
            <h2 style="color: #333; margin-bottom: 15px;">Resultados de Análisis de Comportamiento por Video</h2>
            <div style="background-color: #f5f8ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #3876F4; margin-top: 0;">Puntuación: ${videoScore}/100</h3>
              <p style="margin-bottom: 0;"><strong>Análisis:</strong> ${analysisResult}</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 15px;">Recomendaciones</h2>
            <p>Basado en los resultados de la evaluación, le recomendamos:</p>
            <ul>
              ${videoScore >= 85 ? 
                `<li>Continuar con las actividades actuales</li>
                 <li>Realizar evaluaciones periódicas para monitorear el progreso</li>` :
                videoScore >= 75 ?
                `<li>Realizar ejercicios de atención visual diariamente</li>
                 <li>Practicar ejercicios de seguimiento de instrucciones</li>` :
                `<li>Consultar con un especialista para evaluar posibles dificultades de atención</li>
                 <li>Implementar rutinas de ejercicios específicos para mejorar la concentración</li>`
              }
            </ul>
            
            <div style="margin-top: 40px;">
              <p style="color: #666; font-size: 0.8em;">Este informe es generado automáticamente por la plataforma NeuroSpot.</p>
              <p style="color: #666; font-size: 0.8em;">Los resultados deben ser interpretados por un profesional calificado.</p>
            </div>
          </div>
        `;
        
        document.body.appendChild(reportContainer);
        
        html2canvas(reportContainer).then(canvas => {
          document.body.removeChild(reportContainer);
          
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

  const finishManually = () => {
    // Detener los recursos de video si están activos
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    // Continuar con el análisis
    setManualMode(true);
    analyzeVideoContent();
  };

  const fallbackRecording = () => {
    // Simulación de grabación sin usar la cámara
    setStep("recording");
    setCameraPermission(true);
    setManualMode(true);
    
    // Iniciar el temporizador
    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          // Continuar con el análisis simulado
          analyzeVideoContent();
          return 0;
        }
        setProgress(((60 - prev + 1) / 60) * 100);
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="container max-w-full mx-auto px-6 py-8 flex-1 flex flex-col">
        <Card className="border-none shadow-lg flex-1 flex flex-col w-full max-w-6xl mx-auto">
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Análisis de Comportamiento</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDialog(true)} aria-label="Pausar ejercicio">
                <PauseCircle className="h-6 w-6" />
              </Button>
            </div>
            {step === "recording" && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tiempo restante: {timeLeft}s</span>
              </div>
            )}
            {step === "analyzing" && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Analizando video...</span>
              </div>
            )}
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between py-6">
            {step === "instructions" && (
              <div className="space-y-6 text-center flex-1 flex flex-col justify-center">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    En esta prueba analizaremos tus expresiones faciales y movimientos mientras realizas una actividad sencilla.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Necesitamos acceso a tu cámara. Por favor, siéntate derecho frente a la cámara en un lugar bien iluminado.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Si tu navegador te solicita permisos, debes hacer clic en "Permitir" para continuar con la prueba.
                  </p>
                </div>
                <Button 
                  className="w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                  onClick={startRecording}
                >
                  <Camera className="mr-2 h-5 w-5" /> Permitir acceso y comenzar grabación
                </Button>
                
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    ¿Problemas con la cámara? Puedes continuar sin ella:
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={fallbackRecording}
                  >
                    Continuar sin cámara
                  </Button>
                </div>
              </div>
            )}

            {step === "recording" && (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg mb-2">
                  <p className="text-sm text-muted-foreground">
                    Mientras te grabamos, por favor cuenta del 1 al 20 en voz alta, luego repite el abecedario. 
                    Mantente mirando a la cámara lo mejor posible.
                  </p>
                </div>
                
                <div className="relative bg-black rounded-lg overflow-hidden flex-1 flex items-center justify-center">
                  {cameraPermission === false ? (
                    <div className="text-center p-4 text-white">
                      <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{cameraError || "No se pudo acceder a la cámara. Comprueba los permisos e inténtalo de nuevo."}</p>
                      <div className="flex flex-col gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          className="bg-white text-black hover:bg-gray-100"
                          onClick={startRecording}
                        >
                          Intentar de nuevo
                        </Button>
                        <Button 
                          variant="outline" 
                          className="bg-transparent text-white border-white hover:bg-white/10"
                          onClick={fallbackRecording}
                        >
                          Continuar sin cámara
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {!manualMode && (
                        <>
                          {/* Video oculto que sirve como fuente */}
                          <video 
                            ref={videoRef} 
                            className="hidden" 
                            playsInline 
                            muted
                            autoPlay
                          />
                          
                          {/* Canvas visible que muestra el video (método principal) */}
                          <canvas 
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          
                          {/* Imagen de respaldo que muestra fotogramas (método alternativo) */}
                          {videoFrameSrc && (
                            <img 
                              src={videoFrameSrc} 
                              alt="Vista de cámara" 
                              className="absolute inset-0 w-full h-full object-cover"
                              style={{ display: 'none' }}
                              onLoad={(e) => {
                                const canvas = canvasRef.current;
                                // Si el canvas está vacío, mostrar la imagen
                                if (canvas && canvas.width === 0) {
                                  e.currentTarget.style.display = 'block';
                                }
                              }}
                            />
                          )}
                        </>
                      )}
                      
                      {/* Indicador de grabación */}
                      <div className="absolute top-0 left-0 right-0 p-2 bg-black/50 text-white text-xs text-center">
                        Cámara activa - grabando tu actividad
                      </div>
                      <div className="absolute bottom-4 right-4 bg-red-500 p-2 rounded-full animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      </div>
                      
                      {/* Mensaje si la cámara no se ve */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none opacity-90 z-10">
                        <div className="text-center p-6 bg-black/80 rounded-lg text-white max-w-md">
                          <h3 className="font-medium mb-3 text-lg">Realizando la prueba</h3>
                          <p className="mb-3 text-sm">
                            {manualMode 
                              ? "Estás realizando la prueba en modo manual (sin cámara)." 
                              : "Es posible que no veas tu cámara, pero la grabación continúa normalmente."}
                          </p>
                          <div className="text-left mb-4 bg-blue-900/50 p-3 rounded-md">
                            <p className="mb-2 font-medium text-sm">Recuerda que debes:</p>
                            <ol className="text-sm list-decimal pl-5">
                              <li className="mb-1">Contar en voz alta del 1 al 20</li>
                              <li className="mb-1">Recitar el abecedario completo</li>
                              <li>Mantener la mirada hacia adelante</li>
                            </ol>
                          </div>
                          
                          <div className="mt-5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white text-black hover:bg-gray-200 pointer-events-auto"
                              onClick={finishManually}
                            >
                              He terminado la actividad
                            </Button>
                            <p className="text-xs mt-2 opacity-70">
                              * Haz clic aquí cuando hayas completado la actividad, en lugar de esperar al temporizador.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {step === "analyzing" && (
              <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-medium mb-3">Analizando tu grabación</h2>
                  <p className="text-muted-foreground mb-4">
                    Estamos procesando tu video para analizar patrones de comportamiento.
                    Esto tomará solo unos segundos...
                  </p>
                  <div className="w-16 h-16 border-4 border-t-[#3876F4] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              </div>
            )}

            {step === "completed" && (
              <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-3">¡Evaluación completada!</h2>
                  <p className="text-muted-foreground mb-2">
                    Hemos capturado y analizado tus expresiones faciales y patrones de movimiento.
                  </p>
                  
                  <div className="bg-muted/30 p-4 rounded-lg my-4">
                    <h3 className="font-medium text-lg mb-1">Resultados preliminares:</h3>
                    <p className="font-bold text-xl mb-2">{videoScore}/100 puntos</p>
                    <p className="text-sm text-muted-foreground">{analysisResult}</p>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <Button 
                      className="w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                      onClick={handleDownloadReport}
                    >
                      <Download className="mr-2 h-4 w-4" /> Descargar Informe PDF
                    </Button>
                    
                    <Button 
                      className="w-full h-14 font-medium"
                      variant="outline"
                      onClick={completeExercise}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" /> Ver todos los resultados
                    </Button>
                  </div>
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