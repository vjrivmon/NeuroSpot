import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from "next/server";

// Usar la región de Estocolmo para el bucket S3
const S3_REGION = 'eu-north-1'; // Región de Estocolmo para S3
// Rekognition seguirá usando eu-west-1 en el otro endpoint

export async function POST(request: Request) {
  console.log("[API] getSignedUrl - Procesando solicitud");
  
  try {
    const body = await request.json();
    const { fileName, fileType, bucket, purpose } = body;
    
    // Validación básica
    if (!fileName) {
      console.error("[API] getSignedUrl - Error: fileName no proporcionado");
      return NextResponse.json(
        { error: "Se requiere fileName" },
        { status: 400 }
      );
    }
    
    // Usar el bucket proporcionado en la solicitud o el predeterminado de las variables de entorno
    const bucketName = bucket || process.env.S3_BUCKET_NAME;
    
    if (!bucketName) {
      console.error("[API] getSignedUrl - Error: No se ha configurado S3_BUCKET_NAME");
      return NextResponse.json(
        { error: "Error de configuración: Bucket no definido" },
        { status: 500 }
      );
    }
    
    // Registrar para debug
    console.log(`[API] getSignedUrl - Generando URL para ${bucketName}/${fileName} (${fileType}) - Propósito: ${purpose || 'no especificado'}, Región: ${S3_REGION}`);

    // Credenciales AWS con región específica para S3
    const s3Client = new S3Client({
      region: S3_REGION, // Usamos Estocolmo para S3
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    // Configurar comando para subir archivo
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: fileType,
    });

    // Generar URL firmada
    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutos
    
    console.log(`[API] getSignedUrl - URL generada correctamente para ${bucketName}/${fileName}`);

    // Devolver éxito con la URL firmada y metadatos
    return NextResponse.json({
      url,
      bucket: bucketName,
      key: fileName,
      expiresIn: 300,
      region: S3_REGION
    });
    
  } catch (error) {
    console.error("[API] getSignedUrl - Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { 
        error: "Error al generar URL firmada",
        details: errorMessage,
        region: S3_REGION
      },
      { status: 500 }
    );
  }
} 