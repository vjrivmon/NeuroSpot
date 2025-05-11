# Scripts de utilidad para NeuroSpot

Este directorio contiene diversos scripts de utilidad para interactuar con los datos de NeuroSpot almacenados en AWS DynamoDB.

## Configuración de credenciales

Los scripts ahora usan variables de entorno para las credenciales de AWS. Debes crear un archivo `.env` en la raíz del proyecto con la siguiente estructura:

```
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
S3_BUCKET_NAME=neurospot-data
```

## Ejecución de scripts

Para ejecutar cualquiera de los scripts, necesitas primero cargar las variables de entorno. Puedes hacerlo de varias formas:

### En Linux/Mac:

```bash
source .env
node scripts/nombre-del-script.js
```

### En Windows:

```bash
# Usando PowerShell
$env:AWS_REGION="eu-west-1"
$env:AWS_ACCESS_KEY_ID="tu_access_key_id"
$env:AWS_SECRET_ACCESS_KEY="tu_secret_access_key"
node scripts/nombre-del-script.js
```

## Scripts disponibles

- `check-exercise-results.js`: Verifica los tipos de ejercicios guardados en la base de datos
- `check-result-details.js`: Muestra detalles de los resultados de ejercicios
- `check-user-direct.js`: Comprueba datos de un usuario específico
- `test-save-exercise.js`: Prueba la función de guardar ejercicios en DynamoDB
- `update-completed-exercises.js`: Actualiza la información de ejercicios completados

## Importante

- Nunca incluyas las credenciales directamente en el código
- No subas el archivo `.env` al repositorio (ya está incluido en `.gitignore`)
- Siempre usa variables de entorno para datos sensibles 