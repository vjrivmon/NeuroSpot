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
import { PauseCircle, Mic, MicOff, ArrowRight, Check, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const textoLectura = `El sol brillaba en el cielo azul mientras los pájaros cantaban alegremente entre los árboles del parque. Un niño jugaba con su perro cerca del lago, lanzando una pelota que el animal perseguía con entusiasmo. Cerca de allí, algunas personas disfrutaban de un picnic sobre el césped verde, compartiendo risas y comida. El viento suave movía las hojas de los árboles creando una melodía relajante que invitaba a quedarse un rato más.`

export default function LecturaPage() {
  const [recording, setRecording] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [recordingSaved, setRecordingSaved] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const router = useRouter()

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

  const startRecording = async () => {
    try {
      // Reset states if starting a new recording
      setRecordingSaved(false);
      setAudioUrl(null);
      
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
        
        console.log("Grabación completada y guardada:", audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
      alert("No se pudo acceder al micrófono. Por favor, verifica los permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleContinue = () => {
    // Guardar este ejercicio como completado en localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem("completedExercises") 
        let completedExercises = saved ? JSON.parse(saved) : []
        
        if (!completedExercises.includes("lectura")) {
          completedExercises.push("lectura")
          localStorage.setItem("completedExercises", JSON.stringify(completedExercises))
        }
      } catch (e) {
        console.error("Error updating completedExercises:", e)
      }
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

      <div className="container max-w-full mx-auto px-6 py-8 flex-1 flex flex-col">
        <Card className="border-none shadow-lg flex-1 flex flex-col w-full max-w-6xl mx-auto">
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

          <CardContent className="flex-1 flex flex-col justify-between py-6">
            <div className="space-y-6">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Lee en voz alta el siguiente texto. Pulsa el botón para comenzar a grabar tu voz.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-lg leading-relaxed">{textoLectura}</p>
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
            </div>

            <div className="space-y-4 mt-6">
              {!completed ? (
                <Button 
                  onClick={recording ? stopRecording : startRecording}
                  className={recording ? "w-full h-14 text-white font-medium bg-red-500 hover:bg-red-600" : "w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"}
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
                  className="w-full h-14 text-white font-medium bg-[#3876F4] hover:bg-[#3876F4]/90"
                  onClick={handleContinue}
                >
                  <ArrowRight className="mr-2 h-5 w-5" /> Continuar con la siguiente prueba
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