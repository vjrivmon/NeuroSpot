#!/bin/bash

# Script para iniciar el proyecto NeuroSpot
# Este script instala las dependencias y arranca el proyecto

echo "🧠 Iniciando NeuroSpot..."

# Cambiar al directorio del proyecto
cd neurospot || { echo "❌ Error: No se pudo encontrar el directorio neurospot"; exit 1; }

echo "📦 Verificando dependencias..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado. Por favor, instálalo antes de continuar."
    exit 1
fi

# Instalar dependencias
echo "📥 Instalando dependencias..."
npm install --legacy-peer-deps

# Ejecutar el linter
echo "🧹 Ejecutando linter..."
npm run lint

# Iniciar el servidor de desarrollo
echo "🚀 Iniciando servidor de desarrollo..."
npm run dev

echo "✅ NeuroSpot iniciado correctamente. Presiona Ctrl+C para detener." 