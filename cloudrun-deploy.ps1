# Script para deploy do backend no Cloud Run (GRATUITO)

Write-Host "🚀 Deploy Backend no Cloud Run (Google Cloud - GRATUITO)" -ForegroundColor Cyan
Write-Host ""

# Verificar se gcloud está instalado
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Google Cloud SDK não está instalado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Instale em: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ou via Chocolatey:" -ForegroundColor Yellow
    Write-Host "   choco install gcloudsdk" -ForegroundColor White
    exit 1
}

Write-Host "✅ Google Cloud SDK detectado" -ForegroundColor Green
Write-Host ""

# Verificar autenticação
Write-Host "🔐 Verificando autenticação..." -ForegroundColor Cyan
$auth = gcloud auth list --filter=status:ACTIVE --format="value(account)"
if (-not $auth) {
    Write-Host "❌ Não está autenticado no Google Cloud" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute:" -ForegroundColor Yellow
    Write-Host "   gcloud auth login" -ForegroundColor White
    exit 1
}
Write-Host "✅ Autenticado como: $auth" -ForegroundColor Green
Write-Host ""

# Verificar projeto
Write-Host "📋 Configurando projeto..." -ForegroundColor Cyan
$PROJECT_ID = Read-Host "Digite o ID do projeto Firebase (ex: meu-app-de-clinica)"

gcloud config set project $PROJECT_ID

# Verificar se projeto existe
$projectCheck = gcloud projects describe $PROJECT_ID 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Projeto '$PROJECT_ID' não encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Liste seus projetos com:" -ForegroundColor Yellow
    Write-Host "   gcloud projects list" -ForegroundColor White
    exit 1
}
Write-Host "✅ Projeto configurado: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Configurar região
$REGION = "us-central1"
Write-Host "🌎 Região: $REGION" -ForegroundColor Cyan
Write-Host ""

# Habilitar APIs necessárias
Write-Host "🔧 Habilitando APIs necessárias (pode demorar 1-2 minutos)..." -ForegroundColor Cyan
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
Write-Host "✅ APIs habilitadas" -ForegroundColor Green
Write-Host ""

# Build e deploy
Write-Host "🏗️  Construindo e fazendo deploy..." -ForegroundColor Cyan
Write-Host "⏱️  Isso pode levar 3-5 minutos na primeira vez..." -ForegroundColor Yellow
Write-Host ""

gcloud run deploy altclinic-backend `
    --source . `
    --region=$REGION `
    --platform=managed `
    --allow-unauthenticated `
    --memory=512Mi `
    --cpu=1 `
    --min-instances=0 `
    --max-instances=1 `
    --set-env-vars="NODE_ENV=production,JWT_SECRET=SuaChaveSuperSecretaAqui123,DATABASE_PATH=/app/data,ALLOWED_ORIGINS=https://$PROJECT_ID.web.app,https://$PROJECT_ID.firebaseapp.com"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    
    # Pegar URL do serviço
    $SERVICE_URL = gcloud run services describe altclinic-backend --region=$REGION --format="value(status.url)"
    
    Write-Host "📍 URL do Backend: $SERVICE_URL" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Teste o backend:" -ForegroundColor White
    Write-Host "   curl $SERVICE_URL/health" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Atualize frontend\.env.production:" -ForegroundColor White
    Write-Host "   REACT_APP_API_URL=$SERVICE_URL/api" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Rebuild e redeploy frontend:" -ForegroundColor White
    Write-Host "   cd frontend" -ForegroundColor Gray
    Write-Host "   npm run build" -ForegroundColor Gray
    Write-Host "   cd .." -ForegroundColor Gray
    Write-Host "   Copy-Item -Path 'frontend\build\*' -Destination 'public\' -Recurse -Force" -ForegroundColor Gray
    Write-Host "   firebase deploy --only hosting" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💰 Custo: R$ 0,00 (dentro do tier gratuito)" -ForegroundColor Green
    Write-Host "📊 Tier gratuito: 2 milhões requisições/mês" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erro no deploy" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "- Se o billing está ativo no projeto (mesmo usando tier gratuito)" -ForegroundColor White
    Write-Host "- Se as APIs foram habilitadas corretamente" -ForegroundColor White
    Write-Host "- Os logs acima para mais detalhes" -ForegroundColor White
}
