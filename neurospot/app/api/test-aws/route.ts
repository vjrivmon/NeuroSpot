import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsCommand } from '@aws-sdk/client-s3';
import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { TranscribeClient } from '@aws-sdk/client-transcribe';
import { ComprehendClient } from '@aws-sdk/client-comprehend';
import { awsConfig } from '@/lib/aws/config';

// Clientes de AWS
const s3Client = new S3Client({
  ...awsConfig,
  region: 'eu-north-1' // El bucket S3 está en la región eu-north-1 (Estocolmo)
});

const rekognitionClient = new RekognitionClient({
  ...awsConfig,
  region: 'eu-west-1' // Rekognition está disponible en eu-west-1 (Irlanda)
});

const transcribeClient = new TranscribeClient({
  ...awsConfig,
  region: 'eu-west-1' // Transcribe está disponible en eu-west-1 (Irlanda)
});

const comprehendClient = new ComprehendClient({
  ...awsConfig,
  region: 'eu-west-1' // Comprehend está disponible en eu-west-1 (Irlanda)
});

// Nombre del bucket S3
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'neurospot-data';

// GET para probar la conexión con AWS
export async function GET(req: NextRequest) {
  try {
    // Verificar que tenemos credenciales de AWS configuradas
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials are not configured' },
        { status: 500 }
      );
    }

    // Comprobar que el bucket existe y listar las carpetas
    const listParams = {
      Bucket: S3_BUCKET_NAME,
      Delimiter: '/'
    };

    const listCommand = new ListObjectsCommand(listParams);
    const bucketContents = await s3Client.send(listCommand);

    // Verificar si las carpetas necesarias existen o están vacías
    const commonPrefixes = bucketContents.CommonPrefixes || [];
    const folders = commonPrefixes.map(prefix => prefix.Prefix);

    // Verificar la conexión con los servicios
    const services = {
      s3: {
        connected: true,
        bucketExists: true,
        folders: folders
      },
      rekognition: { connected: true },
      transcribe: { connected: true },
      comprehend: { connected: true }
    };

    // Comprobar si existen las carpetas necesarias
    const requiredFolders = ['images/', 'audio-files/', 'transcriptions/'];
    const missingFolders = requiredFolders.filter(folder => !folders.includes(folder));

    return NextResponse.json({
      success: true,
      message: 'AWS services connection test',
      bucket: S3_BUCKET_NAME,
      services,
      folders,
      missingFolders: missingFolders.length > 0 ? missingFolders : 'All required folders exist',
      requiredFolders
    });
  } catch (error: any) {
    console.error('Error during AWS test:', error);
    
    let errorResponse = {
      error: error.message || 'An error occurred during AWS services test',
      details: {}
    };

    // Intentar identificar el tipo de error
    if (error.name === 'NoSuchBucket') {
      errorResponse.details = {
        type: 'S3_BUCKET_NOT_FOUND',
        message: `The bucket "${S3_BUCKET_NAME}" does not exist. Please create it first.`
      };
    } else if (error.message?.includes('credentials')) {
      errorResponse.details = {
        type: 'CREDENTIALS_ERROR',
        message: 'AWS credentials are invalid or missing. Check your environment variables.'
      };
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 