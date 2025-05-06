import { 
  RekognitionClient, 
  DetectFacesCommand,
  DetectLabelsCommand,
  DetectTextCommand,
  RecognizeCelebritiesCommand,
  DetectModerationLabelsCommand,
  Image
} from '@aws-sdk/client-rekognition';
import { awsConfig } from './config';

// Inicializar el cliente de Rekognition con verificación de entorno
const rekognitionClient = new RekognitionClient({
  region: awsConfig.region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

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

// Función para preparar la imagen para enviar a Rekognition
export function prepareImage(imageBase64: string): Image {
  return {
    Bytes: Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
  };
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