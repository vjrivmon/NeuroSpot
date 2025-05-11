# Integración de Servicios AWS en NeuroSpot

Esta carpeta contiene la implementación de los servicios AWS para el análisis de imágenes y audio en NeuroSpot.

## Servicios implementados

- **AWS Rekognition**: Análisis de imágenes y reconocimiento facial
- **AWS Transcribe**: Transcripción de audio a texto
- **AWS Comprehend**: Análisis de texto y procesamiento de lenguaje natural

## Configuración

Para utilizar los servicios AWS, necesitas configurar las siguientes variables de entorno en el archivo `.env.local`:

```
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=neurospot-data
```

## Estructura del bucket S3

Todos los servicios utilizan el mismo bucket de S3 con la siguiente estructura de carpetas:

- **images/**: Almacena las imágenes para su análisis con Rekognition
- **audio-files/**: Almacena los archivos de audio para su transcripción con Transcribe
- **transcriptions/**: Almacena los resultados de las transcripciones de audio

## Arquitectura de la Implementación

La implementación utiliza un enfoque cliente-servidor para la seguridad de las credenciales AWS:

1. **Cliente (Browser)**: Los componentes React que permiten a los usuarios interactuar con la aplicación.

2. **API (Servidor)**: Endpoints de API de Next.js que se comunican con los servicios AWS y devuelven los resultados al cliente.

Este enfoque mantiene las credenciales de AWS seguras en el servidor y no las expone al cliente.

## Credenciales de AWS

Para obtener tus credenciales de AWS:

1. Crea una cuenta en [AWS](https://aws.amazon.com/) si aún no tienes una
2. Ve a la [Consola de IAM](https://console.aws.amazon.com/iam/)
3. Crea un usuario con los permisos necesarios (se detallan a continuación)
4. Genera y guarda las credenciales (Access Key ID y Secret Access Key)

## Configuración de servicios AWS

### 1. Configuración del Bucket S3

1. Accede a la [Consola de S3](https://s3.console.aws.amazon.com/)
2. Crea un nuevo bucket llamado `neurospot-data` (o el nombre que prefieras)
3. Configura los permisos del bucket:
   - Deshabilita el acceso público
   - Habilita el cifrado del lado del servidor (opcional)
   - Configura CORS si es necesario
4. Crea las siguientes carpetas en el bucket:
   - `images/`
   - `audio-files/`
   - `transcriptions/`

Para crear automáticamente las carpetas, puedes utilizar el script `create-s3-folders.js` incluido en el proyecto:

```bash
node create-s3-folders.js
```

### 2. Configuración de AWS Rekognition

- Asegúrate de que el usuario IAM tenga permisos `AmazonRekognitionFullAccess`.
- Rekognition utilizará las imágenes almacenadas en la carpeta `images/` del bucket S3.

### 3. Configuración de AWS Transcribe

#### Permisos IAM necesarios para Transcribe:

- `AmazonTranscribeFullAccess`
- `AmazonS3FullAccess` (para almacenar y recuperar archivos de audio)

#### Pasos para configurar Transcribe desde la consola AWS:

1. Accede a la [Consola de AWS](https://console.aws.amazon.com/)
2. Ve a Amazon Transcribe
3. Asegúrate de que el servicio esté habilitado en tu región
4. (Opcional) Configura vocabularios personalizados si necesitas términos específicos

### 4. Configuración de AWS Comprehend

#### Permisos IAM necesarios para Comprehend:

- `ComprehendFullAccess`

#### Pasos para configurar Comprehend desde la consola AWS:

1. Accede a la [Consola de AWS](https://console.aws.amazon.com/)
2. Ve a Amazon Comprehend
3. Asegúrate de que el servicio esté habilitado en tu región

## Uso de los servicios

### AWS Rekognition

Para acceder a la página de demostración de Rekognition, visita:
```
/reconocimiento-visual
```

### AWS Transcribe y Comprehend

Estos servicios se utilizan principalmente en el minijuego de lectura:
```
/ejercicio/lectura
```

## Verificación de la configuración

Para verificar que todos los servicios están configurados correctamente, visita:
```
/api/test-aws
```

Esta API comprobará la conexión con todos los servicios AWS y verificará que el bucket S3 y las carpetas necesarias existen.

## Limitaciones y Precios

### AWS Rekognition:
- Capa gratuita: 5,000 imágenes procesadas por mes durante los primeros 12 meses

### AWS Transcribe:
- Capa gratuita: 60 minutos por mes durante 12 meses
- Después: $0.0004 por segundo ($1.44 por hora)

### AWS Comprehend:
- Capa gratuita: 50,000 unidades por mes durante 12 meses
- Después: $0.0001 por unidad

Consulta la [página de precios de AWS](https://aws.amazon.com/pricing/) para obtener información actualizada.

## Solución de Problemas

Si encuentras errores en la implementación:

1. Verifica que las credenciales AWS estén correctamente configuradas en `.env.local`
2. Asegúrate de que el usuario de AWS tenga los permisos necesarios para los servicios que estás utilizando
3. Revisa los logs del servidor en la consola para diagnósticos más detallados
4. Asegúrate de que el bucket S3 exista y contenga las carpetas `images/`, `audio-files/` y `transcriptions/`
5. Utiliza el endpoint `/api/test-aws` para diagnosticar problemas de configuración 