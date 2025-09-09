#!/bin/bash

echo "🚀 Iniciando build para Render..."

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
npm install

# Build do frontend
echo "🔨 Fazendo build do frontend..."
cd frontend
npm install
npm run build
cd ..

# Garantir que a pasta public existe
echo "📁 Preparando pasta public..."
mkdir -p public

# Copiar arquivos do build para public (usando cp do Linux)
echo "📋 Copiando arquivos do frontend..."
cp -r frontend/build/* public/

# Verificar se os arquivos foram copiados
echo "✅ Verificando arquivos copiados..."
ls -la public/

echo "🎉 Build concluído com sucesso!"
