# AltClinic API — Indice de Endpoints

Base URL: `http://localhost:3000/api` (dev) / `https://altclinic.fly.dev/api` (prod)

Autenticacao: `Authorization: Bearer <jwt>` em todos os endpoints protegidos.

## Modulos

| Modulo | Prefixo | Arquivo |
|--------|---------|---------|
| Auth | `/api/auth` | `src/routes/auth.js` |
| Pacientes | `/api/pacientes` | `src/routes/pacientes.js` |
| Check-in | `/api/checkins` | `src/routes/checkins.js` |
| Fila de Espera | `/api/fila` | `src/routes/fila-espera.js` |
| Agenda | `/api/agenda/agendamentos` | `src/routes/agenda-agendamentos.js` |
| Confirmacoes | `/api/confirmacoes` | `src/routes/confirmacoes.js` |
| Profissionais | `/api/profissionais` | `src/routes/profissionais.js` |
| Financeiro | `/api/financeiro` | `src/routes/financeiro-faturas.js` |
| Prontuario | `/api/prontuarios` | `src/routes/prontuarios-eletronico.js` |
| WhatsApp | `/api/whatsapp` | `src/routes/whatsapp-central.js` |
| CRM | `/api/crm` | `src/routes/crm-pipeline.js` |
| Relatorios | `/api/relatorios` | `src/routes/relatorios-*.js` |
| Dashboard IA | `/api/dashboard-ia` | `src/routes/dashboard-ia.js` |
| Configuracoes | `/api/configuracoes` | `src/routes/configuracoes-simple.js` |

> Documentacao detalhada sera adicionada conforme os sprints forem implementados.
