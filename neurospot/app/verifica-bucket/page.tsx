'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, ArrowLeft } from "lucide-react";
import Link from 'next/link';

type BucketItem = {
  key: string;
  lastModified: string;
  size: number;
  url?: string;
};

type SessionData = {
  sessionId: string;
  frameCount: number;
  frames: BucketItem[];
};

export default function VerificaBucket() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const fetchBucketContent = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/listBucketItems', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener el contenido del bucket');
      }
      
      const data = await response.json();
      console.log('Datos del bucket:', data);
      
      // Organizar los items por sesión
      const sessionsMap: Record<string, BucketItem[]> = {};
      
      data.items.forEach((item: BucketItem) => {
        // Formato esperado: videos/{sessionId}/frame-{frameId}.jpg
        const parts = item.key.split('/');
        if (parts.length === 3 && parts[0] === 'videos') {
          const sessionId = parts[1];
          
          if (!sessionsMap[sessionId]) {
            sessionsMap[sessionId] = [];
          }
          
          sessionsMap[sessionId].push(item);
        }
      });
      
      // Convertir el mapa en un array de sesiones
      const sessionsArray: SessionData[] = Object.keys(sessionsMap).map(sessionId => {
        return {
          sessionId,
          frameCount: sessionsMap[sessionId].length,
          frames: sessionsMap[sessionId].sort((a, b) => {
            // Ordenar por número de frame (frame-X.jpg)
            const frameA = parseInt(a.key.split('frame-')[1].split('.')[0]);
            const frameB = parseInt(b.key.split('frame-')[1].split('.')[0]);
            return frameA - frameB;
          })
        };
      });
      
      setSessions(sessionsArray);
      
      // Seleccionar la sesión más reciente por defecto
      if (sessionsArray.length > 0 && !selectedSession) {
        // Ordenar por fecha de modificación (más reciente primero)
        const latestSession = sessionsArray.sort((a, b) => {
          const dateA = new Date(a.frames[0]?.lastModified || 0).getTime();
          const dateB = new Date(b.frames[0]?.lastModified || 0).getTime();
          return dateB - dateA;
        })[0];
        
        setSelectedSession(latestSession.sessionId);
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchBucketContent();
  }, []);

  // Obtener la sesión seleccionada
  const getSelectedSessionData = (): SessionData | undefined => {
    return sessions.find(session => session.sessionId === selectedSession);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="container max-w-full mx-auto px-6 py-8 flex-1 flex flex-col">
        <Card className="border-none shadow-lg flex-1 flex flex-col w-full max-w-6xl mx-auto">
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Verificación de Bucket S3</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchBucketContent} 
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  Actualizar
                </Button>
                <Link href="/panel">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <ArrowLeft size={16} />
                    Volver
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 py-6">
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-600">Error: {error}</p>
                <p className="text-sm text-red-500 mt-1">
                  Asegúrate de que las credenciales AWS estén configuradas correctamente y que el bucket exista.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchBucketContent}
                  className="mt-2"
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">
                    Bucket: neurospot-data
                  </h2>
                  <p className="text-sm text-gray-500">
                    Sesiones encontradas: {sessions.length}
                  </p>
                </div>

                {sessions.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-100 rounded-md p-6 text-center">
                    {isLoading ? (
                      <p>Cargando contenido del bucket...</p>
                    ) : (
                      <>
                        <p className="text-lg font-medium mb-2">No se encontraron sesiones</p>
                        <p className="text-sm text-gray-500 mb-4">
                          No hay imágenes subidas al bucket o el bucket está vacío.
                        </p>
                        <div className="flex justify-center">
                          <Link href="/ejercicio/video">
                            <Button>Probar ejercicio de video</Button>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <h3 className="font-medium">Sesiones</h3>
                      </div>
                      <div className="divide-y max-h-[500px] overflow-y-auto">
                        {sessions.map((session) => (
                          <div 
                            key={session.sessionId}
                            className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedSession === session.sessionId ? 'bg-blue-50' : ''}`}
                            onClick={() => setSelectedSession(session.sessionId)}
                          >
                            <div className="font-mono text-xs mb-1 truncate">{session.sessionId}</div>
                            <div className="flex justify-between text-sm">
                              <span>{session.frameCount} frames</span>
                              <span className="text-gray-500">{formatDate(session.frames[0]?.lastModified || '')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 border rounded-md overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <h3 className="font-medium">
                          {selectedSession ? (
                            <>
                              Detalles sesión: <span className="font-mono text-xs">{selectedSession}</span>
                            </>
                          ) : 'Selecciona una sesión'}
                        </h3>
                      </div>
                      
                      {selectedSession && getSelectedSessionData() ? (
                        <div>
                          <div className="p-3 border-b bg-gray-50">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Frames:</span>{' '}
                                <span className="font-medium">{getSelectedSessionData()?.frameCount}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Fecha:</span>{' '}
                                <span className="font-medium">
                                  {formatDate(getSelectedSessionData()?.frames[0]?.lastModified || '')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="max-h-[450px] overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left py-2 px-3 font-medium">Frame</th>
                                  <th className="text-left py-2 px-3 font-medium">Tamaño</th>
                                  <th className="text-left py-2 px-3 font-medium">Fecha</th>
                                  <th className="text-right py-2 px-3 font-medium">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {getSelectedSessionData()?.frames.map((frame, index) => (
                                  <tr key={frame.key} className="hover:bg-gray-50">
                                    <td className="py-2 px-3">
                                      {frame.key.split('/').pop()}
                                    </td>
                                    <td className="py-2 px-3 text-gray-500">
                                      {formatFileSize(frame.size)}
                                    </td>
                                    <td className="py-2 px-3 text-gray-500">
                                      {formatDate(frame.lastModified)}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      {frame.url ? (
                                        <a 
                                          href={frame.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline"
                                        >
                                          Ver
                                        </a>
                                      ) : (
                                        <span className="text-gray-400">No disponible</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          Selecciona una sesión para ver sus detalles
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 