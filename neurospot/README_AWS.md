# Configuración de AWS DynamoDB para NeuroSpot

Este documento describe cómo configurar AWS DynamoDB para la aplicación NeuroSpot, que permite almacenar y recuperar información de los usuarios y sus resultados en los ejercicios cognitivos.

## Requisitos previos

1. Una cuenta de AWS
2. AWS CLI instalado (opcional pero recomendado)
3. Node.js y npm instalados

## Configuración de credenciales de AWS

1. Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```
# AWS Credentials
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=TU_AWS_ACCESS_KEY_ID
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=TU_AWS_SECRET_ACCESS_KEY
NEXT_PUBLIC_AWS_REGION=eu-north-1
```

2. Reemplaza `TU_AWS_ACCESS_KEY_ID` y `TU_AWS_SECRET_ACCESS_KEY` con tus credenciales de AWS.

> **IMPORTANTE**: Nunca compartas tus credenciales de AWS ni las subas a repositorios públicos.

## Creación de tablas en DynamoDB

Puedes crear las tablas necesarias utilizando la consola de AWS o mediante scripts. A continuación se muestran los comandos de AWS CLI para crear las tablas:

### Tabla de Usuarios

```bash
aws dynamodb create-table \
  --table-name NeuroSpot_Users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=type,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=type,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region eu-north-1
```

### Tabla de Resultados de Ejercicios

```bash
aws dynamodb create-table \
  --table-name NeuroSpot_ExerciseResults \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=exerciseId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=exerciseId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region eu-north-1
```

### Tabla de Datos de Sesión

```bash
aws dynamodb create-table \
  --table-name NeuroSpot_SessionData \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=sessionId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=sessionId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region eu-north-1
```

## Estructura de las tablas

### Tabla `NeuroSpot_Users`
- `userId` (String, clave primaria): Email del usuario
- `type` (String, clave de ordenación): Tipo de registro ("profile", "settings", etc.)
- Otros atributos:
  - `email` (String): Email del usuario
  - `nombre` (String): Nombre del tutor
  - `nombreNino` (String): Nombre del niño
  - `nivelEducativo` (String): Nivel educativo
  - `curso` (String): Curso actual
  - `apoyoClase` (Boolean): Si recibe apoyo educativo

### Tabla `NeuroSpot_ExerciseResults`
- `userId` (String, clave primaria): Email del usuario
- `exerciseId` (String, clave de ordenación): ID único del ejercicio (tipo + timestamp)
- Otros atributos:
  - `timestamp` (String): Fecha y hora de realización
  - `tipo` (String): Tipo de ejercicio (stroop, lectura, etc.)
  - `puntuacion` (Number): Puntuación obtenida
  - `duracion` (Number): Duración en segundos
  - `detalles` (Map): Detalles específicos del ejercicio

### Tabla `NeuroSpot_SessionData`
- `userId` (String, clave primaria): Email del usuario
- `sessionId` (String, clave de ordenación): ID único de la sesión (timestamp)
- Otros atributos:
  - `fecha` (String): Fecha de la sesión
  - `ejerciciosRealizados` (List): Lista de ejercicios realizados
  - `tiempoTotal` (Number): Tiempo total de la sesión en milisegundos
  - `inicioSesion` (String): Timestamp del inicio de sesión
  - `finSesion` (String): Timestamp del fin de sesión (opcional)

## Pruebas y verificación

Para verificar que las tablas se han creado correctamente, puedes ejecutar:

```bash
aws dynamodb list-tables --region eu-north-1
```

## Generación de informes PDF

La aplicación incluye la capacidad de generar informes PDF a partir de los datos almacenados en DynamoDB. La generación se realiza en el cliente utilizando las bibliotecas `jspdf` y `html2canvas`.

Para personalizar el formato o contenido de los informes, modifica la función `handleDownloadReport` en el archivo `/app/resultados/page.tsx`.

## Solución de problemas

Si encuentras problemas con DynamoDB:

1. Verifica que las credenciales de AWS sean correctas
2. Comprueba que las tablas existan y tengan la estructura correcta
3. Revisa los logs de la aplicación para ver mensajes de error específicos
4. Asegúrate de que tu política IAM permite operaciones sobre DynamoDB

## Referencias

- [Documentación de AWS DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [AWS SDK para JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/)
- [Guía de mejores prácticas para DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html) 