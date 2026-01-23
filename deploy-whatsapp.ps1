# 🚀 Deploy WhatsApp para Google Cloud

Write-Host "🚀 Iniciando deploy do WhatsApp no Google Cloud..." -ForegroundColor Cyan

# 1. Instalar dependências das Functions
Write-Host "`n📦 Instalando dependências das Functions..." -ForegroundColor Yellow
Set-Location functions
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
}
npm install
Set-Location ..

# 2. Deploy Storage Rules
Write-Host "`n🔒 Fazendo deploy das Storage Rules..." -ForegroundColor Yellow
firebase deploy --only storage

# 3. Deploy Cloud Functions
Write-Host "`n☁️ Fazendo deploy das Cloud Functions..." -ForegroundColor Yellow
firebase deploy --only functions

# 4. Obter URLs das Functions
Write-Host "`n📋 URLs das Cloud Functions deployadas:" -ForegroundColor Green
Write-Host "   Webhook WhatsApp: https://REGION-PROJECT_ID.cloudfunctions.net/whatsappWebhook?tenantId=SEU_TENANT" -ForegroundColor White
Write-Host "   Send Message: Callable function (use no backend)" -ForegroundColor White
Write-Host "   Stats: Callable function (use no backend)" -ForegroundColor White

Write-Host "`n✅ Deploy concluído!" -ForegroundColor Green
Write-Host "`n📌 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Configure o webhook no Twilio Console" -ForegroundColor White
Write-Host "   2. Adicione TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN no .env" -ForegroundColor White
Write-Host "   3. Teste o backend: npm run dev" -ForegroundColor White
Write-Host "   4. Acesse: http://localhost:3000/api/whatsapp/session/status" -ForegroundColor White
