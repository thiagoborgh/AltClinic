# Sistema de Mensagens Avançado — Documentação de Fluxos

## 1. Visão Geral

Permite comunicação multicanal (WhatsApp, Email, SMS) com pacientes, tanto de forma automática (API) quanto manual (sem API). O sistema deve ser flexível para clínicas que desejam contratar a API ou operar manualmente.

---

## 2. Fluxos de Uso

### 2.1. Envio de Mensagens

**A) Com API Integrada**

- Usuário seleciona paciente(s) e canal (WhatsApp, Email, SMS)
- Escreve a mensagem (pode anexar arquivos, se suportado)
- Clica em “Enviar”
- Sistema envia via API, exibe status (enviado, entregue, lido, erro)
- Mensagem aparece no histórico automaticamente

**B) Modo Manual (sem API)**

- Usuário seleciona paciente(s) e canal
- Escreve a mensagem
- Sistema exibe mensagem pronta para copiar
- Usuário copia e envia pelo canal externo (WhatsApp Web, Email, SMS)
- Usuário pode registrar manualmente o status (enviado, entregue, respondido)
- Mensagem aparece no histórico com indicação de envio manual

---

### 2.2. Recebimento e Histórico

- Todas as mensagens enviadas/recebidas ficam registradas por paciente
- Filtros: canal, data, status, paciente
- Visualização em formato de conversa (thread)
- Indicação clara se mensagem foi enviada/recebida via API ou manualmente

---

### 2.3. Configuração de Integração

- Tela para ativar/desativar integração API
- Campos para inserir chave/token da API
- Exibe status da integração (ativa/inativa)
- Logs de erros de integração

---

## 3. Estados do Sistema

- **API Ativa:** Envio/recebimento automáticos, status em tempo real
- **API Inativa:** Apenas modo manual, usuário faz envio externo e registra status

---

## 4. Componentes Frontend

- `MensagensDashboard.js`: Tela principal, lista de conversas, botão “Nova Mensagem”
- `EnvioMensagemModal.js`: Modal para compor e enviar mensagem (API/manual)
- `HistoricoMensagens.js`: Lista e filtro de mensagens por paciente
- `ConfiguracaoAPI.js`: Tela de configuração e status da integração
- Hooks: `useMensagens.js` (lida com API/local), `useConfiguracaoAPI.js` (status/configuração)

---

## 5. Tarefas (Quebra em Etapas)

1. **Wireframe dos componentes e telas**
2. **Estrutura inicial dos componentes e hooks**
3. **Implementação do modo manual (envio/cópia/registro)**
4. **Implementação da integração API (mock e real)**
5. **Histórico e filtros**
6. **Configuração e status da integração**
7. **Testes e ajustes finais**
