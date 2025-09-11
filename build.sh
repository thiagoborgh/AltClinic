#!/bin/bash
# Script de build para OnRender

echo "🏗️ Iniciando build para produção..."

# Limpar package-lock.json para forçar reinstalação limpa
echo "🧹 Limpando cache e lock files..."
rm -f package-lock.json
rm -rf node_modules

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
npm install

# Instalar dependências do frontend principal
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install

# Build do frontend principal
echo "🔨 Fazendo build do frontend..."
npm run build

# Voltar para o diretório raiz
cd ..

# Instalar dependências do admin frontend
echo "📦 Instalando dependências do admin frontend..."
cd admin/frontend
npm install

# Build do admin frontend
echo "🔨 Fazendo build do admin frontend..."
npm run build

# Voltar para o diretório raiz
cd ../..

# Criar diretórios públicos se não existirem
echo "📁 Criando diretórios públicos..."
mkdir -p public
mkdir -p public/admin

# Copiar arquivos do build para os diretórios públicos
echo "📋 Copiando arquivos do build..."
cp -r frontend/build/* public/
cp -r admin/frontend/build/* public/admin/

# Rebuildar módulos nativos para a plataforma atual
echo "🔧 Rebuilding native modules..."
npm rebuild

echo "✅ Build concluído com sucesso!"
echo "📊 Arquivos no diretório público:"
ls -la public/
echo "📊 Arquivos no diretório admin:"
ls -la public/admin/
