# Script para copiar arquivos do build do frontend para public
if (!(Test-Path public)) {
    New-Item -ItemType Directory -Path public
}

if (!(Test-Path public/admin)) {
    New-Item -ItemType Directory -Path public/admin
}

# Copiar frontend principal
Write-Host "Copiando frontend principal..."
robocopy "frontend/build" "public" /E /IS /IT /NFL /NDL /NJH /NJS

# Copiar admin frontend
Write-Host "Copiando admin frontend..."
robocopy "admin/frontend/build" "public/admin" /E /IS /IT /NFL /NDL /NJH /NJS

Write-Host "Todos os arquivos copiados com sucesso!"
