# Configuração OnRender - AltClinic SaaS

## Configurações no OnRender

### Build Command
```bash
chmod +x build.sh && ./build.sh
```

### Start Command
```bash
npm start
```

### Environment Variables
Adicione as seguintes variáveis de ambiente no painel do OnRender:

```bash
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secret-jwt-key-here
```

### Root Directory
```
.
```

### Build Directory (se necessário)
```
public
```

## Verificação Pós-Deploy

Após o deploy, teste os seguintes endpoints:

1. **Health Check**: `https://your-app.onrender.com/health`
2. **API Status**: `https://your-app.onrender.com/api/status`
3. **Login**: `https://your-app.onrender.com/api/auth/login`

## Teste de Login

```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinica.com","senha":"123456"}'
```

## Solução de Problemas

### CSP Error
Se encontrar erros de Content Security Policy, verifique se:
- O frontend está usando a URL correta da API
- As configurações de CORS estão corretas
- O Node.js está definido como `production`

### 404 em rotas do frontend
Certifique-se de que:
- O build do frontend foi executado corretamente
- Os arquivos estão no diretório `public/`
- O catchall route está funcionando

### Problemas de autenticação
Verifique se:
- O usuário admin foi criado
- O banco de dados está sendo inicializado
- As credenciais estão corretas

## Logs Úteis

Para verificar os logs no OnRender:
1. Acesse o painel do seu serviço
2. Vá na aba "Logs"
3. Procure por mensagens de erro ou sucesso

## URLs de Exemplo

- **App**: https://your-app.onrender.com
- **API**: https://your-app.onrender.com/api
- **Health**: https://your-app.onrender.com/health
