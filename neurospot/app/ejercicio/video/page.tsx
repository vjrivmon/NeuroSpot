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

  const completeExercise = () => {
    router.push("/resultados");
  };

  // Función de reporte de PDF que ya no se usará pero se mantiene por compatibilidad
  const handleDownloadReport = () => {
    // Redirigir a resultados en lugar de descargar PDF
    router.push("/resultados");
  };

  // Solicitar permiso para la cámara y comenzar la grabación
  const startRecording = async () => {
    try {
      setCameraError(null);
      
      // Verificar compatibilidad
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Tu navegador no soporta acceso a la cámara");
      }
      
      // Primero preguntar al usuario qué medio prefiere usar
      const useCamera = window.confirm("¿Deseas usar la cámara para esta actividad? Presiona 'Cancelar' si prefieres usar solo audio.");
      
      // Solicitar acceso según la elección del usuario
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: useCamera, 
        audio: !useCamera // Si no usa cámara, pedir audio
      });
      
      // Guardar referencia al stream
      streamRef.current = stream;
      
      // Asignar el stream al elemento de video y reproducirlo
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Asegurarse de que el video se inicie
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => {
            console.error("Error al iniciar reproducción:", e);
          });
        };
        
        // Iniciar la animación de canvas solo si hay video
        if (useCamera) {
          videoRef.current.addEventListener('play', () => {
            // Iniciar la captura de frames
            animationRef.current = requestAnimationFrame(drawVideoToCanvas);
            
            // Capturar frames cada 500ms como respaldo
            frameIntervalRef.current = setInterval(captureVideoFrame, 500);
          });
        } else {
          // Si solo es audio, usar el modo manual
          setManualMode(true);
        }
      }
      
      setCameraPermission(true);
      setStep("recording");
      
      // Iniciar el temporizador
      const intervalId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            stopRecording();
            analyzeVideoContent();
            return 0;
          }
          setProgress(((60 - prev + 1) / 60) * 100);
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Error al acceder a los dispositivos multimedia:", error);
      setCameraError("No se pudo acceder a la cámara o micrófono. Verifica los permisos.");
      setCameraPermission(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
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
              <div className="space-y-6 w-full max-w-full">
                {/*<h2 className="text-xl font-medium mb-3">Análisis de Emociones</h2>*/}
                
                <div className="bg-muted/30 p-4 rounded-lg mb-4 text-left">
                  <p className="text-sm text-muted-foreground mb-2">
                    En esta prueba analizaremos tus expresiones faciales y movimientos mientras realizas una actividad sencilla.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Puedes elegir usar tu cámara o solo tu micrófono para esta actividad.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Instrucciones:</strong>
                  </p>
                  <ol className="text-sm list-decimal pl-5 mb-2 text-left">
                    <li className="mb-1">Cuenta en voz alta del 1 al 20</li>
                    <li className="mb-1">Recita el abecedario completo</li>
                    <li>Mantén la mirada hacia adelante si usas cámara</li>
                  </ol>
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Si tu navegador te solicita permisos, debes hacer clic en "Permitir" para continuar.
                  </p>
                </div>
                
                <Button 
                  className="w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                  onClick={startRecording}
                >
                  <Camera className="mr-2 h-5 w-5" /> Comenzar actividad
                </Button>
                
                <div className="pt-2 w-full text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    ¿Problemas con los permisos? Puedes continuar en modo manual:
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={fallbackRecording}
                  >
                    Continuar sin cámara ni micrófono
                  </Button>
                </div>
              </div>
            )}

            {step === "recording" && (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Instrucciones movidas fuera del marco de la cámara */}
                <div className="bg-muted/30 p-4 rounded-lg mb-2">
                  <p className="text-sm font-medium mb-1">Instrucciones:</p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center text-primary font-bold mr-3">1</div>
                      <p className="text-sm text-muted-foreground">Cuenta en voz alta del 1 al 20</p>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center text-primary font-bold mr-3">2</div>
                      <p className="text-sm text-muted-foreground">Recita el abecedario completo</p>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center text-primary font-bold mr-3">3</div>
                      <p className="text-sm text-muted-foreground">Mantén la mirada hacia adelante</p>
                    </div>
                  </div>
                </div>
                
                <div className="relative bg-black rounded-lg overflow-hidden flex-1 flex items-center justify-center">
                  {cameraPermission === false ? (
                    <div className="text-center p-4 text-white">
                      <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{cameraError || "No se pudo acceder a la cámara o micrófono. Comprueba los permisos e inténtalo de nuevo."}</p>
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
                          Continuar en modo manual
                        </Button>
                      </div>
                    </div>
                  ) : manualMode ? (
                    /* Contenido del modo manual */
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="text-center p-6 bg-black/80 rounded-lg text-white max-w-md">
                        <h3 className="font-medium mb-3 text-lg">Modo audio activo</h3>
                        <p className="mb-3 text-sm">
                          Estás realizando la prueba con audio solamente.
                        </p>
                        <div className="mt-5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white text-black hover:bg-gray-200"
                            onClick={finishManually}
                          >
                            He terminado la actividad
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Modo cámara directo (sin usar estilos absolute que puedan causar problemas) */
                    <div className="w-full h-full flex items-center justify-center">
                      <video 
                        ref={videoRef} 
                        className="max-w-full max-h-full"
                        style={{ 
                          display: 'block', 
                          width: '100%', 
                          height: 'auto',
                          backgroundColor: 'black'
                        }}
                        playsInline
                        autoPlay
                        muted
                      />
                    </div>
                  )}
                  
                  {/* Indicadores de grabación - siempre visibles si hay permiso */}
                  {cameraPermission && (
                    <>
                      <div className="absolute top-0 left-0 right-0 p-2 bg-black/50 text-white text-xs text-center z-50">
                        {manualMode ? "Audio activo" : "Cámara activa"} - grabando tu actividad
                      </div>
                      <div className="absolute bottom-4 right-4 bg-red-500 p-2 rounded-full animate-pulse z-50">
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      </div>
                    </>
                  )}
                  
                  {/* Canvas oculto para captura de fotogramas */}
                  <canvas 
                    ref={canvasRef}
                    className="hidden"
                    style={{ display: 'none', position: 'absolute', visibility: 'hidden' }}
                  />
                </div>
                
                {/* Botón para terminar manualmente fuera del área de video */}
                {cameraPermission && !manualMode && (
                  <div className="text-center mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={finishManually}
                    >
                      He terminado la actividad
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === "analyzing" && (
              <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-medium mb-3">Analizando tu actividad</h2>
                  <p className="text-muted-foreground mb-4">
                    Estamos procesando tu {manualMode ? "audio" : "video"} para analizar patrones de comportamiento.
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
                    Hemos analizado tus patrones de {manualMode ? "voz" : "expresiones faciales y movimiento"}.
                  </p>
                  
                  <div className="bg-muted/30 p-4 rounded-lg my-4">
                    <h3 className="font-medium text-lg mb-1">Resultados preliminares:</h3>
                    <p className="font-bold text-xl mb-2">{videoScore}/100 puntos</p>
                    <p className="text-sm text-muted-foreground">{analysisResult}</p>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <Button 
                      className="w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                      onClick={completeExercise}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" /> Ver resultados completos
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