#!/bin/bash

echo "🔍 Verificando consistência dos períodos de trial..."
echo ""

echo "📋 Procurando por '30 dias' em arquivos relevantes:"
echo "=================================================="
grep -r "30 dias" --include="*.js" --include="*.jsx" --include="*.html" --include="*.md" src/ frontend/ admin/ 2>/dev/null | grep -i trial

echo ""
echo "📋 Procurando por '15 dias' em arquivos relevantes:"
echo "=================================================="
grep -r "15 dias" --include="*.js" --include="*.jsx" --include="*.html" --include="*.md" src/ frontend/ admin/ 2>/dev/null | grep -i trial

echo ""
echo "📋 Procurando por configurações de trial em código:"
echo "=================================================="
grep -r "24 \* 60 \* 60 \* 1000" --include="*.js" src/ frontend/ admin/ 2>/dev/null | grep -E "(15|30)"

echo ""
echo "📋 Procurando por setDate.*add.*[0-9]+ em trial routes:"
echo "=================================================="
grep -r "setDate.*getDate.*+" --include="*.js" src/routes/ 2>/dev/null

echo ""
echo "✅ Verificação concluída!"