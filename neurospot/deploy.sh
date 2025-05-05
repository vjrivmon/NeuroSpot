#!/bin/bash

# Script de despliegue para NeuroSpot
echo "Iniciando despliegue de NeuroSpot..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo "Error: Este script debe ejecutarse desde el directorio raíz de NeuroSpot"
  exit 1
fi

# Instalar dependencias
echo "Instalando dependencias..."
npm install

# Limpiar build previo
echo "Limpiando build previo..."
rm -rf .next out

# Construir la aplicación
echo "Construyendo la aplicación para producción..."
npm run build

# Verificar si el build fue exitoso
if [ ! -d "out" ]; then
  echo "Error: La compilación falló, no se encontró el directorio 'out'"
  exit 1
fi

echo "Build completado con éxito. Los archivos estáticos están disponibles en el directorio 'out'"
echo ""
echo "INSTRUCCIONES PARA SUBIR A INTERNET:"
echo "-------------------------------------"
echo "1. Para desplegar en Vercel, ejecuta: vercel"
echo "2. Para desplegar en Netlify, ejecuta: netlify deploy"
echo "3. Para desplegar vía FTP, sube todo el contenido de la carpeta 'out' a tu servidor"
echo ""
echo "Para más detalles, consulta el archivo README.md"

# Preguntar si quiere continuar con alguna opción de despliegue
read -p "¿Deseas continuar con alguna opción de despliegue? (vercel/netlify/no): " deploy_option

case $deploy_option in
  vercel)
    echo "Desplegando con Vercel..."
    vercel
    ;;
  netlify)
    echo "Desplegando con Netlify..."
    netlify deploy
    ;;
  *)
    echo "Despliegue manual necesario. Sigue las instrucciones en README.md"
    ;;
esac

echo "Proceso de despliegue completado." 