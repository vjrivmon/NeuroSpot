'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export default function TestS3Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{success: boolean, message: string, url?: string} | null>(null);

  const runConnectionTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/testS3Connection');
      const data = await response.json();
      console.log('Resultados del test de conexión:', data);
      setResults(data);
    } catch (error) {
      console.error('Error al realizar prueba de conexión:', error);
      setResults({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        results: {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar el test al montar el componente
  useEffect(() => {
    runConnectionTest();
  }, []);

  // Función para subir un archivo de prueba
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTestFile(e.target.files[0]);
    }
  };

  const uploadTestFile = async () => {
    if (!testFile) return;
    
    setIsLoading(true);
    setUploadResult(null);
    
    try {
      // 1. Solicitar URL firmada
      const response = await fetch("/api/requestUploadUrl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: "test-session",
          frameId: Date.now()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error al solicitar URL: ${response.statusText}`);
      }
      
      const { uploadUrl, key } = await response.json();
      
      // 2. Subir archivo usando la URL firmada
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": testFile.type
        },
        body: testFile,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Error al subir archivo: ${uploadResponse.statusText}`);
      }
      
      setUploadResult({
        success: true,
        message: `Archivo subido con éxito como ${key}`,
        url: uploadUrl.split('?')[0] // URL base sin parámetros de firma
      });
      
    } catch (error) {
      console.error('Error al subir archivo de prueba:', error);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al subir archivo'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="container max-w-full mx-auto px-6 py-8 flex-1 flex flex-col">
        <Card className="border-none shadow-lg flex-1 flex flex-col w-full max-w-6xl mx-auto">
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Prueba de conexión S3</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runConnectionTest} 
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                Ejecutar prueba
              </Button>
            </div>
          </CardHeader>

          <CardContent className="py-6">
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">1. Diagnóstico de conexión</h2>
              
              {isLoading && !results ? (
                <div className="text-center py-6">
                  <div className="w-8 h-8 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p>Ejecutando pruebas de conexión...</p>
                </div>
              ) : !results ? (
                <p>No hay resultados disponibles</p>
              ) : (
                <div>
                  <div className={`mb-4 p-3 rounded-md ${results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={results.success ? 'text-green-700' : 'text-red-700'}>
                      Estado general: {results.success ? 'Conexión exitosa' : 'Hay problemas de conexión'}
                    </p>
                    <p className="text-sm mt-1">{results.message}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-3">
                      <h3 className="font-medium mb-2">Credenciales AWS</h3>
                      <div className={`text-sm p-2 rounded ${results.results.hasCredentials ? 'bg-green-50' : 'bg-red-50'}`}>
                        {results.results.hasCredentials ? (
                          <p>Credenciales configuradas correctamente</p>
                        ) : (
                          <p className="text-red-600">Credenciales AWS no configuradas</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Región: {results.results.awsRegion || 'No definida'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-3">
                      <h3 className="font-medium mb-2">Listado de buckets</h3>
                      <div className={`text-sm p-2 rounded ${results.results.listBuckets.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        {results.results.listBuckets.success ? (
                          <div>
                            <p className="text-green-600">Permisos correctos para listar buckets</p>
                            <p className="text-xs mt-1">Buckets disponibles:</p>
                            <ul className="list-disc list-inside text-xs mt-1">
                              {results.results.listBuckets.data?.length > 0 ? (
                                results.results.listBuckets.data.map((bucket: string, index: number) => (
                                  <li key={index}>{bucket}</li>
                                ))
                              ) : (
                                <li>No se encontraron buckets</li>
                              )}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-red-600">{results.results.listBuckets.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-3">
                      <h3 className="font-medium mb-2">Bucket neurospot-data</h3>
                      <div className={`text-sm p-2 rounded ${results.results.bucketExists.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        {results.results.bucketExists.success ? (
                          <p className="text-green-600">{results.results.bucketExists.message}</p>
                        ) : (
                          <p className="text-red-600">{results.results.bucketExists.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-3">
                      <h3 className="font-medium mb-2">Generación de URL firmada</h3>
                      <div className={`text-sm p-2 rounded ${results.results.canGenerateUrl.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        {results.results.canGenerateUrl.success ? (
                          <div>
                            <p className="text-green-600">{results.results.canGenerateUrl.message}</p>
                            <p className="text-xs mt-2 break-all font-mono">
                              {results.results.canGenerateUrl.url?.substring(0, 50)}...
                            </p>
                          </div>
                        ) : (
                          <p className="text-red-600">{results.results.canGenerateUrl.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">2. Subir archivo de prueba</h2>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <p className="text-sm mb-3">
                  Sube un archivo de prueba para verificar que puedes escribir en el bucket manualmente.
                </p>
                
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    className="flex-1 text-sm p-2 border rounded"
                    disabled={isLoading}
                  />
                  
                  <Button
                    onClick={uploadTestFile}
                    disabled={!testFile || isLoading}
                  >
                    {isLoading ? 'Subiendo...' : 'Subir archivo'}
                  </Button>
                </div>
              </div>
              
              {uploadResult && (
                <div className={`p-4 rounded-md ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={uploadResult.success ? 'text-green-700' : 'text-red-700'}>
                    {uploadResult.message}
                  </p>
                  {uploadResult.success && uploadResult.url && (
                    <p className="text-xs mt-2 font-mono break-all">
                      URL: {uploadResult.url}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 