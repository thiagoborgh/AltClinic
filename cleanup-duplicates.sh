#!/bin/bash

# 🚨 SCRIPT DE LIMPEZA DE DUPLICATAS - ALTCLINIC
# 📅 Data: 19/09/2025
# ⚠️  EXECUTAR COM CUIDADO - FAZER BACKUP ANTES

echo "🧹 INICIANDO LIMPEZA DE DUPLICATAS - ALTCLINIC"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -d "frontend/src" ]; then
    error "Diretório frontend/src não encontrado. Execute o script na raiz do projeto."
    exit 1
fi

log "Diretório correto detectado. Iniciando análise..."

# FASE 1: Análise de dependências
echo ""
echo "📊 FASE 1: ANALISANDO DEPENDÊNCIAS"
echo "=================================="

# Verificar imports dos arquivos a serem removidos
check_dependencies() {
    local file=$1
    local count=$(grep -r "$file" frontend/src/ --include="*.js" --include="*.jsx" | wc -l)
    echo $count
}

# FASE 2: Backup (opcional)
echo ""
echo "💾 FASE 2: CRIANDO BACKUP"
echo "=========================="

read -p "Deseja criar backup dos arquivos antes de remover? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Criando backup..."
    mkdir -p backup/duplicatas/$(date +%Y%m%d_%H%M%S)
    cp -r frontend/src/pages/AgendaCompleta.js backup/duplicatas/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    cp -r frontend/src/pages/AgendaFuncional.js backup/duplicatas/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    cp -r frontend/src/pages/Agendamentos.js backup/duplicatas/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    cp -r frontend/src/pages/Dashboard.js backup/duplicatas/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    cp -r frontend/src/pages/Configuracoes.js backup/duplicatas/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    cp -r frontend/src/components/pacientes/prontuario/ backup/duplicatas/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    log "Backup criado em: backup/duplicatas/$(date +%Y%m%d_%H%M%S)/"
fi

# FASE 3: Remoção de arquivos duplicados
echo ""
echo "🗑️  FASE 3: REMOVENDO DUPLICATAS"
echo "==============================="

# Array de arquivos a remover
files_to_remove=(
    "frontend/src/pages/AgendaCompleta.js"
    "frontend/src/pages/AgendaFuncional.js"
    "frontend/src/pages/Agendamentos.js"
    "frontend/src/pages/AgendamentosNew.js"
    "frontend/src/pages/AgendaTeste.js"
    "frontend/src/pages/Dashboard.js"
    "frontend/src/pages/Configuracoes.js"
    "frontend/src/hooks/useAgendaSimple.js"
)

removed_count=0
for file in "${files_to_remove[@]}"; do
    if [ -f "$file" ]; then
        # Verificar dependências antes de remover
        deps=$(check_dependencies "$(basename "$file" .js)")
        if [ "$deps" -gt 0 ]; then
            warn "Arquivo $file tem $deps dependências. Verificar antes de remover."
            read -p "Continuar remoção? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                warn "Pulando remoção de $file"
                continue
            fi
        fi

        rm "$file"
        log "Removido: $file"
        ((removed_count++))
    else
        warn "Arquivo não encontrado: $file"
    fi
done

# Remover pasta de componentes duplicados
if [ -d "frontend/src/components/pacientes/prontuario" ]; then
    deps=$(find frontend/src/components/pacientes/prontuario -name "*.js" -exec basename {} \; | xargs -I {} grep -r "{}" frontend/src/ --include="*.js" --include="*.jsx" | wc -l)
    if [ "$deps" -gt 0 ]; then
        warn "Pasta components/pacientes/prontuario tem $deps dependências."
        read -p "Continuar remoção da pasta? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf frontend/src/components/pacientes/prontuario
            log "Removida pasta: frontend/src/components/pacientes/prontuario"
            ((removed_count++))
        fi
    else
        rm -rf frontend/src/components/pacientes/prontuario
        log "Removida pasta: frontend/src/components/pacientes/prontuario"
        ((removed_count++))
    fi
fi

# FASE 4: Verificação e correção de imports
echo ""
echo "🔧 FASE 4: VERIFICANDO IMPORTS"
echo "=============================="

# Verificar imports quebrados
broken_imports=$(grep -r "from.*AgendaCompleta\|from.*AgendaFuncional\|from.*Agendamentos[^N]\|from.*Dashboard[^N]\|from.*Configuracoes[^.jsx]" frontend/src/ --include="*.js" --include="*.jsx" | wc -l)

if [ "$broken_imports" -gt 0 ]; then
    warn "Encontrados $broken_imports imports potencialmente quebrados."
    echo "Execute: grep -r \"from.*AgendaCompleta\|from.*AgendaFuncional\" frontend/src/ --include=\"*.js\" --include=\"*.jsx\""
else
    log "Nenhum import quebrado detectado."
fi

# FASE 5: Estatísticas finais
echo ""
echo "📊 FASE 5: ESTATÍSTICAS FINAIS"
echo "=============================="

echo "Arquivos removidos: $removed_count"
echo "Espaço estimado liberado: ~$(($removed_count * 50))KB"

# Verificar se build ainda funciona
echo ""
echo "🔨 VERIFICANDO BUILD"
echo "===================="

if command -v npm &> /dev/null; then
    log "Executando verificação de build..."
    cd frontend
    npm run build --silent 2>/dev/null
    if [ $? -eq 0 ]; then
        log "✅ Build passou com sucesso!"
    else
        error "❌ Build falhou. Verificar erros acima."
    fi
    cd ..
else
    warn "npm não encontrado. Pule verificação de build."
fi

echo ""
echo "🎉 LIMPEZA CONCLUÍDA!"
echo "===================="
log "Total de arquivos removidos: $removed_count"
log "Consulte DOCUMENTACAO_DUPLICATAS_2025-09-19.md para detalhes completos"
warn "IMPORTANTE: Teste todas as funcionalidades antes de fazer commit!"

exit 0</content>
<parameter name="filePath">c:\Users\thiag\saee\cleanup-duplicates.sh