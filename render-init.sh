#!/bin/bash
# Script de inicialização rápida para Render
# Execute: bash render-init.sh

echo "🚀 INICIALIZANDO ALTCLINIC NO RENDER"
echo "===================================="
echo ""

# Verificar se node está disponível
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo ""

# Verificar se npm está disponível
if ! command -v npm &> /dev/null; then
    echo "❌ NPM não encontrado"
    exit 1
fi

echo "✅ NPM encontrado: $(npm --version)"
echo ""

# Verificar se existe package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado"
    echo "📁 Diretório atual: $(pwd)"
    exit 1
fi

echo "✅ package.json encontrado"
echo ""

# Executar script de inicialização
echo "🔧 Executando script de inicialização..."
echo ""

if [ -f "quick-init-production.js" ]; then
    node quick-init-production.js
elif [ -f "create-first-user-production.js" ]; then
    node create-first-user-production.js
else
    echo "⚠️  Scripts não encontrados, tentando comando npm..."
    npm run init:production
fi

echo ""
echo "===================================="
echo "✅ INICIALIZAÇÃO CONCLUÍDA!"
echo "===================================="
