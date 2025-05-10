import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ComprehendClient, DetectSentimentCommand } from '@aws-sdk/client-comprehend';
import { awsConfig } from './config';
import https from 'https';

// Configuración común para los clientes
const s3Region = 'eu-north-1'; // El bucket S3 está en la región eu-north-1 (Estocolmo)
const comprehendRegion = 'eu-west-1'; // Comprehend en región eu-west-1 (Irlanda)

const httpOptions = {
  agent: new https.Agent({
    keepAlive: true,
    timeout: 50000,
    keepAliveMsecs: 3000
  })
};

const s3Client = new S3Client({
  ...awsConfig,
  region: s3Region,
  requestHandler: { httpOptions }
});

const comprehendClient = new ComprehendClient({
  ...awsConfig,
  region: comprehendRegion,
  requestHandler: { httpOptions }
});

// Nombre del bucket S3 donde se almacenarán los archivos de audio
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'neurospot-data';

// Tipo de resultado para la transcripción y análisis
interface AudioProcessingResult {
  jobId: string;
  sentiment: string;
}

// Tipo de resultado para obtener datos
interface AudioAnalysisResult {
  status: string;
  sentiment: string;
}

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
 * Procesa el audio y detecta el tono de voz
 * @param s3AudioUrl URL del audio en S3
 * @param jobName Nombre único para la referencia del procesamiento
 * @returns ID de referencia del procesamiento con información del tono
 */
export async function startTranscriptionJob(s3AudioUrl: string, jobName: string): Promise<AudioProcessingResult> {
  try {
    console.log(`[AUDIO] Procesando audio con audioUrl=${s3AudioUrl}`);
    
    // Extraer el key del objeto de S3 de la URL
    const key = s3AudioUrl.replace(`s3://${S3_BUCKET_NAME}/`, '');
    console.log(`[AUDIO] Key extraído: ${key}`);
    
    // En un caso real, aquí harías la transcripción del audio
    // Para esta demo, vamos a simular que ya tenemos un texto
    const demoText = "Hola, estoy realizando una prueba de grabación de voz";
    
    // Detectar sentimiento usando Comprehend
    const sentiment = await detectSentiment(demoText);
    
    console.log(`[AUDIO] Procesamiento completado para audio ${key}`);
    console.log(`[AUDIO] Sentimiento detectado: ${sentiment}`);
    
    // Guardamos el resultado en S3
    const resultKey = `processings/${jobName}.json`;
    const resultData = JSON.stringify({
      jobName: jobName,
      status: "COMPLETED",
      audioUrl: s3AudioUrl,
      sentiment: sentiment
    });
    
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: resultKey,
      Body: resultData,
      ContentType: 'application/json'
    }));
    
    return { jobId: jobName, sentiment: sentiment };
  } catch (error) {
    console.error("[AUDIO] Error al procesar audio:", error);
    throw error;
  }
}

/**
 * Detecta el sentimiento/tono en un texto usando Amazon Comprehend
 * @param text Texto a analizar
 * @returns Sentimiento detectado (POSITIVE, NEGATIVE, NEUTRAL, MIXED)
 */
async function detectSentiment(text: string): Promise<string> {
  try {
    const command = new DetectSentimentCommand({
      Text: text,
      LanguageCode: 'es'
    });
    
    const response = await comprehendClient.send(command);
    return response.Sentiment || 'NEUTRAL';
  } catch (error) {
    console.error("[COMPREHEND] Error al detectar sentimiento:", error);
    return 'NEUTRAL';
  }
}

/**
 * Obtiene el resultado de un procesamiento de audio
 * @param jobName Nombre del trabajo de procesamiento
 * @returns Resultado del procesamiento o null si no existe
 */
export async function getTranscriptionResult(jobName: string): Promise<AudioAnalysisResult | null> {
  try {
    // Intentar obtener el resultado directamente de S3
    const outputKey = `processings/${jobName}.json`;
    
    const getObjectParams = {
      Bucket: S3_BUCKET_NAME,
      Key: outputKey,
    };
    
    const getObjectCommand = new GetObjectCommand(getObjectParams);
    const objectResponse = await s3Client.send(getObjectCommand);
    
    if (objectResponse.Body) {
      const bodyData = await objectResponse.Body.transformToByteArray();
      const resultText = new TextDecoder().decode(bodyData);
      const result = JSON.parse(resultText);
      
      // Devolver estado y sentimiento
      return {
        status: result.status,
        sentiment: result.sentiment
      };
    }
    
    return null;
  } catch (error) {
    console.error("[AUDIO] Error al obtener resultado del procesamiento:", error);
    return null;
  }
} 