import { NextRequest, NextResponse } from 'next/server';
import { startTranscriptionJob, getTranscriptionResult } from '@/lib/aws/transcribe';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { awsConfig } from '@/lib/aws/config';
import https from 'https';

// Configuración común para los clientes
const region = 'eu-north-1'; // Usar la región donde está creado el bucket
const httpOptions = {
  agent: new https.Agent({
    keepAlive: true,
    timeout: 50000,
    keepAliveMsecs: 3000
  })
};

// Cliente de S3
const s3Client = new S3Client({
  ...awsConfig,
  region,
  requestHandler: { httpOptions }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'neurospot-data';

// Interfaces para los tipos que esperamos recibir
interface AudioProcessingResult {
  jobId: string;
  sentiment: string;
}

// Función para traducir el sentimiento técnico a una emoción humana
function traducirSentimiento(sentiment: string | undefined | null): string {
  if (!sentiment) {
    return 'neutro'; // Valor por defecto si no hay sentimiento
  }
  
  switch (sentiment.toUpperCase()) {
    case 'POSITIVE':
      return 'alegre';
    case 'NEGATIVE':
      return 'triste';
    case 'NEUTRAL':
      return 'neutro';
    case 'MIXED':
      return 'emociones mixtas';
    default:
      return 'neutro';
  }
}

// POST para iniciar la transcripción
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const userId = formData.get('userId') as string || 'anonymous';
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo de audio' },
        { status: 400 }
      );
    }
    
    // Subir el audio a S3
    const timestamp = new Date().getTime();
    const key = `audio-files/${userId}/${timestamp}.wav`;
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'audio/wav',
    }));
    
    // Iniciar trabajo de transcripción
    const jobName = `transcription-${userId}-${timestamp}`;
    const s3AudioUrl = `s3://${S3_BUCKET_NAME}/${key}`;
    
    // Usamos any para evitar problemas con el compilador, luego haremos una comprobación segura
    const result: any = await startTranscriptionJob(s3AudioUrl, jobName);
    
    // Información que devolveremos
    let jobId = jobName;
    let sentiment = 'NEUTRAL';
    
    // Si el resultado parece ser un objeto con las propiedades esperadas
    if (result && typeof result === 'object') {
      if ('jobId' in result) {
        jobId = result.jobId;
      }
      if ('sentiment' in result) {
        sentiment = result.sentiment;
      }
    } else if (typeof result === 'string') {
      // Si el resultado es un string, lo usamos como jobId
      jobId = result;
    }
    
    const emocion = traducirSentimiento(sentiment);
    
    return NextResponse.json({
      success: true,
      message: 'Audio subido correctamente',
      jobName: jobId,
      sentiment: sentiment,
      emocion: emocion
    });
  } catch (error) {
    console.error('Error al procesar el audio:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// GET para obtener el resultado del análisis de tono
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobName = searchParams.get('jobName');
    
    if (!jobName) {
      return NextResponse.json(
        { error: 'No se proporcionó el nombre del trabajo' },
        { status: 400 }
      );
    }
    
    // Obtener resultado del análisis - usamos any temporalmente
    const result: any = await getTranscriptionResult(jobName);
    
    if (!result) {
      return NextResponse.json({
        success: true,
        status: 'IN_PROGRESS',
        message: 'El análisis del audio aún está en proceso',
      });
    }
    
    // Información que devolveremos
    let sentiment = 'NEUTRAL';
    
    // Si el resultado parece ser un objeto con sentiment
    if (result && typeof result === 'object' && 'sentiment' in result) {
      sentiment = result.sentiment;
    } else if (typeof result === 'string') {
      // Si el resultado es un string, podría ser directamente el sentimiento
      // (aunque es un caso poco probable)
      sentiment = result;
    }
    
    const emocion = traducirSentimiento(sentiment);
    
    return NextResponse.json({
      success: true,
      status: 'COMPLETED',
      message: 'Audio procesado correctamente',
      sentiment: sentiment,
      emocion: emocion
    });
  } catch (error) {
    console.error('Error al obtener resultado del análisis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 