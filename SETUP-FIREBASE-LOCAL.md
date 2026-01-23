# Configuração Firebase para Desenvolvimento Local

## PASSO 1: Obter Credenciais do Firebase

1. Acesse o Firebase Console: https://console.firebase.google.com
2. Selecione o projeto: **meu-app-de-clinica**
3. Vá em ⚙️ **Configurações do Projeto**
4. Aba **Contas de serviço**
5. Clique em **Gerar nova chave privada**
6. Salve o arquivo JSON baixado como:
   ```
   src/services/firebase-service-account.json
   ```

## PASSO 2: Popular Dados de Teste

Execute o script:

```powershell
node popular-firestore-teste.js
```

Este script vai criar:

- ✅ Tenant: "Clínica Teste" (slug: clinica-teste)
- ✅ Usuário Admin (admin@teste.com / Senha@123)

## PASSO 3: Reiniciar Backend

```powershell
# Parar o backend atual (Ctrl+C no terminal)
# Iniciar novamente:
npm run dev
```

## PASSO 4: Testar Login

Acesse: http://localhost:3001/#/clinica-teste/login

Credenciais:

- **Email**: admin@teste.com
- **Senha**: Senha@123

---

## Solução Rápida (Sem Credenciais Locais)

Se você não conseguir baixar as credenciais, o sistema pode funcionar usando as **credenciais padrão do Cloud Run** em produção.

Para desenvolvimento local SEM arquivo de credenciais:

1. Comentar a linha no arquivo `src/services/firestoreService.js` que lê o service account
2. Usar o Firestore em modo produção através do deploy existente no Cloud Run

---

## Verificar se Firestore está Funcionando

```powershell
# Ver logs do backend
# Deve aparecer: ✅ Firebase Admin inicializado
# e: ✅ Firestore conectado
```

## Estrutura de Dados no Firestore

```
tenants/
  {tenantId}/
    - nome: "Clínica Teste"
    - slug: "clinica-teste"
    - status: "active"

    usuarios/
      {userId}/
        - nome: "Admin Teste"
        - email: "admin@teste.com"
        - senha_hash: "..."
        - papel: "admin"
```
