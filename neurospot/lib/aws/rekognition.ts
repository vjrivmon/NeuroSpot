import { 
  RekognitionClient, 
  DetectFacesCommand,
  DetectLabelsCommand,
  DetectTextCommand,
  RecognizeCelebritiesCommand,
  DetectModerationLabelsCommand,
  Image
} from '@aws-sdk/client-rekognition';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { awsConfig } from './config';

// Inicializar el cliente de Rekognition con verificación de entorno
const rekognitionClient = new RekognitionClient({
  region: 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Inicializar el cliente de S3
const s3Client = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Nombre del bucket S3
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'neurospot-data';

// Función para convertir un archivo a formato Base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Extraer solo la parte de datos Base64 (eliminar el prefijo 'data:image/...;base64,')
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
}

// Función para guardar una imagen en S3
export async function saveImageToS3(imageBase64: string, userId: string, fileType: string = 'jpg'): Promise<string> {
  try {
    const timestamp = new Date().getTime();
    const key = `images/${userId}/${timestamp}.${fileType}`;
    
    // Convertir Base64 a Buffer
    const buffer = Buffer.from(imageBase64, 'base64');
    
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: `image/${fileType}`,
    };
    
    await s3Client.send(new PutObjectCommand(params));
    
    // Devolver la URL del objeto en S3
    return `s3://${S3_BUCKET_NAME}/${key}`;
  } catch (error) {
    console.error('Error al guardar imagen en S3:', error);
    throw error;
  }
}

// Función para preparar la imagen para enviar a Rekognition
export function prepareImage(imageBase64: string): Image {
  try {
    console.log(`[Rekognition] Preparando imagen base64 de longitud ${imageBase64.length}`);
    
    // Verificar si el base64 tiene el prefijo (data:image/jpeg;base64,) y eliminarlo
    let base64Data = imageBase64;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
      console.log(`[Rekognition] Prefijo de datos encontrado y eliminado`);
    }
    
    // Verificar que los datos son válidos
    if (!base64Data || base64Data.trim().length === 0) {
      throw new Error("Los datos base64 son inválidos o están vacíos");
    }
    
    // Convertir a Uint8Array (método directo más seguro que atob)
    const buffer = Buffer.from(base64Data, 'base64');
    
    if (buffer.length === 0) {
      throw new Error("El buffer de imagen está vacío después de decodificar");
    }
    
    console.log(`[Rekognition] Buffer de imagen creado correctamente: ${buffer.length} bytes`);
    
    return {
      Bytes: buffer
    };
  } catch (error) {
    console.error('[Rekognition] Error al preparar imagen:', error);
    throw new Error(`Error al preparar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Función para detectar caras en una imagen
export async function detectFaces(imageBase64: string) {
  try {
    const image = prepareImage(imageBase64);
    const command = new DetectFacesCommand({
      Image: image,
      Attributes: ['ALL']
    });
    
    const response = await rekognitionClient.send(command);
    return response.FaceDetails;
  } catch (error) {
    console.error('Error al detectar caras:', error);
    throw error;
  }
}

// Función para detectar objetos y escenas en una imagen
export async function detectLabels(imageBase64: string) {
  try {
    const image = prepareImage(imageBase64);
    const command = new DetectLabelsCommand({
      Image: image,
      MaxLabels: 10,
      MinConfidence: 70
    });
    
    const response = await rekognitionClient.send(command);
    return response.Labels;
  } catch (error) {
    console.error('Error al detectar etiquetas:', error);
    throw error;
  }
}

// Función para detectar texto en una imagen
export async function detectText(imageBase64: string) {
  try {
    const image = prepareImage(imageBase64);
    const command = new DetectTextCommand({
      Image: image
    });
    
    const response = await rekognitionClient.send(command);
    return response.TextDetections;
  } catch (error) {
    console.error('Error al detectar texto:', error);
    throw error;
  }
}

// Función para reconocer celebridades en una imagen
export async function recognizeCelebrities(imageBase64: string) {
  try {
    const image = prepareImage(imageBase64);
    const command = new RecognizeCelebritiesCommand({
      Image: image
    });
    
    const response = await rekognitionClient.send(command);
    return {
      celebrities: response.CelebrityFaces,
      unrecognized: response.UnrecognizedFaces
    };
  } catch (error) {
    console.error('Error al reconocer celebridades:', error);
    throw error;
  }
}

// Función para detectar contenido inapropiado
export async function detectModerationLabels(imageBase64: string) {
  try {
    const image = prepareImage(imageBase64);
    const command = new DetectModerationLabelsCommand({
      Image: image,
      MinConfidence: 60
    });
    
    const response = await rekognitionClient.send(command);
    return response.ModerationLabels;
  } catch (error) {
    console.error('Error al detectar contenido inapropiado:', error);
    throw error;
  }
} 