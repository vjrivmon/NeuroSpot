import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

// Configuración de AWS con credenciales desde variables de entorno
export const awsConfig = {
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
}; 

// Busco el archivo para verificar su contenido 