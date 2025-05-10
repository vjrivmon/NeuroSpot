import { NextRequest, NextResponse } from 'next/server';
import { startTranscriptionJob, getTranscriptionResult } from '@/lib/aws/transcribe';
import { calculateReadingAccuracy } from '@/lib/aws/comprehend';
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

// POST para iniciar la transcripción
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const originalText = formData.get('originalText') as string;
    const userId = formData.get('userId') as string || 'anonymous';
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo de audio' },
        { status: 400 }
      );
    }
    
    if (!originalText) {
      return NextResponse.json(
        { error: 'No se proporcionó el texto original' },
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
    
    await startTranscriptionJob(s3AudioUrl, jobName);
    
    return NextResponse.json({
      success: true,
      message: 'Trabajo de transcripción iniciado',
      jobName,
    });
  } catch (error) {
    console.error('Error en la transcripción:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// GET para obtener el resultado de la transcripción
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobName = searchParams.get('jobName');
    const originalText = searchParams.get('originalText');
    
    if (!jobName) {
      return NextResponse.json(
        { error: 'No se proporcionó el nombre del trabajo' },
        { status: 400 }
      );
    }
    
    if (!originalText) {
      return NextResponse.json(
        { error: 'No se proporcionó el texto original' },
        { status: 400 }
      );
    }
    
    // Obtener resultado de la transcripción
    const transcribedText = await getTranscriptionResult(jobName);
    
    if (!transcribedText) {
      return NextResponse.json({
        success: true,
        status: 'IN_PROGRESS',
        message: 'El trabajo de transcripción aún está en proceso',
      });
    }
    
    // Calcular precisión de lectura con Comprehend
    const accuracy = await calculateReadingAccuracy(originalText, transcribedText);
    
    return NextResponse.json({
      success: true,
      status: 'COMPLETED',
      transcribedText,
      accuracy,
      originalText,
    });
  } catch (error) {
    console.error('Error al obtener resultado de transcripción:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 