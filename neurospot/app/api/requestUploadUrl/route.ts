import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Inicializar el cliente de S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function POST(request: Request) {
  console.log("[API requestUploadUrl] Iniciando solicitud de URL");
  
  try {
    // Verificar las credenciales de AWS
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error("[API requestUploadUrl] Error: AWS credentials are not configured");
      return NextResponse.json(
        { error: 'AWS credentials are not configured' },
        { status: 500 }
      );
    }

    console.log("[API requestUploadUrl] Credenciales AWS verificadas");
    
    // Verificar que el bucket existe
    const bucketName = 'neurospot-data';
    
    try {
      // Intentar verificar si el bucket existe
      console.log(`[API requestUploadUrl] Verificando existencia del bucket ${bucketName}`);
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log(`[API requestUploadUrl] Bucket ${bucketName} existe y es accesible`);
    } catch (bucketError) {
      console.error(`[API requestUploadUrl] Error verificando bucket: ${bucketError instanceof Error ? bucketError.message : 'Error desconocido'}`);
      return NextResponse.json(
        { error: `Bucket ${bucketName} no existe o no es accesible` },
        { status: 500 }
      );
    }
    
    // Obtener datos de la solicitud
    const data = await request.json().catch(() => ({}));
    const { sessionId, frameId } = data;
    
    console.log(`[API requestUploadUrl] Datos recibidos: sessionId=${sessionId}, frameId=${frameId}`);

    if (!sessionId || frameId === undefined) {
      console.error("[API requestUploadUrl] Error: Session ID and frame ID are required");
      return NextResponse.json(
        { error: 'Session ID and frame ID are required' },
        { status: 400 }
      );
    }

    // Configurar la clave del objeto en S3
    const key = `videos/${sessionId}/frame-${frameId}.jpg`;
    console.log(`[API requestUploadUrl] Generando URL para objeto: ${key}`);

    // Crear el comando para la operación putObject
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: 'image/jpeg'
    });

    // Generar URL firmada
    console.log("[API requestUploadUrl] Generando URL firmada...");
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    console.log("[API requestUploadUrl] URL firmada generada con éxito");

    // Retornar la URL firmada
    return NextResponse.json({ 
      uploadUrl,
      bucketName,
      key
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error generating upload URL';
    console.error(`[API requestUploadUrl] Error general: ${errorMessage}`);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 