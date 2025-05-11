# Despliegue automático a Amazon S3

Este proyecto está configurado para desplegarse automáticamente en Amazon S3 cuando se hace push a la rama `develop`.

## Requisitos previos

1. Una cuenta de AWS con acceso a S3
2. Un bucket de S3 configurado para alojamiento web estático
3. Credenciales de AWS con permisos para escribir en S3

## Configuración

### 1. Crear un bucket de S3

1. Inicia sesión en la consola de AWS y navega a S3
2. Crea un nuevo bucket con un nombre único (por ejemplo, "neurospot-app")
3. Desactiva "Bloquear todo el acceso público" para poder servir contenido web
4. Habilita el alojamiento de sitios web estáticos en la pestaña "Propiedades"
   - Establece "index.html" como documento de índice
   - Opcional: Establece "error.html" como documento de error

### 2. Configurar permisos del bucket

Agrega la siguiente política al bucket (reemplaza `nombre-de-tu-bucket` con el nombre de tu bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::nombre-de-tu-bucket/*"
    }
  ]
}
```

### 3. Configurar GitHub Secrets

En tu repositorio de GitHub, navega a Settings > Secrets and variables > Actions y agrega los siguientes secretos:

- `AWS_ACCESS_KEY_ID`: Tu ID de clave de acceso de AWS
- `AWS_SECRET_ACCESS_KEY`: Tu clave de acceso secreta de AWS

### 4. Configurar el flujo de trabajo

El archivo `.github/workflows/deploy-to-s3.yml` ya está configurado, pero necesitas:

1. Reemplazar `tu-nombre-de-bucket-aqui` con el nombre real de tu bucket
2. Actualizar la región de AWS si no estás usando `us-east-1`

## Cómo funciona

Cada vez que hagas push a la rama `develop`:

1. GitHub Actions ejecutará el flujo de trabajo
2. Se construirá la aplicación Next.js
3. Los archivos generados se sincronizarán con tu bucket de S3

La URL de tu sitio web será algo como: `http://nombre-de-tu-bucket.s3-website-us-east-1.amazonaws.com`

## Solución de problemas

- Si el despliegue falla, revisa los logs de GitHub Actions para más detalles
- Verifica que las credenciales de AWS tengan los permisos correctos
- Asegúrate de que el bucket esté configurado correctamente para alojamiento web 