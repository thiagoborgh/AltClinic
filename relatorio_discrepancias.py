import csv

# Ler o arquivo CSV
with open('Inscrição para CRISMA 2026 (respostas) - Página1 (3).csv', 'r', encoding='utf-8') as file:
    csv_reader = csv.reader(file)
    rows = list(csv_reader)

print("=" * 80)
print("RELATÓRIO DETALHADO - DISCREPÂNCIAS ENTRE PLANILHA E SISTEMA")
print("=" * 80)

print("\n📊 RESUMO EXECUTIVO:")
print(f"   Planilha: 248 linhas (1 cabeçalho + 247 dados)")
print(f"   Nomes únicos na planilha: 245")
print(f"   Sistema: 219 crismandos ativos")
print(f"   Diferença: 26 crismandos (245 - 219 = 26)")

print("\n" + "=" * 80)
print("🔍 PROBLEMAS IDENTIFICADOS NA PLANILHA")
print("=" * 80)

print("\n1️⃣ DUPLICATAS ENCONTRADAS (2 registros extras):")
print("   - Bernardo Matos Borges Nóbrega (linhas 16 e 189)")
print("   - Marielle Cardoso Vanderley (linhas 114 e 185)")
print("\n   ⚠️  Ação: Remover duplicatas ou marcar como inativas no sistema")

print("\n2️⃣ NOME COM OBSERVAÇÃO (1 registro):")
print("   - Linha 75: 'João Pedro do Carmo Oliveira (meu pai mandou o")
print("     formulário uma vez já, mas mudamos de ideia sobre o dia e o")
print("     oficial é quinta feira)'")
print("\n   ⚠️  Ação: Este pode ter sido registrado sem a observação no sistema")

print("\n" + "=" * 80)
print("🔎 ANÁLISE DA DIFERENÇA DE 26 CRISMANDOS")
print("=" * 80)

print("\n✅ REGISTROS NA PLANILHA:")
print("   - Total de linhas: 247")
print("   - Duplicatas: -2")
print("   - Nomes únicos: 245")

print("\n❌ POSSÍVEIS MOTIVOS PARA FALTAREM 26 NO SISTEMA:")
print()
print("   1. Status diferentes no sistema:")
print("      • Crismandos marcados como 'inativos' ou 'desistentes'")
print("      • Crismandos em status 'pendente' ou 'aguardando confirmação'")
print()
print("   2. Problemas de importação:")
print("      • Alguns registros podem não ter sido importados corretamente")
print("      • Erros de validação durante a importação (ex: campos obrigatórios)")
print()
print("   3. Exclusões manuais:")
print("      • Registros excluídos manualmente por duplicatas")
print("      • Crismandos que desistiram e foram removidos")
print()
print("   4. Filtros no sistema:")
print("      • Você está vendo apenas 'crismandos ativos'")
print("      • Pode haver outros status (pendente, inativo, desistente)")

print("\n" + "=" * 80)
print("📋 AÇÕES RECOMENDADAS")
print("=" * 80)

print("\n1. Verificar no sistema:")
print("   ☐ Quantos crismandos existem no TOTAL (ativos + inativos)?")
print("   ☐ Verificar se há filtro aplicado para 'apenas ativos'")
print("   ☐ Listar crismandos com status: inativos, pendentes, desistentes")

print("\n2. Verificar duplicatas no sistema:")
print("   ☐ Buscar: 'Bernardo Matos Borges Nóbrega'")
print("   ☐ Buscar: 'Marielle Cardoso Vanderley'")
print("   ☐ Se houver 2 registros, manter apenas 1")

print("\n3. Verificar importação:")
print("   ☐ Há log de importação da planilha?")
print("   ☐ Quantos registros foram importados com sucesso?")
print("   ☐ Houve erros de validação?")

print("\n4. Reconciliação:")
print("   ☐ Exportar lista do sistema com TODOS os status")
print("   ☐ Comparar nome por nome com a planilha")
print("   ☐ Identificar quais 26 nomes não estão no sistema")

print("\n" + "=" * 80)
print("💡 PRÓXIMO PASSO")
print("=" * 80)
print("\nPara identificar EXATAMENTE quais crismandos faltam, precisamos:")
print("1. Exportar a lista completa do sistema (com todos os status)")
print("2. Fazer uma comparação nome por nome")
print()
print("Posso criar um script de comparação se você fornecer o export do sistema.")
print("=" * 80)
