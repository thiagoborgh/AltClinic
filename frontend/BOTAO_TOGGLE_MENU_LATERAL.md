# Botão Toggle Menu Lateral - AgendaLite

## 🎯 Funcionalidade Implementada

Foi adicionado um **botão toggle** no cabeçalho da AgendaLite para expandir/esconder o menu lateral esquerdo, proporcionando mais flexibilidade na visualização da agenda.

## 📍 Localização do Botão

### Posição:

- **Local**: Canto esquerdo da barra superior
- **Ícone**:
  - 🔓 `MenuOpen` quando menu está **expandido**
  - 🔒 `Menu` quando menu está **escondido**
- **Tooltip**: Indica a ação ("Esconder/Mostrar menu lateral")

### Visual:

```
[🔓] [←] Agenda semanal / 09-15/10/2025 [→] [Diária] [Semanal] [Mensal] [⟳] [📝] [⏳]
```

## 🎨 Estados Visuais

### 🔓 **Menu Expandido (Padrão)**

- **Layout**: `md={3}` (menu) + `md={9}` (grade principal)
- **Ícone**: `MenuOpen` (menu aberto)
- **Tooltip**: "Esconder menu lateral"

### 🔒 **Menu Escondido**

- **Layout**: `md={12}` (grade principal ocupa toda largura)
- **Ícone**: `Menu` (menu fechado)
- **Tooltip**: "Mostrar menu lateral"

## ✨ Benefícios da Funcionalidade

### 👀 **Mais Espaço Visual**

- **Grade principal** pode ocupar toda a largura
- **Melhor visualização** dos slots em telas menores
- **Flexibilidade** conforme necessidade do usuário

### 🎯 **Casos de Uso**

- **Apresentações**: Esconder menu para foco na grade
- **Telas pequenas**: Maximizar espaço da agenda
- **Análise detalhada**: Mais espaço para visualizar slots
- **Impressão**: Layout mais limpo

### 📱 **Responsividade**

- **Desktop**: Funciona perfeitamente
- **Tablet**: Útil para ganhar espaço
- **Mobile**: Menu escondido por padrão seria ideal

## 🔧 Implementação Técnica

### Estado do Componente

```javascript
const [sidebarExpanded, setSidebarExpanded] = useState(true);
```

### Botão Toggle

```javascript
<Tooltip
  title={sidebarExpanded ? "Esconder menu lateral" : "Mostrar menu lateral"}
>
  <IconButton
    onClick={() => setSidebarExpanded(!sidebarExpanded)}
    size="small"
    sx={{ mr: 1 }}
  >
    {sidebarExpanded ? <MenuOpen /> : <Menu />}
  </IconButton>
</Tooltip>
```

### Layout Condicional

```javascript
{
  /* Menu Lateral - Condicional */
}
{
  sidebarExpanded && (
    <Grid item xs={12} md={3} className="sidebar-toggle-animation">
      {/* Conteúdo do menu */}
    </Grid>
  );
}

{
  /* Grade Principal - Tamanho Dinâmico */
}
<Grid
  item
  xs={12}
  md={sidebarExpanded ? 9 : 12}
  className="main-content-expanded"
>
  {/* Conteúdo da grade */}
</Grid>;
```

## 🎨 Animações CSS

### Transições Suaves

```css
.agenda-lite-header {
  transition: all 0.3s ease;
}

.sidebar-toggle-animation {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content-expanded {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 🚀 Como Usar

### Passo a Passo:

1. **Clique** no ícone de menu (🔓) no canto esquerdo
2. **Menu desaparece** com animação suave
3. **Grade principal** expande para ocupar toda largura
4. **Clique novamente** para restaurar o menu

### Dicas de Uso:

- 📊 **Análise de dados**: Esconda o menu para ver mais slots
- 🖨️ **Impressão**: Menu escondido para layout limpo
- 📱 **Telas pequenas**: Maximize o espaço da agenda
- 👥 **Apresentações**: Foque apenas na grade principal

## 🎉 Resultado

O **botão toggle** proporciona:

- ✅ **Flexibilidade** na visualização
- ✅ **Melhor uso** do espaço disponível
- ✅ **Interface adaptável** às necessidades
- ✅ **Animações suaves** e profissionais
- ✅ **Experiência** de usuário aprimorada

---

_Funcionalidade implementada em 10 de outubro de 2025_  
_Permite alternar entre layout com menu (3+9) e sem menu (12)_
