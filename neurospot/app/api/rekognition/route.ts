import { NextResponse } from 'next/server';
import { 
  RekognitionClient, 
  DetectFacesCommand,
  DetectLabelsCommand,
  DetectTextCommand
} from '@aws-sdk/client-rekognition';
import https from 'https';

// Inicializar el cliente de Rekognition con variables de entorno del servidor
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  },
  // Configuración adicional para resolver problemas de DNS y conexión
  requestHandler: {
    httpOptions: {
      agent: new https.Agent({
        keepAlive: true,
        timeout: 50000,
        keepAliveMsecs: 3000
      })
    }
  }
});

export async function POST(request: Request) {
  try {
    const { image, operation } = await request.json();

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials are not configured' },
        { status: 500 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Decodificar la imagen base64
    const imageBuffer = Buffer.from(image, 'base64');
    
    let result;
    
    // Ejecutar la operación solicitada
    switch (operation) {
      case 'detectFaces':
        const detectFacesCommand = new DetectFacesCommand({
          Image: { Bytes: imageBuffer },
          Attributes: ['ALL']
        });
        result = await rekognitionClient.send(detectFacesCommand);
        return NextResponse.json({ faceDetails: result.FaceDetails });
        
      case 'detectLabels':
        const detectLabelsCommand = new DetectLabelsCommand({
          Image: { Bytes: imageBuffer },
          MaxLabels: 10,
          MinConfidence: 70
        });
        result = await rekognitionClient.send(detectLabelsCommand);
        return NextResponse.json({ labels: result.Labels });
        
      case 'detectText':
        const detectTextCommand = new DetectTextCommand({
          Image: { Bytes: imageBuffer }
        });
        result = await rekognitionClient.send(detectTextCommand);
        return NextResponse.json({ textDetections: result.TextDetections });
        
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in Rekognition API:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred during image analysis' },
      { status: 500 }
    );
  }
} 