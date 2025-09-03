#!/bin/bash

# Deploy Script para Alt Clinic
echo "🚀 Iniciando deploy do Alt Clinic..."

# Função para deploy no Heroku
deploy_heroku() {
    echo "📦 Preparando deploy para Heroku..."
    
    # Verificar se Heroku CLI está instalado
    if ! command -v heroku &> /dev/null; then
        echo "❌ Heroku CLI não encontrado. Instale em: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Login no Heroku (se necessário)
    echo "🔐 Verificando login no Heroku..."
    heroku whoami || heroku login
    
    # Criar app se não existir
    echo "🏗️  Criando/verificando app no Heroku..."
    heroku create alt-clinic-$(date +%s) --region us
    
    # Configurar variáveis de ambiente
    echo "⚙️  Configurando variáveis de ambiente..."
    heroku config:set NODE_ENV=production
    heroku config:set JWT_SECRET=$(openssl rand -base64 32)
    heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
    
    # Deploy
    echo "🚀 Fazendo deploy..."
    git add .
    git commit -m "Deploy Alt Clinic to Heroku"
    git push heroku main
    
    # Abrir app
    heroku open
}

# Função para deploy no Vercel
deploy_vercel() {
    echo "📦 Preparando deploy para Vercel..."
    
    # Verificar se Vercel CLI está instalado
    if ! command -v vercel &> /dev/null; then
        echo "📥 Instalando Vercel CLI..."
        npm i -g vercel
    fi
    
    # Login no Vercel
    echo "🔐 Fazendo login no Vercel..."
    vercel login
    
    # Deploy
    echo "🚀 Fazendo deploy..."
    vercel --prod
}

# Função para deploy com Docker
deploy_docker() {
    echo "🐳 Preparando deploy com Docker..."
    
    # Build da imagem
    echo "🔨 Construindo imagem Docker..."
    docker build -t alt-clinic .
    
    # Executar container
    echo "🚀 Iniciando container..."
    docker run -d -p 3000:3000 --name alt-clinic-app alt-clinic
    
    echo "✅ Alt Clinic rodando em: http://localhost:3000"
}

# Menu de opções
echo "Escolha a plataforma de deploy:"
echo "1) Heroku"
echo "2) Vercel" 
echo "3) Docker Local"
echo "4) Sair"

read -p "Digite sua opção (1-4): " option

case $option in
    1)
        deploy_heroku
        ;;
    2)
        deploy_vercel
        ;;
    3)
        deploy_docker
        ;;
    4)
        echo "👋 Deploy cancelado."
        exit 0
        ;;
    *)
        echo "❌ Opção inválida."
        exit 1
        ;;
esac

echo "✅ Deploy concluído com sucesso!"
