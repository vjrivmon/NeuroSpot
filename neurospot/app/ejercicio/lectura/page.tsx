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
import { PauseCircle, Mic, MicOff, ArrowRight, Check, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useDynamo } from "@/hooks/use-dynamo"

const textoLectura = `El sol brillaba en el cielo azul mientras los pájaros cantaban alegremente entre los árboles del parque. Un niño jugaba con su perro cerca del lago, lanzando una pelota que el animal perseguía con entusiasmo. Cerca de allí, algunas personas disfrutaban de un picnic sobre el césped verde, compartiendo risas y comida. El viento suave movía las hojas de los árboles creando una melodía relajante que invitaba a quedarse un rato más.`

export default function LecturaPage() {
  const [textoActual, setTextoActual] = useState<string>(textoLectura)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [recordingSaved, setRecordingSaved] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcriptionStatus, setTranscriptionStatus] = useState<'idle' | 'processing' | 'completed'>('idle')
  const [transcriptionJobName, setTranscriptionJobName] = useState<string | null>(null)
  const [emocionUsuario, setEmocionUsuario] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(0)
  
  const router = useRouter()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const dynamo = useDynamo()

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (recording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Actualiza el progreso (asumiendo un máximo de 60 segundos)
          setProgress(Math.min((newTime / 60) * 100, 100));
          
          // Si ha pasado el tiempo suficiente para leer el texto (30 segundos)
          if (newTime >= 30 && !completed) {
            stopRecording();
            return newTime;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording, completed]);

  // Efecto para verificar el estado de la transcripción
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (transcriptionStatus === 'processing' && transcriptionJobName) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/transcribe?jobName=${transcriptionJobName}`);
          const data = await response.json();
          
          if (data.status === 'COMPLETED') {
            setTranscriptionStatus('completed');
            setEmocionUsuario(data.emocion);
            clearInterval(interval as NodeJS.Timeout);
          }
        } catch (error) {
          console.error("Error al verificar estado de transcripción:", error);
        }
      }, 5000); // Verificar cada 5 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [transcriptionStatus, transcriptionJobName]);

  const startRecording = async () => {
    setStartTime(Date.now());
    
    try {
      // Reset states if starting a new recording
      setRecordingSaved(false);
      setAudioUrl(null);
      setTranscriptionStatus('idle');
      setEmocionUsuario(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Crear URL para reproducir el audio
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Marcar como guardado y completado
        setRecordingSaved(true);
        setCompleted(true);
        
        // Cerrar los tracks de audio para liberar el micrófono
        stream.getTracks().forEach(track => track.stop());
        
        // Iniciar el proceso de transcripción
        startTranscription(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
      alert("No se pudo acceder al micrófono. Por favor, verifica los permisos.");
    }
  };

  const startTranscription = async (audioBlob: Blob) => {
    try {
      setTranscriptionStatus('processing');
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      
      // Obtener userId del localStorage (si está disponible)
      let userId = 'anonymous';
      if (typeof window !== 'undefined') {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) userId = storedUserId;
      }
      formData.append('userId', userId);
      
      console.log("Iniciando análisis de audio para el usuario:", userId);
      console.log("Tamaño del archivo de audio:", Math.round(audioBlob.size / 1024), "KB");
      
      // Enviar solicitud al endpoint de transcripción
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        console.error("Error en la respuesta del servidor:", response.status, response.statusText);
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log("Análisis de audio iniciado exitosamente. Job:", data.jobName);
        console.log("Emoción detectada:", data.emocion);
        setTranscriptionJobName(data.jobName);
        
        // Si ya tenemos la emoción, actualizar el estado directamente
        if (data.emocion) {
          setEmocionUsuario(data.emocion);
          setTranscriptionStatus('completed');
        }
      } else {
        console.error("Error al iniciar análisis de audio:", data.error);
        alert(`Error al iniciar análisis de audio: ${data.error}`);
        setTranscriptionStatus('idle');
      }
    } catch (error) {
      console.error("Error al enviar audio para análisis:", error);
      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Error al procesar el audio: ${errorMessage}`);
      setTranscriptionStatus('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleContinue = async () => {
    // Calcular la duración del ejercicio
    const endTime = Date.now();
    const durationInMs = endTime - startTime;
    const durationInSec = Math.floor(durationInMs / 1000);
    
    // Guardar este ejercicio como completado en localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem("completedExercises") 
        const completedExercises = saved ? JSON.parse(saved) : []
        
        if (!completedExercises.includes("lectura")) {
          completedExercises.push("lectura")
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
          console.log("Ejercicio de Lectura completado y guardado en localStorage")
        }
      } catch (e) {
        console.error("Error updating completedExercises:", e)
      }
    }
    
    // Guardar los resultados en DynamoDB
    try {
      // Calcular puntuación basada en tiempo de grabación y emoción
      // Si no hay emoción detectada, asignamos 70 puntos base
      const puntuacionBase = 70;
      let puntuacionEmocion = 0;
      
      // Ajuste por emoción detectada
      if (emocionUsuario) {
        // Bonificación para emociones neutras o calmadas, que son ideales para una lectura
        if (emocionUsuario.toLowerCase().includes('calm') || 
            emocionUsuario.toLowerCase().includes('neutral')) {
          puntuacionEmocion = 30;
        } else if (emocionUsuario.toLowerCase().includes('happy')) {
          puntuacionEmocion = 20;
        } else {
          puntuacionEmocion = 10; // Otras emociones
        }
      }
      
      const puntuacionFinal = Math.min(100, puntuacionBase + puntuacionEmocion);
      
      // Datos del ejercicio a guardar
      const exerciseData = {
        tipo: "lectura",
        puntuacion: puntuacionFinal,
        duracion: durationInSec,
        detalles: {
          tiempoLectura: recordingTime,
          emocionDetectada: emocionUsuario || "No detectada",
          longitudTexto: textoActual.length,
          tiempoTotal: durationInSec
        }
      }
      
      // Guardar en DynamoDB
      const result = await dynamo.saveExerciseResult(exerciseData)
      
      if (!result.success) {
        console.error("Error al guardar resultados en DynamoDB:", result.error)
      } else {
        console.log("Resultados de Lectura guardados correctamente en DynamoDB:", exerciseData)
      }
    } catch (error) {
      console.error("Error al procesar resultados de lectura:", error)
    }

    router.push("/ejercicio/atencion");
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />
      
      {/* Barra de progreso global - Oculta */}
      <div className="hidden">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Prueba 2 de 5: Lectura en Voz Alta</h3>
            <span className="text-xs text-blue-600 dark:text-blue-300">40% completado</span>
          </div>
          <div className="w-full bg-white dark:bg-gray-800 rounded-full h-2.5">
            <div className="bg-[#3876F4] h-2.5 rounded-full" style={{ width: '40%' }}></div>
          </div>
        </div>
      </div>

      <div className="container max-w-full mx-auto px-6 pt-6 pb-4 flex flex-col">
        <Card className="border-none shadow-lg flex flex-col w-full max-w-6xl mx-auto h-auto">
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Lectura en Voz Alta</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDialog(true)} aria-label="Pausar ejercicio">
                <PauseCircle className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tiempo: {recordingTime}s</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="px-4 pt-3 pb-6 flex flex-col space-y-3 min-h-0">
            <div className="space-y-4">
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Lee en voz alta el siguiente texto. Pulsa el botón para comenzar a grabar tu voz.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-base leading-relaxed">{textoActual}</p>
              </div>
              
              {recordingSaved && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <div>
                    <AlertTitle className="text-green-800 dark:text-green-300">¡Grabación guardada!</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
                      Tu lectura se ha guardado correctamente.
                      {audioUrl && (
                        <div className="mt-2">
                          <p className="text-xs mb-1">Puedes escuchar tu grabación:</p>
                          <audio controls src={audioUrl} className="w-full h-8 mt-1" />
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
              
              {transcriptionStatus === 'processing' && (
                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                  <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <AlertTitle className="text-blue-800 dark:text-blue-300">Procesando audio...</AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                    Estamos analizando tu grabación. Esto puede tardar unos segundos.
                  </AlertDescription>
                </Alert>
              )}
              
              {transcriptionStatus === 'completed' && emocionUsuario && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <div>
                    <AlertTitle className="text-green-800 dark:text-green-300">¡Análisis de audio completado!</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
                      <div className="mt-1">
                        <p className="font-medium">Tu tono de voz suena: <span className="font-bold">{emocionUsuario}</span></p>
                      </div>
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>

            <div className="mt-4">
              {!completed ? (
                <Button 
                  onClick={recording ? stopRecording : startRecording}
                  className={recording ? "w-full h-12 text-white font-medium bg-red-500 hover:bg-red-600" : "w-full h-12 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"}
                >
                  {recording ? (
                    <>
                      <MicOff className="mr-2 h-5 w-5" /> Detener grabación
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" /> Comenzar grabación
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  className="w-full h-12 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                  onClick={handleContinue}
                  disabled={transcriptionStatus === 'processing'}
                >
                  {transcriptionStatus === 'processing' ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-5 w-5" /> Continuar con la siguiente prueba
                    </>
                  )}
                </Button>
              )}
            </div>
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