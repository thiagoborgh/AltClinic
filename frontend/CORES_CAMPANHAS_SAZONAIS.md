# Sistema de Cores Sazonais - AgendaLite

## 🎨 Cores das Campanhas por Mês

O cabeçalho da AgendaLite agora muda automaticamente de cor conforme as campanhas de conscientização de cada mês:

### 📅 Calendário de Campanhas 2025

| Mês           | Campanha               | Cor Principal | Causa                 |
| ------------- | ---------------------- | ------------- | --------------------- |
| **Janeiro**   | Janeiro Branco         | 🤍 Branco     | Saúde Mental          |
| **Fevereiro** | Fevereiro Roxo/Laranja | 🟣 Roxo       | Alzheimer e Leucemia  |
| **Março**     | Março Azul             | 🔵 Azul Claro | Câncer Colorretal     |
| **Abril**     | Abril Verde            | 🟢 Verde      | Segurança no Trabalho |
| **Maio**      | Maio Amarelo           | 🟡 Amarelo    | Trânsito Seguro       |
| **Junho**     | Junho Laranja          | 🟠 Laranja    | Anemia e Leucemia     |
| **Julho**     | Julho Amarelo          | 🟡 Amarelo    | Hepatites Virais      |
| **Agosto**    | Agosto Dourado         | 🟡 Dourado    | Aleitamento Materno   |
| **Setembro**  | Setembro Amarelo       | 🟡 Amarelo    | Prevenção ao Suicídio |
| **Outubro**   | Outubro Rosa           | 🩷 Rosa        | Câncer de Mama        |
| **Novembro**  | Novembro Azul          | 🔵 Azul       | Câncer de Próstata    |
| **Dezembro**  | Dezembro Vermelho      | 🔴 Vermelho   | AIDS/HIV              |

## ✨ Funcionalidades Implementadas

### 🎯 Detecção Automática

- **Sistema inteligente** que detecta o mês atual
- **Aplicação automática** da cor correspondente
- **Tooltip informativo** com nome da campanha (ao passar o mouse)

### 🎨 Cores Dinâmicas

- **Gradiente suave** para visual moderno
- **Contraste automático** do texto (branco/preto)
- **Tooltip discreto** com informações da campanha (hover)

### 📱 Adaptação Visual

- **Legibilidade otimizada** para todas as cores
- **Contraste adequado** entre texto e fundo
- **Design responsivo** mantido

## 🔧 Implementação Técnica

### Função `getCampanhaColor()`

```javascript
const getCampanhaColor = () => {
  const mes = moment().month() + 1;
  const campanhas = {
    1: {
      cor: "#ffffff",
      gradiente: "#f8f9fa",
      nome: "Janeiro Branco",
      campanha: "Saúde Mental",
    },
    2: {
      cor: "#9c27b0",
      gradiente: "#e1bee7",
      nome: "Fevereiro Roxo/Laranja",
      campanha: "Alzheimer e Leucemia",
    },
    // ... demais meses
  };
  return campanhas[mes];
};
```

### Aplicação no Header

```javascript
<Tooltip title={`${campanhaAtual.nome} - ${campanhaAtual.campanha}`} arrow>
  <Paper
    sx={{
      background: `linear-gradient(135deg, ${campanhaAtual.cor} 0%, ${campanhaAtual.gradiente} 100%)`,
      color: campanhaAtual.cor === '#ffffff' || campanhaAtual.cor === '#ffeb3b' ? '#333333' : '#ffffff',
      cursor: 'help'
    }}
  >
</Tooltip>
```

## 🎊 Outubro 2025 - Outubro Rosa

**Atualmente ativo:** 🩷 **Outubro Rosa**

- **Cor:** Rosa vibrante (`#e91e63`)
- **Gradiente:** Rosa claro (`#f8bbd9`)
- **Campanha:** Conscientização sobre Câncer de Mama
- **Texto:** Branco para melhor contraste

## 🚀 Benefícios

### Para a Clínica

- ✅ **Engajamento** com campanhas de saúde
- ✅ **Conscientização** automática dos pacientes
- ✅ **Relevância social** da clínica
- ✅ **Identidade visual** sempre atualizada

### Para os Usuários

- ✅ **Lembrança visual** das campanhas importantes
- ✅ **Interface sempre atualizada**
- ✅ **Conexão emocional** com causas relevantes
- ✅ **Experiência personalizada** por época

## 🔄 Funcionamento Automático

1. **Sistema detecta** o mês atual automaticamente
2. **Aplica cores** da campanha correspondente
3. **Ajusta contraste** do texto automaticamente
4. **Exibe badge** com informações da campanha
5. **Atualiza** automaticamente a cada mês

## 📝 Manutenção

O sistema é **100% automático** e não requer manutenção manual. As cores mudam automaticamente conforme o calendário.

### Personalização Futura

- Possibilidade de **campanhas personalizadas** da clínica
- **Integração** com eventos especiais
- **Notificações** sobre mudanças de campanha

---

_Sistema implementado em 10 de outubro de 2025_  
_Atualmente: 🩷 Outubro Rosa - Câncer de Mama_
