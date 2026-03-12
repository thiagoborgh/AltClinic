# /pipeline — GitHub Projects Pipeline (AltClinic)

Processa os itens do [AltClinic Projects Board](https://github.com/users/thiagoborgh/projects/1).

Para cada item em **Todo/Backlog**:
1. Cria um **PRD** como GitHub Issue (label: `prd`)
2. Cria um **TDD** como GitHub Issue (label: `tdd`)
3. Move o card para **In Progress**
4. Linka PRD + TDD de volta ao item

## Configuração do projeto

- **Owner**: `thiagoborgh`
- **Project Number**: `1`
- **Repo**: `thiagoborgh/AltClinic`

## Antes de rodar

Verificar autenticação com scope de projetos:
```bash
gh auth status
# Deve mostrar: ✓ Logged in to github.com as thiagoborgh
# Scopes: project (obrigatório)
```

Se não tiver o scope `project`:
```bash
gh auth refresh --scopes "project"
```

## Execução

Use o skill `github-projects-pipeline` e passe o contexto:
- Project number: 1
- Owner: thiagoborgh
- Repo: thiagoborgh/AltClinic
- Status column "Todo" → move para "In Progress"

## Labels necessárias no repo

```bash
gh label create "prd" --color "0075ca" --description "Product Requirements Document" --repo thiagoborgh/AltClinic
gh label create "tdd" --color "e4e669" --description "Technical Design Document" --repo thiagoborgh/AltClinic
gh label create "documentation" --color "0075ca" --description "Documentation" --repo thiagoborgh/AltClinic
```
