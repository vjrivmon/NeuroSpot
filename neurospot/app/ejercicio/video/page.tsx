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
import { PauseCircle, Video, Camera, ArrowRight } from "lucide-react"

export default function VideoPage() {
  const [step, setStep] = useState<"instructions" | "recording" | "completed">("instructions")
  const [timeLeft, setTimeLeft] = useState(60) // 1 minuto de grabación
  const [progress, setProgress] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const router = useRouter()

  // Solicitar permiso para la cámara y comenzar la grabación
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        // Aquí podrías enviar el blob al servidor para análisis
        console.log("Video grabado:", blob);
        
        // Liberar recursos de la cámara
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorder.start();
      setCameraPermission(true);
      setStep("recording");
      
      // Iniciar el temporizador
      const intervalId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            stopRecording();
            setStep("completed");
            return 0;
          }
          setProgress(((60 - prev + 1) / 60) * 100);
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      setCameraPermission(false);
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

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between py-6">
            {step === "instructions" && (
              <div className="space-y-6 text-center flex-1 flex flex-col justify-center">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    En esta prueba analizaremos tus expresiones faciales y movimientos mientras realizas una actividad sencilla.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Necesitamos acceso a tu cámara. Por favor, siéntate derecho frente a la cámara en un lugar bien iluminado.
                  </p>
                </div>
                <Button 
                  className="w-full h-14 text-white font-medium"
                  onClick={startRecording}
                >
                  <Camera className="mr-2 h-5 w-5" /> Permitir acceso a la cámara
                </Button>
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
                      <p>No se pudo acceder a la cámara. Comprueba los permisos e inténtalo de nuevo.</p>
                    </div>
                  ) : (
                    <video 
                      ref={videoRef} 
                      className="absolute inset-0 w-full h-full object-cover"
                      playsInline
                      muted
                    />
                  )}
                </div>
              </div>
            )}

            {step === "completed" && (
              <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-3">¡Evaluación completada!</h2>
                  <p className="text-muted-foreground mb-6">
                    Hemos capturado y analizado tus expresiones faciales y patrones de movimiento para completar la evaluación.
                  </p>
                  
                  <Button 
                    className="w-full h-14 text-white font-medium"
                    onClick={completeExercise}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" /> Ver resultados
                  </Button>
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