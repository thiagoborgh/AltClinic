# 🚀 DEPLOY AUTOMÁTICO NO RENDER
# Execute este script para obter instruções completas

Write-Host "🚀 ALT CLINIC - DEPLOY NO RENDER" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

Write-Host "✅ STATUS ATUAL:" -ForegroundColor Cyan
Write-Host "   ✓ Código commitado e enviado para GitHub" -ForegroundColor Green
Write-Host "   ✓ Sistema de email implementado" -ForegroundColor Green
Write-Host "   ✓ SMTP Gmail configurado" -ForegroundColor Green
Write-Host ""

Write-Host "📋 PRÓXIMOS PASSOS NO RENDER.COM:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. ACESSE: https://render.com" -ForegroundColor White
Write-Host "2. Faça login com sua conta GitHub" -ForegroundColor White
Write-Host "3. Dashboard → New + → Web Service" -ForegroundColor White
Write-Host "4. Connect repository → AltClinic" -ForegroundColor White
Write-Host ""

Write-Host "5. CONFIGURAÇÕES DO SERVIÇO:" -ForegroundColor Cyan
Write-Host "   Name: alt-clinic" -ForegroundColor White
Write-Host "   Branch: main" -ForegroundColor White
Write-Host "   Runtime: Node" -ForegroundColor White
Write-Host "   Build Command:" -ForegroundColor White
Write-Host "   cd frontend && npm install && npm run build && cd .. && npm install" -ForegroundColor Gray
Write-Host "   Start Command:" -ForegroundColor White
Write-Host "   node app.js" -ForegroundColor Gray
Write-Host ""

Write-Host "6. VARIÁVEIS DE AMBIENTE (COPIE DO ARQUIVO render-env.txt):" -ForegroundColor Cyan
Write-Host ""
Get-Content "render-env.txt" | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        $key = $1
        $value = $2
        Write-Host "   $key = $value" -ForegroundColor White
    } elseif ($_ -match "^#") {
        Write-Host "   $_" -ForegroundColor Gray
    } else {
        Write-Host "   $_" -ForegroundColor White
    }
}
Write-Host ""

Write-Host "7. PLANO: Selecione FREE (0 USD/month)" -ForegroundColor Yellow
Write-Host "8. Clique em 'Create Web Service'" -ForegroundColor Green
Write-Host ""

Write-Host "⏳ AGUARDE 5-10 MINUTOS" -ForegroundColor Yellow
Write-Host ""

Write-Host "🎯 APÓS O DEPLOY:" -ForegroundColor Green
Write-Host "   ✓ URL será gerada automaticamente" -ForegroundColor White
Write-Host "   ✓ HTTPS incluído gratuitamente" -ForegroundColor White
Write-Host "   ✓ Sistema de email funcionará" -ForegroundColor White
Write-Host "   ✓ 750 horas gratuitas por mês" -ForegroundColor White
Write-Host ""

Write-Host "💡 DICAS IMPORTANTES:" -ForegroundColor Cyan
Write-Host "   • Configure o SMTP com sua conta Gmail real" -ForegroundColor White
Write-Host "   • Use senha de app, não senha normal" -ForegroundColor White
Write-Host "   • Teste o cadastro de usuários após deploy" -ForegroundColor White
Write-Host ""

Write-Host "🔗 LINKS ÚTEIS:" -ForegroundColor Yellow
Write-Host "   Render: https://render.com" -ForegroundColor White
Write-Host "   Repositório: https://github.com/thiagoborgh/AltClinic" -ForegroundColor White
Write-Host "   Gmail App Passwords: https://myaccount.google.com/apppasswords" -ForegroundColor White
Write-Host ""

Write-Host "🚀 PRONTO PARA DEPLOY!" -ForegroundColor Green
