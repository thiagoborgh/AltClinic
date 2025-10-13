#!/bin/bash
# Script de Verificação de Ambiente - Render
# Execute no Shell do Render: bash verify-render-env.sh

echo "🔍 VERIFICAÇÃO DE AMBIENTE - ALTCLINIC RENDER"
echo "=============================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# 1. Node.js
echo "📦 1. Verificando Node.js..."
node --version
check "Node.js instalado: $(node --version)"
echo ""

# 2. NPM
echo "📦 2. Verificando NPM..."
npm --version
check "NPM instalado: $(npm --version)"
echo ""

# 3. Diretório atual
echo "📁 3. Verificando diretório..."
pwd
check "Diretório: $(pwd)"
echo ""

# 4. Estrutura de arquivos
echo "📂 4. Verificando estrutura..."
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json encontrado${NC}"
else
    echo -e "${RED}❌ package.json NÃO encontrado${NC}"
fi

if [ -d "src" ]; then
    echo -e "${GREEN}✅ Diretório src/ encontrado${NC}"
else
    echo -e "${RED}❌ Diretório src/ NÃO encontrado${NC}"
fi

if [ -f "src/app.js" ]; then
    echo -e "${GREEN}✅ src/app.js encontrado${NC}"
else
    echo -e "${RED}❌ src/app.js NÃO encontrado${NC}"
fi
echo ""

# 5. Scripts do package.json
echo "📜 5. Verificando scripts..."
if grep -q '"build:linux"' package.json; then
    echo -e "${GREEN}✅ Script build:linux existe${NC}"
else
    echo -e "${RED}❌ Script build:linux NÃO existe${NC}"
fi

if grep -q '"start".*"node src/app.js"' package.json; then
    echo -e "${GREEN}✅ Script start correto${NC}"
else
    echo -e "${YELLOW}⚠️  Script start pode estar incorreto${NC}"
fi
echo ""

# 6. Variáveis de ambiente
echo "🔐 6. Verificando variáveis de ambiente..."

if [ -n "$NODE_ENV" ]; then
    echo -e "${GREEN}✅ NODE_ENV: $NODE_ENV${NC}"
else
    echo -e "${RED}❌ NODE_ENV não definido${NC}"
fi

if [ -n "$PORT" ]; then
    echo -e "${GREEN}✅ PORT: $PORT${NC}"
else
    echo -e "${YELLOW}⚠️  PORT não definido (usando padrão)${NC}"
fi

if [ -n "$JWT_SECRET" ]; then
    echo -e "${GREEN}✅ JWT_SECRET: [definido]${NC}"
else
    echo -e "${RED}❌ JWT_SECRET não definido${NC}"
fi

if [ -n "$CORS_ORIGIN" ]; then
    echo -e "${GREEN}✅ CORS_ORIGIN: $CORS_ORIGIN${NC}"
else
    echo -e "${YELLOW}⚠️  CORS_ORIGIN não definido${NC}"
fi

if [ -n "$MASTER_DB_PATH" ]; then
    echo -e "${GREEN}✅ MASTER_DB_PATH: $MASTER_DB_PATH${NC}"
else
    echo -e "${YELLOW}⚠️  MASTER_DB_PATH não definido${NC}"
fi
echo ""

# 7. Diretório data/
echo "💾 7. Verificando diretório data/..."
if [ -d "data" ]; then
    echo -e "${GREEN}✅ Diretório data/ existe${NC}"
    ls -lh data/ 2>/dev/null || echo "  (vazio)"
else
    echo -e "${YELLOW}⚠️  Diretório data/ não existe (será criado)${NC}"
    mkdir -p data
    check "Criado diretório data/"
fi
echo ""

