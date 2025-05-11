import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand, HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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
  console.log("[API testS3Connection] Iniciando prueba de conexión S3");
  
  const results = {
    hasCredentials: false,
    awsRegion: '',
    listBuckets: { success: false, message: '', data: null as any },
    bucketExists: { success: false, message: '' },
    canGenerateUrl: { success: false, message: '', url: '' }
  };
  
  try {
    // 1. Verificar credenciales
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error("[API testS3Connection] Error: AWS credentials are not configured");
      return NextResponse.json({
        success: false,
        message: 'AWS credentials are not configured',
        results
      });
    }
    
    results.hasCredentials = true;
    results.awsRegion = process.env.AWS_REGION || 'eu-north-1';
    
    // 2. Listar buckets (prueba de permisos generales)
    console.log("[API testS3Connection] Listando buckets");
    try {
      const listBucketsResponse = await s3Client.send(new ListBucketsCommand({}));
      results.listBuckets.success = true;
      results.listBuckets.message = 'Successfully listed buckets';
      results.listBuckets.data = listBucketsResponse.Buckets?.map(b => b.Name) || [];
      console.log(`[API testS3Connection] Buckets listados con éxito: ${results.listBuckets.data.join(', ')}`);
    } catch (listError) {
      results.listBuckets.success = false;
      results.listBuckets.message = listError instanceof Error ? listError.message : 'Unknown error listing buckets';
      console.error(`[API testS3Connection] Error listando buckets: ${results.listBuckets.message}`);
    }
    
    // 3. Verificar si el bucket específico existe
    const bucketName = 'neurospot-data';
    console.log(`[API testS3Connection] Verificando existencia del bucket ${bucketName}`);
    
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      results.bucketExists.success = true;
      results.bucketExists.message = `Bucket ${bucketName} exists and is accessible`;
      console.log(`[API testS3Connection] ${results.bucketExists.message}`);
    } catch (bucketError) {
      results.bucketExists.success = false;
      results.bucketExists.message = bucketError instanceof Error ? bucketError.message : `Unable to access bucket ${bucketName}`;
      console.error(`[API testS3Connection] Error verificando bucket: ${results.bucketExists.message}`);
    }
    
    // 4. Intentar generar una URL firmada (prueba de permisos de escritura)
    if (results.bucketExists.success) {
      console.log("[API testS3Connection] Intentando generar URL firmada para prueba");
      try {
        const testKey = `test/connection-test-${Date.now()}.txt`;
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          ContentType: 'text/plain'
        });
        
        const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });
        results.canGenerateUrl.success = true;
        results.canGenerateUrl.message = `Successfully generated signed URL for ${testKey}`;
        results.canGenerateUrl.url = url;
        console.log(`[API testS3Connection] URL generada con éxito para ${testKey}`);
      } catch (urlError) {
        results.canGenerateUrl.success = false;
        results.canGenerateUrl.message = urlError instanceof Error ? urlError.message : 'Unknown error generating URL';
        console.error(`[API testS3Connection] Error generando URL firmada: ${results.canGenerateUrl.message}`);
      }
    }
    
    return NextResponse.json({
      success: results.hasCredentials && results.listBuckets.success && results.bucketExists.success && results.canGenerateUrl.success,
      message: 'S3 connection test completed',
      results
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during S3 connection test';
    console.error(`[API testS3Connection] Error general: ${errorMessage}`);
    
    return NextResponse.json({
      success: false,
      message: errorMessage,
      results
    }, { status: 500 });
  }
} 