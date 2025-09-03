# 🔄 Deploy no Render - GRATUITO PERMANENTE

Write-Host "Preparando deploy para Render..." -ForegroundColor Green

# Verificar se build existe
if (!(Test-Path "public/index.html")) {
    Write-Host "Preparando build do frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm run build
    Set-Location ..
    Copy-Item -Path "frontend/build/*" -Destination "public/" -Recurse -Force
}

Write-Host "✅ Alt Clinic pronto para Render!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PASSOS PARA DEPLOY NO RENDER:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Acesse: https://render.com" -ForegroundColor White
Write-Host "2. Clique 'Get Started for Free'" -ForegroundColor White
Write-Host "3. Login com GitHub" -ForegroundColor White
Write-Host "4. Dashboard → New + → Web Service" -ForegroundColor White
Write-Host "5. Connect repository → AltClinic" -ForegroundColor White
Write-Host ""
Write-Host "6. CONFIGURAÇÕES:" -ForegroundColor Yellow
Write-Host "   Name: alt-clinic" -ForegroundColor White
Write-Host "   Branch: main" -ForegroundColor White
Write-Host "   Runtime: Node" -ForegroundColor White
Write-Host "   Build Command:" -ForegroundColor White
Write-Host "   cd frontend && npm install && npm run build && cd .. && npm install" -ForegroundColor Gray
Write-Host "   Start Command:" -ForegroundColor White  
Write-Host "   node app.js" -ForegroundColor Gray
Write-Host ""
Write-Host "7. ENVIRONMENT VARIABLES:" -ForegroundColor Yellow
Write-Host "   NODE_ENV=production" -ForegroundColor White
Write-Host "   JWT_SECRET=AltClinic2024SuperSeguro!" -ForegroundColor White
Write-Host "   SESSION_SECRET=AltClinicSession2024!" -ForegroundColor White
Write-Host ""
Write-Host "8. Create Web Service" -ForegroundColor White
Write-Host "9. Aguarde 5-10 minutos" -ForegroundColor White
Write-Host "10. PRONTO! URL disponível!" -ForegroundColor Green
Write-Host ""
Write-Host "💰 CUSTO: 100% GRATUITO (750 horas/mês)" -ForegroundColor Green
Write-Host "🌐 HTTPS automático incluído!" -ForegroundColor Green
