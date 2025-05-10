import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig } from './config';
import https from 'https';

// Configuración común para los clientes
const s3Region = 'eu-north-1'; // El bucket S3 está en la región eu-north-1 (Estocolmo)
const transcribeRegion = 'eu-west-1'; // Transcribe está disponible en eu-west-1 (Irlanda)

const httpOptions = {
  agent: new https.Agent({
    keepAlive: true,
    timeout: 50000,
    keepAliveMsecs: 3000
  })
};

// Clientes de AWS
const transcribeClient = new TranscribeClient({
  ...awsConfig,
  region: transcribeRegion,
  requestHandler: { httpOptions }
});

const s3Client = new S3Client({
  ...awsConfig,
  region: s3Region,
  requestHandler: { httpOptions }
});

// Nombre del bucket S3 donde se almacenarán los archivos de audio
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'neurospot-data';

/**
 * Sube un archivo de audio a S3 y devuelve la URL
 * @param audioBlob Blob del audio a subir
 * @param userId ID del usuario para crear una ruta única
 * @returns URL del archivo en S3
 */
export async function uploadAudioToS3(audioBlob: Blob, userId: string): Promise<string> {
  const timestamp = new Date().getTime();
  const key = `audio-files/${userId}/${timestamp}.wav`;
  
  // Convertir el Blob a Buffer para subirlo a S3
  const arrayBuffer = await audioBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const uploadParams = {
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'audio/wav',
  };
  
  await s3Client.send(new PutObjectCommand(uploadParams));
  
  // Devolver la URL del objeto en S3
  return `s3://${S3_BUCKET_NAME}/${key}`;
}

/**
 * Crea una URL prefirmada para subir un archivo de audio directamente desde el cliente
 * @param userId ID del usuario para crear una ruta única
 * @returns URL prefirmada para la subida
 */
export async function getPresignedUploadUrl(userId: string): Promise<{ url: string, key: string }> {
  const timestamp = new Date().getTime();
  const key = `audio-files/${userId}/${timestamp}.wav`;
  
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    ContentType: 'audio/wav',
  });
  
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  return { url, key };
}

/**
 * Inicia un trabajo de transcripción con Amazon Transcribe
 * @param s3AudioUrl URL del audio en S3
 * @param jobName Nombre único para el trabajo de transcripción
 * @returns ID del trabajo de transcripción
 */
export async function startTranscriptionJob(s3AudioUrl: string, jobName: string): Promise<string> {
  try {
    console.log(`[TRANSCRIBE] Iniciando trabajo de transcripción con audioUrl=${s3AudioUrl}`);
    
    // Extraer el key del objeto de S3 de la URL
    const key = s3AudioUrl.replace(`s3://${S3_BUCKET_NAME}/`, '');
    console.log(`[TRANSCRIBE] Key extraído: ${key}`);
    
    // Primero, obtener el archivo de audio desde S3 en eu-north-1
    const getObjectCommand = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });
    
    console.log(`[TRANSCRIBE] Obteniendo audio de S3 (${s3Region})...`);
    const s3Response = await s3Client.send(getObjectCommand);
    
    if (!s3Response.Body) {
      throw new Error("[TRANSCRIBE] No se pudo obtener el archivo de audio desde S3");
    }
    
    // Leer el cuerpo de la respuesta como un Buffer
    console.log(`[TRANSCRIBE] Leyendo contenido del archivo...`);
    const audioBuffer = await s3Response.Body.transformToByteArray();
    console.log(`[TRANSCRIBE] Audio obtenido: ${audioBuffer.length} bytes`);
    
    // Volver a subir el archivo a S3 en la misma región que Transcribe (eu-west-1)
    const transcribeS3Client = new S3Client({
      ...awsConfig,
      region: transcribeRegion
    });
    
    // Crear un nuevo key en la región de Transcribe
    const transcribeKey = `transcribe-input/${jobName}.wav`;
    
    console.log(`[TRANSCRIBE] Subiendo audio a S3 en ${transcribeRegion}...`);
    await transcribeS3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: transcribeKey,
      Body: audioBuffer,
      ContentType: 'audio/wav'
    }));
    
    console.log(`[TRANSCRIBE] Audio subido con éxito a la región de Transcribe`);
    
    // Ahora iniciar el trabajo usando la URL en la región correcta
    const transcribeS3Url = `s3://${S3_BUCKET_NAME}/${transcribeKey}`;
    console.log(`[TRANSCRIBE] URL para Transcribe: ${transcribeS3Url}`);
    
    const params = {
      TranscriptionJobName: jobName,
      LanguageCode: 'es-ES' as const,
      Media: {
        MediaFileUri: transcribeS3Url
      },
      OutputBucketName: S3_BUCKET_NAME,
      OutputKey: `transcriptions/${jobName}.json`,
    };
    
    console.log(`[TRANSCRIBE] Enviando comando a AWS Transcribe...`);
    const command = new StartTranscriptionJobCommand(params);
    await transcribeClient.send(command);
    
    console.log(`[TRANSCRIBE] Trabajo iniciado correctamente: ${jobName}`);
    return jobName;
  } catch (error) {
    console.error("[TRANSCRIBE] Error al iniciar trabajo de transcripción:", error);
    throw error;
  }
}

/**
 * Obtiene el resultado de un trabajo de transcripción
 * @param jobName Nombre del trabajo de transcripción
 * @returns Resultado de la transcripción o null si aún no está completo
 */
export async function getTranscriptionResult(jobName: string): Promise<string | null> {
  const params = {
    TranscriptionJobName: jobName,
  };
  
  const command = new GetTranscriptionJobCommand(params);
  const response = await transcribeClient.send(command);
  
  if (response.TranscriptionJob?.TranscriptionJobStatus === 'COMPLETED') {
    // Si el trabajo está completo, descargar el resultado de S3
    const outputKey = `transcriptions/${jobName}.json`;
    
    const getObjectParams = {
      Bucket: S3_BUCKET_NAME,
      Key: outputKey,
    };
    
    // Usar el cliente S3 de la región donde se almacenan las transcripciones (eu-west-1)
    const transcribeS3Client = new S3Client({
      ...awsConfig,
      region: transcribeRegion
    });
    
    const getObjectCommand = new GetObjectCommand(getObjectParams);
    const objectResponse = await transcribeS3Client.send(getObjectCommand);
    
    if (objectResponse.Body) {
      const bodyData = await objectResponse.Body.transformToByteArray();
      const transcriptionText = new TextDecoder().decode(bodyData);
      const transcriptionResult = JSON.parse(transcriptionText);
      
      // Devolver solo el texto transcrito
      return transcriptionResult.results.transcripts[0].transcript;
    }
  }
  
  return null; // El trabajo aún no está completo
} 