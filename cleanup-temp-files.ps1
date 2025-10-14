# 🧹 SCRIPT DE LIMPEZA DE ARQUIVOS TEMPORÁRIOS DO SAEE
# Uso: .\cleanup-temp-files.ps1
# 
# Este script remove arquivos temporários criados durante desenvolvimento e testes
# Mantenha este arquivo para uso futuro

Write-Host "🧹 LIMPEZA DE ARQUIVOS TEMPORÁRIOS DO SAEE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$patterns = @(
    # Arquivos de teste e debug
    "test-*.js", "teste-*.js", "debug-*.js",
    
    # Arquivos de verificação
    "check-*.js", "verify-*.js", "validate-*.js", "verificar-*.js",
    
    # Arquivos de correção e manutenção
    "fix-*.js", "cleanup-*.js", "reset-*.js", "migrate-*.js", 
    "update-*.js", "padronizar-*.js", "reorganizar-*.js", "limpeza-*.js",
    
    # Arquivos de criação e setup temporário
    "create-*.js", "setup-*.js", "exemplo-*.js", "demo-*.js",
    
    # Arquivos de diagnóstico e análise
    "diagnostico-*.js", "analise-*.js",
    
    # Bancos de dados temporários
    "tenant_altclinic_*", "tenant_altclinin*", "tenant_teste.*", 
    "tenant_trial*", "tenant_testprimeiro*", "tenant_trialtest*",
    
    # Arquivos diversos temporários
    "s", "s-shm", "s-wal", "*-temp.json", "backup-*.json", 
    "test-*.json", "*.log", "qr_test.txt"
)

$cleaned = 0

foreach ($pattern in $patterns) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    if ($files) {
        foreach ($file in $files) {
            Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Removido: $($file.Name)" -ForegroundColor Green
            $cleaned++
        }
    }
}

# Remover diretórios de backup temporários
$backupDirs = Get-ChildItem -Path "backup_tenants_*" -Directory -ErrorAction SilentlyContinue
if ($backupDirs) {
    foreach ($dir in $backupDirs) {
        Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Removido diretório: $($dir.Name)" -ForegroundColor Green
        $cleaned++
    }
}

Write-Host ""
Write-Host "📊 RESULTADO: $cleaned itens removidos" -ForegroundColor Magenta

if ($cleaned -gt 0) {
    Write-Host "🎉 Limpeza concluída com sucesso!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Sistema já estava limpo" -ForegroundColor Yellow
}

Write-Host "✨ Arquivos temporários organizados!" -ForegroundColor Cyan