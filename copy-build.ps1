# Script para copiar arquivos do build do frontend para public
if (!(Test-Path public)) {
    New-Item -ItemType Directory -Path public
}

# Usar robocopy para cópia mais confiável
robocopy "frontend/build" "public" /E /IS /IT /NFL /NDL /NJH /NJS

Write-Host "Arquivos copiados com sucesso!"
