'use client';

import React from 'react';
import ImageAnalyzer from '../../components/image-analyzer';
import Link from 'next/link';

export default function ReconocimientoVisualPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Reconocimiento Visual</h1>
      <p className="text-center mb-8 text-gray-600 max-w-2xl mx-auto">
        Esta herramienta utiliza la tecnología AWS Rekognition para analizar imágenes 
        y detectar rostros, objetos y texto con alta precisión.
      </p>
      
      <ImageAnalyzer />
      
      <div className="mt-12 max-w-2xl mx-auto">
        <details className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          <summary className="font-medium cursor-pointer">Información sobre esta función</summary>
          <div className="mt-3 space-y-2">
            <p>
              La información detectada en las imágenes es procesada por AWS Rekognition y 
              no se almacena permanentemente en nuestros servidores.
            </p>
            <h3 className="font-medium mt-4">Solución de problemas</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Si recibes errores de API, verifica que las credenciales AWS estén correctamente configuradas.</li>
              <li>La aplicación requiere que Next.js se ejecute en modo de desarrollo o producción completo (no como exportación estática).</li>
              <li>Para más información, consulta la <Link href="https://aws.amazon.com/rekognition/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">documentación de AWS Rekognition</Link>.</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
} 