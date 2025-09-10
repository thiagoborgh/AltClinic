#!/bin/bash
# Script de build para OnRender

echo "🏗️ Iniciando build para produção..."

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
npm install

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install

# Build do frontend
echo "🔨 Fazendo build do frontend..."
npm run build

# Voltar para o diretório raiz
cd ..

# Criar diretório público se não existir
echo "📁 Criando diretório público..."
mkdir -p public

# Copiar arquivos do build para o diretório público
echo "📋 Copiando arquivos do build..."
cp -r frontend/build/* public/

echo "✅ Build concluído com sucesso!"
echo "📊 Arquivos no diretório público:"
ls -la public/
