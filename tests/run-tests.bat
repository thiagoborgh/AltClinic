@echo off
REM 🧪 Script de Execução de Testes Automatizados - Windows
REM SAEE & Intranet Altclinic

echo 🚀 Iniciando Suite de Testes Automatizados
echo ==========================================

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Instale Node.js primeiro.
    exit /b 1
)

echo ✅ Node.js encontrado
node --version

REM Navegar para diretório de testes
cd tests

REM Verificar se package.json existe
if not exist "package.json" (
    echo ❌ package.json não encontrado no diretório tests/
    exit /b 1
)

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo ℹ️ Instalando dependências de teste...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Falha ao instalar dependências
        exit /b 1
    )
    echo ✅ Dependências instaladas
)

echo.
echo ℹ️ Verificando serviços...

REM Verificar SAEE (porta 3000)
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ SAEE rodando na porta 3000
) else (
    echo ⚠️ SAEE não encontrado na porta 3000
)

REM Verificar Admin Backend (porta 3001)
curl -s http://localhost:3001/api/admin/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Admin Backend rodando na porta 3001
) else (
    echo ⚠️ Admin Backend não encontrado na porta 3001
)

REM Verificar Admin Frontend (porta 3002)
curl -s http://localhost:3002 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Admin Frontend rodando na porta 3002
) else (
    echo ⚠️ Admin Frontend não encontrado na porta 3002
)

echo.
echo ℹ️ Iniciando execução dos testes...
echo ==========================================

set "total_tests=0"
set "passed_tests=0"
set "failed_tests=0"

REM 1. Testes de API SAEE
echo.
echo ℹ️ Executando: API SAEE
echo ----------------------------------------
call npm run test:api -- --testPathPattern=saee-api
if %errorlevel% equ 0 (
    echo ✅ API SAEE: PASSOU
    set /a passed_tests+=1
) else (
    echo ❌ API SAEE: FALHOU
    set /a failed_tests+=1
)
set /a total_tests+=1

REM 2. Testes de API Admin
echo.
echo ℹ️ Executando: API Admin
echo ----------------------------------------
call npm run test:api -- --testPathPattern=admin-api
if %errorlevel% equ 0 (
    echo ✅ API Admin: PASSOU
    set /a passed_tests+=1
) else (
    echo ❌ API Admin: FALHOU
    set /a failed_tests+=1
)
set /a total_tests+=1

REM 3. Testes de Frontend SAEE
echo.
echo ℹ️ Executando: Frontend SAEE
echo ----------------------------------------
call npm run test:frontend -- --testPathPattern=saee-frontend
if %errorlevel% equ 0 (
    echo ✅ Frontend SAEE: PASSOU
    set /a passed_tests+=1
) else (
    echo ❌ Frontend SAEE: FALHOU
    set /a failed_tests+=1
)
set /a total_tests+=1

REM 4. Testes de Frontend Admin
echo.
echo ℹ️ Executando: Frontend Admin
echo ----------------------------------------
call npm run test:frontend -- --testPathPattern=admin-frontend
if %errorlevel% equ 0 (
    echo ✅ Frontend Admin: PASSOU
    set /a passed_tests+=1
) else (
    echo ❌ Frontend Admin: FALHOU
    set /a failed_tests+=1
)
set /a total_tests+=1

REM 5. Testes de Integração
echo.
echo ℹ️ Executando: Integração Sistemas
echo ----------------------------------------
call npm run test:integration
if %errorlevel% equ 0 (
    echo ✅ Integração Sistemas: PASSOU
    set /a passed_tests+=1
) else (
    echo ❌ Integração Sistemas: FALHOU
    set /a failed_tests+=1
)
set /a total_tests+=1

REM 6. Testes E2E (se Playwright estiver disponível)
playwright --version >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ℹ️ Executando: Testes E2E
    echo ----------------------------------------
    call npm run test:e2e
    if %errorlevel% equ 0 (
        echo ✅ Testes E2E: PASSOU
        set /a passed_tests+=1
    ) else (
        echo ❌ Testes E2E: FALHOU
        set /a failed_tests+=1
    )
    set /a total_tests+=1
) else (
    echo ⚠️ Playwright não encontrado. Pulando testes E2E.
)

REM Gerar relatório de cobertura
echo.
echo ℹ️ Gerando relatório de cobertura...
call npm run test:coverage -- --silent

echo.
echo ==========================================
echo ℹ️ RESUMO DOS TESTES
echo ==========================================

echo 📊 Total de suites: %total_tests%
echo ✅ Sucessos: %passed_tests%
echo ❌ Falhas: %failed_tests%

if %failed_tests% equ 0 (
    echo ✅ TODOS OS TESTES PASSARAM! 🎉
    echo.
    echo ℹ️ Sistema está funcionando corretamente
    
    REM Gerar badge de status
    echo ![Tests](https://img.shields.io/badge/tests-passing-brightgreen) > ..\test-badge.md
    
    exit /b 0
) else (
    echo ❌ %failed_tests% TESTE(S) FALHARAM!
    echo.
    echo ⚠️ Verifique os logs acima para mais detalhes
    
    REM Gerar badge de status
    echo ![Tests](https://img.shields.io/badge/tests-%failed_tests%_failing-red) > ..\test-badge.md
    
    exit /b 1
)
