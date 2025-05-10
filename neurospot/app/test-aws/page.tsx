"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Image, Mic, FileText } from "lucide-react";

export default function TestAWSPage() {
  const [activeTab, setActiveTab] = useState('status');
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>({
    image: null,
    audio: null,
    text: null
  });

  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test-aws');
      const data = await response.json();
      setStatusData(data);
    } catch (error) {
      console.error("Error al verificar el estado:", error);
      alert("Error al verificar el estado de AWS");
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (testType: 'image' | 'audio' | 'text') => {
    try {
      setTestResults(prev => ({
        ...prev,
        [testType]: { loading: true }
      }));

      const formData = new FormData();
      formData.append('testType', testType);

      const response = await fetch('/api/test-upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      setTestResults(prev => ({
        ...prev,
        [testType]: {
          loading: false,
          data
        }
      }));
    } catch (error) {
      console.error(`Error en la prueba de ${testType}:`, error);
      
      setTestResults(prev => ({
        ...prev,
        [testType]: {
          loading: false,
          error: error instanceof Error ? error.message : "Error desconocido"
        }
      }));
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Prueba de Servicios AWS</h1>
      
      <Tabs defaultValue="status" value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="status">Estado de la Configuración</TabsTrigger>
          <TabsTrigger value="tests">Pruebas de Funcionalidad</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Configuración de AWS</CardTitle>
              <CardDescription>Verifica la conexión con los servicios de AWS y la existencia del bucket S3 y las carpetas necesarias.</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Bucket S3</h3>
                      <p><span className="font-semibold">Nombre:</span> {statusData.bucket}</p>
                      <p><span className="font-semibold">Estado:</span> {statusData.services.s3.bucketExists ? "Existe" : "No existe"}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Servicios</h3>
                      <p>
                        <span className="font-semibold">Rekognition:</span> {statusData.services.rekognition.connected ? "Conectado" : "No conectado"}
                      </p>
                      <p>
                        <span className="font-semibold">Transcribe:</span> {statusData.services.transcribe.connected ? "Conectado" : "No conectado"}
                      </p>
                      <p>
                        <span className="font-semibold">Comprehend:</span> {statusData.services.comprehend.connected ? "Conectado" : "No conectado"}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Carpetas necesarias</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {statusData.requiredFolders.map((folder: string) => (
                        <div key={folder} className="flex items-center space-x-2 p-2 bg-gray-100 rounded dark:bg-gray-800">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span>{folder}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground mb-4">Haz clic en el botón para verificar el estado de configuración de AWS</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={checkStatus} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
                  </>
                ) : (
                  "Verificar Estado"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="h-5 w-5 mr-2 text-blue-500" />
                Prueba de Rekognition (Imágenes)
              </CardTitle>
              <CardDescription>
                Sube una imagen de prueba a la carpeta "images/" en S3 y realiza un análisis básico con Rekognition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.image ? (
                testResults.image.loading ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                    <p>Subiendo y analizando imagen...</p>
                  </div>
                ) : testResults.image.data ? (
                  <Alert className={testResults.image.data.success ? "bg-green-50 border-green-200 dark:bg-green-900/20" : "bg-red-50 border-red-200 dark:bg-red-900/20"}>
                    {testResults.image.data.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertTitle>
                      {testResults.image.data.success ? "Prueba exitosa" : "Error en la prueba"}
                    </AlertTitle>
                    <AlertDescription>
                      {testResults.image.data.message || testResults.image.data.error}
                      {testResults.image.data.success && (
                        <div className="mt-2 text-xs">
                          <p><span className="font-semibold">URL de imagen:</span> {testResults.image.data.imageUrl}</p>
                          <p><span className="font-semibold">Clave S3:</span> {testResults.image.data.imageKey}</p>
                          <p><span className="font-semibold">Etiquetas detectadas:</span> {testResults.image.data.rekognitionResult?.labels}</p>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{testResults.image.error}</AlertDescription>
                  </Alert>
                )
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Haz clic en el botón para iniciar la prueba de Rekognition</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => runTest('image')} 
                disabled={testResults.image?.loading} 
                className="w-full"
              >
                Probar Rekognition
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mic className="h-5 w-5 mr-2 text-blue-500" />
                Prueba de Transcribe (Audio)
              </CardTitle>
              <CardDescription>
                Sube un archivo de audio de prueba a la carpeta "audio-files/" en S3 e inicia un trabajo de transcripción.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.audio ? (
                testResults.audio.loading ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                    <p>Subiendo archivo de audio e iniciando transcripción...</p>
                  </div>
                ) : testResults.audio.data ? (
                  <Alert className={testResults.audio.data.success ? "bg-green-50 border-green-200 dark:bg-green-900/20" : "bg-red-50 border-red-200 dark:bg-red-900/20"}>
                    {testResults.audio.data.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertTitle>
                      {testResults.audio.data.success ? "Prueba exitosa" : "Error en la prueba"}
                    </AlertTitle>
                    <AlertDescription>
                      {testResults.audio.data.message || testResults.audio.data.error}
                      {testResults.audio.data.success && (
                        <div className="mt-2 text-xs">
                          <p><span className="font-semibold">URL de audio:</span> {testResults.audio.data.audioUrl}</p>
                          <p><span className="font-semibold">Clave S3:</span> {testResults.audio.data.audioKey}</p>
                          <p><span className="font-semibold">Trabajo de transcripción:</span> {testResults.audio.data.transcriptionJobName}</p>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{testResults.audio.error}</AlertDescription>
                  </Alert>
                )
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Haz clic en el botón para iniciar la prueba de Transcribe</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => runTest('audio')} 
                disabled={testResults.audio?.loading} 
                className="w-full"
              >
                Probar Transcribe
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                Prueba de Comprehend (Texto)
              </CardTitle>
              <CardDescription>
                Analiza un texto de ejemplo con Amazon Comprehend para detectar su idioma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.text ? (
                testResults.text.loading ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                    <p>Analizando texto con Comprehend...</p>
                  </div>
                ) : testResults.text.data ? (
                  <Alert className={testResults.text.data.success ? "bg-green-50 border-green-200 dark:bg-green-900/20" : "bg-red-50 border-red-200 dark:bg-red-900/20"}>
                    {testResults.text.data.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertTitle>
                      {testResults.text.data.success ? "Prueba exitosa" : "Error en la prueba"}
                    </AlertTitle>
                    <AlertDescription>
                      {testResults.text.data.message || testResults.text.data.error}
                      {testResults.text.data.success && (
                        <div className="mt-2 text-xs">
                          <p><span className="font-semibold">Texto analizado:</span> "{testResults.text.data.text}"</p>
                          <p>
                            <span className="font-semibold">Idiomas detectados:</span>
                            {testResults.text.data.detectedLanguages?.map((lang: any, i: number) => (
                              <span key={i} className="ml-1">
                                {lang.LanguageCode} ({Math.round(lang.Score * 100)}%)
                                {i < (testResults.text.data.detectedLanguages.length - 1) ? ',' : ''}
                              </span>
                            ))}
                          </p>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{testResults.text.error}</AlertDescription>
                  </Alert>
                )
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Haz clic en el botón para iniciar la prueba de Comprehend</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => runTest('text')} 
                disabled={testResults.text?.loading} 
                className="w-full"
              >
                Probar Comprehend
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 