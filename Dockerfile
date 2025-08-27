# Usar Node.js LTS
FROM node:18-alpine

# Criar diretório da aplicação
WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Criar pastas necessárias
RUN mkdir -p uploads logs whatsapp-session

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta
EXPOSE 3000

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Definir permissões
RUN chown -R nextjs:nodejs /app
USER nextjs

# Comando para iniciar a aplicação
CMD ["npm", "start"]
