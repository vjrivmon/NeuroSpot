import { 
  RekognitionClient, 
  DetectFacesCommand,
  DetectFacesCommandInput
} from "@aws-sdk/client-rekognition";
import { 
  S3Client, 
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { Readable } from "stream";

// Configuración de regiones
const S3_SOURCE_REGION = 'eu-north-1'; // Estocolmo (donde está el bucket original)
const AWS_REKOGNITION_REGION = 'eu-west-1'; // Irlanda (donde funciona Rekognition)

export async function POST(request: Request) {
  console.log("[API] analyzeImage - Procesando solicitud");
  
  try {
    const body = await request.json();
    const { bucket: sourceBucket, key: sourceKey, image: imageBase64 } = body;
    
    // Si nos proporcionan directamente la imagen en base64, la usamos (método preferido)
    if (imageBase64) {
      console.log(`[API] analyzeImage - Analizando imagen proporcionada directamente en base64`);
      
      // Verificar si el base64 tiene prefijo (data:image/jpeg;base64,)
      let base64Data = imageBase64;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
      
      // Convertir base64 a buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Cliente de Rekognition (en Irlanda)
      const rekognitionClient = new RekognitionClient({
        region: AWS_REKOGNITION_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });

      // Configurar comando para análisis directo del buffer de imagen
      const params: DetectFacesCommandInput = {
        Image: {
          Bytes: imageBuffer
        },
        Attributes: ["ALL"] // Solicitar todos los atributos disponibles
      };

      console.log(`[API] analyzeImage - Enviando imagen en base64 a Rekognition (${Math.round(imageBuffer.length / 1024)} KB)`);
      
      const command = new DetectFacesCommand(params);
      const response = await rekognitionClient.send(command);
      
      // Verificar si hay rostros detectados
      const hasFace = response.FaceDetails && response.FaceDetails.length > 0;
      const faceDetails = hasFace ? response.FaceDetails[0] : null;
      
      console.log(`[API] analyzeImage - Análisis de base64 completado - Rostros detectados: ${hasFace ? 'Sí' : 'No'}`);
      
      if (hasFace && faceDetails) {
        console.log(`[API] analyzeImage - Rostro detectado con confianza: ${faceDetails.Confidence?.toFixed(2)}%`);
        
        // Log detallado para depuración (solo en desarrollo)
        if (process.env.NODE_ENV !== 'production') {
          // Mostrar detalles de pose
          if (faceDetails.Pose) {
            console.log(`[API] analyzeImage - POSE: Yaw=${faceDetails.Pose.Yaw?.toFixed(2)}° (horizontal), Pitch=${faceDetails.Pose.Pitch?.toFixed(2)}° (vertical), Roll=${faceDetails.Pose.Roll?.toFixed(2)}° (inclinación)`);
          }
          
          // Estado de los ojos
          console.log(`[API] analyzeImage - OJOS: Abiertos=${faceDetails.EyesOpen?.Value ? 'Sí' : 'No'} (confianza: ${faceDetails.EyesOpen?.Confidence?.toFixed(2)}%)`);
          
          // Emociones principales (top 3)
          if (faceDetails.Emotions && faceDetails.Emotions.length > 0) {
            const sortedEmotions = [...faceDetails.Emotions].sort((a, b) => (b.Confidence || 0) - (a.Confidence || 0));
            const topEmotions = sortedEmotions.slice(0, 3).map(e => `${e.Type}=${e.Confidence?.toFixed(2)}%`).join(', ');
            console.log(`[API] analyzeImage - EMOCIONES TOP: ${topEmotions}`);
          }
        }
      }
      
      // Devolver resultados del análisis
      return NextResponse.json({
        success: true,
        hasFace,
        faceDetails,
        imageInfo: {
          analysisMethod: "direct_base64",
          rekognitionRegion: AWS_REKOGNITION_REGION
        }
      });
    }
    
    // Validación para método alternativo (obtención desde S3)
    if (!sourceBucket || !sourceKey) {
      console.error("[API] analyzeImage - Error: faltan parámetros bucket o key");
      return NextResponse.json(
        { error: "Se requieren los parámetros bucket, key o image (base64)" },
        { status: 400 }
      );
    }
    
    // Si llegamos aquí, intentamos obtener la imagen del bucket y analizarla
    console.log(`[API] analyzeImage - Obteniendo imagen de S3: ${sourceBucket}/${sourceKey}`);
    
    // Cliente S3 para la región de origen
    const s3Client = new S3Client({
      region: S3_SOURCE_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    // Obtener la imagen de S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: sourceBucket,
      Key: sourceKey
    });
    
    const s3Response = await s3Client.send(getObjectCommand);
    
    if (!s3Response.Body) {
      throw new Error("No se pudo obtener el cuerpo de la imagen desde S3");
    }
    
    // Convertir el stream a buffer
    const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    };
    
    // @ts-ignore - Ignorar error de tipo en Body
    const imageBuffer = await streamToBuffer(s3Response.Body);
    
    console.log(`[API] analyzeImage - Imagen obtenida de S3, tamaño: ${Math.round(imageBuffer.length / 1024)} KB`);
    
    // Cliente de Rekognition (en Irlanda)
    const rekognitionClient = new RekognitionClient({
      region: AWS_REKOGNITION_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    // Configurar comando para análisis con la imagen obtenida de S3
    const params: DetectFacesCommandInput = {
      Image: {
        Bytes: imageBuffer
      },
      Attributes: ["ALL"] // Solicitar todos los atributos disponibles
    };

    console.log(`[API] analyzeImage - Enviando imagen a Rekognition`);
    
    const command = new DetectFacesCommand(params);
    const response = await rekognitionClient.send(command);
    
    // Verificar si hay rostros detectados
    const hasFace = response.FaceDetails && response.FaceDetails.length > 0;
    const faceDetails = hasFace ? response.FaceDetails[0] : null;
    
    console.log(`[API] analyzeImage - Análisis S3 completado - Rostros detectados: ${hasFace ? 'Sí' : 'No'}`);
    
    if (hasFace && faceDetails) {
      console.log(`[API] analyzeImage - Rostro detectado con confianza: ${faceDetails.Confidence?.toFixed(2)}%`);
      
      // Log detallado para depuración (solo en desarrollo)
      if (process.env.NODE_ENV !== 'production') {
        // Mostrar detalles de pose
        if (faceDetails.Pose) {
          console.log(`[API] analyzeImage - POSE: Yaw=${faceDetails.Pose.Yaw?.toFixed(2)}° (horizontal), Pitch=${faceDetails.Pose.Pitch?.toFixed(2)}° (vertical), Roll=${faceDetails.Pose.Roll?.toFixed(2)}° (inclinación)`);
        }
        
        // Estado de los ojos
        console.log(`[API] analyzeImage - OJOS: Abiertos=${faceDetails.EyesOpen?.Value ? 'Sí' : 'No'} (confianza: ${faceDetails.EyesOpen?.Confidence?.toFixed(2)}%)`);
        
        // Emociones principales (top 3)
        if (faceDetails.Emotions && faceDetails.Emotions.length > 0) {
          const sortedEmotions = [...faceDetails.Emotions].sort((a, b) => (b.Confidence || 0) - (a.Confidence || 0));
          const topEmotions = sortedEmotions.slice(0, 3).map(e => `${e.Type}=${e.Confidence?.toFixed(2)}%`).join(', ');
          console.log(`[API] analyzeImage - EMOCIONES TOP: ${topEmotions}`);
        }
      }
    }
    
    // Devolver resultados del análisis
    return NextResponse.json({
      success: true,
      hasFace,
      faceDetails,
      imageInfo: {
        bucket: sourceBucket,
        key: sourceKey,
        analysisMethod: "s3_to_buffer",
        sourceRegion: S3_SOURCE_REGION,
        rekognitionRegion: AWS_REKOGNITION_REGION
      }
    });
    
  } catch (error) {
    console.error("[API] analyzeImage - Error:", error);
    
    // Extraer más información para debugging
    const errorDetails = {
      message: (error as Error).message,
      name: (error as Error).name,
      stack: (error as Error).stack,
      sourceRegion: S3_SOURCE_REGION,
      rekognitionRegion: AWS_REKOGNITION_REGION
    };
    
    console.error("[API] analyzeImage - Detalles del error:", JSON.stringify(errorDetails));
    
    return NextResponse.json(
      { 
        error: "Error al analizar imagen con Rekognition",
        details: errorDetails.message,
        regions: {
          source: S3_SOURCE_REGION,
          rekognition: AWS_REKOGNITION_REGION
        }
      },
      { status: 500 }
    );
  }
} 