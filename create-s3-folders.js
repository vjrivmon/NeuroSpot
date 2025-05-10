// Script para crear las carpetas necesarias en el bucket S3
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: './neurospot/.env.local' });

// Configuración del cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Nombre del bucket
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'neurospot-data';

// Carpetas a crear
const FOLDERS = [
  'images/',
  'audio-files/',
  'transcriptions/'
];

async function createFolders() {
  try {
    console.log(`Creando carpetas en el bucket: ${BUCKET_NAME}`);
    
    for (const folder of FOLDERS) {
      console.log(`Creando carpeta: ${folder}`);
      
      // En S3, las carpetas son objetos con una clave que termina en /
      const params = {
        Bucket: BUCKET_NAME,
        Key: folder,
        Body: '' // Carpetas vacías
      };
      
      await s3Client.send(new PutObjectCommand(params));
    }
    
    console.log('Todas las carpetas han sido creadas exitosamente.');
  } catch (error) {
    console.error('Error al crear las carpetas:', error);
    
    if (error.name === 'NoSuchBucket') {
      console.error(`El bucket "${BUCKET_NAME}" no existe. Por favor, créalo primero.`);
    } else if (error.message && error.message.includes('credentials')) {
      console.error('Las credenciales de AWS son inválidas o están ausentes. Verifica tus variables de entorno.');
    }
  }
}

// Ejecutar la función
createFolders(); 