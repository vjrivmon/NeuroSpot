'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, AlertTriangle } from 'lucide-react';

type AnalysisResult = {
  faces?: any[];
  labels?: any[];
  text?: any[];
  error?: string;
};

export default function ImageAnalyzer() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('faces');
  const [apiError, setApiError] = useState<string | null>(null);

  // Función para convertir un archivo a formato Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (reader.result) {
          // Extraer solo la parte de datos Base64 (eliminar el prefijo 'data:image/...;base64,')
          const base64String = reader.result.toString();
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        } else {
          reject(new Error('Error al leer el archivo'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Manejar la selección de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Crear una URL para la vista previa
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // Limpiar resultados anteriores
      setAnalysisResult(null);
      setApiError(null);
    }
  };

  // Analizar la imagen seleccionada con el API de Rekognition
  const analyzeImage = async (type: string) => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setActiveTab(type);
    setApiError(null);
    
    try {
      const base64Data = await fileToBase64(selectedImage);
      let operation;
      
      switch (type) {
        case 'faces':
          operation = 'detectFaces';
          break;
        case 'labels':
          operation = 'detectLabels';
          break;
        case 'text':
          operation = 'detectText';
          break;
        default:
          throw new Error('Tipo de análisis no válido');
      }
      
      // Llamar al endpoint de la API
      const response = await fetch('/api/rekognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          operation: operation
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el servidor');
      }
      
      const data = await response.json();
      
      const result: AnalysisResult = {};
      if (operation === 'detectFaces') {
        result.faces = data.faceDetails;
      } else if (operation === 'detectLabels') {
        result.labels = data.labels;
      } else if (operation === 'detectText') {
        result.text = data.textDetections;
      }
      
      setAnalysisResult(result);
    } catch (error: any) {
      console.error('Error al analizar la imagen:', error);
      const errorMsg = error.message || 'Error al procesar la imagen';
      
      // Mostrar un mensaje de error más detallado
      const errorMsgDetail = errorMsg.includes('ENOTFOUND') 
        ? 'Error de conexión a AWS. Verifica tu conexión a internet y la región configurada.'
        : errorMsg.includes('credentials') 
          ? 'Error de credenciales AWS. Verifica tus claves de acceso.'
          : errorMsg;
      
      setApiError(errorMsgDetail);
      setAnalysisResult({ error: 'Hubo un error al analizar la imagen. Por favor, inténtalo de nuevo.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Renderizar resultados según el tipo de análisis
  const renderResults = () => {
    if (!analysisResult) return null;
    if (analysisResult.error) return <p className="text-red-500">{analysisResult.error}</p>;
    
    switch (activeTab) {
      case 'faces':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-2">Rostros Detectados: {analysisResult.faces?.length || 0}</h3>
            {analysisResult.faces && analysisResult.faces.length > 0 ? (
              <ul className="space-y-2">
                {analysisResult.faces.map((face, index) => (
                  <li key={index} className="border p-2 rounded">
                    <p>Confianza: {face.Confidence.toFixed(2)}%</p>
                    {face.Gender && <p>Género: {face.Gender.Value} (Confianza: {face.Gender.Confidence.toFixed(2)}%)</p>}
                    {face.AgeRange && <p>Edad aproximada: {face.AgeRange.Low}-{face.AgeRange.High} años</p>}
                    {face.Emotions && face.Emotions.length > 0 && (
                      <p>Emoción principal: {face.Emotions[0].Type} (Confianza: {face.Emotions[0].Confidence.toFixed(2)}%)</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No se detectaron rostros en la imagen.</p>
            )}
          </div>
        );
        
      case 'labels':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-2">Elementos Detectados: {analysisResult.labels?.length || 0}</h3>
            {analysisResult.labels && analysisResult.labels.length > 0 ? (
              <ul className="space-y-1">
                {analysisResult.labels.map((label, index) => (
                  <li key={index}>
                    {label.Name}: {label.Confidence.toFixed(2)}%
                  </li>
                ))}
              </ul>
            ) : (
              <p>No se detectaron elementos en la imagen.</p>
            )}
          </div>
        );
        
      case 'text':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-2">Texto Detectado:</h3>
            {analysisResult.text && analysisResult.text.length > 0 ? (
              <ul className="space-y-1">
                {analysisResult.text.map((textItem, index) => (
                  <li key={index}>
                    {textItem.DetectedText} (Confianza: {textItem.Confidence.toFixed(2)}%)
                  </li>
                ))}
              </ul>
            ) : (
              <p>No se detectó texto en la imagen.</p>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Analizador de Imágenes con AWS Rekognition</CardTitle>
        <CardDescription>
          Sube una imagen para analizarla con tecnología de reconocimiento visual de AWS
        </CardDescription>
        
        {apiError && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error de API</p>
              <p className="text-sm">{apiError}</p>
              <p className="text-xs mt-1">
                Asegúrate de que las credenciales AWS estén configuradas correctamente en el servidor.
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="image-upload" className="text-sm font-medium">
              Selecciona una imagen
            </label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer"
            />
          </div>
          
          {imagePreview && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Vista previa</h3>
              <div className="relative w-full h-64 border rounded overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
          
          {selectedImage && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="faces" onClick={() => analyzeImage('faces')}>
                  Rostros
                </TabsTrigger>
                <TabsTrigger value="labels" onClick={() => analyzeImage('labels')}>
                  Objetos
                </TabsTrigger>
                <TabsTrigger value="text" onClick={() => analyzeImage('text')}>
                  Texto
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-4 min-h-[200px]">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Analizando imagen...</p>
                  </div>
                ) : (
                  renderResults()
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Desarrollado con AWS Rekognition
        </p>
      </CardFooter>
    </Card>
  );
} 