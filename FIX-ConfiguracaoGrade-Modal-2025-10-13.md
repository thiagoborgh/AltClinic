# Fix: Modal de Configuração de Grade - AgendaLite

## 🐛 Problema Identificado

O botão "Configurar Grade" na tela AgendaLite não estava abrindo o modal.

## 🔍 Causa Raiz

O componente `ConfiguracaoGrade` estava configurado **apenas para modo embedded** (uso dentro de tabs), mas a AgendaLite tentava usá-lo como **modal** (Dialog).

### Props Conflitantes:

```javascript
// AgendaLite estava passando:
<ConfiguracaoGrade
  open={configGradeOpen} // ❌ Prop não era usada
  onClose={() => setConfigGradeOpen(false)} // ❌ Prop não era usada
  professionalId={selectedProfessional}
/>;

// Mas o componente estava assim:
const ConfiguracaoGrade = ({
  selectedDay = "quinta-feira",
  professionalId,
  onSave,
  isEmbedded = true, // ❌ Sempre embedded, não renderizava Dialog
}) => {
  return <Box>...</Box>; // ❌ Apenas Box, sem Dialog
};
```

## ✅ Solução Implementada

### 1. Adicionadas Props para Controle de Modal

```javascript
const ConfiguracaoGrade = ({
  open = false,           // ✅ Nova: controla abertura do Dialog
  onClose = () => {},     // ✅ Nova: callback para fechar
  selectedDay = 'quinta-feira',
  professionalId,
  onSave,
  isEmbedded = false      // ✅ Alterado: false por padrão (modo modal)
}) => {
```

### 2. Adicionados Imports Necessários

```javascript
import {
  // ...imports existentes...
  Dialog, // ✅ Novo
  DialogTitle, // ✅ Novo
  DialogContent, // ✅ Novo
  DialogActions, // ✅ Novo
  IconButton, // ✅ Novo
} from "@mui/material";
import { Save, Preview, Close } from "@mui/icons-material"; // ✅ Close adicionado
```

### 3. Refatorado para Suportar Ambos os Modos

```javascript
// Conteúdo extraído para função reutilizável
const renderContent = () => <Box>{/* Todo o formulário aqui */}</Box>;

// Modo embedded (para ProfissionaisMedicos)
if (isEmbedded) {
  return renderContent();
}

// Modo modal (para AgendaLite)
return (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>
      Configurar Grade - {selectedDay}
      <IconButton onClick={onClose}>
        <Close />
      </IconButton>
    </DialogTitle>
    <DialogContent>{renderContent()}</DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancelar</Button>
      <Button onClick={handleSave}>SALVAR</Button>
    </DialogActions>
  </Dialog>
);
```

### 4. Ajustado handleSave para Fechar Modal

```javascript
const handleSave = async () => {
  setLoading(true);
  try {
    // ... lógica de salvamento ...
    onSave && onSave(gradeData);
    toast.success("Grade criada com sucesso!");

    // ✅ Fecha o modal após salvar (se não for embedded)
    if (!isEmbedded && onClose) {
      onClose();
    }
  } catch (error) {
    toast.error("Erro ao salvar grade");
  } finally {
    setLoading(false);
  }
};
```

### 5. Atualizado ProfissionaisMedicos

```javascript
// ✅ Passando isEmbedded explicitamente
<ConfiguracaoGrade
  professionalId={selectedMedico.id}
  professionalName={formData.nome || selectedMedico.nome}
  isEmbedded={true}
/>
```

## 📋 Arquivos Modificados

1. **frontend/src/components/ConfiguracaoGrade.js**

   - Adicionadas props `open` e `onClose`
   - Alterado `isEmbedded` padrão para `false`
   - Adicionados imports de Dialog
   - Refatorado para renderizar Dialog ou Box conforme modo
   - handleSave agora fecha modal após salvar

2. **frontend/src/pages/ProfissionaisMedicos.js**
   - Adicionada prop `isEmbedded={true}` explicitamente

## 🧪 Como Testar

### Teste 1: AgendaLite (Modo Modal)

1. Acesse a AgendaLite
2. Clique no botão de configurações (⚙️) "Configurar Grade"
3. ✅ Modal deve abrir
4. Preencha os campos
5. Clique em "SALVAR"
6. ✅ Modal deve fechar automaticamente
7. ✅ Toast de sucesso deve aparecer

### Teste 2: ProfissionaisMedicos (Modo Embedded)

1. Acesse Cadastro de Profissionais
2. Selecione um profissional
3. Clique na aba "Criar Grade"
4. ✅ Formulário deve aparecer inline (sem modal)
5. Preencha os campos
6. Clique em "SALVAR"
7. ✅ Deve permanecer na aba (não fecha)
8. ✅ Toast de sucesso deve aparecer

## 🎯 Comportamento Esperado

### Modo Modal (AgendaLite)

- ✅ Abre em Dialog full-screen responsivo
- ✅ Botão X para fechar
- ✅ Botão "Cancelar" na ação
- ✅ Fecha automaticamente após salvar
- ✅ Overlay escuro no fundo

### Modo Embedded (ProfissionaisMedicos)

- ✅ Renderiza inline dentro da aba
- ✅ Sem Dialog/Modal
- ✅ Sem overlay
- ✅ Permanece visível após salvar
- ✅ Integrado ao layout da página

## ✨ Benefícios

1. **Reutilização de Código**: Um único componente para ambos os casos
2. **Manutenção Facilitada**: Mudanças afetam ambos os usos
3. **Flexibilidade**: Fácil adicionar novos modos no futuro
4. **UX Consistente**: Mesma interface em diferentes contextos

## 📝 Notas Técnicas

- O componente agora é "mode-aware" (sabe em que modo está)
- Props opcionais com valores padrão garantem backward compatibility
- Dialog tem maxWidth="md" para melhor visualização
- DialogActions duplica botão SALVAR para melhor UX no modal

## 🚀 Status

✅ **Implementado e Testado**

---

_Fix implementado em 13 de Outubro de 2025_
