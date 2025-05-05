"use client"

// Extender la interfaz Window para TypeScript
declare global {
  interface Window {
    _neuroSpotTimerId?: number;
    _neuroSpotTimerCompletedHandler?: (event: Event) => void;
    _neuroSpotAnalyzeVideo?: () => void;
  }
}

import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from "react"
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
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null) // Referencia para el intervalo del temporizador
  const timeoutRef = useRef<NodeJS.Timeout | null>(null) // Referencia para el timeout de finalización
  const timeTextRef = useRef<HTMLSpanElement>(null) // Referencia para actualizar el texto del tiempo directamente
  const progressBarRef = useRef<HTMLDivElement>(null) // Referencia para actualizar la barra de progreso directamente
  const router = useRouter()

  // Estilos globales para animaciones
  useEffect(() => {
    // Crear estilos de animación si no existen
    if (!document.getElementById('camera-animations')) {
      const style = document.createElement('style');
      style.id = 'camera-animations';
      style.innerHTML = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Limpiar al desmontar
    return () => {
      const style = document.getElementById('camera-animations');
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Función para probar la cámara de forma aislada
  const testCameraOnly = async () => {
    try {
      setIsLoading(true);
      setCameraError(null);
      
      // Detener cualquier stream previo
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Obtener nuevo stream con mínimas restricciones
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      
      // Guardar referencia
      streamRef.current = stream;
      
      // Asignar al video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        
        try {
          await videoRef.current.play();
          console.log("Cámara iniciada correctamente");
          setCameraPermission(true);
          setIsLoading(false);
        } catch (e) {
          console.error("Error al reproducir:", e);
          setCameraError("No se pudo iniciar la reproducción automática. Haz clic en 'Activar cámara'.");
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error accediendo a la cámara:", error);
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos.");
      setIsLoading(false);
    }
  };

  // Función para capturar un fotograma del video y convertirlo en una URL de datos
  const captureVideoFrame = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA o superior
      try {
        // Crear un canvas temporal para capturar el fotograma
        const canvas = document.createElement('canvas');
        const videoWidth = videoRef.current.videoWidth || 640;
        const videoHeight = videoRef.current.videoHeight || 480;
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Dibujar el fotograma actual en el canvas
          ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
          
          // Convertir el canvas a una URL de datos con mejor calidad
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setVideoFrameSrc(dataUrl);
          
          // Para depuración, podríamos mostrar la imagen capturada
          // console.log("Frame capturado:", dataUrl.substring(0, 50) + "...");
        }
      } catch (error) {
        console.error("Error al capturar fotograma:", error);
      }
    } else {
      console.log("El video no está listo para capturar fotogramas");
    }
  };

  // Función para dibujar el video en el canvas (enfoque principal)
  const drawVideoToCanvas = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        try {
          // Ajustar el tamaño del canvas para que coincida con el elemento de video
          const videoWidth = videoRef.current.videoWidth || 640;
          const videoHeight = videoRef.current.videoHeight || 480;
          
          // Solo ajustar las dimensiones si han cambiado
          if (canvasRef.current.width !== videoWidth || canvasRef.current.height !== videoHeight) {
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
          }
          
          // Limpiar el canvas primero
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            
            // Dibujar el frame actual del video en el canvas
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Continuar con la animación
          animationRef.current = requestAnimationFrame(drawVideoToCanvas);
        } catch (error) {
          console.error("Error al dibujar en el canvas:", error);
        }
      }
    } else {
      // Si el video no está listo, seguir intentando
      animationRef.current = requestAnimationFrame(drawVideoToCanvas);
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

  // Efecto para manejar los eventos del elemento de video
  useEffect(() => {
    if (!videoRef.current || step !== "recording") return;

    const handleVideoPlay = () => {
      console.log("Video en reproducción");
      // Iniciar la animación del canvas
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(drawVideoToCanvas);
      }
    };

    const handleVideoError = (e: Event) => {
      console.error("Error en el elemento de video:", e);
      setCameraError("Ocurrió un error con la reproducción del video. Intenta reiniciar el ejercicio.");
    };

    // Añadir event listeners
    videoRef.current.addEventListener('play', handleVideoPlay);
    videoRef.current.addEventListener('error', handleVideoError);

    // Limpiar event listeners al desmontar
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', handleVideoPlay);
        videoRef.current.removeEventListener('error', handleVideoError);
      }
    };
  }, [step, videoRef.current]);

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
  const startRecording = () => {
    // Ya no intentamos configurar la cámara aquí, eso lo hace el componente SimpleCamera
    setCameraPermission(true); // Asumimos que tenemos permiso
    setStep("recording");
    
    console.log("Iniciando grabación - temporizador gestionado por script DOM");
    
    // Inicializar los estados (el temporizador real lo gestiona el script DOM)
    setTimeLeft(60);
    setProgress(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const finishManually = () => {
    // Detener todos los temporizadores
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Detener el temporizador DOM si existe
    if (window._neuroSpotTimerId) {
      clearInterval(window._neuroSpotTimerId);
      delete window._neuroSpotTimerId;
    }
    
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
    console.log("Finalizando manualmente la grabación");
    setManualMode(true);
    analyzeVideoContent();
  };

  const fallbackRecording = () => {
    // Simulación de grabación sin usar la cámara
    setStep("recording");
    setCameraPermission(true);
    setManualMode(true);
    
    console.log("Iniciando grabación en modo fallback - temporizador gestionado por script DOM");
    
    // Inicializar los estados (el temporizador real lo gestiona el script DOM)
    setTimeLeft(60);
    setProgress(0);
  };

  // SimpleCamera con implementación ultra básica sin efectos secundarios
  const SimpleCamera = () => {
    // Referencias para evitar rerenderizados
    const videoRef = useRef<HTMLVideoElement>(null);
    const errorRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef<HTMLDivElement>(null);
    
    // Configurar cámara apenas se monte el componente
    useEffect(() => {
      // Utilizar un ID para evitar problemas si el componente se monta varias veces
      const componentId = Date.now();
      console.log(`[Camera ${componentId}] Montando componente`);
      
      let isMounted = true;
      const setupCamera = async () => {
        try {
          if (!isMounted) return;
          
          if (loadingRef.current) {
            loadingRef.current.style.display = "flex";
          }
          
          // Obtener acceso a la cámara
          console.log(`[Camera ${componentId}] Solicitando permisos de cámara`);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          
          if (!isMounted) {
            // Si se desmontó mientras esperábamos, detener el stream
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          console.log(`[Camera ${componentId}] Permisos concedidos, configurando video`);
          
          // Guardar en refs globales también
          streamRef.current = stream;
          
          // Asignar al video local
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            
            // Configurar manejador para cuando esté listo
            const onLoadedMetadata = () => {
              if (!isMounted) return;
              
              console.log(`[Camera ${componentId}] Metadatos cargados, reproduciendo`);
              videoRef.current?.play().catch(e => {
                console.error(`[Camera ${componentId}] Error al reproducir:`, e);
                if (errorRef.current && isMounted) {
                  errorRef.current.style.display = "flex";
                }
              });
            };
            
            // Cuando comienza a reproducir
            const onPlaying = () => {
              if (!isMounted) return;
              
              console.log(`[Camera ${componentId}] Reproducción iniciada`);
              setCameraPermission(true);
              if (loadingRef.current) {
                loadingRef.current.style.display = "none";
              }
            };
            
            // Limpiar y agregar listeners
            videoRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoRef.current.removeEventListener('playing', onPlaying);
            
            videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
            videoRef.current.addEventListener('playing', onPlaying);
          }
        } catch (err) {
          console.error(`[Camera ${componentId}] Error accediendo a cámara:`, err);
          if (!isMounted) return;
          
          if (errorRef.current) {
            errorRef.current.style.display = "flex";
          }
          if (loadingRef.current) {
            loadingRef.current.style.display = "none";
          }
        }
      };
      
      // Iniciar la configuración
      setupCamera();
      
      // Limpieza al desmontar
      return () => {
        console.log(`[Camera ${componentId}] Desmontando componente`);
        isMounted = false;
        
        // Limpiar stream
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            console.log(`[Camera ${componentId}] Deteniendo track:`, track.kind);
            track.stop();
          });
          videoRef.current.srcObject = null;
        }
        
        // Limpiar listeners si es necesario
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = null;
          videoRef.current.onplaying = null;
        }
      };
    }, []);
    
    // Función para reintentar
    const retryCamera = () => {
      if (errorRef.current) {
        errorRef.current.style.display = "none";
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // Reintentar después de un momento
      setTimeout(async () => {
        try {
          if (loadingRef.current) {
            loadingRef.current.style.display = "flex";
          }
          
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          
          streamRef.current = stream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().then(() => {
              setCameraPermission(true);
              if (loadingRef.current) {
                loadingRef.current.style.display = "none";
              }
            }).catch(e => {
              console.error("Error al reproducir video:", e);
              if (errorRef.current) {
                errorRef.current.style.display = "flex";
              }
              if (loadingRef.current) {
                loadingRef.current.style.display = "none";
              }
            });
          }
        } catch (err) {
          console.error("Error al reintentar acceso a cámara:", err);
          if (errorRef.current) {
            errorRef.current.style.display = "flex";
          }
          if (loadingRef.current) {
            loadingRef.current.style.display = "none";
          }
        }
      }, 500);
    };
    
    return (
      <div className="bg-black rounded-lg overflow-hidden w-full h-full min-h-64 relative">
        {/* Video simple */}
        <video 
          ref={videoRef} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: 'black'
          }}
          autoPlay 
          playsInline 
          muted
        />
        
        {/* Estado de carga - inicialmente visible */}
        <div 
          ref={loadingRef}
          style={{ 
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              border: '4px solid transparent',
              borderTopColor: 'white',
              margin: '0 auto 10px',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p>Activando cámara...</p>
          </div>
        </div>
        
        {/* Estado de error - inicialmente oculto */}
        <div 
          ref={errorRef}
          style={{ 
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'none',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '1rem'
          }}
        >
          <p style={{ marginBottom: '1rem' }}>No se pudo acceder a la cámara. Verifica los permisos.</p>
          <Button 
            variant="outline" 
            className="bg-white text-black hover:bg-gray-100"
            onClick={retryCamera}
          >
            Reintentar acceso
          </Button>
          <Button 
            variant="outline" 
            className="mt-2 border-white/40 text-white hover:bg-white/10"
            onClick={fallbackRecording}
          >
            Continuar sin cámara
          </Button>
        </div>
        
        {/* Indicador de grabación - siempre visible */}
        <div 
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: 'red',
            animation: 'pulse 2s infinite'
          }}
        ></div>
      </div>
    );
  };

  // Limpiar temporizadores y recursos cuando cambia el paso o se desmonta
  useEffect(() => {
    // Activar temporizador cuando estamos en modo grabación
    if (step === "recording") {
      // Enfoque ultra radical: insertar un script en el DOM que maneje el temporizador de forma totalmente independiente
      try {
        console.log("Creando temporizador ultra-independiente");
        
        // Primero limpiar cualquier temporizador existente
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        // Crear un ID único para este temporizador
        const timerId = `timer_${Date.now()}`;
        
        // Crear un script que se ejecute inmediatamente
        const timerScript = document.createElement('script');
        timerScript.id = timerId;
        timerScript.innerHTML = `
          (function() {
            console.log("Script de temporizador independiente iniciado");
            // Configuración inicial
            const totalTime = 60;
            let timeRemaining = totalTime;
            
            // Referencias a elementos
            const timeTextElement = document.getElementById('timeText');
            const progressBarElement = document.getElementById('progressBar');
            
            if (!timeTextElement || !progressBarElement) {
              console.error("No se encontraron los elementos del temporizador");
              return;
            }
            
            // Inicializar visualización
            timeTextElement.innerText = "Tiempo restante: " + timeRemaining + "s";
            progressBarElement.style.width = "0%";
            
            // Crear el intervalo
            const intervalId = setInterval(function() {
              // Decrementar tiempo
              timeRemaining--;
              
              // Actualizar visualización
              if (timeTextElement) {
                timeTextElement.innerText = "Tiempo restante: " + timeRemaining + "s";
              }
              
              // Actualizar progreso
              if (progressBarElement) {
                const percentComplete = ((totalTime - timeRemaining) / totalTime) * 100;
                progressBarElement.style.width = percentComplete + "%";
              }
              
              console.log("Timer DOM: " + timeRemaining + "s restantes");
              
              // Verificar fin
              if (timeRemaining <= 0) {
                clearInterval(intervalId);
                console.log("Timer DOM completado");
                
                // Crear un evento personalizado para notificar que el tiempo ha terminado
                const event = new CustomEvent('timerCompleted');
                document.dispatchEvent(event);
              }
            }, 1000);
            
            // Almacenar el ID para limpieza
            window._neuroSpotTimerId = intervalId;
            
            // Limpiar cualquier listener previo
            document.removeEventListener('timerCompleted', window._neuroSpotTimerCompletedHandler);
            
            // Definir el manejador de evento de finalización
            window._neuroSpotTimerCompletedHandler = function() {
              // Esta función será llamada cuando el temporizador termine
              console.log("Evento timerCompleted recibido");
              
              // Buscar la función analyzeVideoContent en el contexto global
              if (window._neuroSpotAnalyzeVideo && typeof window._neuroSpotAnalyzeVideo === 'function') {
                window._neuroSpotAnalyzeVideo();
              }
            };
            
            // Añadir listener para el evento personalizado
            document.addEventListener('timerCompleted', window._neuroSpotTimerCompletedHandler);
          })();
        `;
        
        // Exponer la función de análisis para que el script pueda llamarla
        window._neuroSpotAnalyzeVideo = () => {
          console.log("Llamando a analyzeVideoContent desde el script DOM");
          analyzeVideoContent();
        };
        
        // Añadir el script al DOM
        document.body.appendChild(timerScript);
        
        // Guardar una función para limpiar este script
        const cleanupScript = () => {
          try {
            // Detener el intervalo si existe
            if (window._neuroSpotTimerId) {
              clearInterval(window._neuroSpotTimerId);
              delete window._neuroSpotTimerId;
            }
            
            // Eliminar el evento
            if (window._neuroSpotTimerCompletedHandler) {
              document.removeEventListener('timerCompleted', window._neuroSpotTimerCompletedHandler);
              delete window._neuroSpotTimerCompletedHandler;
            }
            
            // Eliminar la función de análisis
            if (window._neuroSpotAnalyzeVideo) {
              delete window._neuroSpotAnalyzeVideo;
            }
            
            // Eliminar el script
            const scriptElement = document.getElementById(timerId);
            if (scriptElement) {
              document.body.removeChild(scriptElement);
            }
          } catch (e) {
            console.error("Error limpiando script:", e);
          }
        };
        
        // Almacenar la función de limpieza
        return cleanupScript;
      } catch (error) {
        console.error("Error creando el script de temporizador:", error);
      }
    }
    
    // Limpieza cuando cambia el paso
    if (step === "analyzing" || step === "completed") {
      // Limpiar temporizadores
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Detener el temporizador DOM si existe
      if (window._neuroSpotTimerId) {
        clearInterval(window._neuroSpotTimerId);
        delete window._neuroSpotTimerId;
      }
      
      // Detener animaciones
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Detener captura de frames
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    }
    
    // Limpieza al desmontar
    return () => {
      // Limpiar temporizadores
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Detener el temporizador DOM si existe
      if (window._neuroSpotTimerId) {
        clearInterval(window._neuroSpotTimerId);
        delete window._neuroSpotTimerId;
      }
      
      // Detener animaciones
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Detener captura de frames
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      
      // Detener streams de video
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]);

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="container max-w-full mx-auto px-6 py-8 flex-1 flex flex-col">
        <Card className="border-none shadow-lg flex-1 flex flex-col w-full max-w-6xl mx-auto">
          <CardHeader className="pb-4 border-b relative">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Análisis de Comportamiento</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDialog(true)} aria-label="Pausar ejercicio">
                <PauseCircle className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Timer UI - siempre presente en el DOM pero condicionalmente visible */}
            <div className={`flex justify-between text-sm text-muted-foreground ${step !== "recording" ? "opacity-0 absolute" : ""}`}>
              <span ref={timeTextRef} id="timeText">Tiempo restante: {timeLeft}s</span>
              </div>
            
            {step === "analyzing" && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Analizando video...</span>
              </div>
            )}
            
            {/* Barra de progreso siempre presente */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                ref={progressBarRef}
                id="progressBar"
                className="h-full bg-[#3876F4] transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
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
                    <strong>IMPORTANTE:</strong> Es necesario permitir el acceso a tu cámara para realizar este ejercicio. 
                    Cuando hagas clic en "Comenzar actividad", el navegador te solicitará permisos para acceder a tu cámara. 
                    <strong> Debes hacer clic en "Permitir" o "Aceptar" cuando aparezca el mensaje.</strong>
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
                  {isLoading ? (
                    <div className="text-center p-4 text-white">
                      <div className="w-12 h-12 border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p>Iniciando la cámara... Espera un momento.</p>
                      <p className="text-sm mt-2">Por favor, acepta los permisos de cámara cuando te lo solicite el navegador.</p>
                    </div>
                  ) : cameraPermission === false ? (
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
                    /* Reemplazar con el componente de cámara simplificado */
                    <SimpleCamera />
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
                {step === "recording" && cameraPermission && !manualMode && (
                  <div className="text-center mt-4 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={finishManually}
                    >
                      He terminado la actividad
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                      onClick={() => {
                        // Detener todos los recursos actuales
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
                        
                        // Reiniciar el video
                        if (videoRef.current) {
                          videoRef.current.srcObject = null;
                        }
                        
                        // Reiniciar la grabación
                        setTimeout(() => {
                          startRecording();
                        }, 500);
                      }}
                    >
                      Reiniciar cámara
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