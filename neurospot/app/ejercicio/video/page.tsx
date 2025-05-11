"use client"

// Extender la interfaz Window para TypeScript
declare global {
  interface Window {
    _neuroSpotTimerId?: number;
    _neuroSpotTimerCompletedHandler?: (event: Event) => void;
    _neuroSpotAnalyzeVideo?: () => void;
  }
}

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
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
import { PauseCircle, Video, Camera, ArrowRight, Download, Check, AlertCircle } from "lucide-react"
import { useDynamo } from "@/hooks/use-dynamo"

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
  const [sessionId, setSessionId] = useState<string>("")
  const [uploadedFrames, setUploadedFrames] = useState<{id: number, status: 'success'|'error', hasFace: boolean|null, faceDetails?: any}[]>([])
  const [showFramesList, setShowFramesList] = useState(false)
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
  const dynamo = useDynamo()

  // Variable para contar frames
  const frameCountRef = useRef(0);
  const [startTime, setStartTime] = useState<number>(Date.now())

  // Subir fotograma a S3 y analizarlo con Rekognition
  const uploadFrameToS3 = async (dataUrl: string, frameId: number) => {
    try {
      // Registrar inicio del proceso con identificador claro
      console.log(`[UPLOAD:${frameId}] Iniciando subida de frame...`);
      
      // Verificar que tenemos una sesión válida
      if (!sessionId) {
        console.error(`[UPLOAD:${frameId}] Error: No hay ID de sesión válido`);
        return;
      }
      
      // Crear un nuevo ID de frame único basado en la sesión y contador
      const frameKey = `${sessionId}/frame_${frameId.toString().padStart(3, '0')}.jpg`;
      
      // Limpiar el dataURL para obtener solo los datos binarios
      const base64Data = dataUrl.split(',')[1];
      if (!base64Data) {
        console.error(`[UPLOAD:${frameId}] Error: Formato de dataUrl inválido`);
        return;
      }
      
      // 1. Primero subir a S3 (Estocolmo)
      console.log(`[UPLOAD:${frameId}] Solicitando URL firmada para ${frameKey}`);
      const response = await fetch("/api/getSignedUrl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: frameKey,
          fileType: "image/jpeg",
          bucket: "neurospot-data", // Asegurarnos de usar el bucket correcto
          purpose: "video-frame"
        }),
      });
      
      if (!response.ok) {
        console.error(`[UPLOAD:${frameId}] Error al obtener URL firmada:`, response.status, await response.text());
        
        // Agregar a la lista de frames con error
        setUploadedFrames(prev => [...prev, {
          id: frameId,
          status: 'error',
          hasFace: null
        }]);
        return;
      }
      
      const { url, bucket, key } = await response.json();
      console.log(`[UPLOAD:${frameId}] URL firmada obtenida para bucket ${bucket}, key ${key}`);
      
      // Convertir la base64 a un blob para subir
      const binaryData = atob(base64Data);
      const arrayBuffer = new ArrayBuffer(binaryData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }
      
      const blob = new Blob([uint8Array], { type: 'image/jpeg' });
      
      // Subir a S3 directamente usando fetch con la URL firmada
      console.log(`[UPLOAD:${frameId}] Iniciando envío PUT a S3...`);
      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: blob,
      });
      
      if (!uploadResponse.ok) {
        console.error(`[UPLOAD:${frameId}] Error al subir imagen a S3:`, uploadResponse.status, await uploadResponse.text());
        
        // Agregar a la lista de frames con error
        setUploadedFrames(prev => [...prev, {
          id: frameId,
          status: 'error',
          hasFace: null
        }]);
        return;
      }
      
      console.log(`[UPLOAD:${frameId}] Frame subido exitosamente a ${bucket}/${key}`);
      
      // 2. Enviar la imagen directamente para análisis (sin usar referencias a S3)
      console.log(`[UPLOAD:${frameId}] Enviando frame para análisis facial directo...`);
      
      const analysisResponse = await fetch("/api/analyzeImage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: dataUrl,  // Enviar la imagen directamente como base64
          bucket, // También enviar referencias por compatibilidad
          key
        }),
      });
      
      if (!analysisResponse.ok) {
        console.error(`[UPLOAD:${frameId}] Error al analizar imagen:`, analysisResponse.status, await analysisResponse.text());
        
        // Aún así consideramos la subida exitosa
        setUploadedFrames(prev => [...prev, {
          id: frameId,
          status: 'success',
          hasFace: false,
        }]);
        return;
      }
      
      const analysisData = await analysisResponse.json();
      console.log(`[UPLOAD:${frameId}] Análisis completado:`, 
        analysisData.hasFace ? "Rostro detectado" : "Sin rostro",
        analysisData.faceDetails ? `Detalles: ${Object.keys(analysisData.faceDetails).length}` : "");
      
      // Actualizar la lista de frames subidos
      setUploadedFrames(prev => [...prev, {
        id: frameId,
        status: 'success',
        hasFace: analysisData.hasFace,
        faceDetails: analysisData.faceDetails
      }]);
      
    } catch (error) {
      console.error(`[UPLOAD:${frameId}] Error general en proceso de subida:`, error);
      
      // Agregar a la lista con error
      setUploadedFrames(prev => [...prev, {
        id: frameId,
        status: 'error',
        hasFace: null
      }]);
    }
  };

  // Calcular una puntuación de atención basada en los detalles faciales de AWS Rekognition
  // Con criterios mejorados para la dirección de la mirada
  const calculateAttentionScore = (faceDetails: any): number => {
    if (!faceDetails) return 0;
    
    try {
      // Comenzamos con una puntuación base neutral
      let score = 5; 
      let isDistracted = false;
      const distractionReasons = [];
      
      // ---- VERIFICACIÓN DE POSE/ORIENTACIÓN (PRIORIDAD MÁXIMA) ----
      // Esta es la parte crucial para detectar si alguien no mira a la cámara
      if (faceDetails.Pose) {
        const { Yaw, Pitch, Roll } = faceDetails.Pose;
        
        // Yaw: rotación horizontal (mirar a izquierda/derecha)
        // Menos estricto: ±15 grados es considerado "mirando al frente"
        if (Math.abs(Yaw) > 15) {
          // Penalización más severa por desviación horizontal
          const penalty = Math.min(5, Math.abs(Yaw) / 10); 
          score -= penalty;
          isDistracted = true;
          distractionReasons.push(`Mirando a ${Yaw > 0 ? 'derecha' : 'izquierda'} (${Math.abs(Yaw).toFixed(1)}°)`);
          console.log(`[Attention] ⚠️ Cabeza girada horizontalmente ${Yaw.toFixed(1)}° (-${penalty.toFixed(1)}): ${score}`);
        } else {
          // Bonificación por mirar directamente al frente
          score += 1.5;
          console.log(`[Attention] ✅ Cabeza bien centrada horizontalmente (+1.5): ${score}`);
        }
        
        // Pitch: rotación vertical (mirar arriba/abajo)
        // Mucho menos estricto: ±25 grados es considerado "mirando al frente"
        // Muchas cámaras web están en posición que fuerza un poco de inclinación
        if (Math.abs(Pitch) > 25) {
          const penalty = Math.min(3, Math.abs(Pitch) / 15);
          score -= penalty;
          isDistracted = true;
          distractionReasons.push(`Mirando ${Pitch > 0 ? 'abajo' : 'arriba'} (${Math.abs(Pitch).toFixed(1)}°)`);
          console.log(`[Attention] ⚠️ Cabeza girada verticalmente ${Pitch.toFixed(1)}° (-${penalty.toFixed(1)}): ${score}`);
        } else {
          // Pequeña bonificación por mantener la cabeza en nivel correcto
          score += 1;
          console.log(`[Attention] ✅ Cabeza bien centrada verticalmente (+1): ${score}`);
        }
        
        // Roll: inclinación de la cabeza
        // Más permisivo con la inclinación
        if (Math.abs(Roll) > 20) {
          const penalty = Math.min(2, Math.abs(Roll) / 20);
          score -= penalty;
          if (Math.abs(Roll) > 30) {
            isDistracted = true;
            distractionReasons.push(`Cabeza muy inclinada (${Math.abs(Roll).toFixed(1)}°)`);
          }
          console.log(`[Attention] ${Math.abs(Roll) > 30 ? '⚠️ ' : ''}Cabeza inclinada ${Roll.toFixed(1)}° (-${penalty.toFixed(1)}): ${score}`);
        }
      }
      
      // ---- VERIFICACIÓN DE OJOS ----
      // Si los ojos están cerrados, consideramos distracción
      if (faceDetails.EyesOpen?.Value === false && faceDetails.EyesOpen?.Confidence > 70) {
        score -= 4; // Penalización severa
        isDistracted = true;
        distractionReasons.push("Ojos cerrados");
        console.log(`[Attention] ⚠️ Ojos cerrados (-4): ${score}`);
      } else if (faceDetails.EyesOpen?.Value === true && faceDetails.EyesOpen?.Confidence > 80) {
        score += 1.5;
        console.log(`[Attention] ✅ Ojos claramente abiertos (+1.5): ${score}`);
      } else if (faceDetails.EyesOpen?.Confidence < 60) {
        // Si hay baja confianza en el estado de los ojos, también penalizamos pero menos
        score -= 1;
        console.log(`[Attention] ℹ️ Baja confianza en estado de ojos (-1): ${score}`);
      }
      
      // ---- VERIFICACIÓN DE EMOCIONES ----
      if (faceDetails.Emotions && Array.isArray(faceDetails.Emotions)) {
        // Buscar emoción dominante
        let dominantEmotion = {Type: 'UNKNOWN', Confidence: 0};
        for (const emotion of faceDetails.Emotions) {
          if (emotion.Confidence > dominantEmotion.Confidence) {
            dominantEmotion = emotion;
          }
        }
        
        // Emociones ideales: Neutralidad y calma con alta confianza
        if ((dominantEmotion.Type === 'CALM' || dominantEmotion.Type === 'NEUTRAL') && 
            dominantEmotion.Confidence > 70) {
          score += 1;
          console.log(`[Attention] ✅ Emoción ideal (${dominantEmotion.Type}) (+1): ${score}`);
        } 
        // Emociones de distracción más específicas
        else if (['CONFUSED', 'DISGUSTED', 'FEAR'].includes(dominantEmotion.Type) && 
                dominantEmotion.Confidence > 50) {
          score -= 1.5;
          console.log(`[Attention] ⚠️ Emoción distractora (${dominantEmotion.Type}) (-1.5): ${score}`);
        }
      }
      
      // Si hay factores severos de distracción, garantizar que la puntuación esté por debajo de 5
      if (isDistracted && score > 5) {
        score = Math.min(score, 4.9);
        console.log(`[Attention] Ajustando puntuación a ${score} por detección de distracción`);
      }
      
      // Registrar los resultados detallados
      if (isDistracted) {
        console.log(`[Attention] ⚠️ DISTRACCIÓN DETECTADA: ${distractionReasons.join(', ')}`);
      } else if (score >= 7) {
        console.log(`[Attention] ✅ ATENCIÓN PERFECTA: Mirada directa a cámara`);
      } else {
        console.log(`[Attention] ℹ️ ATENCIÓN PARCIAL: ${score.toFixed(1)}/10`);
      }
      
      // Limitar a rango 0-10
      return Math.max(0, Math.min(10, score));
    } catch (error) {
      console.error("Error calculando puntuación de atención:", error);
      return 5; // Valor por defecto en caso de error
    }
  };

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

  // Capturar fotograma de video y subirlo a S3 con análisis de Rekognition
  const captureVideoFrame = () => {
    console.log("Intentando capturar fotograma...");
    
    // Verificamos si tenemos elemento de video
    if (!videoRef.current) {
      console.error("Error: No hay elemento de video disponible para capturar frame");
      return;
    }
    
    // Verificamos si tiene contenido
    if (videoRef.current.readyState < 2) {
      console.error("Error: El video no está listo (readyState:", videoRef.current.readyState, ")");
      return;
    }

    try {
      console.log("Video readyState:", videoRef.current.readyState, "- dimensiones:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
      
        // Crear un canvas temporal para capturar el fotograma
        const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
        const videoWidth = videoRef.current.videoWidth || 640;
        const videoHeight = videoRef.current.videoHeight || 480;
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        if (ctx) {
          // Dibujar el fotograma actual en el canvas
          ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
          
          // Convertir el canvas a una URL de datos con mejor calidad
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        console.log("Frame capturado con éxito, tamaño aproximado:", Math.round(dataUrl.length/1024), "KB");
        
        // Subida al bucket
        uploadFrameToS3(dataUrl, frameCountRef.current);
        frameCountRef.current++;
      } else {
        console.error("No se pudo obtener el contexto 2D del canvas");
        }
      } catch (error) {
        console.error("Error al capturar fotograma:", error);
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

  // Función para analizar comportamiento con datos reales
  const analyzeVideoContent = () => {
    console.log("Analizando comportamiento con datos reales de atención");
    setStep("analyzing");
    
    // Obtener estadísticas de los frames capturados
    const stats = checkUploadStatus();
    console.log("Estadísticas de frames:", stats);
    
    // Obtener las puntuaciones de atención de frames con rostros detectados
    const attentionFrames = uploadedFrames.filter(f => f.hasFace === true && f.faceDetails);
    
    // Calcular puntuación de cada frame
    const attentionScores = attentionFrames.map(frame => {
      const score = calculateAttentionScore(frame.faceDetails);
      return score;
    });
    
    console.log("Puntuaciones de atención:", attentionScores);
    
    // Calcular puntuación real basada en:
    // 1. Porcentaje de frames con rostro detectado
    // 2. Promedio de puntuación de atención en esos frames
    let finalScore = 0;
    let feedback = "";
    
    // Simular tiempo de análisis (2 segundos)
    setTimeout(() => {
      if (uploadedFrames.length === 0) {
        // Si no hay frames, generamos una puntuación baja
        finalScore = 60;
        feedback = "No se pudieron capturar suficientes frames para un análisis preciso. Recomendamos repetir la prueba con mejor conectividad o cámara.";
      } else {
        // Calcular porcentaje de atención
        const attentionPercentage = uploadedFrames.length > 0 
          ? (stats.withFace / uploadedFrames.length) * 100 
          : 0;
          
        // Calcular puntuación media de atención
        const avgAttentionScore = attentionScores.length > 0 
          ? attentionScores.reduce((sum, score) => sum + score, 0) / attentionScores.length 
          : 5; // valor neutro por defecto
          
        console.log(`Porcentaje de atención: ${attentionPercentage.toFixed(1)}%, Puntuación media: ${avgAttentionScore.toFixed(1)}/10`);
        
        // Calcular puntuación final ponderada:
        // - 60% basado en porcentaje de frames con rostro (presencia)
        // - 40% basado en la calidad de atención en esos frames
        const presenceScore = Math.min(100, attentionPercentage * 1.2); // Hasta 60 puntos por presencia
        const qualityScore = avgAttentionScore * 4; // Hasta 40 puntos por calidad de atención
        
        finalScore = Math.round(
          (presenceScore * 0.6) + (qualityScore * 0.4)
        );
        
        // Limitar entre 60-95 para mantener consistencia con el diseño original
        finalScore = Math.max(60, Math.min(95, finalScore));
        
        console.log(`Puntuación final calculada: ${finalScore} (Presencia: ${presenceScore.toFixed(1)}, Calidad: ${qualityScore.toFixed(1)})`);
        
        // Generar retroalimentación basada en la puntuación real
        if (finalScore >= 85) {
          feedback = "Excelente capacidad de seguir instrucciones. Mantuviste contacto visual constante y tus expresiones faciales fueron naturales y fluidas.";
        } else if (finalScore >= 75) {
          feedback = "Buena capacidad de seguir instrucciones. Mantuviste contacto visual la mayor parte del tiempo con algunos momentos de distracción.";
      } else {
        feedback = "Capacidad moderada de seguir instrucciones. Se detectaron dificultades para mantener el contacto visual y algunos patrones de movimiento facial irregulares.";
        }
      }
      
      // Establecer puntuación y feedback calculados
      setVideoScore(finalScore);
      setAnalysisResult(feedback);
      setStep("completed");
      
      // Guardar resultados en localStorage
      if (typeof window !== 'undefined') {
        try {
          // Guardar ejercicio como completado
          const saved = localStorage.getItem("completedExercises") 
          const completedExercises = saved ? JSON.parse(saved) : []
          
          if (!completedExercises.includes("video")) {
            completedExercises.push("video")
            localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
          }
          
          // Incluir datos de análisis en los resultados
          const analysisData = {
            totalFrames: uploadedFrames.length,
            framesWithFace: stats.withFace,
            framesWithoutFace: stats.withoutFace,
            attentionPercentage: stats.withFace > 0 ? (stats.withFace / uploadedFrames.length) * 100 : 0,
            sessionId: sessionId
          };
          
          // Guardar resultado específico en formato compatible con resultados.tsx
          const videoResult = {
            id: "video",
            name: "Análisis de Comportamiento por Video",
            score: finalScore,
            maxScore: 100,
            description: "Evalúa las expresiones faciales, contacto visual y seguimiento de instrucciones.",
            feedback: feedback,
            date: new Date().toISOString(),
            metadata: {
              analysisData
            }
          };
          
          // Actualizar testResults en localStorage
          try {
            // Primero intentamos obtener los resultados existentes
            const savedResultsData = localStorage.getItem("testResultsData");
            const resultsData = savedResultsData ? JSON.parse(savedResultsData) : [];
            
            // Buscar si ya existe un resultado para este test
            const existingIndex = resultsData.findIndex((test: { id: string }) => test.id === "video");
            
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
          const testResults = savedResults ? JSON.parse(savedResults) : {}
          
          testResults.video = {
            score: finalScore,
            feedback: feedback,
            date: new Date().toISOString(),
            analysisData
          }
          
          localStorage.setItem("testResults", JSON.stringify(testResults))
        } catch (e) {
          console.error("Error updating results:", e)
        }
      }
    }, 2000);
  };

  const completeExercise = async () => {
    // Calcular la duración del ejercicio
    const endTime = Date.now();
    const durationInMs = endTime - startTime;
    const durationInSec = Math.floor(durationInMs / 1000);
    
    // Guardar este ejercicio como completado en localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem("completedExercises") 
        const completedExercises = saved ? JSON.parse(saved) : []
        
        if (!completedExercises.includes("video")) {
          completedExercises.push("video")
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
          console.log("Ejercicio de Video completado y guardado en localStorage")
        }
      } catch (e) {
        console.error("Error updating completedExercises:", e)
      }
    }
    
    // Guardar los resultados en DynamoDB
    try {
      // Calcular estadísticas de atención
      const uploadStats = checkUploadStatus();
      const attentionFrames = uploadedFrames.filter(f => f.hasFace === true);
      const attentionPercentage = attentionFrames.length > 0 
        ? Math.round((attentionFrames.length / uploadedFrames.length) * 100) 
        : 0;
        
      // Procesar los detalles faciales para calcular puntuaciones de atención
      const attentionScores = attentionFrames
        .filter(frame => frame.faceDetails)
        .map(frame => {
          // Calcular puntuación con la función existente
          const score = calculateAttentionScore(frame.faceDetails);
          return {
            frameId: frame.id,
            score: score,
            level: score >= 7 ? 'high' : (score >= 4 ? 'medium' : 'low')
          };
        });
      
      // Calcular la puntuación promedio de atención
      const averageAttention = attentionScores.length > 0
        ? attentionScores.reduce((sum, item) => sum + item.score, 0) / attentionScores.length
        : 0;
        
      // Calcular porcentaje de frames con alta atención
      const highAttentionFrames = attentionScores.filter(frame => frame.level === 'high');
      const highAttentionPercentage = attentionScores.length > 0
        ? Math.round((highAttentionFrames.length / attentionScores.length) * 100)
        : 0;
      
      // Calcular una puntuación ponderada en escala 0-100
      // 60% basado en el porcentaje de frames con alta atención
      // 40% basado en la puntuación media normalizada (0-10 a 0-40)
      const weightedScore = Math.round(
        (highAttentionPercentage * 0.6) + (averageAttention * 4) 
      );
      
      // Datos del ejercicio a guardar
      const exerciseData = {
        tipo: "video",
        puntuacion: Math.min(100, weightedScore), // No exceder 100
        duracion: durationInSec,
        detalles: {
          framesCapturados: uploadedFrames.length,
          framesConRostro: attentionFrames.length,
          porcentajeAtencion: attentionPercentage,
          puntuacionMedia: averageAttention,
          porcentajeAltaAtencion: highAttentionPercentage,
          sessionId: sessionId,
          tiempoTotal: durationInSec
        }
      }
      
      // Guardar en DynamoDB
      const result = await dynamo.saveExerciseResult(exerciseData)
      
      if (!result.success) {
        console.error("Error al guardar resultados en DynamoDB:", result.error)
      } else {
        console.log("Resultados de Video guardados correctamente en DynamoDB:", exerciseData)
        
        // Navegar a la página de resultados
        router.push("/resultados");
      }
    } catch (error) {
      console.error("Error al procesar resultados de video:", error)
      router.push("/resultados");
    }
  };

  // Función de reporte de PDF que ya no se usará pero se mantiene por compatibilidad
  const handleDownloadReport = () => {
    // Aquí se manejaría la descarga del informe
    // Por ahora simplemente redirigimos a resultados
    router.push("/resultados");
  }

  // Verificar estado de subidas
  const checkUploadStatus = () => {
    return {
      total: uploadedFrames.length,
      success: uploadedFrames.filter(f => f.status === 'success').length,
      error: uploadedFrames.filter(f => f.status === 'error').length,
      withFace: uploadedFrames.filter(f => f.hasFace === true).length,
      withoutFace: uploadedFrames.filter(f => f.hasFace === false).length
    };
  };

  // Renderiza la lista de frames subidos
  const FramesUploadedList = () => {
    const uploadStats = checkUploadStatus();
    
    if (uploadedFrames.length === 0) {
      return (
        <div className="text-sm text-gray-500 p-3 bg-gray-100 rounded-md">
          No hay frames subidos todavía.
        </div>
      );
    }

    // Calcular estadísticas de atención
    const attentionFrames = uploadedFrames.filter(f => f.hasFace === true);
    const attentionPercentage = attentionFrames.length > 0 
      ? Math.round((attentionFrames.length / uploadedFrames.length) * 100) 
      : 0;
    
    // Procesar los detalles faciales para calcular puntuaciones de atención
    const attentionScores = attentionFrames
      .filter(frame => frame.faceDetails)
      .map(frame => {
        // Calcular puntuación con la función existente
        const score = calculateAttentionScore(frame.faceDetails);
        return {
          frameId: frame.id,
          score: score,
          // Clasificar el nivel de atención con umbrales más realistas
          level: score >= 7 ? 'high' : (score >= 4 ? 'medium' : 'low')
        };
      });
    
    // Calcular la puntuación promedio de atención
    const averageAttention = attentionScores.length > 0
      ? attentionScores.reduce((sum, item) => sum + item.score, 0) / attentionScores.length
      : 0;
    
    // Calcular porcentaje de frames con alta atención
    const highAttentionFrames = attentionScores.filter(frame => frame.level === 'high');
    const highAttentionPercentage = attentionScores.length > 0
      ? Math.round((highAttentionFrames.length / attentionScores.length) * 100)
      : 0;

    return (
      <div className="text-sm">
        <div className="space-y-2">
          {/* Estadísticas de atención - versión más clara */}
          {attentionFrames.length > 0 && (
            <div className="p-2 bg-blue-50 rounded-md border border-blue-100">
              <div className="font-medium text-blue-800">
                {attentionPercentage}% de frames con rostro detectado
              </div>
              
              {/* Detalles de presencia */}
              <div className="flex justify-between text-xs mt-1 mb-2">
                <span className="text-blue-600">
                  <strong>{attentionFrames.length}</strong> de {uploadedFrames.length} frames con rostro
                </span>
                <span className={uploadStats.error > 0 ? "text-orange-500" : "text-green-500"}>
                  {uploadStats.error > 0 ? `${uploadStats.error} errores` : "Sin errores"}
                </span>
              </div>
              
              {/* Medidor visual de atención - Mejorado */}
              {attentionScores.length > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium text-blue-700">
                      Puntuación: {averageAttention.toFixed(1)}/10
                    </span>
                    <span className={`px-1.5 py-0.5 rounded font-semibold ${
                      highAttentionPercentage >= 60 ? "bg-green-100 text-green-800" : 
                      highAttentionPercentage >= 30 ? "bg-amber-100 text-amber-800" : 
                      "bg-red-100 text-red-800"
                    }`}>
                      {highAttentionPercentage}% óptima
                    </span>
                  </div>
                  
                  {/* Barra de puntuaciones */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, averageAttention * 10))}%`,
                        transition: 'width 0.5s ease'
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Lista de frames con indicadores más claros */}
          <div className="max-h-40 overflow-y-auto border rounded-md">
            {uploadedFrames.map((frame, index) => {
              // Calcular la puntuación para este frame si tiene datos faciales
              const frameScore = frame.faceDetails ? calculateAttentionScore(frame.faceDetails) : null;
              
              // Determinar el nivel de atención y el color correspondiente
              let attentionLevel = "";
              let bgColor = "";
              let textColor = "";
              let icon = null;
              
              if (frame.hasFace === true) {
                if (frameScore !== null) {
                  // Umbrales más realistas: >=7 atento, >=4 parcial, <4 distraído
                  if (frameScore >= 7) {
                    attentionLevel = "Atento";
                    bgColor = "bg-green-100";
                    textColor = "text-green-800";
                    icon = <Check size={12} className="mr-1" />;
                  } else if (frameScore >= 4) {
                    attentionLevel = "Parcial";
                    bgColor = "bg-amber-100";
                    textColor = "text-amber-800";
                  } else {
                    attentionLevel = "Distraído";
                    bgColor = "bg-red-100";
                    textColor = "text-red-800";
                    icon = <AlertCircle size={12} className="mr-1" />;
                  }
                } else {
                  attentionLevel = "Rostro";
                  bgColor = "bg-blue-100";
                  textColor = "text-blue-800";
                }
              } else {
                attentionLevel = "Sin rostro";
                bgColor = "bg-red-100";
                textColor = "text-red-800";
                icon = <AlertCircle size={12} className="mr-1" />;
              }
              
              return (
                <div key={index} className="flex items-center text-xs p-1.5 border-b last:border-0 hover:bg-gray-50">
                  <div className={`mr-2 ${frame.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {frame.status === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  </div>
                  <div className="flex-1">
                    Frame-{frame.id}.jpg
                  </div>
                  <div className={`text-xs px-1.5 py-0.5 rounded flex items-center ${bgColor} ${textColor}`}>
                    {icon}
                    {frameScore !== null ? `${attentionLevel} (${frameScore.toFixed(1)})` : attentionLevel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Iniciar grabación y configurar la captura de frames
  const startRecording = () => {
    setCameraPermission(true);
    setStep("recording");
    
    // Limpiar frames anteriores
    setUploadedFrames([]);
    frameCountRef.current = 0;
    
    console.log("Iniciando grabación - temporizador gestionado por script DOM");
    
    // Generar ID único para la sesión
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    console.log("Nueva sesión de grabación:", newSessionId);
    
    // Inicializar los estados (el temporizador real lo gestiona el script DOM)
    setTimeLeft(60);
    setProgress(0);
    
    // Registrar el tiempo de inicio para cálculos de duración
    setStartTime(Date.now())
    
    // Programar la primera captura con un pequeño retraso
    console.log("Programando captura de frames cada segundo");
    setTimeout(() => {
      // Intentar capturar un frame inmediatamente
      captureVideoFrame();
      
      // Configurar captura periódica
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      
      frameIntervalRef.current = setInterval(captureVideoFrame, 1000);
      console.log("Intervalo de captura configurado:", frameIntervalRef.current);
    }, 1500);
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
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const errorRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef<HTMLDivElement>(null);
    
    // Al montar, asignar la referencia local a la global
    useEffect(() => {
      if (localVideoRef.current) {
        videoRef.current = localVideoRef.current;
      }
    }, []);
    
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
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            
            // Configurar manejador para cuando esté listo
            const onLoadedMetadata = () => {
              if (!isMounted) return;
              
              console.log(`[Camera ${componentId}] Metadatos cargados, reproduciendo`);
              localVideoRef.current?.play().catch(e => {
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
              
              // Actualizar la referencia global
              videoRef.current = localVideoRef.current;
              
              // Probar captura después de que la cámara esté lista
              setTimeout(() => {
                if (isMounted) {
                  console.log("Probando captura inicial de frame...");
                  captureVideoFrame();
                }
              }, 1000);
            };
            
            // Limpiar y agregar listeners
            localVideoRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
            localVideoRef.current.removeEventListener('playing', onPlaying);
            
            localVideoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
            localVideoRef.current.addEventListener('playing', onPlaying);
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
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const stream = localVideoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            console.log(`[Camera ${componentId}] Deteniendo track:`, track.kind);
            track.stop();
          });
          localVideoRef.current.srcObject = null;
        }
        
        // Limpiar listeners si es necesario
        if (localVideoRef.current) {
          localVideoRef.current.onloadedmetadata = null;
          localVideoRef.current.onplaying = null;
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
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
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
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            videoRef.current = localVideoRef.current; // Actualizar ref global
            
            localVideoRef.current.play().then(() => {
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
          ref={localVideoRef} 
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
              
              {/* Información de estado de uploads */}
              {step === "recording" && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowFramesList(!showFramesList)}
                  className="text-xs px-2 py-0.5 h-auto"
                >
                  {uploadedFrames.length > 0 ? (
                    <>{checkUploadStatus().success}/{uploadedFrames.length} frames</>
                  ) : (
                    <>Sin frames</>
                  )}
                </Button>
              )}
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
                    Cuando hagas clic en &quot;Comenzar actividad&quot;, el navegador te solicitará permisos para acceder a tu cámara. 
                    <strong> Debes hacer clic en &quot;Permitir&quot; o &quot;Aceptar&quot; cuando aparezca el mensaje.</strong>
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
                    <strong>Nota:</strong> Si tu navegador te solicita permisos, debes hacer clic en &quot;Permitir&quot; para continuar.
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
                
                {/* Información ampliada sobre frames capturados */}
                {uploadedFrames.length > 0 && (
                  <div className="bg-white border rounded-lg p-3 mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Seguimiento de atención</h3>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600">
                          <Check size={14} className="inline mr-1" />
                          {checkUploadStatus().success} subidos
                        </span>
                        {checkUploadStatus().withFace > 0 && (
                          <span 
                            className={`${
                              // Obtener los últimos 3 frames con rostro
                              uploadedFrames.filter(f => f.hasFace === true).slice(-3).some(frame => 
                                frame.faceDetails && calculateAttentionScore(frame.faceDetails) < 5
                              )
                              ? "text-red-600 bg-red-50 animate-pulse" 
                              : "text-green-600 bg-green-50"
                            } px-2 py-0.5 rounded-full flex items-center`}
                          >
                            {
                              // Verificar si hay distracción en los últimos frames
                              uploadedFrames.filter(f => f.hasFace === true).slice(-3).some(frame => 
                                frame.faceDetails && calculateAttentionScore(frame.faceDetails) < 5
                              ) ? (
                                <>
                                  <AlertCircle size={12} className="mr-1" />
                                  No mirando
                                </>
                              ) : (
                                <>
                                  <Check size={12} className="mr-1" />
                                  Atento
                                </>
                              )
                            }
                          </span>
                        )}
                        {checkUploadStatus().withoutFace > 0 && (
                          <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            {checkUploadStatus().withoutFace} sin rostro
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Información del bucket */}
                    <div className="text-xs text-gray-500 mb-2">
                      <div>ID Sesión: <span className="font-mono">{sessionId}</span></div>
                      <div>Bucket: neurospot-data/videos/{sessionId}/</div>
                    </div>
                    
                    {/* Alertas de atención y mensajes de ánimo */}
                    {uploadedFrames.filter(f => f.hasFace === true).length > 0 && (
                      <div className={`text-sm p-2 rounded-md mt-1 ${
                        // Verificar si hay distracción en los últimos frames
                        uploadedFrames.filter(f => f.hasFace === true).slice(-3).some(frame => 
                          frame.faceDetails && calculateAttentionScore(frame.faceDetails) < 5
                        ) 
                        ? "bg-amber-50 text-amber-700 border border-amber-200" 
                        : "bg-green-50 text-green-700 border border-green-200"
                      }`}>
                        {
                          // Mensajes positivos y claros basados en la atención
                          uploadedFrames.filter(f => f.hasFace === true).slice(-3).some(frame => 
                            frame.faceDetails && calculateAttentionScore(frame.faceDetails) < 5
                          ) ? (
                            <>
                              <AlertCircle size={14} className="inline mr-1" />
                              <strong>¡Recuerda!</strong> Intenta mantener la mirada hacia la cámara durante el ejercicio.
                            </>
                          ) : (
                            <>
                              <Check size={14} className="inline mr-1" />
                              <strong>¡Perfecto!</strong> Estás manteniendo muy buena atención visual. ¡Sigue así!
                            </>
                          )
                        }
                      </div>
                    )}
                    
                    {/* Mostrar lista de frames si está expandido */}
                    {showFramesList && (
                      <div className="max-h-32 overflow-y-auto border rounded-md mt-2">
                        <FramesUploadedList />
                      </div>
                    )}
                  </div>
                )}
                
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