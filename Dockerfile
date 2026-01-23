# Dockerfile para Backend - Cloud Run
FROM node:18-alpine

# Criar diretório da aplicação
WORKDIR /app

# Instalar dependências do sistema para better-sqlite3 e sharp
RUN apk add --no-cache python3 make g++ sqlite

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar TODAS as dependências (não usar --only=production para evitar problemas)
RUN npm install --production

# Copiar código da aplicação
COPY src ./src
COPY admin ./admin
COPY data ./data

# Criar diretórios necessários
RUN mkdir -p /app/data && chmod 777 /app/data && mkdir -p /app/uploads

# Expor porta (Cloud Run usa porta 8080)
EXPOSE 8080

# Variável de ambiente para produção
ENV NODE_ENV=production
ENV PORT=8080

# Iniciar aplicação
CMD ["node", "src/app.js"]

