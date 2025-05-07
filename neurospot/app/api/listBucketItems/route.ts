import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Inicializar el cliente de S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function GET() {
  try {
    // Verificar las credenciales de AWS
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials are not configured' },
        { status: 500 }
      );
    }

    // Configurar el nombre del bucket
    const bucketName = 'neurospot-data';

    // Listar objetos en el bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'videos/'
    });

    const listResponse = await s3Client.send(listCommand);
    
    // Procesar la respuesta
    const items = await Promise.all((listResponse.Contents || []).map(async (item) => {
      // Solo procesar si es un archivo JPG
      if (item.Key && item.Key.endsWith('.jpg')) {
        try {
          // Generar URL firmada para ver la imagen
          const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: item.Key
          });
          
          const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 }); // URL válida por 1 hora
          
          return {
            key: item.Key,
            size: item.Size || 0,
            lastModified: item.LastModified?.toISOString() || new Date().toISOString(),
            url: url
          };
        } catch (err) {
          console.error(`Error generando URL para ${item.Key}:`, err);
          return {
            key: item.Key || '',
            size: item.Size || 0,
            lastModified: item.LastModified?.toISOString() || new Date().toISOString()
          };
        }
      }
      return null;
    }));

    // Filtrar elementos nulos (no JPG)
    const validItems = items.filter(item => item !== null);

    return NextResponse.json({
      bucketName,
      itemCount: validItems.length,
      items: validItems
    });

  } catch (error: Error | unknown) {
    console.error('Error listing bucket items:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error listing bucket items';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 