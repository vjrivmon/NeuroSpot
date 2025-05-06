# Integración de AWS Rekognition en NeuroSpot

Esta carpeta contiene la implementación del servicio de AWS Rekognition para el análisis de imágenes en NeuroSpot.

## Configuración

Para utilizar AWS Rekognition, necesitas configurar las siguientes variables de entorno en el archivo `.env.local`:

```
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
```

## Arquitectura de la Implementación

La implementación utiliza un enfoque cliente-servidor para la seguridad de las credenciales AWS:

1. **Cliente (Browser)**: El componente React `image-analyzer.tsx` que permite a los usuarios seleccionar imágenes y realizar diferentes tipos de análisis.

2. **API (Servidor)**: Un endpoint de API de Next.js en `app/api/rekognition/route.ts` que recibe las imágenes del cliente, se comunica con AWS Rekognition y devuelve los resultados.

Este enfoque mantiene las credenciales de AWS seguras en el servidor y no las expone al cliente.

## Credenciales de AWS

Para obtener tus credenciales de AWS:

1. Crea una cuenta en [AWS](https://aws.amazon.com/) si aún no tienes una
2. Ve a la [Consola de IAM](https://console.aws.amazon.com/iam/)
3. Crea un usuario con permisos para `AmazonRekognitionFullAccess`
4. Genera y guarda las credenciales (Access Key ID y Secret Access Key)

## Funcionalidades Implementadas

El servicio incluye las siguientes capacidades:

- **Detección de rostros**: Identifica rostros en imágenes y analiza características como edad, género y emociones
- **Detección de objetos**: Reconoce objetos, escenas y conceptos en imágenes
- **Reconocimiento de texto**: Extrae texto visible en imágenes

## Uso

Para acceder a la página de demostración, visita:
```
/reconocimiento-visual
```

## Limitaciones y Precios

AWS Rekognition es un servicio de pago por uso. Consulta la [página de precios de AWS Rekognition](https://aws.amazon.com/rekognition/pricing/) para más detalles.

La capa gratuita de AWS incluye:
- 5,000 imágenes procesadas por mes durante los primeros 12 meses

## Solución de Problemas

Si encuentras errores en la implementación:

1. Verifica que las credenciales AWS estén correctamente configuradas en `.env.local`
2. Asegúrate de que el usuario de AWS tenga los permisos necesarios para Rekognition
3. Revisa los logs del servidor en la consola para diagnósticos más detallados 