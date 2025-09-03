#!/bin/bash

# 🧪 Script de Execução de Testes Automatizados
# SAEE & Intranet Altclinic

echo "🚀 Iniciando Suite de Testes Automatizados"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para print colorido
print_status() {
    case $1 in
        "success") echo -e "${GREEN}✅ $2${NC}" ;;
        "error") echo -e "${RED}❌ $2${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️ $2${NC}" ;;
        "info") echo -e "${BLUE}ℹ️ $2${NC}" ;;
    esac
}

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    print_status "error" "Node.js não encontrado. Instale Node.js primeiro."
    exit 1
fi

print_status "success" "Node.js encontrado: $(node --version)"

# Navegar para diretório de testes
cd tests

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    print_status "error" "package.json não encontrado no diretório tests/"
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    print_status "info" "Instalando dependências de teste..."
    npm install
    if [ $? -ne 0 ]; then
        print_status "error" "Falha ao instalar dependências"
        exit 1
    fi
    print_status "success" "Dependências instaladas"
fi

# Verificar se os serviços estão rodando
print_status "info" "Verificando serviços..."

# Verificar SAEE (porta 3000)
if curl -s http://localhost:3000 > /dev/null; then
    print_status "success" "SAEE rodando na porta 3000"
else
    print_status "warning" "SAEE não encontrado na porta 3000"
fi

# Verificar Admin Backend (porta 3001)
if curl -s http://localhost:3001/api/admin/health > /dev/null; then
    print_status "success" "Admin Backend rodando na porta 3001"
else
    print_status "warning" "Admin Backend não encontrado na porta 3001"
fi

# Verificar Admin Frontend (porta 3002)
if curl -s http://localhost:3002 > /dev/null; then
    print_status "success" "Admin Frontend rodando na porta 3002"
else
    print_status "warning" "Admin Frontend não encontrado na porta 3002"
fi

echo ""
print_status "info" "Iniciando execução dos testes..."
echo "=========================================="

# Função para executar teste e mostrar resultado
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo ""
    print_status "info" "Executando: $test_name"
    echo "----------------------------------------"
    
    eval $test_command
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_status "success" "$test_name: PASSOU"
    else
        print_status "error" "$test_name: FALHOU"
        return $exit_code
    fi
}

# Contador de testes
total_tests=0
passed_tests=0
failed_tests=0

# 1. Testes de API SAEE
total_tests=$((total_tests + 1))
if run_test "API SAEE" "npm run test:api -- --testPathPattern=saee-api"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

# 2. Testes de API Admin
total_tests=$((total_tests + 1))
if run_test "API Admin" "npm run test:api -- --testPathPattern=admin-api"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

# 3. Testes de Frontend SAEE
total_tests=$((total_tests + 1))
if run_test "Frontend SAEE" "npm run test:frontend -- --testPathPattern=saee-frontend"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

# 4. Testes de Frontend Admin
total_tests=$((total_tests + 1))
if run_test "Frontend Admin" "npm run test:frontend -- --testPathPattern=admin-frontend"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

# 5. Testes de Integração
total_tests=$((total_tests + 1))
if run_test "Integração Sistemas" "npm run test:integration"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

# 6. Testes E2E (se Playwright estiver disponível)
if command -v playwright &> /dev/null; then
    total_tests=$((total_tests + 1))
    if run_test "Testes E2E" "npm run test:e2e"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
else
    print_status "warning" "Playwright não encontrado. Pulando testes E2E."
fi

# Gerar relatório de cobertura
echo ""
print_status "info" "Gerando relatório de cobertura..."
npm run test:coverage -- --silent

echo ""
echo "=========================================="
print_status "info" "RESUMO DOS TESTES"
echo "=========================================="

echo "📊 Total de suites: $total_tests"
echo "✅ Sucessos: $passed_tests"
echo "❌ Falhas: $failed_tests"

if [ $failed_tests -eq 0 ]; then
    print_status "success" "TODOS OS TESTES PASSARAM! 🎉"
    echo ""
    print_status "info" "Sistema está funcionando corretamente"
    
    # Gerar badge de status
    echo "![Tests](https://img.shields.io/badge/tests-passing-brightgreen)" > ../test-badge.md
    
    exit 0
else
    print_status "error" "$failed_tests TESTE(S) FALHARAM!"
    echo ""
    print_status "warning" "Verifique os logs acima para mais detalhes"
    
    # Gerar badge de status
    echo "![Tests](https://img.shields.io/badge/tests-$failed_tests%20failing-red)" > ../test-badge.md
    
    exit 1
fi