# 8. Diretório public/
echo "🌐 8. Verificando diretório public/..."
if [ -d "public" ]; then
    echo -e "${GREEN}✅ Diretório public/ existe${NC}"
    if [ -f "public/index.html" ]; then
        echo -e "${GREEN}✅ Frontend build encontrado${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend build não encontrado${NC}"
    fi
    if [ -d "public/admin" ]; then
        echo -e "${GREEN}✅ Admin build encontrado${NC}"
    else
        echo -e "${YELLOW}⚠️  Admin build não encontrado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Diretório public/ não existe${NC}"
fi
echo ""

# 9. node_modules
echo "📦 9. Verificando node_modules..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules/ existe${NC}"
    
    # Verificar módulos críticos
    if [ -d "node_modules/better-sqlite3" ]; then
        echo -e "${GREEN}✅ better-sqlite3 instalado${NC}"
    else
        echo -e "${RED}❌ better-sqlite3 NÃO instalado${NC}"
    fi
    
    if [ -d "node_modules/express" ]; then
        echo -e "${GREEN}✅ express instalado${NC}"
    else
        echo -e "${RED}❌ express NÃO instalado${NC}"
    fi
else
    echo -e "${RED}❌ node_modules/ não existe${NC}"
fi
echo ""

# 10. Testar conexão com banco
echo "🗄️  10. Verificando banco de dados..."
if [ -f "data/master.db" ]; then
    echo -e "${GREEN}✅ Banco master.db existe${NC}"
    
    # Tentar contar tenants
    TENANT_COUNT=$(node -e "try { const db = require('better-sqlite3')('./data/master.db'); const count = db.prepare('SELECT COUNT(*) as count FROM tenants').get(); console.log(count.count); } catch(e) { console.log('0'); }" 2>/dev/null)
    
    if [ -n "$TENANT_COUNT" ]; then
        echo -e "${GREEN}✅ Tenants cadastrados: $TENANT_COUNT${NC}"
    else
        echo -e "${YELLOW}⚠️  Não foi possível contar tenants${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Banco master.db não existe (será criado)${NC}"
fi
echo ""

# 11. Verificar porta livre
echo "🔌 11. Verificando porta..."
if [ -n "$PORT" ]; then
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Porta $PORT já está em uso${NC}"
    else
        echo -e "${GREEN}✅ Porta $PORT livre${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Porta não configurada${NC}"
fi
echo ""

# RESUMO
echo "=============================================="
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "=============================================="
echo ""

ERRORS=0
WARNINGS=0

# Contar erros e avisos
if [ ! -f "package.json" ]; then ((ERRORS++)); fi
if [ ! -f "src/app.js" ]; then ((ERRORS++)); fi
if [ -z "$NODE_ENV" ]; then ((ERRORS++)); fi
if [ -z "$JWT_SECRET" ]; then ((ERRORS++)); fi
if [ ! -d "node_modules" ]; then ((ERRORS++)); fi

if [ -z "$CORS_ORIGIN" ]; then ((WARNINGS++)); fi
if [ ! -d "public" ]; then ((WARNINGS++)); fi
if [ ! -f "data/master.db" ]; then ((WARNINGS++)); fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ TUDO OK! Sistema pronto para rodar.${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS avisos encontrados. Sistema pode funcionar.${NC}"
else
    echo -e "${RED}❌ $ERRORS erros críticos encontrados!${NC}"
    echo -e "${RED}   O sistema NÃO funcionará corretamente.${NC}"
fi

echo ""
echo "=============================================="
echo "🎯 PRÓXIMAS AÇÕES RECOMENDADAS"
echo "=============================================="

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "1. Corrija os erros críticos (❌)"
    echo "2. Execute: npm install"
    echo "3. Execute: npm run build:linux"
    echo "4. Execute este script novamente"
else
    echo ""
    echo "1. Se warnings (⚠️), execute: npm run build:linux"
    echo "2. Inicialize o sistema: node quick-init-production.js"
    echo "3. Inicie o servidor: node src/app.js"
    echo "4. Teste: curl http://localhost:\$PORT/api/health"
fi

echo ""
echo "=============================================="
echo "✅ Verificação concluída!"
echo "=============================================="
