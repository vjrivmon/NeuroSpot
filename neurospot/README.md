# NeuroSpot - Guía de Despliegue

Esta guía proporciona instrucciones para desplegar la aplicación NeuroSpot en diferentes plataformas de hosting.

## Preparación para el Despliegue

### 1. Compilar la Aplicación

Para generar una versión de producción optimizada:

```bash
# Navegar al directorio del proyecto
cd neurospot

# Instalar dependencias (si no se ha hecho ya)
npm install
# o
yarn install
# o
pnpm install

# Construir la aplicación
npm run build
# o
yarn build
# o
pnpm build
```

Después de la compilación, los archivos estáticos se generarán en la carpeta `out`.

## Opciones de Despliegue

### Opción 1: Vercel (Recomendado)

Vercel es la plataforma más fácil para desplegar aplicaciones Next.js, ya que está desarrollada por los mismos creadores de Next.js.

1. Crear una cuenta en [Vercel](https://vercel.com)
2. Instalar la CLI de Vercel:
   ```bash
   npm install -g vercel
   ```
3. Autenticarse en Vercel:
   ```bash
   vercel login
   ```
4. Desplegar la aplicación:
   ```bash
   vercel
   ```

### Opción 2: Netlify

1. Crear una cuenta en [Netlify](https://netlify.com)
2. Configurar un nuevo sitio desde la interfaz de Netlify
3. Configuración manual:
   - Directorio de publicación: `out`
   - Comando de construcción: `npm run build`
4. O usar Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy
   ```

### Opción 3: GitHub Pages

1. Modificar el archivo `.env.production` para configurar `NEXT_PUBLIC_BASE_PATH` con el nombre de tu repositorio
2. Construir la aplicación:
   ```bash
   npm run build
   ```
3. Instalar `gh-pages`:
   ```bash
   npm install -g gh-pages
   ```
4. Desplegar a GitHub Pages:
   ```bash
   gh-pages -d out
   ```

### Opción 4: Hosting Tradicional (FTP)

1. Construir la aplicación:
   ```bash
   npm run build
   ```
2. Subir todos los archivos de la carpeta `out` a tu servidor web mediante FTP

## Configuración de Variables de Entorno

Para personalizar la configuración de despliegue, edita los archivos:
- `.env.local` para desarrollo local
- `.env.production` para entornos de producción

## Solución de Problemas Comunes

### Enlaces Rotos
- Asegúrate de configurar correctamente `NEXT_PUBLIC_BASE_PATH` si la aplicación se sirve desde una subcarpeta

### Imágenes No Visibles
- Verifica que las rutas de las imágenes sean relativas y utilicen el componente `next/image`

### Errores API/Backend
- Configura `NEXT_PUBLIC_API_URL` con la URL correcta del backend

## Soporte

Si encuentras problemas durante el despliegue, consulta la [documentación oficial de Next.js](https://nextjs.org/docs/deployment). 